function getButtonState(svg){
    console.log("Button state:", svg.dataset.state);
    return Number(svg.dataset.state);
}

document.addEventListener("mousedown",(e)=>{

    if(!e.target.classList.contains("button-top")) return;

    const svg = e.target.closest("svg");

    svg.dataset.state = "1";

    console.log("Pressed");

    e.target.setAttribute("cy","18");
    e.target.setAttribute("fill","#dc2626");

});

document.addEventListener("mouseup",()=>{

    document.querySelectorAll(".button-svg").forEach(svg=>{

        svg.dataset.state = "0";

        console.log("Released");

        const top = svg.querySelector(".button-top");

        top.setAttribute("cy","15");
        top.setAttribute("fill","#ef4444");

    });

});