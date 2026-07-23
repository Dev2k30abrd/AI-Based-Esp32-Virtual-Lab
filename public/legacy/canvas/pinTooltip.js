// =====================================
// Pin Tooltip + Hover Focus (Wokwi-style)
// Hover any pin -> name tooltip near
// cursor + pin enlarges/glows so user
// always knows which pin is which.
// =====================================

const pinTooltipEl = document.createElement("div");
pinTooltipEl.id = "pinTooltip";
pinTooltipEl.className = "pin-tooltip";
document.body.appendChild(pinTooltipEl);

function pinLabel(pinEl){

    const component = pinEl.dataset.component || "";
    const pinName = pinEl.dataset.pin || "";

    return component ? `${component} · ${pinName}` : pinName;

}

function showPinTooltip(pinEl, clientX, clientY){

    pinTooltipEl.textContent = pinLabel(pinEl);
    pinTooltipEl.style.left = (clientX + 14) + "px";
    pinTooltipEl.style.top = (clientY + 14) + "px";
    pinTooltipEl.classList.add("visible");

}

function hidePinTooltip(){

    pinTooltipEl.classList.remove("visible");

}

document.addEventListener("mouseover",(e)=>{

    if(!e.target.classList || !e.target.classList.contains("pin")) return;

    e.target.classList.add("pin-hovered");

    showPinTooltip(e.target, e.clientX, e.clientY);

});

document.addEventListener("mousemove",(e)=>{

    if(e.target.classList && e.target.classList.contains("pin")){

        showPinTooltip(e.target, e.clientX, e.clientY);

    }

});

document.addEventListener("mouseout",(e)=>{

    if(!e.target.classList || !e.target.classList.contains("pin")) return;

    e.target.classList.remove("pin-hovered");

    hidePinTooltip();

});
