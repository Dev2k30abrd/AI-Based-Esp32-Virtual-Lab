// ==========================================
// STEMbotix Virtual Lab
// Component Manager
// ==========================================

const canvas = document.getElementById("canvas");
const componentList = document.querySelectorAll(".component");

let componentCounter = 0;


// ==========================================
// Create Component
// ==========================================

// ==========================================
// Create Component (Registry Based)
// ==========================================

function createComponent(type){

    componentCounter++;

    const element = document.createElement("div");

    element.className = "placed-component";

    element.dataset.id = componentCounter;
    element.dataset.type = type;

    // ------------------------------
    // Lookup from Registry
    // ------------------------------

    const component = COMPONENTS[type];

    if(!component){

        console.error("Unknown Component:",type);

        return null;

    }

    // ------------------------------
    // SVG
    // ------------------------------

    element.innerHTML = component.svg();

    // ------------------------------
    // Special Styling
    // ------------------------------

    if(component.cssClass){

    element.classList.add(component.cssClass);

}

    element.style.left="80px";
    element.style.top="80px";

    canvas.appendChild(element);

    // ------------------------------
    // Optional Initializer
    // ------------------------------

    if(component.initializer &&
   typeof component.initializer==="function"){

    component.initializer(element);

}

    makeDraggable(element);

    return element;

}



// ==========================================
// Left Panel
// ==========================================

componentList.forEach(item=>{

    item.addEventListener("click",()=>{

        createComponent(item.innerText.trim());

        if(typeof pushHistorySnapshot==="function"){
            pushHistorySnapshot();
        }

    });

});
window.createComponent = createComponent;



// ==========================================
// Dragging
// ==========================================

function makeDraggable(element){

    let dragging = false;

    let startClientX = 0;
    let startClientY = 0;

    let startLeft = 0;
    let startTop = 0;

    element.addEventListener("mousedown",(e)=>{

        // A pin drag (wiring) is starting - don't also move the component.
        if(e.target.classList.contains("pin")) return;

        dragging = true;

        startClientX = e.clientX;
        startClientY = e.clientY;

        startLeft = parseFloat(element.style.left) || 0;
        startTop = parseFloat(element.style.top) || 0;

        element.classList.add("dragging");

    });

    document.addEventListener("mousemove",(e)=>{

        if(!dragging) return;

        // Divide the on-screen mouse movement by the current zoom
        // level so components track the cursor 1:1 at any zoom.
        const zoom = (typeof getCanvasZoom==="function") ? getCanvasZoom() : 1;

        const dx = (e.clientX - startClientX) / zoom;
        const dy = (e.clientY - startClientY) / zoom;

        element.style.left = (startLeft + dx) + "px";
        element.style.top = (startTop + dy) + "px";

        updateAllConnections();

    });

    document.addEventListener("mouseup",()=>{

        if(!dragging) return;

        dragging = false;

        element.classList.remove("dragging");

        if(typeof pushHistorySnapshot==="function"){
            pushHistorySnapshot();
        }

    });

}



// ==========================================
// Pin Wiring (drag from pin to pin, like Wokwi)
// ==========================================

document.addEventListener("mousedown",(e)=>{

    if(!e.target.classList.contains("pin")) return;

    e.stopPropagation();

    startWireDrag(e.target);

});

document.addEventListener("mousemove",(e)=>{

    updateWireDrag(e);

});

document.addEventListener("mouseup",(e)=>{

    endWireDrag(e);

});



// ==========================================
// RUN BUTTON
// ==========================================

document.getElementById("runBtn").addEventListener("click",()=>{

    stopArduino();

    setTimeout(()=>{

        const code =
            document.getElementById("codeEditor").value;

        console.clear();

        console.log("====== CODE START ======");

        console.log(code);

        console.log("====== CODE END ======");

        runArduino(code);

    },50);

});



// ==========================================
// RESET BUTTON
// ==========================================

document.getElementById("resetBtn").addEventListener("click",()=>{

    stopArduino();

    document.getElementById("serialOutput").innerHTML="";

    Object.keys(gpioState).forEach(key=>{

        delete gpioState[key];

    });

    updateComponents();

    console.clear();

    console.log("Simulator Reset");

});



// ==========================================
// CHECK WIRING
// ==========================================

document.getElementById("checkBtn").addEventListener("click",()=>{

    checkWiring();

});



// ==========================================
// GENERATE CIRCUIT (AI)
// ==========================================

const generateBtn = document.getElementById("generateBtn");

if(generateBtn){

    generateBtn.addEventListener("click",()=>{

        generateCircuit();

    });

}
else{

    console.error("generateBtn not found");

}

