// =====================================
// LED SVG Component
// =====================================

const LED_COLORS = {

    red:    { base:"#8b1e1e", on:"#ff3030", glow:"red" },
    green:  { base:"#14532d", on:"#22ff66", glow:"#22ff66" },
    blue:   { base:"#1e3a8a", on:"#3b82ff", glow:"#3b82ff" },
    yellow: { base:"#78350f", on:"#ffd60a", glow:"#ffd60a" },
    white:  { base:"#374151", on:"#ffffff", glow:"#ffffff" }

};

function createLEDSVG(color="red"){

const id="led_"+Math.random();

    const c = LED_COLORS[color] || LED_COLORS.red;

    return `

<svg width="70" height="120"
viewBox="0 0 70 120"
data-led-color="${color}"
xmlns="http://www.w3.org/2000/svg">

    <!-- Legs -->

    <line
        x1="26"
        y1="65"
        x2="26"
        y2="115"
        stroke="#cbd5e1"
        stroke-width="4"/>

    <line
        x1="44"
        y1="65"
        x2="44"
        y2="105"
        stroke="#cbd5e1"
        stroke-width="4"/>

    <!-- Body -->

    <path
        d="
        M20 25
        Q20 5 35 5
        Q50 5 50 25
        L50 50
        L20 50
        Z"
        id="${id}"
        fill="${c.base}"
        stroke="#ffffff"
        stroke-width="2"/>

    <!-- Shine -->

    <ellipse
        cx="29"
        cy="18"
        rx="5"
        ry="8"
        fill="rgba(255,255,255,.45)"/>

    <!-- Pins -->

    <circle
class="pin"
data-component="LED"
data-pin="CATHODE"
cx="26"
cy="115"
r="5"
fill="#22c55e"/>

<circle
class="pin"
data-component="LED"
data-pin="ANODE"
cx="44"
cy="105"
r="5"
fill="#facc15"/>

</svg>

`;

}

function updateLED(pin,state){

    const svg = pin.closest("svg");

    if(!svg) return;

    const body = svg.querySelector("path");

    if(!body) return;

    const colorName = svg.dataset.ledColor || "red";

    const c = LED_COLORS[colorName] || LED_COLORS.red;

    if(state){

        body.setAttribute("fill",c.on);
        body.style.filter=`drop-shadow(0 0 18px ${c.glow})`;

    }else{

        body.setAttribute("fill",c.base);
        body.style.filter="none";

    }

    // Keep the pin's own on/off state tagged, regardless of which
    // code path (logic engine, or raw GPIO interpreter) drove this
    // update - used by toggle()/color-swatch re-apply to know the
    // LED's current state without re-deriving it.

    pin.dataset.logic = state ? 1 : 0;

}


// =====================================
// Change an already-placed LED's color
// (used by the right-click "Color"
// swatches in the component menu)
// =====================================

function setLEDColor(component,color){

    if(!LED_COLORS[color]) return;

    const svg = component.querySelector("svg");

    if(!svg) return;

    svg.dataset.ledColor = color;

    const pin = svg.querySelector('[data-pin="ANODE"]');

    const state = pin ? Number(pin.dataset.logic || 0) : 0;

    if(pin){

        updateLED(pin,state);

    }

}
