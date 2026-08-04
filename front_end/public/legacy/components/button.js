// ==========================================
// STEMbotix Push Button
// ==========================================

function createButtonSVG(){

return `

<svg
    class="button-svg"
    data-state="0"
    width="90"
    height="120"
    viewBox="0 0 90 120"
    xmlns="http://www.w3.org/2000/svg">

    <!-- Body -->
    <rect
        x="20"
        y="20"
        width="50"
        height="35"
        rx="5"
        fill="#4b5563"
        stroke="#9ca3af"
        stroke-width="2"/>

    <!-- Button -->
    <circle
        class="button-top"
        cx="45"
        cy="15"
        r="12"
        fill="#ef4444"
        stroke="white"
        stroke-width="2"/>

    <!-- Legs -->
    <line
        x1="25"
        y1="55"
        x2="25"
        y2="90"
        stroke="#d1d5db"
        stroke-width="4"/>

    <line
        x1="65"
        y1="55"
        x2="65"
        y2="90"
        stroke="#d1d5db"
        stroke-width="4"/>

    <!-- LEFT -->
    <circle
        class="pin"
        data-component="Button"
        data-pin="LEFT"
        cx="25"
        cy="92"
        r="6"
        fill="#22c55e"/>

    <!-- RIGHT -->
    <circle
        class="pin"
        data-component="Button"
        data-pin="RIGHT"
        cx="65"
        cy="92"
        r="6"
        fill="#facc15"/>

</svg>

`;

}


// ==========================================
// Initialize Button
// ==========================================

function initializeButton(component){

    const svg = component.querySelector("svg");

    if(!svg) return;

    const top = svg.querySelector(".button-top");

    // ----------------------------
    // Press
    // ----------------------------

    top.addEventListener("mousedown",()=>{

        svg.dataset.state = "1";

        top.setAttribute("cy","18");

        top.setAttribute("fill","#dc2626");

    });

    // ----------------------------
    // Release
    // ----------------------------

    const release = ()=>{

        svg.dataset.state = "0";

        top.setAttribute("cy","15");

        top.setAttribute("fill","#ef4444");

    };

    top.addEventListener("mouseup",release);

    top.addEventListener("mouseleave",release);

    document.addEventListener("mouseup",release);

}