// ======================================
// STEMbotix Runtime
// Hybrid Interpreter
// ======================================
let runtimeVariables = {};
let isRunning = false;

let servoPin = null;


// ======================================
// Legacy Arduino Executor
// ======================================

async function executeCommands(commands){

    const serial = document.getElementById("serialOutput");

    for(const cmd of commands){

        if(!isRunning) return;

        switch(cmd.type){

            //----------------------------------
            // pinMode
            //----------------------------------

            case "pinMode":
                break;

            //----------------------------------
            // Variable = digitalRead(...)
            //----------------------------------

            case "assignDigitalRead":

                runtimeVariables[cmd.variable] =
                    digitalRead(cmd.pin);

                break;

            //----------------------------------
            // Variable = analogRead(...)
            //----------------------------------

            case "assignAnalogRead":

    runtimeVariables[cmd.variable] =
        analogRead(cmd.pin);

    break;

case "assignVariable":

    runtimeVariables[cmd.variable] =

        runtimeVariables[cmd.value];

    break;

case "assignMap": {

    const input =

        Number(

            runtimeVariables[cmd.input]

        );

    runtimeVariables[cmd.variable] =

        Math.round(

            (input - cmd.fromLow) *

            (cmd.toHigh - cmd.toLow) /

            (cmd.fromHigh - cmd.fromLow)

            +

            cmd.toLow

        );

    break;

}

            //----------------------------------
            case "digitalWrite": {

    let value = cmd.value;

    if(cmd.isVariable){

        value = runtimeVariables[value];

    }

    else if(String(value).toUpperCase()=="HIGH"){

        value = 1;

    }

    else if(String(value).toUpperCase()=="LOW"){

        value = 0;

    }

    else{

        const m =

            String(value).match(

                /!\s*digitalRead\s*\((.*?)\)/

            );

        if(m){

            value = digitalRead(

                m[1]

            ) ? 0 : 1;

        }

        else{

            value = Number(value);

        }

    }

    setGPIO(

        String(cmd.pin),

        Number(value)||0

    );

    break;

}
            //----------------------------------
// tone()
//----------------------------------

case "tone":{

    let freq = cmd.frequency;

    if(cmd.isVariable){

        freq =

            runtimeVariables[freq];

    }

    setGPIO(

        String(cmd.pin),

        1

    );

    break;

}


//----------------------------------
// noTone()
//----------------------------------

case "noTone":

    setGPIO(

        String(cmd.pin),

        0

    );

    break;
            //----------------------------------
            // Servo Attach
            //----------------------------------

            case "servoAttach":

                servoPin = String(cmd.pin);

                break;

            //----------------------------------
            // Servo Write
            //----------------------------------

            case "servoWrite":{

    if(!servoPin) break;

    let angle;

    if(cmd.isVariable){

        angle =

            runtimeVariables[cmd.value];

    }

    else{

        angle =

            Number(cmd.value);

    }

    updateServoByGPIO(

        servoPin,

        Number(angle)||0

    );

    break;

}

            //----------------------------------
            // Serial.println(variable)
            //----------------------------------

            case "serialVariable":

                serial.innerHTML +=
                    (runtimeVariables[cmd.variable] ?? 0)
                    + "<br>";

                serial.scrollTop =
                    serial.scrollHeight;

                break;

            //----------------------------------
            // Serial.println(digitalRead())
            //----------------------------------

            case "serialDigitalRead":

                serial.innerHTML +=
                    digitalRead(cmd.pin)
                    + "<br>";

                serial.scrollTop =
                    serial.scrollHeight;

                break;

            //----------------------------------
            // Serial.println(analogRead())
            //----------------------------------

            case "serialAnalogRead":

                serial.innerHTML +=
                    analogRead(cmd.pin)
                    + "<br>";

                serial.scrollTop =
                    serial.scrollHeight;

                break;

            //----------------------------------
            // Serial.println("Hello")
            //----------------------------------

            case "serial":

                serial.innerHTML +=
                    cmd.text.replaceAll('"',"")
                    + "<br>";

                serial.scrollTop =
                    serial.scrollHeight;

                break;

            //----------------------------------
            // delay
            //----------------------------------

            case "delay":{

    let ms = cmd.time;

    if(cmd.isVariable){

        ms =

            runtimeVariables[cmd.time];

    }

    await new Promise(resolve=>

        setTimeout(

            resolve,

            Number(ms)||0

        )

    );

    break;

}

            //----------------------------------
            // if / else
            //----------------------------------

            case "if":{

                const result = evaluateCondition(cmd.condition);

                if(result){

                    await executeCommands(cmd.then);

                }
                else if(cmd.else && cmd.else.length){

                    await executeCommands(cmd.else);

                }

                break;

            }

        }

    }

}


// ======================================
// Runtime Condition Evaluation
// ======================================

function evaluateCondition(cond){

    if(!cond) return false;

    switch(cond.type){

        case "and":

            return cond.parts.every(evaluateCondition);

        case "or":

            return cond.parts.some(evaluateCondition);

        case "not":

            return !evaluateCondition(cond.value);

        case "cmp":{

            const left = evaluateTerm(cond.left);
            const right = evaluateTerm(cond.right);

            switch(cond.op){

                case "==": return left === right;
                case "!=": return left !== right;
                case ">":  return left > right;
                case "<":  return left < right;
                case ">=": return left >= right;
                case "<=": return left <= right;

            }

            return false;

        }

        case "truthy":

            return !!evaluateTerm(cond.value);

    }

    return false;

}

function evaluateTerm(raw){

    let str = String(raw).trim();

    if(str.startsWith("!")){

        return evaluateTerm(str.slice(1)) ? 0 : 1;

    }

    const digitalReadMatch =
        str.match(/^digitalRead\s*\((.*)\)$/);

    if(digitalReadMatch){

        return digitalRead(digitalReadMatch[1].trim());

    }

    const analogReadMatch =
        str.match(/^analogRead\s*\((.*)\)$/);

    if(analogReadMatch){

        return analogRead(analogReadMatch[1].trim());

    }

    if(/^high$/i.test(str) || str==="true") return 1;
    if(/^low$/i.test(str) || str==="false") return 0;

    if(/^-?\d+(\.\d+)?$/.test(str)){

        return Number(str);

    }

    return Number(runtimeVariables[str] ?? 0);

}

// ======================================
// Run
// ======================================

async function runArduino(code){

    stopArduino();

    await new Promise(r=>setTimeout(r,20));

    servoPin = null;
    runtimeVariables = {};

    document.getElementById(
        "serialOutput"
    ).innerHTML = "";

    isRunning = true;

    // ==================================
    // NEW LOGIC ENGINE
    // ==================================

    if(
        window.currentLogic &&
        window.currentLogic.length>0
    ){

        console.log(
            "Logic Engine Started"
        );

        startLogicEngine();

        return;

    }

    // ==================================
    // Legacy Parser
    // ==================================

    const program =
        parseArduino(code);

    await executeCommands(
        program.setup
    );

    while(isRunning){

        await executeCommands(
            program.loop
        );

        await new Promise(r=>

            setTimeout(r,0)

        );

    }

}


// ======================================
// Stop
// ======================================

function stopArduino(){

    isRunning=false;

    stopLogicEngine();

}