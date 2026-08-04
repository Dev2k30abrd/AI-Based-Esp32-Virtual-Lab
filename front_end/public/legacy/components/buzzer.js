// =====================================
// Buzzer SVG
// =====================================

function createBuzzerSVG(){

return `

<svg
width="90"
height="120"
viewBox="0 0 90 120"
xmlns="http://www.w3.org/2000/svg">

    <!-- Body -->

    <circle
        class="buzzer-body"
        cx="45"
        cy="40"
        r="25"
        fill="#1f2937"
        stroke="#6b7280"
        stroke-width="3"/>

    <!-- Center -->

    <circle
        cx="45"
        cy="40"
        r="8"
        fill="#374151"/>

    <!-- + Symbol -->

    <text
        x="43"
        y="10"
        fill="#fbbf24"
        font-size="16"
        font-weight="bold">

        +

    </text>

    <!-- Legs -->

    <line
        x1="28"
        y1="65"
        x2="28"
        y2="100"
        stroke="#d1d5db"
        stroke-width="4"/>

    <line
        x1="62"
        y1="65"
        x2="62"
        y2="100"
        stroke="#d1d5db"
        stroke-width="4"/>

    <!-- Positive Pin -->

    <circle
        class="pin"
        data-component="Buzzer"
        data-pin="POSITIVE"
        cx="28"
        cy="102"
        r="6"
        fill="#ef4444"/>

    <!-- Negative Pin -->

    <circle
        class="pin"
        data-component="Buzzer"
        data-pin="NEGATIVE"
        cx="62"
        cy="102"
        r="6"
        fill="#22c55e"/>

</svg>

`;

}



// =====================================
// Update Buzzer
// =====================================

function updateBuzzer(pin,state){

    const svg = pin.closest("svg");

    if(!svg) return;

    const body = svg.querySelector(".buzzer-body");

    if(!body) return;

    if(state){

        body.setAttribute(
            "fill",
            "#facc15"
        );

        body.style.filter =
            "drop-shadow(0 0 15px yellow)";

    }

    else{

        body.setAttribute(
            "fill",
            "#1f2937"
        );

        body.style.filter =
            "none";

    }

}