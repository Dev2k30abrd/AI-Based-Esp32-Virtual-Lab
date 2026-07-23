// ==========================================
// STEMbotix Logic Engine
// General / Interdependent Version
// ==========================================
//
// This engine executes the declarative "logic" rules produced by the
// AI (or by hand) for a circuit. It is intentionally generic: any
// component can be a "source" (button, potentiometer, timer, startup)
// and any component(s) can be a "target" (LED, Buzzer, Servo, ...).
//
// Key features:
//  - Rules can target more than one component ("target": ["LED1","Buzzer1"])
//  - "blink" starts an independent, tracked interval per target so it can
//    always be cleanly stopped later ("stopBlink", "turnOff", "toggle",
//    or a fresh "blink"/"turnOn" call all cancel any previous blink).
//  - buttonPressed/buttonReleased pairs naturally create interdependent
//    behaviour: e.g. pressing a button can start LED + Buzzer blinking
//    together, and releasing it stops both.
//  - potentiometerChanged lets an analog input continuously drive a
//    target (typically Servo angle) while the value actually changes.
// ==========================================

let logicIntervals = [];
let inputWatcher = null;

let previousButtonStates = {};
let previousPotValues = {};

// target component id -> interval id (for tracked blink effects)
let blinkIntervals = {};


// ==========================================
// Start
// ==========================================

function startLogicEngine(){

    stopLogicEngine();

    console.log("Logic Engine Running");

    const logic = window.currentLogic || [];

    previousButtonStates = {};
    previousPotValues = {};
    blinkIntervals = {};

    // --------------------------------------
    // Startup Events
    // --------------------------------------

    logic.forEach(rule=>{

        if(rule.event === "startup"){

            executeLogicAction(rule);

        }

    });

    // --------------------------------------
    // Timer Events
    // --------------------------------------

    logic.forEach(rule=>{

        if(rule.event!=="timer") return;

        const interval =
            Number(rule.interval)||1000;

        executeLogicAction(rule);

        const id=setInterval(()=>{

            executeLogicAction(rule);

        },interval);

        logicIntervals.push(id);

    });

    // --------------------------------------
    // Input Watcher (buttons + potentiometers)
    // --------------------------------------

    inputWatcher = setInterval(()=>{

        watchButtons();
        watchPotentiometers();

    },40);

}


// ==========================================
// Stop
// ==========================================

function stopLogicEngine(){

    logicIntervals.forEach(clearInterval);

    logicIntervals = [];

    Object.values(blinkIntervals).forEach(clearInterval);

    blinkIntervals = {};

    if(inputWatcher){

        clearInterval(inputWatcher);

        inputWatcher = null;

    }

}


// ==========================================
// Watch Buttons
// ==========================================

function watchButtons(){

    const logic = window.currentLogic || [];

    // Collect each unique button source ONCE first. Reading /
    // updating previousButtonStates per-rule (instead of per-source)
    // was the bug: a "buttonPressed" rule and a "buttonReleased" rule
    // for the same button both read/write the same key, so whichever
    // rule happened to run first inside this loop "consumed" the
    // transition before the other rule ever saw it - releasing the
    // button would silently never fire its rule.

    const sources = new Set();

    logic.forEach(rule=>{

        if(
            rule.event === "buttonPressed" ||
            rule.event === "buttonReleased"
        ){

            sources.add(rule.source);

        }

    });

    sources.forEach(source=>{

        const component = document.querySelector(

            `[data-component-id="${source}"]`

        );

        if(!component) return;

        const svg = component.querySelector("svg");

        if(!svg) return;

        const state =
            Number(svg.dataset.state || 0);

        const old =
            previousButtonStates[source] || 0;

        if(state === old) return;

        previousButtonStates[source] = state;

        const eventName =
            state === 1 ? "buttonPressed" : "buttonReleased";

        logic.forEach(rule=>{

            if(
                rule.source === source &&
                rule.event === eventName
            ){

                executeLogicAction(rule);

            }

        });

    });

}


// ==========================================
// Watch Potentiometers
// ==========================================

function watchPotentiometers(){

    const logic = window.currentLogic || [];

    logic.forEach(rule=>{

        if(rule.event !== "potentiometerChanged") return;

        const component = document.querySelector(

            `[data-component-id="${rule.source}"]`

        );

        if(!component) return;

        const svg = component.querySelector("svg");

        if(!svg) return;

        const value =
            Number(svg.dataset.value || 0);

        const old = previousPotValues[rule.source];

        // Ignore tiny jitter, react once value actually moves.

        if(old !== undefined && Math.abs(value-old) < 8) return;

        previousPotValues[rule.source] = value;

        executeLogicAction(rule, value);

    });

}


// ==========================================
// Resolve a target id/array into elements
// ==========================================

function resolveLogicTarget(id){

    if(!id) return null;

    let target = document.querySelector(

        `[data-component-id="${id}"]`

    );

    if(!target){

        target=[

            ...document.querySelectorAll(".placed-component")

        ].find(component=>{

            return (

                component.dataset.componentId?.toLowerCase()

                ===

                String(id).toLowerCase()

            );

        });

    }

    return target || null;

}

function resolveLogicTargets(rule){

    const raw = rule.target;

    const ids = Array.isArray(raw) ? raw : [raw];

    return ids

        .map(resolveLogicTarget)

        .filter(Boolean);

}


// ==========================================
// Execute Action
// ==========================================

