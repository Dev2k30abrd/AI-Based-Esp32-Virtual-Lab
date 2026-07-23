// =====================================
// Fullscreen Toggle
// =====================================

const appRootEl = document.getElementById("appRoot");
const fullscreenBtnEl = document.getElementById("fullscreenBtn");

function updateFullscreenButtonLabel(){

    if(!fullscreenBtnEl) return;

    if(document.fullscreenElement){

        fullscreenBtnEl.textContent = "⤢ Exit Fullscreen";

    } else {

        fullscreenBtnEl.textContent = "⛶ Fullscreen";

    }

}

if(fullscreenBtnEl){

    fullscreenBtnEl.addEventListener("click",()=>{

        if(!document.fullscreenElement){

            const target = (appRootEl && appRootEl.requestFullscreen)
                ? appRootEl
                : document.documentElement;

            target.requestFullscreen().catch(err=>{

                console.error("Fullscreen request failed:",err);

            });

        } else {

            document.exitFullscreen();

        }

    });

}

document.addEventListener("fullscreenchange", updateFullscreenButtonLabel);

updateFullscreenButtonLabel();