// ==========================================
// BUILD CIRCUIT (Arduino)
// ==========================================

const buildBtn = document.getElementById("buildBtn");

if(buildBtn){

    buildBtn.addEventListener("click",()=>{

        console.log("Build Circuit Clicked");

        buildCircuitFromArduino();

    });

}
else{

    console.error("buildBtn not found");

}

// ==========================================
// CLEAR SERIAL
// ==========================================

const clearBtn = document.getElementById("clearSerial");

if(clearBtn){

    clearBtn.addEventListener("click",()=>{

        document.getElementById("serialOutput").innerHTML="";

    });

}

// ==========================================
// COMPONENT CONTEXT MENU
// ==========================================

let selectedComponent = null;

// Create menu
const contextMenu = document.createElement("div");
contextMenu.className = "context-menu";

contextMenu.innerHTML = `
    <button class="delete">🗑 Delete</button>
    <button class="rotate">🔄 Rotate 90° (Coming Soon)</button>
    <button class="duplicate">📋 Duplicate (Coming Soon)</button>
    <div class="color-row" id="ledColorRow">
        <span class="color-label">Color</span>
        <button class="swatch" data-color="red" style="background:#ff3030"></button>
        <button class="swatch" data-color="green" style="background:#22ff66"></button>
        <button class="swatch" data-color="blue" style="background:#3b82ff"></button>
        <button class="swatch" data-color="yellow" style="background:#ffd60a"></button>
        <button class="swatch" data-color="white" style="background:#ffffff"></button>
    </div>
    <button class="cancel">❌ Cancel</button>
`;

document.body.appendChild(contextMenu);

const ledColorRow = contextMenu.querySelector("#ledColorRow");

ledColorRow.querySelectorAll(".swatch").forEach(swatch=>{

    swatch.addEventListener("click",()=>{

        if(!selectedComponent) return;

        setLEDColor(selectedComponent, swatch.dataset.color);

        contextMenu.style.display = "none";

    });

});

// ------------------------------------------
// Right Click on Component
// ------------------------------------------

canvas.addEventListener("contextmenu",(e)=>{

    const component = e.target.closest(".placed-component");

    if(!component) return;

    e.preventDefault();

    selectedComponent = component;

    ledColorRow.style.display =
        component.dataset.componentType === "LED" ||
        component.dataset.type === "LED"
            ? "flex" : "none";

    contextMenu.style.display = "flex";
    contextMenu.style.left = e.pageX + "px";
    contextMenu.style.top = e.pageY + "px";

});

// ------------------------------------------
// Hide Menu
// ------------------------------------------

document.addEventListener("click",()=>{

    contextMenu.style.display = "none";

});

// Prevent closing when clicking inside menu
contextMenu.addEventListener("click",(e)=>{

    e.stopPropagation();

});

// ------------------------------------------
// Delete Component
// ------------------------------------------

contextMenu.querySelector(".delete").addEventListener("click",()=>{

    if(!selectedComponent) return;

    // Remove connected wires
    for(let i = connections.length-1; i>=0; i--){

        const c = connections[i];

        const fromComponent = c.from.closest(".placed-component");
        const toComponent = c.to.closest(".placed-component");

        if(
            fromComponent === selectedComponent ||
            toComponent === selectedComponent
        ){

            if(typeof selectedWirePath!=="undefined" && selectedWirePath===c.wire){

                selectedWirePath=null;

            }

            if(c.wire && c.wire.remove){

                c.wire.remove();

            }

            connections.splice(i,1);

        }

    }

    selectedComponent.remove();

    selectedComponent = null;

    contextMenu.style.display = "none";

    if(typeof pushHistorySnapshot==="function"){
        pushHistorySnapshot();
    }

});

// ------------------------------------------
// Rotate
// ------------------------------------------

contextMenu.querySelector(".rotate").addEventListener("click",()=>{

    alert("Rotate feature coming in next update.");

});

// ------------------------------------------
// Duplicate
// ------------------------------------------

contextMenu.querySelector(".duplicate").addEventListener("click",()=>{

    alert("Duplicate feature coming in next update.");

});

// ------------------------------------------
// Cancel
// ------------------------------------------

contextMenu.querySelector(".cancel").addEventListener("click",()=>{

    contextMenu.style.display = "none";

});

// ==========================================
// SAVE PROJECT
// ==========================================

