// =====================================
// Potentiometer SVG Component
// =====================================

function createPotentiometerSVG(){

return `

<svg
width="110"
height="120"
viewBox="0 0 110 120"
xmlns="http://www.w3.org/2000/svg"
data-value="2048">

    <!-- Body -->

    <rect
        x="20"
        y="20"
        width="70"
        height="55"
        rx="8"
        fill="#2563eb"
        stroke="#93c5fd"
        stroke-width="2"/>

    <!-- Knob -->

    <circle
        class="pot-knob"
        cx="55"
        cy="47"
        r="14"
        fill="#111827"
        stroke="#d1d5db"
        stroke-width="2"
        style="cursor:pointer;"/>

    <!-- Indicator -->

    <line
        class="pot-pointer"
        x1="55"
        y1="47"
        x2="55"
        y2="33"
        stroke="white"
        stroke-width="2"/>

    <!-- Legs -->

    <line
        x1="35"
        y1="75"
        x2="35"
        y2="105"
        stroke="#cbd5e1"
        stroke-width="4"/>

    <line
        x1="55"
        y1="75"
        x2="55"
        y2="105"
        stroke="#cbd5e1"
        stroke-width="4"/>

    <line
        x1="75"
        y1="75"
        x2="75"
        y2="105"
        stroke="#cbd5e1"
        stroke-width="4"/>

    <!-- Pins -->

    <circle
        class="pin"
        data-component="Potentiometer"
        data-pin="VCC"
        cx="35"
        cy="105"
        r="5"
        fill="#ef4444"/>

    <circle
        class="pin"
        data-component="Potentiometer"
        data-pin="OUT"
        cx="55"
        cy="105"
        r="5"
        fill="#facc15"/>

    <circle
        class="pin"
        data-component="Potentiometer"
        data-pin="GND"
        cx="75"
        cy="105"
        r="5"
        fill="#22c55e"/>

</svg>

`;

}


// =====================================
// Enable Potentiometer
// =====================================

function initializePotentiometer(element){

    const svg = element.querySelector("svg");

    if(!svg) return;

    const knob = svg.querySelector(".pot-knob");

    const pointer = svg.querySelector(".pot-pointer");

    if(!knob || !pointer) return;

    let dragging = false;

    knob.addEventListener("mousedown",(e)=>{

        dragging = true;

        e.stopPropagation();

    });

    document.addEventListener("mouseup",()=>{

        dragging = false;

    });

    document.addEventListener("mousemove",(e)=>{

        if(!dragging) return;

        const rect = svg.getBoundingClientRect();

        const cx = rect.left + 55;

        const cy = rect.top + 47;

        let angle = Math.atan2(

            e.clientY-cy,
            e.clientX-cx

        ) * 180 / Math.PI;

        angle = Math.max(-135,Math.min(135,angle));

        pointer.setAttribute(

            "transform",

            `rotate(${angle} 55 47)`

        );

        const value = Math.round(

            ((angle+135)/270)*4095

        );

        svg.dataset.value = value;

    });

}


// =====================================
// Read Potentiometer
// =====================================

function getPotentiometerValue(pin){

    pin = String(pin);

    for(const connection of connections){

        let espPin = null;

        let potPin = null;

        if(

            connection.fromComponent==="ESP32" &&
            connection.toComponent==="Potentiometer"

        ){

            espPin = String(connection.fromPin);

            potPin = connection.to;

        }

        else if(

            connection.fromComponent==="Potentiometer" &&
            connection.toComponent==="ESP32"

        ){

            espPin = String(connection.toPin);

            potPin = connection.from;

        }

        if(!espPin || !potPin) continue;

        if(espPin!==pin) continue;

        if(potPin.dataset.pin!=="OUT") continue;

        const svg = potPin.closest("svg");

        return Number(svg.dataset.value || 0);

    }

    return 0;

}