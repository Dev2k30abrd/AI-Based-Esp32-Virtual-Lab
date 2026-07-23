// =======================================
// Wiring Manager
// =======================================

const connections = [];

// =======================================
// Drag-to-Wire (Wokwi style)
//
// Press down on a pin, drag toward another
// pin, release to connect - instead of the
// old click-then-click flow.
// =======================================

let dragSourcePin = null;

function startWireDrag(pinElement){

    dragSourcePin = pinElement;

    pinElement.classList.add("wiring-source");

    drawLiveWire(pinElement);

}

function updateWireDrag(evt){

    if(!dragSourcePin) return;

    updateLiveWire(dragSourcePin, evt);

    document
        .querySelectorAll(".pin.wiring-target-valid,.pin.wiring-target-invalid")
        .forEach(p=>p.classList.remove("wiring-target-valid","wiring-target-invalid"));

    const target = document.elementFromPoint(evt.clientX,evt.clientY);

    if(target && target.classList && target.classList.contains("pin") && target!==dragSourcePin){

        if(target.dataset.component===dragSourcePin.dataset.component){

            target.classList.add("wiring-target-invalid");

        } else {

            target.classList.add("wiring-target-valid");

        }

    }

}

function endWireDrag(evt){

    if(!dragSourcePin) return;

    const target = document.elementFromPoint(evt.clientX,evt.clientY);

    removeLiveWire();

    dragSourcePin.classList.remove("wiring-source");

    document
        .querySelectorAll(".pin.wiring-target-valid,.pin.wiring-target-invalid")
        .forEach(p=>p.classList.remove("wiring-target-valid","wiring-target-invalid"));

    if(target && target.classList && target.classList.contains("pin") && target!==dragSourcePin){

        createConnection(dragSourcePin,target);

    }

    dragSourcePin = null;

}

function createConnection(pinA, pinB){

    if(pinA===pinB) return;

    if(pinA.dataset.component===pinB.dataset.component){
        alert("Cannot connect same component.");
        return;
    }

    const duplicate = connections.find(c=>{

        return (
            (c.from===pinA && c.to===pinB) ||
            (c.from===pinB && c.to===pinA)
        );

    });

    if(duplicate){
        alert("Wire already exists.");
        return;
    }

    const wire = drawWire(pinA,pinB);

    connections.push({

        // DOM references
        from: pinA,
        to: pinB,

        // component names
        fromComponent: pinA.dataset.component,
        toComponent: pinB.dataset.component,

        // pin names
        fromPin: pinA.dataset.pin,
        toPin: pinB.dataset.pin,

        // direct references for easy lookup
        espPin:
            pinA.dataset.component==="ESP32"
                ? pinA.dataset.pin
                : pinB.dataset.pin,

        ledPin:
            pinA.dataset.component==="LED"
                ? pinA
                : (pinB.dataset.component==="LED" ? pinB : null),

        wire: wire

    });

    updateComponents();

    if(typeof pushHistorySnapshot==="function"){
        pushHistorySnapshot();
    }

}
// =======================================
// Remove a Connection (used when a wire is
// deleted directly, e.g. click + Delete key
// or right-click on the wire itself)
// =======================================

function removeConnection(connection){

    if(!connection) return;

    if(connection.wire && connection.wire.remove){

        connection.wire.remove();

    }

    const idx = connections.indexOf(connection);

    if(idx!==-1){

        connections.splice(idx,1);

    }

    updateComponents();

    if(typeof pushHistorySnapshot==="function"){
        pushHistorySnapshot();
    }

}

function updateAllConnections(){

    connections.forEach(connection=>{

        updateWire(
            connection.wire,
            connection.from,
            connection.to
        );

    });

}

// =======================================
// Create Connection from Saved Data
// =======================================

function createConnectionByData(data){

    const components = document.querySelectorAll(".placed-component");

    let fromPin = null;
    let toPin = null;

    components.forEach(component=>{

        if(component.dataset.id != data.fromId &&
           component.dataset.id != data.toId){

            return;

        }

        component.querySelectorAll(".pin").forEach(pin=>{

            if(
                component.dataset.id == data.fromId &&
                pin.dataset.pin == data.fromPin
            ){

                fromPin = pin;

            }

            if(
                component.dataset.id == data.toId &&
                pin.dataset.pin == data.toPin
            ){

                toPin = pin;

            }

        });

    });

    if(fromPin && toPin){

        createConnection(fromPin,toPin);

    }

}