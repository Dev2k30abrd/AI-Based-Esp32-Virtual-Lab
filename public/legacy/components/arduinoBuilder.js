// ==========================================
// STEMbotix Arduino -> Circuit Builder
// Registry-Driven (Softcoded) Version
//
// This no longer hardcodes a block per component
// type. It scans the code for each recognised
// Arduino call (pinMode/.attach/tone/analogRead),
// looks up which registered COMPONENTS[type] claims
// that pattern via its `detect` rule, and wires it
// up using that type's `builder` metadata. Adding a
// new component to config/components.js (detect +
// builder) is enough for it to be picked up here too
// - no code changes needed in this file.
// ==========================================

function buildCircuitFromArduino(){

    console.log("Arduino Builder Started");

    const code =
        document.getElementById("codeEditor").value;

    if(code.trim()===""){

        alert("Arduino code is empty.");

        return;

    }

    const circuit={

        components:[ { id:"ESP32", type:"ESP32" } ],

        connections:[],

        logic:[],

        arduino:code

    };

    const addedPins = {};
    const typeCounts = {};

    //---------------------------------------
    // Resolve pin-name constants (int ledPin = 5; ...)
    //---------------------------------------

    const vars={};

    code.replace(
        /(?:const\s+)?(?:int|byte|long|uint8_t)\s+(\w+)\s*=\s*(\d+)/g,
        (_,name,value)=>{ vars[name]=value; }
    );

    function pin(x){

        x=x.trim();

        return vars[x] || x;

    }

    //---------------------------------------
    // Add one component instance wired to a GPIO,
    // using nothing but that type's registry entry.
    //---------------------------------------

    function addComponent(type, gpio){

        if(addedPins[gpio]) return;

        const def = COMPONENTS[type];

        if(!def || !def.builder) return;

        addedPins[gpio] = true;

        typeCounts[type] = (typeCounts[type] || 0) + 1;

        const id = def.builder.idPrefix + typeCounts[type];

        circuit.components.push({ id, type });

        circuit.connections.push({
            fromComponent:"ESP32",
            fromPin:String(gpio),
            toComponent:id,
            toPin:def.builder.gpioPin
        });

        if(def.builder.groundPin){

            circuit.connections.push({
                fromComponent:"ESP32",
                fromPin:"GND",
                toComponent:id,
                toPin:def.builder.groundPin
            });

        }

        if(def.builder.powerPin){

            circuit.connections.push({
                fromComponent:"ESP32",
                fromPin:"3V3",
                toComponent:id,
                toPin:def.builder.powerPin
            });

        }

    }

    //---------------------------------------
    // pinMode(pin, MODE) -> matches by `detect.pinMode`
    // (e.g. LED = "OUTPUT", Button = "INPUT")
    //---------------------------------------

    [...code.matchAll(/pinMode\s*\((.*?),(.*?)\)/g)].forEach(match=>{

        const gpio = pin(match[1]);

        const mode = match[2].trim();

        const type = findComponentTypeByDetect(detect=>

            detect.pinMode && mode.includes(detect.pinMode)

        );

        if(type) addComponent(type, gpio);

    });

    //---------------------------------------
    // <name>.attach(pin) -> matches by `detect.attach`
    //---------------------------------------

    [...code.matchAll(/\.attach\s*\((.*?)\)/g)].forEach(match=>{

        const gpio = pin(match[1]);

        const type = findComponentTypeByDetect(detect=> detect.attach);

        if(type) addComponent(type, gpio);

    });

    //---------------------------------------
    // analogRead(pin) -> matches by `detect.analogRead`
    //---------------------------------------

    [...code.matchAll(/analogRead\s*\((.*?)\)/g)].forEach(match=>{

        const gpio = pin(match[1]);

        const type = findComponentTypeByDetect(detect=> detect.analogRead);

        if(type) addComponent(type, gpio);

    });

    //---------------------------------------
    // tone(pin, ...) -> matches by `detect.tone`
    //---------------------------------------

    if(code.includes("tone(") || code.includes("noTone(")){

        const match = code.match(/tone\s*\((.*?),/);

        if(match){

            const gpio = pin(match[1]);

            const type = findComponentTypeByDetect(detect=> detect.tone);

            if(type) addComponent(type, gpio);

        }

    }

    // ---------------------------------------
    // Nothing Found
    // ---------------------------------------

    if(circuit.components.length===1){

        alert("No supported components found in Arduino code.");

        return;

    }

    // ---------------------------------------
    // Build Circuit
    // ---------------------------------------

    console.clear();

    console.log("Arduino Circuit");

    console.log(circuit);

    autoBuildCircuit(circuit);

}
