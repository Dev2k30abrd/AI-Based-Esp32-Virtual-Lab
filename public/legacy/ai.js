// ==========================================
// STEMbotix AI Client
// ==========================================

const API_URL = "http://127.0.0.1:8000/generate";


// ==========================================
// Generate Circuit using AI
// ==========================================

async function generateCircuit(){

    const prompt = document
        .getElementById("promptInput")
        .value
        .trim();

    if(prompt===""){

        alert("Please enter a prompt.");

        return;

    }

    const model = document
        .getElementById("modelSelect")
        .value;

    const serial =
        document.getElementById("serialOutput");

    serial.innerHTML = "";

    serial.innerHTML +=
        "🤖 Contacting AI...<br>";

    serial.innerHTML +=
        "🧠 Model : " + model + "<br><br>";

    try{

        const response = await fetch(API_URL,{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                prompt:prompt,

                model:model

            })

        });

        if(!response.ok){

            throw new Error(
                "Backend Error : " + response.status
            );

        }

        const result = await response.json();

        if(!result.success){

            serial.innerHTML +=
                "❌ " + result.response;

            return;

        }

        console.log("========== AI RESPONSE ==========");
        console.log(result.response);

        const circuit = JSON.parse(result.response);

        console.log(circuit);

        serial.innerHTML +=
            "✅ Circuit Generated Successfully<br>";

        serial.innerHTML +=
            "⚡ Building Circuit...<br>";

        autoBuildCircuit(circuit);

        serial.innerHTML +=
            "✅ Auto Build Complete<br>";

    }

    catch(error){

        console.error(error);

        serial.innerHTML +=
            "<br>❌ " + error.message;

    }

}