function executeLogicAction(rule, liveValue){

    const targets = resolveLogicTargets(rule);

    switch(rule.action){

        case "turnOn":

            targets.forEach(target=>{

                stopBlinkOn(target);
                controlComponent(target,1);

            });

            break;

        case "turnOff":

            targets.forEach(target=>{

                stopBlinkOn(target);
                controlComponent(target,0);

            });

            break;

        case "toggle":

            targets.forEach(target=>{

                stopBlinkOn(target);
                toggleComponent(target);

            });

            break;

        case "blink":

            targets.forEach(target=>{

                startBlinkOn(target, Number(rule.interval)||300);

            });

            break;

        case "stopBlink":

            targets.forEach(target=>{

                stopBlinkOn(target);
                controlComponent(target,0);

            });

            break;

        case "buzzerOn":

            targets.forEach(target=>{

                stopBlinkOn(target);
                controlComponent(target,1);

            });

            break;

        case "buzzerOff":

            targets.forEach(target=>{

                stopBlinkOn(target);
                controlComponent(target,0);

            });

            break;

        case "servoWrite":{

            let angle = Number(rule.value ?? 90);

            // Driven live by a potentiometer / analog source.

            if(liveValue !== undefined){

                if(

                    rule.fromLow !== undefined &&
                    rule.fromHigh !== undefined &&
                    rule.toLow !== undefined &&
                    rule.toHigh !== undefined

                ){

                    angle = mapRange(

                        liveValue,
                        Number(rule.fromLow),
                        Number(rule.fromHigh),
                        Number(rule.toLow),
                        Number(rule.toHigh)

                    );

                }

                else{

                    // Default: raw ADC range (0-4095) -> servo (0-180)

                    angle = mapRange(liveValue,0,4095,0,180);

                }

            }

            targets.forEach(target=>{

                const signal =
                    findComponentSignalPin(target,"SIGNAL");

                if(signal){

                    updateServoByGPIO(

                        signal,

                        angle

                    );

                }

            });

            break;

        }

        case "serialPrint":

            document.getElementById(

                "serialOutput"

            ).innerHTML +=

                (rule.text||"") +
                (liveValue!==undefined ? (" "+liveValue) : "") +

                "<br>";

            break;

    }

}


// ==========================================
// Blink Tracking
// ==========================================

function startBlinkOn(target, interval){

    if(!target) return;

    const id = target.dataset.componentId;

    stopBlinkOn(target);

    // Show the "on" state immediately so the effect is visible
    // right away instead of waiting a full interval.

    controlComponent(target,1);

    let state = 1;

    const timer = setInterval(()=>{

        state = state ? 0 : 1;

        controlComponent(target,state);

    },interval);

    if(id){

        blinkIntervals[id] = timer;

    }

}

function stopBlinkOn(target){

    if(!target) return;

    const id = target.dataset.componentId;

    if(id && blinkIntervals[id]){

        clearInterval(blinkIntervals[id]);

        delete blinkIntervals[id];

    }

}


// ==========================================
// Toggle
// ==========================================

function toggleComponent(component){

    if(!component) return;

    const current = getComponentOnState(component);

    controlComponent(component, current ? 0 : 1);

}


// ==========================================
// Read Current On/Off State (LED or Buzzer)
// ==========================================

function getComponentOnState(component){

    if(!component) return 0;

    const type =
        component.dataset.componentType;

    const def = COMPONENTS[type];

    if(!def || !def.gpioPin) return 0;

    const pin =
        component.querySelector(`[data-pin="${def.gpioPin}"]`);

    if(!pin) return 0;

    return Number(pin.dataset.logic || 0);

}


// ==========================================
// Control Component
//
// Registry-driven: any COMPONENTS[type] entry that
// declares a gpioPin + gpioHandler (LED, Buzzer, or
// any future on/off component added to
// config/components.js) works here automatically -
// nothing in this file has to be told about a new
// component type by name.
// ==========================================

function controlComponent(component,state){

    if(!component) return;

    const type =
        component.dataset.componentType;

    const def = COMPONENTS[type];

    if(!def || !def.gpioPin || typeof def.gpioHandler!=="function") return;

    const pin =
        component.querySelector(`[data-pin="${def.gpioPin}"]`);

    if(!pin) return;

    def.gpioHandler(pin,state);

    pin.dataset.logic = state;

}


// ==========================================
// Servo / generic signal pin lookup
// (works no matter which direction the wire
//  was created in: ESP32->Component or
//  Component->ESP32)
// ==========================================

function findComponentSignalPin(component, pinName){

    for(const connection of connections){

        const fromEl = connection.from.closest(".placed-component");
        const toEl = connection.to.closest(".placed-component");

        if(toEl === component && connection.to.dataset.pin === pinName){

            return connection.from.dataset.pin;

        }

        if(fromEl === component && connection.from.dataset.pin === pinName){

            return connection.to.dataset.pin;

        }

    }

    return null;

}

// Backwards-compatible alias

function findServoSignalPin(component){

    return findComponentSignalPin(component,"SIGNAL");

}


// ==========================================
// Helpers
// ==========================================

function mapRange(value, fromLow, fromHigh, toLow, toHigh){

    if(fromHigh === fromLow) return toLow;

    const result =
        (value - fromLow) *
        (toHigh - toLow) /
        (fromHigh - fromLow) +
        toLow;

    return Math.max(

        Math.min(toLow,toHigh),

        Math.min(

            Math.max(toLow,toHigh),

            Math.round(result)

        )

    );

}
