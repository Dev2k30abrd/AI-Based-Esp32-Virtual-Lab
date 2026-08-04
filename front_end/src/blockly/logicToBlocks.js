// ==========================================
// AI Circuit -> Blockly translator
//
// Turns the JSON the backend returns (components,
// connections, logic, arduino) into Blockly XML,
// using the SAME block set defined in
// arduinoBlocks.js, so "Generate Circuit" fills in
// the canvas, the code panel, AND the Blocks
// workspace together.
//
// This is a best-effort structural translation of
// the declarative "logic" rules (not a full C code
// parser) - it covers the common patterns the AI is
// instructed to produce: startup actions, timer
// blink loops, and buttonPressed/buttonReleased
// pairs toggling one or more targets. Anything more
// exotic (e.g. a potentiometer continuously driving
// a servo) can't be expressed with the current block
// set and is simply skipped rather than guessed at.
// ==========================================

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function findEsp32Pin(connections, componentId) {
  const conn = connections.find(
    (c) =>
      (c.fromComponent === componentId && c.toComponent === "ESP32") ||
      (c.toComponent === componentId && c.fromComponent === "ESP32")
  );

  if (!conn) return null;

  return conn.fromComponent === "ESP32" ? conn.fromPin : conn.toPin;
}

function normalizeTargets(target) {
  if (target == null) return [];
  return Array.isArray(target) ? target : [target];
}

// ---- individual block XML builders ----

function pinModeBlock(pin, mode) {
  return `<block type="arduino_pin_mode"><field name="PIN">${esc(pin)}</field><field name="MODE">${mode}</field></block>`;
}
function digitalWriteBlock(pin, value) {
  return `<block type="arduino_digital_write"><field name="PIN">${esc(pin)}</field><field name="VALUE">${value}</field></block>`;
}
function delayBlock(ms) {
  return `<block type="arduino_delay"><field name="MS">${ms}</field></block>`;
}
function servoAttachBlock(pin) {
  return `<block type="arduino_servo_attach"><field name="PIN">${esc(pin)}</field></block>`;
}
function servoWriteBlock(angle) {
  return `<block type="arduino_servo_write"><field name="ANGLE">${angle}</field></block>`;
}
function toneBlock(pin, freq) {
  return `<block type="arduino_tone"><field name="PIN">${esc(pin)}</field><field name="FREQ">${freq}</field></block>`;
}
function noToneBlock(pin) {
  return `<block type="arduino_no_tone"><field name="PIN">${esc(pin)}</field></block>`;
}
function serialPrintBlock(text) {
  return `<block type="arduino_serial_print"><field name="TEXT">${esc(text)}</field></block>`;
}
function digitalReadBlock(pin) {
  return `<block type="arduino_digital_read"><field name="PIN">${esc(pin)}</field></block>`;
}
function ifElseBlock(conditionXml, doXml, elseXml) {
  const mutation = elseXml ? `<mutation else="1"></mutation>` : "";
  const elsePart = elseXml ? `<statement name="ELSE">${elseXml}</statement>` : "";
  return `<block type="controls_if">${mutation}<value name="IF0">${conditionXml}</value><statement name="DO0">${doXml}</statement>${elsePart}</block>`;
}

// Chains a list of standalone <block> xml strings into one
// statement-input-ready sequence using Blockly's <next> nesting.
function chainBlocks(blocks) {
  let xml = "";
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    xml = xml
      ? block.replace(/<\/block>\s*$/, `<next>${xml}</next></block>`)
      : block;
  }
  return xml;
}

// Converts one logic rule's action into 0+ block xml strings
// (a rule with an array target becomes one block per target).
function actionToBlocks(rule, pinFor) {
  const blocks = [];

  normalizeTargets(rule.target).forEach((targetId) => {
    const pin = pinFor(targetId);
    if (pin === null) return;

    switch (rule.action) {
      case "turnOn":
        blocks.push(digitalWriteBlock(pin, "HIGH"));
        break;
      case "turnOff":
        blocks.push(digitalWriteBlock(pin, "LOW"));
        break;
      case "blink":
        // Best-effort outside a timer loop: represent as "on".
        blocks.push(digitalWriteBlock(pin, "HIGH"));
        break;
      case "stopBlink":
        blocks.push(digitalWriteBlock(pin, "LOW"));
        break;
      case "buzzerOn":
        blocks.push(toneBlock(pin, rule.frequency || 1000));
        break;
      case "buzzerOff":
        blocks.push(noToneBlock(pin));
        break;
      case "servoWrite":
        blocks.push(
          servoWriteBlock(typeof rule.value === "number" ? rule.value : 90)
        );
        break;
      default:
        break;
    }
  });

  if (rule.action === "serialPrint") {
    blocks.push(serialPrintBlock(rule.message || rule.text || ""));
  }

  return blocks;
}