document.getElementById("saveBtn").addEventListener("click", () => {

    const project = {

        prompt: document.getElementById("promptInput").value,

        model: document.getElementById("modelSelect").value,

        code: document.getElementById("codeEditor").value,

        // The declarative rules driving the AI/logic-engine
        // simulation - without this a reloaded project has no
        // idea how its components are supposed to behave.

        logic: window.currentLogic || [],

        components: [],

        connections: []

    };

    // Save Components
    document.querySelectorAll(".placed-component").forEach(component => {

        const svg = component.querySelector("svg");

        project.components.push({

            id: component.dataset.id,

            type: component.dataset.type,

            // Semantic AI id/type ("LED1"/"LED") - required so the
            // logic engine can find this component again after load.

            componentId: component.dataset.componentId || null,

            componentType: component.dataset.componentType || component.dataset.type,

            // Per-instance visual state.

            ledColor: svg ? (svg.dataset.ledColor || null) : null,

            left: component.style.left,

            top: component.style.top

        });

    });

    // Save Connections
    connections.forEach(c => {

        project.connections.push({

            fromComponent: c.from.closest(".placed-component").dataset.id,

            toComponent: c.to.closest(".placed-component").dataset.id,

            fromPin: c.from.dataset.pin,

            toPin: c.to.dataset.pin

        });

    });

    const blob = new Blob(

        [JSON.stringify(project, null, 4)],

        { type: "application/json" }

    );

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);

    a.download = "STEMbotix_Project.json";

    a.click();

});

// ==========================================
// LOAD PROJECT
// ==========================================

document.getElementById("loadBtn").addEventListener("click", () => {

    const input = document.createElement("input");

    input.type = "file";
    input.accept = ".json";

    input.onchange = function(e){

        const file = e.target.files[0];

        if(!file) return;

        const reader = new FileReader();

        reader.onload = function(event){

            const project = JSON.parse(event.target.result);

            // Avoid pushing a history snapshot for every single
            // component/wire created while rebuilding the loaded
            // project below (same flag history.js's own restore uses).
            if(typeof isRestoringHistory!=="undefined"){
                isRestoringHistory = true;
            }

            // -----------------------------
            // Reset Canvas
            // -----------------------------

            stopArduino();

            document
                .querySelectorAll(".placed-component")
                .forEach(x=>x.remove());

            connections.length = 0;

            if(typeof clearAllWires==="function"){
                clearAllWires();
            }

            componentCounter = 0;

            // -----------------------------
            // Restore Prompt / Model / Code
            // -----------------------------

            document.getElementById("promptInput").value =
                project.prompt || "";

            document.getElementById("modelSelect").value =
                project.model || "";

            document.getElementById("codeEditor").value =
                project.code || "";

            // -----------------------------
            // Restore Components
            // -----------------------------

            const componentMap = {};

            project.components.forEach(c=>{

                createComponent(c.type);

                const all =
                    document.querySelectorAll(".placed-component");

                const created =
                    all[all.length-1];

                created.style.left = c.left;
                created.style.top = c.top;

                created.dataset.id = c.id;

                // Restore the semantic AI id/type - the logic
                // engine looks components up by these, not by the
                // numeric placement id above.

                created.dataset.componentId =
                    c.componentId || c.id;

                created.dataset.componentType =
                    c.componentType || c.type;

                if(c.ledColor && typeof setLEDColor==="function"){

                    setLEDColor(created, c.ledColor);

                }

                componentMap[c.id] = created;

            });

            // -----------------------------
            // Restore Connections
            // -----------------------------

            project.connections.forEach(c=>{

                const fromComponent =
                    componentMap[c.fromComponent];

                const toComponent =
                    componentMap[c.toComponent];

                if(!fromComponent || !toComponent) return;

                const fromPin =
                    fromComponent.querySelector(
                        `[data-pin="${c.fromPin}"]`
                    );

                const toPin =
                    toComponent.querySelector(
                        `[data-pin="${c.toPin}"]`
                    );

                if(!fromPin || !toPin) return;

                createConnection(
                    fromPin,
                    toPin
                );

            });

            updateAllConnections();

            if(typeof isRestoringHistory!=="undefined"){
                isRestoringHistory = false;
            }

            if(typeof pushHistorySnapshot==="function"){
                pushHistorySnapshot();
            }

            // -----------------------------
            // Resume Simulation
            //
            // Restore the exact AI/logic-engine rule set that was
            // active when this project was saved (if any), then
            // start it running - a loaded project should come back
            // to life exactly as it was, not sit static until the
            // user manually presses Run.
            // -----------------------------

            window.currentLogic = project.logic || [];

            setTimeout(()=>{

                runArduino(project.code || "");

            },300);

            alert("Project Loaded Successfully!");

        };

        reader.readAsText(file);

    };

    input.click();

});

// ==========================================
// Seed the initial undo state (empty canvas)
// ==========================================

if(typeof pushHistorySnapshot==="function"){
    pushHistorySnapshot();
}