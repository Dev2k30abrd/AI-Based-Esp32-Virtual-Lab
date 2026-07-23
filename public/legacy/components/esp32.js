// =============================================
// Professional ESP32 DevKit (Wiring Ready)
// =============================================

function createESP32SVG() {

const leftPins = [
"3V3",
"EN",
"VP",
"VN",
"34",
"35",
"32",
"33",
"25",
"26",
"27",
"14",
"12",
"GND",
"13"
];

const rightPins = [
"GND",
"23",
"22",
"TX",
"RX",
"21",
"GND",
"19",
"18",
"5",
"17",
"16",
"4",
"2",
"15"
];

let svg = `

<svg
width="250"
height="430"
viewBox="0 0 250 430"
xmlns="http://www.w3.org/2000/svg">

<rect
x="70"
y="15"
width="110"
height="395"
rx="12"
fill="#374151"
stroke="#5eead4"
stroke-width="2"/>

<rect
x="88"
y="75"
width="74"
height="120"
rx="6"
fill="#0f172a"
stroke="#64748b"/>

<text
x="125"
y="140"
fill="white"
font-size="16"
text-anchor="middle">

ESP32

</text>

<path
d="M110 160 Q125 145 140 160"
stroke="#38bdf8"
stroke-width="3"
fill="none"/>

<path
d="M114 168 Q125 158 136 168"
stroke="#38bdf8"
stroke-width="3"
fill="none"/>

<circle
cx="125"
cy="175"
r="3"
fill="#38bdf8"/>

<rect
x="102"
y="340"
width="46"
height="32"
rx="4"
fill="#111827"/>

`;


// LEFT GPIO

leftPins.forEach((pin,index)=>{

let y = 40 + index*24;

svg += `

<circle
class="gpio-pin pin"
data-component="ESP32"
data-pin="${pin}"
cx="62"
cy="${y}"
r="5"
fill="#facc15"/>

<line
x1="67"
y1="${y}"
x2="70"
y2="${y}"
stroke="#facc15"
stroke-width="2"/>

<text
x="55"
y="${y+4}"
font-size="10"
fill="#ffffff"
text-anchor="end">

${pin}

</text>

`;

});


// RIGHT GPIO

rightPins.forEach((pin,index)=>{

let y = 40 + index*24;

svg += `

<circle
class="gpio-pin pin"
data-component="ESP32"
data-pin="${pin}"
cx="188"
cy="${y}"
r="5"
fill="#22c55e"/>

<line
x1="180"
y1="${y}"
x2="183"
y2="${y}"
stroke="#22c55e"
stroke-width="2"/>

<text
x="195"
y="${y+4}"
font-size="10"
fill="#ffffff">

${pin}

</text>

`;

});

svg += "</svg>";

return svg;

}