export function buildBlocklyXmlFromCircuit(circuit) {
  const components = circuit.components || [];
  const connections = circuit.connections || [];
  const logic = circuit.logic || [];

  const pinFor = (id) => findEsp32Pin(connections, id);

  const setupBlocks = [];
  const loopBlocks = [];

  // ---- SETUP: pinMode / servo-attach for every wired component ----
  components.forEach((c) => {
    if (c.type === "ESP32") return;

    const pin = pinFor(c.id);
    if (pin === null) return;

    if (c.type === "LED" || c.type === "Buzzer") {
      setupBlocks.push(pinModeBlock(pin, "OUTPUT"));
    } else if (c.type === "Button" || c.type === "Potentiometer") {
      setupBlocks.push(pinModeBlock(pin, "INPUT"));
    } else if (c.type === "Servo") {
      setupBlocks.push(servoAttachBlock(pin));
    }
  });

  const startupRules = logic.filter((r) => r.event === "startup" && r.action !== "sequence");
  const sequenceRules = logic.filter((r) => r.action === "sequence");
  const timerRules = logic.filter((r) => r.event === "timer");
  const pressedRules = logic.filter((r) => r.event === "buttonPressed");
  const releasedRules = logic.filter((r) => r.event === "buttonReleased");

  // ---- sequence (traffic light / disco chase) -> flat on/delay/off
  // chain in loop, one block per step, in order. loop() re-running
  // is what makes it repeat forever, same as the Arduino stage.
  sequenceRules.forEach((rule) => {
    (rule.steps || []).forEach((step) => {
      const pin = pinFor(step.target);
      if (pin === null) return;

      loopBlocks.push(digitalWriteBlock(pin, step.state === "on" ? "HIGH" : "LOW"));
      if (step.duration) loopBlocks.push(delayBlock(step.duration));
    });
  });

  // ---- startup actions -> setup ----
  startupRules.forEach((rule) => {
    setupBlocks.push(...actionToBlocks(rule, pinFor));
  });

  // ---- timer -> blink pattern (or a plain repeated action) in loop ----
  timerRules.forEach((rule) => {
    if (rule.action === "toggle" || rule.action === "blink") {
      const interval = rule.interval || 500;

      normalizeTargets(rule.target).forEach((targetId) => {
        const pin = pinFor(targetId);
        if (pin === null) return;

        loopBlocks.push(digitalWriteBlock(pin, "HIGH"));
        loopBlocks.push(delayBlock(interval));
        loopBlocks.push(digitalWriteBlock(pin, "LOW"));
        loopBlocks.push(delayBlock(interval));
      });
    } else {
      loopBlocks.push(...actionToBlocks(rule, pinFor));
    }
  });

  // ---- buttonPressed/buttonReleased pairs -> if/else ----
  const handledReleased = new Set();

  pressedRules.forEach((pressRule) => {
    const sourcePin = pinFor(pressRule.source);
    if (sourcePin === null) return;

    const doBlocks = actionToBlocks(pressRule, pinFor);
    if (!doBlocks.length) return;

    const matchingRelease = releasedRules.find(
      (r) =>
        r.source === pressRule.source &&
        JSON.stringify(normalizeTargets(r.target)) ===
          JSON.stringify(normalizeTargets(pressRule.target))
    );

    let elseXml = null;

    if (matchingRelease) {
      const releaseBlocks = actionToBlocks(matchingRelease, pinFor);
      if (releaseBlocks.length) elseXml = chainBlocks(releaseBlocks);
      handledReleased.add(matchingRelease);
    }

    loopBlocks.push(
      ifElseBlock(digitalReadBlock(sourcePin), chainBlocks(doBlocks), elseXml)
    );
  });

  // Any buttonReleased rule that wasn't paired with a press still gets
  // represented, standalone (fires while the pin reads released/HIGH -
  // an approximation, since there's no "NOT" block wired in here).
  releasedRules.forEach((rule) => {
    if (handledReleased.has(rule)) return;

    const sourcePin = pinFor(rule.source);
    if (sourcePin === null) return;

    const doBlocks = actionToBlocks(rule, pinFor);
    if (!doBlocks.length) return;

    loopBlocks.push(
      ifElseBlock(digitalReadBlock(sourcePin), chainBlocks(doBlocks), null)
    );
  });

  const setupXml = setupBlocks.length ? chainBlocks(setupBlocks) : "";
  const loopXml = loopBlocks.length ? chainBlocks(loopBlocks) : "";

  return (
    `<xml xmlns="https://developers.google.com/blockly/xml">` +
    `<block type="arduino_setup_loop" x="30" y="30">` +
    (setupXml ? `<statement name="SETUP">${setupXml}</statement>` : "") +
    (loopXml ? `<statement name="LOOP">${loopXml}</statement>` : "") +
    `</block></xml>`
  );
}
