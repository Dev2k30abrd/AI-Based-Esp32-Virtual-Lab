// ==========================================
// STEMbotix Auto Builder
// Logic Engine Version
// ==========================================

window.currentCircuit = null;
window.currentLogic = [];


async function autoBuildCircuit(circuit){

    console.clear();

    console.log("AI Circuit");
    console.log(circuit);

    // ==========================================
    // Save complete circuit for Logic Engine
    // ==========================================

    window.currentCircuit = circuit;
    window.currentLogic = circuit.logic || [];

    stopArduino();

    document.getElementById("serialOutput").innerHTML = "";

    document
        .querySelectorAll(".placed-component")
        .forEach(x => x.remove());

    connections.length = 0;

    if(typeof clearAllWires === "function"){
        clearAllWires();
    }

    componentCounter = 0;

    // ==========================================
    // Component Maps
    // ==========================================

    const componentMap = {};
    const typeCount = {};

    // ==========================================
    // Create Components
    // ==========================================

    circuit.components.forEach(component=>{

        createComponent(component.type);

        const all =
            document.querySelectorAll(".placed-component");

        const created =
            all[all.length-1];

        let id = component.id;

        if(!id){

            typeCount[component.type] =
                (typeCount[component.type] || 0) + 1;

            id =
                component.type +
                typeCount[component.type];

        }

        created.dataset.componentId = id;
        created.dataset.componentType = component.type;

        if(
            component.type === "LED" &&
            (component.color || component.ledColor) &&
            typeof setLEDColor === "function"
        ){
            setLEDColor(created, component.color || component.ledColor);
        }

        componentMap[id] = created;

    });

    // ==========================================
    // Auto Arrange
    // ==========================================

    let x = 80;
    let y = 120;

    Object.values(componentMap).forEach(component=>{

        component.style.left = x + "px";
        component.style.top = y + "px";

        x += 220;

        if(x > 900){

            x = 80;
            y += 220;

        }

    });

    // ==========================================
    // Create Wires
    // ==========================================

    circuit.connections.forEach(connection=>{

        let fromComponent = componentMap[connection.fromComponent];

        if(!fromComponent){

            fromComponent =
                Object.values(componentMap).find(x=>

                    x.dataset.componentType ===
                    connection.fromComponent

                );

        }

        let toComponent = componentMap[connection.toComponent];

        if(!toComponent){

            toComponent =
                Object.values(componentMap).find(x=>

                    x.dataset.componentType ===
                    connection.toComponent

                );

        }

        if(!fromComponent){

            console.error(
                "FROM COMPONENT NOT FOUND",
                connection
            );

            return;

        }

        if(!toComponent){

            console.error(
                "TO COMPONENT NOT FOUND",
                connection
            );

            return;

        }

        const fromPin =
            fromComponent.querySelector(
                `[data-pin="${connection.fromPin}"]`
            );

        const toPin =
            toComponent.querySelector(
                `[data-pin="${connection.toPin}"]`
            );

        if(!fromPin){

            console.error(
                "FROM PIN NOT FOUND",
                connection.fromPin
            );

            return;

        }

        if(!toPin){

            console.error(
                "TO PIN NOT FOUND",
                connection.toPin
            );

            return;

        }

        createConnection(
            fromPin,
            toPin
        );

    });

    // ==========================================
    // Arduino Code
    // ==========================================

    document.getElementById("codeEditor").value =
        circuit.arduino;

    // ==========================================
    // Blocks (best-effort translation of the same
    // circuit into the Blockly workspace)
    // ==========================================

    if(typeof window.loadCircuitIntoBlockly === "function"){

        window.loadCircuitIntoBlockly(circuit);

    }

    // ==========================================
    // Show Logic
    // ==========================================

    console.log("Logic");

    console.table(window.currentLogic);

    // ==========================================
    // Start Simulation
    // ==========================================

    setTimeout(()=>{

        runArduino(circuit.arduino);

    },300);

}