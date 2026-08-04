// ======================================
// Registry Based Arduino Code Generator
// ======================================

function generateArduinoCode(){

    let setupCode = "";

    let loopCode = "";

    connections.forEach(connection=>{

        let espPin = null;
        let componentType = null;

        if(connection.fromComponent==="ESP32"){

            espPin = connection.fromPin;
            componentType = connection.toComponent;

        }

        else if(connection.toComponent==="ESP32"){

            espPin = connection.toPin;
            componentType = connection.fromComponent;

        }

        if(!espPin) return;

        if(
            espPin==="3V3" ||
            espPin==="GND"
        ) return;

        const component = COMPONENTS[componentType];

        if(!component) return;

        if(component.generateSetup){

            setupCode +=
                component.generateSetup(espPin) + "\n";

        }

        if(component.generateLoop){

            loopCode +=
                component.generateLoop(espPin) + "\n";

        }

    });

    const finalCode =

`void setup(){

${setupCode}

}

void loop(){

${loopCode}

}
`;

    document.getElementById("codeEditor").value =
        finalCode;

}