// ======================================
// GPIO Manager
// ======================================

const gpioState = {};


// ======================================
// GPIO
// ======================================

function setGPIO(pin,value){

    pin = String(pin);

    gpioState[pin] = value;

    console.log("GPIO",pin,value);

    updateComponents();

}

function getGPIO(pin){

    pin = String(pin);

    return gpioState[pin] || 0;

}



// ======================================
// Button Input
// ======================================

function digitalRead(pin){

    pin = String(pin);

    for(const connection of connections){

        let espPin = null;
        let buttonPin = null;

        if(
            connection.fromComponent==="ESP32" &&
            connection.toComponent==="Button"
        ){

            espPin = String(connection.fromPin);
            buttonPin = connection.to;

        }

        else if(
            connection.fromComponent==="Button" &&
            connection.toComponent==="ESP32"
        ){

            espPin = String(connection.toPin);
            buttonPin = connection.from;

        }

        if(!espPin || !buttonPin) continue;

        if(espPin!==pin) continue;

        const svg = buttonPin.closest("svg");

        return Number(svg.dataset.state || 0);

    }

    return getGPIO(pin);

}

// ======================================
// Potentiometer Input
// ======================================

function analogRead(pin){

    pin = String(pin);

    return getPotentiometerValue(pin);

}

// ======================================
// Servo
// ======================================

function updateServoByGPIO(pin,angle){

    pin = String(pin);

    connections.forEach(connection=>{

        let espPin = null;
        let servoPin = null;

        if(
            connection.fromComponent==="ESP32" &&
            connection.toComponent==="Servo"
        ){

            espPin = String(connection.fromPin);
            servoPin = connection.to;

        }

        else if(
            connection.fromComponent==="Servo" &&
            connection.toComponent==="ESP32"
        ){

            espPin = String(connection.toPin);
            servoPin = connection.from;

        }

        if(!espPin || !servoPin) return;

        if(espPin!==pin) return;

        const svg = servoPin.closest("svg");

        if(!svg) return;

        const horn = svg.querySelector(".servo-horn");

        if(!horn) return;

        angle = Math.max(
            0,
            Math.min(180,Number(angle))
        );

        horn.setAttribute(
            "transform",
            `rotate(${angle-90} 65 35)`
        );

    });

}



// ======================================
// Update Components
// ======================================

// ======================================
// Update Components
// ======================================

// ======================================
// Update Components (Registry Based)
// ======================================

function updateComponents(){

    connections.forEach(connection=>{

        let espPin = null;
        let componentPin = null;
        let componentType = null;

        // -----------------------------
        // ESP32 -> Component
        // -----------------------------

        if(connection.fromComponent==="ESP32"){

            espPin = String(connection.fromPin);
            componentPin = connection.to;
            componentType = connection.toComponent;

        }

        // -----------------------------
        // Component -> ESP32
        // -----------------------------

        else if(connection.toComponent==="ESP32"){

            espPin = String(connection.toPin);
            componentPin = connection.from;
            componentType = connection.fromComponent;

        }

        if(!espPin || !componentPin) return;

        if(
            espPin==="3V3" ||
            espPin==="GND"
        ) return;

        const state = getGPIO(espPin);

        // -----------------------------
        // Registry Lookup
        // -----------------------------

        const component = COMPONENTS[componentType];

        if(!component) return;

        if(!component.gpioHandler) return;

        // -----------------------------
        // Call Component Handler
        // -----------------------------

        component.gpioHandler(

            componentPin,

            state

        );

    });

}