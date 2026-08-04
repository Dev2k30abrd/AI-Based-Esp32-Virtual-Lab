// =====================================
// Canvas Viewport (Zoom & Pan)
// =====================================
//
// #canvasViewport is a fixed-size window (overflow hidden) that the
// user looks through. #canvas is the actual drawing surface inside
// it, moved/scaled with a CSS transform. Everything that needs to
// convert a real screen position (mouse cursor, a pin's bounding
// rect) into the canvas's own un-zoomed coordinate space should go
// through screenToCanvasPoint() below, rather than re-deriving the
// math inline.

const canvasEl = document.getElementById("canvas");
const canvasViewportEl = document.getElementById("canvasViewport");

let zoomLevel = 1;
let panX = 0;
let panY = 0;

const ZOOM_MIN = 0.08;
const ZOOM_MAX = 6;
const ZOOM_WHEEL_SENSITIVITY = 0.0015;

function applyCanvasTransform(){

    canvasEl.style.transform =
        `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;

}

function clampZoom(z){

    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

}

function updateZoomLabel(){

    const label = document.getElementById("zoomLevelLabel");

    if(label){

        label.textContent = Math.round(zoomLevel*100) + "%";

    }

}

function refreshWiresIfPossible(){

    if(typeof updateAllConnections==="function"){

        updateAllConnections();

    }

}

// Convert a real on-screen point (e.g. e.clientX/clientY, or a pin's
// getBoundingClientRect() center) into #canvas's own local, un-zoomed
// coordinate space.
function screenToCanvasPoint(clientX, clientY){

    const rect = canvasViewportEl.getBoundingClientRect();

    return {
        x: (clientX - rect.left - panX) / zoomLevel,
        y: (clientY - rect.top - panY) / zoomLevel
    };

}

// Zoom while keeping the point currently under (screenX, screenY)
// visually fixed in place - the standard "zoom to cursor" behaviour.
function zoomToScreenPoint(screenX, screenY, newZoomRaw){

    const rect = canvasViewportEl.getBoundingClientRect();

    const mouseX = screenX - rect.left;
    const mouseY = screenY - rect.top;

    const canvasX = (mouseX - panX) / zoomLevel;
    const canvasY = (mouseY - panY) / zoomLevel;

    const newZoom = clampZoom(newZoomRaw);

    panX = mouseX - canvasX * newZoom;
    panY = mouseY - canvasY * newZoom;
    zoomLevel = newZoom;

    applyCanvasTransform();
    updateZoomLabel();
    refreshWiresIfPossible();

}

// Smooth, animated zoom (used by the +/- buttons and "reset view" -
// not by the wheel/drag, which should track the input immediately).
function animatedZoomToCenter(newZoomRaw){

    const rect = canvasViewportEl.getBoundingClientRect();

    canvasEl.classList.add("canvas-animated");

    zoomToScreenPoint(
        rect.left + rect.width/2,
        rect.top + rect.height/2,
        newZoomRaw
    );

    window.setTimeout(()=>{

        canvasEl.classList.remove("canvas-animated");

    },220);

}

function resetView(){

    canvasEl.classList.add("canvas-animated");

    zoomLevel = 1;
    panX = 0;
    panY = 0;

    applyCanvasTransform();
    updateZoomLabel();
    refreshWiresIfPossible();

    window.setTimeout(()=>{

        canvasEl.classList.remove("canvas-animated");

    },220);

}

// =====================================
// Scroll wheel = zoom (like Wokwi - no
// modifier key required)
// =====================================

canvasViewportEl.addEventListener("wheel",(e)=>{

    e.preventDefault();

    const zoomDelta = -e.deltaY * ZOOM_WHEEL_SENSITIVITY * zoomLevel;

    zoomToScreenPoint(e.clientX, e.clientY, zoomLevel + zoomDelta);

}, { passive:false });

// =====================================
// Panning: middle-mouse-button drag
// anywhere, or left-click drag on the
// empty canvas background
// =====================================

let isPanning = false;
let panPointerStartX = 0;
let panPointerStartY = 0;
let panOriginX = 0;
let panOriginY = 0;

canvasViewportEl.addEventListener("mousedown",(e)=>{

    const isBackground =
        e.target===canvasViewportEl ||
        e.target===canvasEl ||
        e.target.classList.contains("canvas-grid");

    const isMiddleButton = e.button===1;

    if(!isBackground && !isMiddleButton) return;

    isPanning = true;

    panPointerStartX = e.clientX;
    panPointerStartY = e.clientY;

    panOriginX = panX;
    panOriginY = panY;

    canvasViewportEl.classList.add("panning");

    if(isMiddleButton) e.preventDefault();

});

document.addEventListener("mousemove",(e)=>{

    if(!isPanning) return;

    panX = panOriginX + (e.clientX - panPointerStartX);
    panY = panOriginY + (e.clientY - panPointerStartY);

    applyCanvasTransform();

    refreshWiresIfPossible();

});

document.addEventListener("mouseup",()=>{

    if(!isPanning) return;

    isPanning = false;

    canvasViewportEl.classList.remove("panning");

});

// =====================================
// Zoom control buttons
// =====================================

const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomResetBtn = document.getElementById("zoomResetBtn");

if(zoomInBtn){

    zoomInBtn.addEventListener("click",()=>{

        animatedZoomToCenter(zoomLevel + 0.2);

    });

}

if(zoomOutBtn){

    zoomOutBtn.addEventListener("click",()=>{

        animatedZoomToCenter(zoomLevel - 0.2);

    });

}

if(zoomResetBtn){

    zoomResetBtn.addEventListener("click",()=>{

        resetView();

    });

}

updateZoomLabel();

// Small public API for other legacy modules (dragging, wiring).
window.getCanvasZoom = ()=>zoomLevel;
window.screenToCanvasPoint = screenToCanvasPoint;
