// ==========================================
// STEMbotix Component Registry
// Single Source of Truth
//
// Every component type is ONE self-contained
// entry here. Nothing outside this file should
// hardcode a component's pin names, its Arduino
// detection pattern, or how the AI/code builder
// wires it up - they all read it from here.
// Adding a new component = add one entry below.
// ==========================================

const COMPONENTS = {

    // ======================================================
    // ESP32
    // ======================================================

    ESP32: {

        svg: createESP32SVG,

        cssClass: "esp32-component",

        pins: [
            "3V3","EN","VP","VN","34","35","32","33","25","26",
            "27","14","12","GND","13","23","22","TX","RX","21",
            "19","18","5","17","16","4","2","15"
        ],

        powerPins: [ "3V3", "GND" ]

    },


    // ======================================================
    // LED
    // ======================================================

    LED: {

        svg: createLEDSVG,

        pins: [ "ANODE", "CATHODE" ],

        // Pin the AI/code-builder logic engine treats as this
        // component's single on/off signal.

        gpioPin: "ANODE",

        gpioHandler(pin, state) {

            if (pin.dataset.pin !== "ANODE") return;

            updateLED(pin, state);

        },

        requiredConnections: {
            ANODE: "GPIO",
            CATHODE: "GND"
        },

        // How to recognise this component from raw Arduino code.

        detect: { pinMode: "OUTPUT" },

        // How the Arduino-code circuit builder should wire it up.

        builder: {
            idPrefix: "LED",
            gpioPin: "ANODE",
            groundPin: "CATHODE"
        },

        generator: {

            setup(pin) {
                return `pinMode(${pin}, OUTPUT);`;
            },

            loop(pin) {
                return `digitalWrite(${pin}, HIGH);\ndelay(500);\ndigitalWrite(${pin}, LOW);\ndelay(500);`;
            }

        }

    },


    // ======================================================
    // BUTTON
    // ======================================================

    Button: {

        svg: createButtonSVG,

        initializer: initializeButton,

        pins: [ "LEFT", "RIGHT" ],

        requiredConnections: {
            LEFT: "GPIO",
            RIGHT: "GND"
        },

        detect: { pinMode: "INPUT" },

        builder: {
            idPrefix: "Button",
            gpioPin: "LEFT",
            groundPin: "RIGHT"
        },

        generator: {

            setup(pin) {
                return `pinMode(${pin}, INPUT);`;
            },

            loop(pin) {
                return `if (digitalRead(${pin}) == HIGH) {\n  // button pressed\n}`;
            }

        }

    },


    // ======================================================
    // SERVO
    // ======================================================

    Servo: {

        svg: createServoSVG,

        pins: [ "SIGNAL", "VCC", "GND" ],

        requiredConnections: {
            SIGNAL: "GPIO",
            VCC: "3V3",
            GND: "GND"
        },

        detect: { attach: true },

        builder: {
            idPrefix: "Servo",
            gpioPin: "SIGNAL",
            powerPin: "VCC",
            groundPin: "GND"
        },

        generator: {

            setup(pin) {
                return `myServo.attach(${pin});`;
            },

            loop() {
                return `myServo.write(90);\ndelay(500);`;
            }

        }

    },


    // ======================================================
    // BUZZER
    // ======================================================

    Buzzer: {

        svg: createBuzzerSVG,

        pins: [ "POSITIVE", "NEGATIVE" ],

        gpioPin: "POSITIVE",

        gpioHandler(pin, state) {

            if (pin.dataset.pin !== "POSITIVE") return;

            updateBuzzer(pin, state);

        },

        requiredConnections: {
            POSITIVE: "GPIO",
            NEGATIVE: "GND"
        },

        detect: { tone: true },

        builder: {
            idPrefix: "Buzzer",
            gpioPin: "POSITIVE",
            groundPin: "NEGATIVE"
        },

        generator: {

            setup() {
                return "";
            },

            loop(pin) {
                return `tone(${pin}, 1000);\ndelay(300);\nnoTone(${pin});\ndelay(300);`;
            }

        }

    },


    // ======================================================
    // POTENTIOMETER
    // ======================================================

    Potentiometer: {

        svg: createPotentiometerSVG,

        initializer: initializePotentiometer,

        pins: [ "VCC", "OUT", "GND" ],

        requiredConnections: {
            VCC: "3V3",
            OUT: "GPIO",
            GND: "GND"
        },

        detect: { analogRead: true },

        builder: {
            idPrefix: "Potentiometer",
            gpioPin: "OUT",
            powerPin: "VCC",
            groundPin: "GND"
        },

        generator: {

            setup() {
                return "";
            },

            loop(pin) {
                return `int value = analogRead(${pin});`;
            }

        }

    }

};



// ==========================================
// Helper Functions
// ==========================================

function getComponentDefinition(type) {

    return COMPONENTS[type] || null;

}


function getComponentPins(type) {

    const component = COMPONENTS[type];

    return component ? component.pins : [];

}


function hasGPIOHandler(type) {

    const component = COMPONENTS[type];

    return component && typeof component.gpioHandler === "function";

}


function runGPIOHandler(type, pin, state) {

    const component = COMPONENTS[type];

    if (!component) return;

    if (typeof component.gpioHandler !== "function") return;

    component.gpioHandler(pin, state);

}


function initializeComponent(type, element) {

    const component = COMPONENTS[type];

    if (!component) return;

    if (typeof component.initializer === "function") {

        component.initializer(element);

    }

}


// Every registered type whose `detect` rule matches how it shows
// up in raw Arduino code - used by the generic Arduino->circuit
// builder so it never has to hardcode a per-type block.

function findComponentTypeByDetect(predicate) {

    return Object.keys(COMPONENTS).find(type => {

        const detect = COMPONENTS[type].detect;

        return detect && predicate(detect);

    });

}
