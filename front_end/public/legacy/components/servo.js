// =====================================
// Servo Motor SVG
// =====================================

function createServoSVG(){

return `

<svg
class="servo-svg"
width="130"
height="120"
viewBox="0 0 130 120"
xmlns="http://www.w3.org/2000/svg">

<!-- Servo Horn -->

<g
class="servo-horn"
transform="rotate(0 65 35)">

    <line
    x1="65"
    y1="35"
    x2="100"
    y2="35"
    stroke="white"
    stroke-width="5"
    stroke-linecap="round"/>

    <circle
    cx="65"
    cy="35"
    r="6"
    fill="#e5e7eb"/>

</g>

<!-- Body -->

<rect
x="25"
y="45"
width="80"
height="50"
rx="8"
fill="#2563eb"
stroke="#60a5fa"
stroke-width="2"/>

<text
x="65"
y="74"
font-size="14"
fill="white"
text-anchor="middle">

SERVO

</text>

<!-- Servo Leads -->

<line
x1="50"
y1="95"
x2="50"
y2="118"
stroke="#facc15"
stroke-width="4"/>

<line
x1="65"
y1="95"
x2="65"
y2="118"
stroke="#ef4444"
stroke-width="4"/>

<line
x1="80"
y1="95"
x2="80"
y2="118"
stroke="#22c55e"
stroke-width="4"/>

<!-- SIGNAL -->

<circle
class="pin"
data-component="Servo"
data-pin="SIGNAL"
cx="50"
cy="118"
r="6"
fill="#facc15"/>

<!-- VCC -->

<circle
class="pin"
data-component="Servo"
data-pin="VCC"
cx="65"
cy="118"
r="6"
fill="#ef4444"/>

<!-- GND -->

<circle
class="pin"
data-component="Servo"
data-pin="GND"
cx="80"
cy="118"
r="6"
fill="#22c55e"/>

</svg>

`;

}



// =====================================
// Rotate Servo
// =====================================

function updateServo(pin, angle){

    const svg = pin.closest("svg");

    if(!svg) return;

    const horn = svg.querySelector(".servo-horn");

    if(!horn) return;

    angle = Math.max(0, Math.min(180, Number(angle)));

    horn.setAttribute(
        "transform",
        `rotate(${angle-90} 65 35)`
    );

}