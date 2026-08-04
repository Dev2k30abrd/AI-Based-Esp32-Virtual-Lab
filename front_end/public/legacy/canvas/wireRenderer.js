// =====================================
// Wire Renderer
// =====================================

const wireSVG = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
);

wireSVG.setAttribute("id","wireLayer");

wireSVG.style.position="absolute";
wireSVG.style.left="0";
wireSVG.style.top="0";
wireSVG.style.width="100%";
wireSVG.style.height="100%";
wireSVG.style.pointerEvents="none";

canvas.appendChild(wireSVG);

// =====================================
// Draw Professional 90° Wire
// =====================================

const wireColors = [
    "#ff4d4d",
    "#00ff88",
    "#4da6ff",
    "#ffd633",
    "#b84dff",
    "#ff9933",
    "#00e5ff",
    "#ff66cc",
    "#ffffff",
    "#66ff66"
];

let wireIndex = 0;

function drawWire(pinA,pinB){

    const path=document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );

    path.setAttribute("fill","none");

    path.setAttribute(
        "stroke",
        wireColors[wireIndex]
    );

    path.setAttribute("stroke-width","4");

    path.setAttribute("stroke-linejoin","round");

    path.setAttribute("stroke-linecap","round");

    path.classList.add("wire-path");

    // The <svg> layer itself ignores pointer events (so dragging
    // components/pins underneath it still works), but each finished
    // wire opts back in so it can be clicked/selected/deleted.
    path.style.pointerEvents="stroke";
    path.style.cursor="pointer";

    path.addEventListener("click",(e)=>{

        e.stopPropagation();

        selectWire(path);

    });

    path.addEventListener("contextmenu",(e)=>{

        e.preventDefault();

        e.stopPropagation();

        deleteWireByPath(path);

    });

    wireSVG.appendChild(path);

    updateWire(path,pinA,pinB);

    wireIndex++;

    if(wireIndex>=wireColors.length)
        wireIndex=0;

    return path;

}

// =====================================
// Live "in progress" wire that follows
// the cursor while dragging from a pin
// =====================================

let liveWirePath = null;

function drawLiveWire(pinA){

    liveWirePath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );

    liveWirePath.setAttribute("fill","none");
    liveWirePath.setAttribute("stroke","#ffffff");
    liveWirePath.setAttribute("stroke-width","3");
    liveWirePath.setAttribute("stroke-dasharray","6 5");
    liveWirePath.setAttribute("stroke-linecap","round");
    liveWirePath.style.pointerEvents="none";
    liveWirePath.classList.add("live-wire");

    wireSVG.appendChild(liveWirePath);

    updateLiveWire(pinA,{clientX:0,clientY:0});

}

function updateLiveWire(pinA,evt){

    if(!liveWirePath) return;

    const a=pinA.getBoundingClientRect();

    const pointA = screenToCanvasPoint(a.left+a.width/2, a.top+a.height/2);
    const pointB = screenToCanvasPoint(evt.clientX, evt.clientY);

    const midX=(pointA.x+pointB.x)/2;

    liveWirePath.setAttribute(
        "d",
        `M ${pointA.x} ${pointA.y} L ${midX} ${pointA.y} L ${midX} ${pointB.y} L ${pointB.x} ${pointB.y}`
    );

}

function removeLiveWire(){

    if(liveWirePath){

        liveWirePath.remove();

        liveWirePath=null;

    }

}

// =====================================
// Wire Selection & Deletion
// (click a wire to select it, then press
// Delete/Backspace, or right-click a wire
// to delete it instantly)
// =====================================

let selectedWirePath = null;

function selectWire(path){

    if(selectedWirePath && selectedWirePath!==path){

        selectedWirePath.classList.remove("selected-wire");

    }

    if(selectedWirePath===path){

        path.classList.remove("selected-wire");

        selectedWirePath=null;

        return;

    }

    selectedWirePath=path;

    path.classList.add("selected-wire");

}

function deleteWireByPath(path){

    const connection = connections.find(c=>c.wire===path);

    if(connection){

        removeConnection(connection);

    } else if(path.remove){

        path.remove();

    }

    if(selectedWirePath===path){

        selectedWirePath=null;

    }

}

document.addEventListener("click",(e)=>{

    if(selectedWirePath && !e.target.classList.contains("wire-path")){

        selectedWirePath.classList.remove("selected-wire");

        selectedWirePath=null;

    }

});

document.addEventListener("keydown",(e)=>{

    if(e.key!=="Delete" && e.key!=="Backspace") return;

    if(!selectedWirePath) return;

    // Don't hijack Backspace/Delete while typing in a text field
    const active=document.activeElement;

    if(active && (active.tagName==="TEXTAREA" || active.tagName==="INPUT")) return;

    deleteWireByPath(selectedWirePath);

});

function updateWire(path,pinA,pinB){

    const a=pinA.getBoundingClientRect();

    const b=pinB.getBoundingClientRect();

    // screenToCanvasPoint (canvas/viewport.js) converts a real screen
    // position into the canvas's own, un-zoomed coordinate space -
    // required because this <path> lives inside the #canvas element,
    // which now gets scaled/panned as a whole.
    const pointA = screenToCanvasPoint(
        a.left + a.width/2,
        a.top + a.height/2
    );

    const pointB = screenToCanvasPoint(
        b.left + b.width/2,
        b.top + b.height/2
    );

    const midX=(pointA.x+pointB.x)/2;

    path.setAttribute(
        "d",
        `
        M ${pointA.x} ${pointA.y}
        L ${midX} ${pointA.y}
        L ${midX} ${pointB.y}
        L ${pointB.x} ${pointB.y}
        `
    );

}

// =====================================
// Remove every drawn wire (used by
// Load / undo-redo / autobuild reset)
// =====================================

function clearAllWires(){

    wireSVG.querySelectorAll(".wire-path").forEach(p=>p.remove());

    removeLiveWire();

    selectedWirePath = null;

}