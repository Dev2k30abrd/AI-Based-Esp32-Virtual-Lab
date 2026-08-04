// ==========================================
// STEMbotix Arduino Blocks (Tinkercad-style)
//
// Defines the Blockly block set + the code
// generator that turns a block program into
// real Arduino text - the exact same text
// format the code panel / arduinoBuilder.js /
// interpreter already understand. Nothing
// downstream needs to know blocks were ever
// involved.
// ==========================================

import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";

// A dedicated generator (cloned shape of javascriptGenerator) that
// emits Arduino C-ish text instead of JS. Re-using Blockly's Order
// enum keeps expression precedence/parens handling correct for
// free.

export const arduinoGenerator = new Blockly.Generator("Arduino");

arduinoGenerator.ORDER_ATOMIC = Order.ATOMIC;
arduinoGenerator.ORDER_NONE = Order.NONE;

arduinoGenerator.scrub_ = function (block, code, thisOnly) {
  const nextBlock =
    block.nextConnection && block.nextConnection.targetBlock();
  const nextCode = nextBlock && !thisOnly
    ? arduinoGenerator.blockToCode(nextBlock)
    : "";
  return code + nextCode;
};

// ==========================================
// Block Definitions
// ==========================================

Blockly.common.defineBlocks({

  arduino_setup_loop: {
    init() {
      this.appendStatementInput("SETUP")
        .setCheck(null)
        .appendField("⚙ setup");
      this.appendStatementInput("LOOP")
        .setCheck(null)
        .appendField("🔁 loop (repeats forever)");
      this.setColour(230);
      this.setDeletable(false);
      this.setMovable(false);
      this.setTooltip("Every program has one setup (runs once) and one loop (repeats).");
    }
  },

  arduino_pin_mode: {
    init() {
      this.appendDummyInput()
        .appendField("set pin")
        .appendField(new Blockly.FieldTextInput("2"), "PIN")
        .appendField("mode")
        .appendField(new Blockly.FieldDropdown([
          ["OUTPUT", "OUTPUT"],
          ["INPUT", "INPUT"],
          ["INPUT_PULLUP", "INPUT_PULLUP"],
        ]), "MODE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("pinMode() - do this once in setup for every LED/Button/Servo/Buzzer pin. Buttons usually want INPUT_PULLUP.");
    }
  },

  arduino_digital_write: {
    init() {
      this.appendDummyInput()
        .appendField("set pin")
        .appendField(new Blockly.FieldTextInput("2"), "PIN")
        .appendField("to")
        .appendField(new Blockly.FieldDropdown([
          ["HIGH", "HIGH"],
          ["LOW", "LOW"],
        ]), "VALUE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("digitalWrite() - turn an LED (or any output pin) on/off.");
    }
  },

  arduino_digital_read: {
    init() {
      this.appendDummyInput()
        .appendField("pin")
        .appendField(new Blockly.FieldTextInput("4"), "PIN")
        .appendField("is pressed (HIGH)?");
      this.setOutput(true, "Boolean");
      this.setColour(160);
      this.setTooltip("digitalRead() == HIGH - true while a button on this pin is held.");
    }
  },

  arduino_analog_read: {
    init() {
      this.appendDummyInput()
        .appendField("analog value on pin")
        .appendField(new Blockly.FieldTextInput("34"), "PIN");
      this.setOutput(true, "Number");
      this.setColour(160);
      this.setTooltip("analogRead() - the potentiometer's current value (0-4095).");
    }
  },

  arduino_delay: {
    init() {
      this.appendDummyInput()
        .appendField("wait")
        .appendField(new Blockly.FieldNumber(500, 0), "MS")
        .appendField("ms");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
      this.setTooltip("delay() - pause for this many milliseconds.");
    }
  },

  arduino_tone: {
    init() {
      this.appendDummyInput()
        .appendField("buzz pin")
        .appendField(new Blockly.FieldTextInput("15"), "PIN")
        .appendField("at")
        .appendField(new Blockly.FieldNumber(1000, 1), "FREQ")
        .appendField("Hz");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("tone() - start a buzzer beeping at this frequency.");
    }
  },

  arduino_no_tone: {
    init() {
      this.appendDummyInput()
        .appendField("stop buzzer on pin")
        .appendField(new Blockly.FieldTextInput("15"), "PIN");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("noTone() - silence the buzzer on this pin.");
    }
  },

  arduino_servo_attach: {
    init() {
      this.appendDummyInput()
        .appendField("connect servo on pin")
        .appendField(new Blockly.FieldTextInput("18"), "PIN");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(45);
      this.setTooltip("myServo.attach() - do this once in setup.");
    }
  },

  arduino_servo_write: {
    init() {
      this.appendDummyInput()
        .appendField("turn servo to")
        .appendField(new Blockly.FieldNumber(90, 0, 180), "ANGLE")
        .appendField("°");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(45);
      this.setTooltip("myServo.write() - set the servo's angle (0-180).");
    }
  },

  arduino_serial_print: {
    init() {
      this.appendDummyInput()
        .appendField("print")
        .appendField(new Blockly.FieldTextInput("hello"), "TEXT")
        .appendField("to serial monitor");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(65);
      this.setTooltip("Serial.println() - show a message in the Serial Monitor.");
    }
  },

  // ==========================================
  // Tinkercad-style compound "one block = one
  // whole action" helpers - each expands to a
  // few lines of real Arduino, no wiring together
  // required for the common cases.
  // ==========================================

  arduino_led_blink_once: {
    init() {
      this.appendDummyInput()
        .appendField("blink LED on pin")
        .appendField(new Blockly.FieldTextInput("2"), "PIN")
        .appendField("on for")
        .appendField(new Blockly.FieldNumber(300, 1), "ON_MS")
        .appendField("ms, off for")
        .appendField(new Blockly.FieldNumber(300, 1), "OFF_MS")
        .appendField("ms");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("One full on/off blink cycle. Put it inside loop to keep blinking.");
    }
  },

  arduino_buzzer_beep: {
    init() {
      this.appendDummyInput()
        .appendField("beep buzzer on pin")
        .appendField(new Blockly.FieldTextInput("15"), "PIN")
        .appendField("at")
        .appendField(new Blockly.FieldNumber(1000, 1), "FREQ")
        .appendField("Hz for")
        .appendField(new Blockly.FieldNumber(200, 1), "MS")
        .appendField("ms");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("tone() + delay() + noTone() as one block - a single beep.");
    }
  },

  arduino_servo_sweep: {
    init() {
      this.appendDummyInput()
        .appendField("sweep servo from")
        .appendField(new Blockly.FieldNumber(0, 0, 180), "FROM")
        .appendField("° to")
        .appendField(new Blockly.FieldNumber(180, 0, 180), "TO")
        .appendField("°, step delay")
        .appendField(new Blockly.FieldNumber(15, 1), "STEP_MS")
        .appendField("ms");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(45);
      this.setTooltip("Moves the servo through every angle in the range, one degree at a time.");
    }
  },

  arduino_pot_to_servo: {
    init() {
      this.appendDummyInput()
        .appendField("drive servo from potentiometer on pin")
        .appendField(new Blockly.FieldTextInput("34"), "PIN");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(45);
      this.setTooltip("Reads the potentiometer (0-4095) and maps it straight to a servo angle (0-180). Put in loop.");
    }
  },

  arduino_comment: {
    init() {
      this.appendDummyInput()
        .appendField("// note:")
        .appendField(new Blockly.FieldTextInput("what this does"), "TEXT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(0);
      this.setTooltip("A comment line - doesn't do anything, just labels your code.");
    }
  }

});


// ==========================================
// Code Generators
// (one per block, mirrors the definitions above)
// ==========================================

arduinoGenerator.forBlock["arduino_setup_loop"] = function (block) {
  const setupCode = arduinoGenerator.statementToCode(block, "SETUP");
  const loopCode = arduinoGenerator.statementToCode(block, "LOOP");
  return `void setup(){\n${setupCode}}\n\nvoid loop(){\n${loopCode}}\n`;
};

arduinoGenerator.forBlock["arduino_pin_mode"] = function (block) {
  const pin = block.getFieldValue("PIN");
  const mode = block.getFieldValue("MODE");
  return `pinMode(${pin}, ${mode});\n`;
};

arduinoGenerator.forBlock["arduino_digital_write"] = function (block) {
  const pin = block.getFieldValue("PIN");
  const value = block.getFieldValue("VALUE");
  return `digitalWrite(${pin}, ${value});\n`;
};

arduinoGenerator.forBlock["arduino_digital_read"] = function (block) {
  const pin = block.getFieldValue("PIN");
  return [`digitalRead(${pin}) == HIGH`, Order.ATOMIC];
};

arduinoGenerator.forBlock["arduino_analog_read"] = function (block) {
  const pin = block.getFieldValue("PIN");
  return [`analogRead(${pin})`, Order.ATOMIC];
};

arduinoGenerator.forBlock["arduino_delay"] = function (block) {
  const ms = block.getFieldValue("MS");
  return `delay(${ms});\n`;
};

arduinoGenerator.forBlock["arduino_tone"] = function (block) {
  const pin = block.getFieldValue("PIN");
  const freq = block.getFieldValue("FREQ");
  return `tone(${pin}, ${freq});\n`;
};

arduinoGenerator.forBlock["arduino_no_tone"] = function (block) {
  const pin = block.getFieldValue("PIN");
  return `noTone(${pin});\n`;
};

arduinoGenerator.forBlock["arduino_servo_attach"] = function (block) {
  const pin = block.getFieldValue("PIN");
  return `myServo.attach(${pin});\n`;
};

arduinoGenerator.forBlock["arduino_servo_write"] = function (block) {
  const angle = block.getFieldValue("ANGLE");
  return `myServo.write(${angle});\n`;
};

arduinoGenerator.forBlock["arduino_serial_print"] = function (block) {
  const text = block.getFieldValue("TEXT");
  return `Serial.println("${text}");\n`;
};

arduinoGenerator.forBlock["arduino_led_blink_once"] = function (block) {
  const pin = block.getFieldValue("PIN");
  const onMs = block.getFieldValue("ON_MS");
  const offMs = block.getFieldValue("OFF_MS");
  return `digitalWrite(${pin}, HIGH);\ndelay(${onMs});\ndigitalWrite(${pin}, LOW);\ndelay(${offMs});\n`;
};

arduinoGenerator.forBlock["arduino_buzzer_beep"] = function (block) {
  const pin = block.getFieldValue("PIN");
  const freq = block.getFieldValue("FREQ");
  const ms = block.getFieldValue("MS");
  return `tone(${pin}, ${freq});\ndelay(${ms});\nnoTone(${pin});\n`;
};

arduinoGenerator.forBlock["arduino_servo_sweep"] = function (block) {
  const from = block.getFieldValue("FROM");
  const to = block.getFieldValue("TO");
  const stepMs = block.getFieldValue("STEP_MS");
  const dir = to >= from ? 1 : -1;

  // The simulator has no for()/while() support - it silently skips
  // anything it doesn't recognise. So the sweep is unrolled HERE,
  // at code-generation time, into a flat sequence of servoWrite()/
  // delay() lines the parser CAN read one at a time.
  let lines = "";
  for (let angle = from; dir > 0 ? angle <= to : angle >= to; angle += dir) {
    lines += `myServo.write(${angle});\ndelay(${stepMs});\n`;
  }
  return lines;
};

arduinoGenerator.forBlock["arduino_pot_to_servo"] = function (block) {
  const pin = block.getFieldValue("PIN");
  // Matches the parser's "int VAR = map(analogRead(PIN),...)" shape
  // exactly, then a plain servoWrite(variable) on its own line.
  return `int potAngle = map(analogRead(${pin}), 0, 4095, 0, 180);\nmyServo.write(potAngle);\n`;
};

arduinoGenerator.forBlock["arduino_comment"] = function (block) {
  const text = block.getFieldValue("TEXT");
  return `// ${text}\n`;
};

// Re-use only the stock Blockly blocks the simulator's parser can
// actually execute. No loops (for/while aren't supported), no
// variables_set/get or math blocks (nothing here has a value-input
// socket for them to plug into, and the parser only accepts a
// handful of literal assignment shapes) - Logic/if is the one
// stock category that maps cleanly onto the parser's if/else +
// comparison support.

["controls_if", "logic_compare", "logic_operation", "logic_boolean", "logic_negate", "text"].forEach(
  (name) => {
    if (javascriptGenerator.forBlock[name]) {
      arduinoGenerator.forBlock[name] = javascriptGenerator.forBlock[name];
    }
  }
);


// ==========================================
// Toolbox (the block palette on the left of
// the workspace)
// ==========================================

export const ARDUINO_TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Structure",
      colour: "230",
      contents: [{ kind: "block", type: "arduino_setup_loop" }],
    },
    {
      kind: "category",
      name: "LED",
      colour: "160",
      contents: [
        { kind: "block", type: "arduino_pin_mode" },
        { kind: "block", type: "arduino_digital_write" },
        { kind: "block", type: "arduino_led_blink_once" },
      ],
    },
    {
      kind: "category",
      name: "Button",
      colour: "170",
      contents: [
        { kind: "block", type: "arduino_pin_mode" },
        { kind: "block", type: "arduino_digital_read" },
      ],
    },
    {
      kind: "category",
      name: "Buzzer",
      colour: "290",
      contents: [
        { kind: "block", type: "arduino_pin_mode" },
        { kind: "block", type: "arduino_tone" },
        { kind: "block", type: "arduino_no_tone" },
        { kind: "block", type: "arduino_buzzer_beep" },
      ],
    },
    {
      kind: "category",
      name: "Servo",
      colour: "45",
      contents: [
        { kind: "block", type: "arduino_servo_attach" },
        { kind: "block", type: "arduino_servo_write" },
        { kind: "block", type: "arduino_servo_sweep" },
      ],
    },
    {
      kind: "category",
      name: "Potentiometer",
      colour: "55",
      contents: [
        { kind: "block", type: "arduino_analog_read" },
        { kind: "block", type: "arduino_pot_to_servo" },
      ],
    },
    {
      kind: "category",
      name: "Timing",
      colour: "20",
      contents: [{ kind: "block", type: "arduino_delay" }],
    },
    {
      kind: "category",
      name: "Serial",
      colour: "65",
      contents: [
        { kind: "block", type: "arduino_serial_print" },
        { kind: "block", type: "arduino_comment" },
      ],
    },
    {
      kind: "category",
      name: "Logic",
      colour: "%{BKY_LOGIC_HUE}",
      contents: [
        { kind: "block", type: "controls_if" },
        { kind: "block", type: "logic_compare" },
        { kind: "block", type: "logic_operation" },
        { kind: "block", type: "logic_negate" },
        { kind: "block", type: "logic_boolean" },
      ],
    },
  ],
};


// ==========================================
// Starter blocks so a fresh workspace isn't
// empty (Tinkercad always seeds an empty
// setup/loop pair).
// ==========================================

export const STARTER_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup_loop" x="30" y="30"></block>
</xml>
`;
