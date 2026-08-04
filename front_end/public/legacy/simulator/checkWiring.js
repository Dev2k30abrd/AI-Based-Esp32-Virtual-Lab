// ======================================
// Generic Wiring Checker
// Registry Based
// ======================================

function checkWiring(){

    const serial = document.getElementById("serialOutput");

    serial.innerHTML = "";

    if(connections.length===0){

        serial.innerHTML += "❌ No wiring found.<br>";

        return;

    }

    // -----------------------------
    // Check every registered component
    // -----------------------------

    Object.keys(COMPONENTS).forEach(type=>{

        // ESP32 itself doesn't need checking

        if(type==="ESP32") return;

        const component = COMPONENTS[type];

        if(!component.requiredConnections) return;

        const exists = connections.some(c=>

            c.fromComponent===type ||

            c.toComponent===type

        );

        if(!exists) return;

        let valid = true;

        // -----------------------------
        // Check every required pin
        // -----------------------------

        Object.entries(component.requiredConnections)

        .forEach(([pinName,expected])=>{

            let found = false;

            connections.forEach(c=>{

                let espPin = null;

                let compPin = null;

                // ESP32 -> Component

                if(

                    c.fromComponent==="ESP32" &&

                    c.toComponent===type

                ){

                    espPin = c.fromPin;

                    compPin = c.toPin;

                }

                // Component -> ESP32

                else if(

                    c.fromComponent===type &&

                    c.toComponent==="ESP32"

                ){

                    espPin = c.toPin;

                    compPin = c.fromPin;

                }

                else{

                    return;

                }

                if(compPin!==pinName) return;

                switch(expected){

                    case "GPIO":

                        if(

                            espPin!=="3V3" &&

                            espPin!=="GND"

                        ){

                            found = true;

                        }

                        break;

                    default:

                        if(espPin===expected){

                            found = true;

                        }

                        break;

                }

            });

            if(!found){

                valid = false;

            }

        });

        serial.innerHTML +=

            valid

            ? `✅ ${type} wiring looks valid.<br>`

            : `❌ ${type} wiring is incorrect.<br>`;

    });

}