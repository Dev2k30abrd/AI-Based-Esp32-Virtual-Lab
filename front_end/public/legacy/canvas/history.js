// =====================================
// Undo / Redo History
// =====================================
//
// Snapshots are pushed after each meaningful canvas edit: adding or
// deleting a component, finishing a drag, or adding/deleting a wire.
// This mirrors the existing Save/Load format in app.js so restoring
// a snapshot reuses the same createComponent()/createConnection()
// calls the rest of the app already relies on.

const HISTORY_LIMIT = 50;

let undoStack = [];
let redoStack = [];
let isRestoringHistory = false;

function captureCanvasState(){

    const state = { components: [], connections: [] };

    document.querySelectorAll(".placed-component").forEach(component=>{

        state.components.push({
            id: component.dataset.id,
            type: component.dataset.type,
            left: component.style.left,
            top: component.style.top
        });

    });

    connections.forEach(c=>{

        state.connections.push({
            fromComponent: c.from.closest(".placed-component").dataset.id,
            toComponent: c.to.closest(".placed-component").dataset.id,
            fromPin: c.from.dataset.pin,
            toPin: c.to.dataset.pin
        });

    });

    return JSON.stringify(state);

}

function restoreCanvasState(json){

    isRestoringHistory = true;

    const state = JSON.parse(json);

    document.querySelectorAll(".placed-component").forEach(x=>x.remove());

    connections.length = 0;

    if(typeof clearAllWires==="function"){
        clearAllWires();
    }

    const componentMap = {};

    let maxId = 0;

    state.components.forEach(c=>{

        createComponent(c.type);

        const all = document.querySelectorAll(".placed-component");
        const created = all[all.length-1];

        created.style.left = c.left;
        created.style.top = c.top;
        created.dataset.id = c.id;

        componentMap[c.id] = created;

        const numericId = parseInt(c.id,10);

        if(!isNaN(numericId)){
            maxId = Math.max(maxId, numericId);
        }

    });

    // Keep future createComponent() ids from colliding with restored ones.
    componentCounter = maxId;

    state.connections.forEach(c=>{

        const fromComponent = componentMap[c.fromComponent];
        const toComponent = componentMap[c.toComponent];

        if(!fromComponent || !toComponent) return;

        const fromPin = fromComponent.querySelector(`[data-pin="${c.fromPin}"]`);
        const toPin = toComponent.querySelector(`[data-pin="${c.toPin}"]`);

        if(!fromPin || !toPin) return;

        createConnection(fromPin, toPin);

    });

    updateAllConnections();

    isRestoringHistory = false;

}

function pushHistorySnapshot(){

    if(isRestoringHistory) return;

    const snapshot = captureCanvasState();

    if(undoStack.length && undoStack[undoStack.length-1]===snapshot){
        return; // nothing actually changed
    }

    undoStack.push(snapshot);

    if(undoStack.length > HISTORY_LIMIT){
        undoStack.shift();
    }

    // A fresh action invalidates whatever redo branch existed.
    redoStack.length = 0;

    updateHistoryButtons();

}

function undoHistory(){

    // Need at least [state-before-last-action, current-state].
    if(undoStack.length < 2) return;

    const current = undoStack.pop();

    redoStack.push(current);

    const previous = undoStack[undoStack.length-1];

    restoreCanvasState(previous);

    updateHistoryButtons();

}

function redoHistory(){

    if(!redoStack.length) return;

    const next = redoStack.pop();

    undoStack.push(next);

    restoreCanvasState(next);

    updateHistoryButtons();

}

function updateHistoryButtons(){

    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");

    if(undoBtn) undoBtn.disabled = undoStack.length < 2;
    if(redoBtn) redoBtn.disabled = redoStack.length === 0;

}

document.addEventListener("keydown",(e)=>{

    const active = document.activeElement;
    const typing = active && (active.tagName==="TEXTAREA" || active.tagName==="INPUT");

    if(typing) return;

    const ctrlOrCmd = e.ctrlKey || e.metaKey;

    if(!ctrlOrCmd) return;

    if(e.key==="z" && !e.shiftKey){

        e.preventDefault();
        undoHistory();

    } else if(e.key==="y" || (e.key==="Z" && e.shiftKey) || (e.key==="z" && e.shiftKey)){

        e.preventDefault();
        redoHistory();

    }

});

const undoBtnEl = document.getElementById("undoBtn");
const redoBtnEl = document.getElementById("redoBtn");

if(undoBtnEl) undoBtnEl.addEventListener("click", undoHistory);
if(redoBtnEl) redoBtnEl.addEventListener("click", redoHistory);

updateHistoryButtons();

window.pushHistorySnapshot = pushHistorySnapshot;
