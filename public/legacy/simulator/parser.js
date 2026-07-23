// ======================================
// Arduino Parser
// Variable Aware Version
// ======================================

const variables = {};

function parseArduino(code){

    const result = {
        setup: [],
        loop: []
    };

    variablesClear();

    code = code.replace(/\r/g,"");

    // -----------------------------
    // Read global variables
    // -----------------------------

    parseVariables(code);

    // -----------------------------
    // setup()
    // -----------------------------

    const setupMatch =
        code.match(/void\s+setup\s*\(\s*\)\s*\{([\s\S]*?)\}/);

    if(setupMatch){

        parseSection(
            setupMatch[1],
            result.setup
        );

    }

    // -----------------------------
    // loop()
    // -----------------------------

    const loopMatch =
        code.match(/void\s+loop\s*\(\s*\)\s*\{([\s\S]*?)\}/);

    if(loopMatch){

        parseSection(
            loopMatch[1],
            result.loop
        );

    }

    console.log("Variables",variables);

    console.log(result);

    return result;

}


// ======================================
// Variable Parser
// ======================================

function variablesClear(){

    for(const k in variables){

        delete variables[k];

    }

}

function parseVariables(code){

    const regex =
/(?:const\s+)?(?:int|byte|uint8_t|long)\s+([A-Za-z_]\w*)\s*=\s*(\d+)/g;

    let match;

    while((match = regex.exec(code)) !== null){

        variables[match[1]] = match[2];

    }

}


// ======================================
// Resolve Variable
// ======================================

function resolvePin(pin){

    pin = pin.trim();

    if(variables[pin]){

        return variables[pin];

    }

    return pin;

}


// ======================================
// Parse Section
// ======================================

function parseSection(text,output){

    const statements = splitStatements(text);

    for(const stmt of statements){

        if(stmt.type==="if"){

            buildIfCommand(stmt,output);

            continue;

        }

        parseSingleStatement(stmt.text,output);

    }

}


// ======================================
// Build an "if" command (recursing into
// its then/else bodies)
// ======================================

function buildIfCommand(stmt,output){

    const thenOutput = [];

    parseSection(stmt.thenBody, thenOutput);

    let elseOutput = [];

    if(stmt.elseBody){

        if(stmt.elseBody.nested){

            buildIfCommand(stmt.elseBody.stmt, elseOutput);

        }
        else{

            parseSection(stmt.elseBody, elseOutput);

        }

    }

    output.push({

        type:"if",

        condition: parseCondition(stmt.condition),

        then: thenOutput,

        else: elseOutput

    });

}


// ======================================
// Split a block of code into top-level
// statements, understanding if/else
// blocks (braces) so their bodies are
// NOT flattened into the outer list.
// Anything else is still a flat,
// semicolon-terminated statement, same
// as before.
// ======================================

function splitStatements(text){

    const stmts=[];

    let i=0;

    const n=text.length;

    function skipWs(){

        while(i<n && /\s/.test(text[i])) i++;

    }

    function isWordBoundary(pos){

        return !/[A-Za-z0-9_]/.test(text[pos]||"");

    }

    function readParenGroup(start){

        // text[start] must be "("

        let depth=0, j=start;

        do{

            if(text[j]==="(") depth++;
            else if(text[j]===")") depth--;

            j++;

        } while(depth>0 && j<n);

        return { content:text.slice(start+1,j-1), end:j };

    }

    function readBraceGroup(start){

        // text[start] must be "{"

        let depth=0, j=start;

        do{

            if(text[j]==="{") depth++;
            else if(text[j]==="}") depth--;

            j++;

        } while(depth>0 && j<n);

        return { content:text.slice(start+1,j-1), end:j };

    }

    function readIfStatement(){

        // assumes text[i..] starts with "if" (already confirmed)

        i+=2;

        skipWs();

        let condition="";

        if(text[i]==="("){

            const group = readParenGroup(i);

            condition = group.content;

            i = group.end;

        }

        skipWs();

        let thenBody;

        if(text[i]==="{"){

            const group = readBraceGroup(i);

            thenBody = group.content;

            i = group.end;

        }
        else{

            const semi = text.indexOf(";",i);

            const end = semi===-1 ? n : semi+1;

            thenBody = text.slice(i,end);

            i = end;

        }

        skipWs();

        let elseBody = null;

        if(

            text.substr(i,4)==="else" &&

            isWordBoundary(i+4)

        ){

            i+=4;

            skipWs();

            if(

                text.substr(i,2)==="if" &&

                isWordBoundary(i+2)

            ){

                const nested = readIfStatement();

                elseBody = { nested:true, stmt:nested };

            }
            else if(text[i]==="{"){

                const group = readBraceGroup(i);

                elseBody = group.content;

                i = group.end;

            }
            else{

                const semi = text.indexOf(";",i);

                const end = semi===-1 ? n : semi+1;

                elseBody = text.slice(i,end);

                i = end;

            }

        }

        return { type:"if", condition, thenBody, elseBody };

    }

    while(i<n){

        skipWs();

        if(i>=n) break;

        if(

            text.substr(i,2)==="if" &&

            isWordBoundary(i+2)

        ){

            stmts.push(readIfStatement());

            continue;

        }

        // Normal flat statement: scan to the next top-level ";"
        // (depth-tracked so a ";" inside a function call's parens
        // doesn't end the statement early).

        let depth=0;

        const start=i;

        while(i<n){

            if(text[i]==="(") depth++;
            else if(text[i]===")") depth--;
            else if(text[i]===";" && depth===0) break;

            i++;

        }

        const raw = text.slice(start,i).trim();

        i++; // skip ";"

        if(raw.length){

            stmts.push({ type:"stmt", text:raw });

        }

    }

    return stmts;

}


// ======================================
// Condition Parser (compile time)
// splits on ||, then &&, then a single
// comparison operator. Pin/const names
// inside are resolved same as elsewhere.
// ======================================

function splitTopLevel(str,token){

    const parts=[];

    let depth=0, current="";

    for(let i=0;i<str.length;i++){

        const c=str[i];

        if(c==="(") depth++;
        if(c===")") depth--;

        if(

            depth===0 &&

            str.substr(i,token.length)===token

        ){

            parts.push(current);

            current="";

            i+=token.length-1;

            continue;

        }

        current+=c;

    }

    parts.push(current);

    return parts.map(p=>p.trim()).filter(p=>p.length);

}

function parseCondition(raw){

    let str = raw.trim();

    if(

        str.startsWith("(") &&

        str.endsWith(")") &&

        readParenGroupBalanced(str)

    ){

        str = str.slice(1,-1).trim();

    }

    let parts = splitTopLevel(str,"||");

    if(parts.length>1){

        return { type:"or", parts:parts.map(parseCondition) };

    }

    parts = splitTopLevel(str,"&&");

    if(parts.length>1){

        return { type:"and", parts:parts.map(parseCondition) };

    }

    if(str.startsWith("!")){

        return { type:"not", value:parseCondition(str.slice(1)) };

    }

    const opMatch = str.match(/(==|!=|>=|<=|>|<)/);

    if(opMatch){

        const op = opMatch[1];

        const idx = str.indexOf(op);

        const left = resolvePin(str.slice(0,idx).trim());
        const right = resolvePin(str.slice(idx+op.length).trim());

        return { type:"cmp", op, left, right };

    }

    return { type:"truthy", value:resolvePin(str) };

}

// True only if the string's very first "(" closes at the very end
// (i.e. the outer parens actually wrap the whole expression).

function readParenGroupBalanced(str){

    let depth=0;

    for(let i=0;i<str.length;i++){

        if(str[i]==="(") depth++;
        else if(str[i]===")"){

            depth--;

            if(depth===0 && i!==str.length-1) return false;

        }

    }

    return true;

}


// ======================================
// Single flat statement (unchanged
// behaviour, just pulled into its own
// function so parseSection can also
// call it for if/else bodies)
// ======================================

function parseSingleStatement(line,output){
        // ---------------- Variable = digitalRead ----------------

if (/^(int|bool|byte|long)\s+\w+\s*=\s*digitalRead\(/.test(line)) {

    const match = line.match(
        /(?:int|bool|byte|long)\s+(\w+)\s*=\s*digitalRead\((.*?)\)/
    );

    output.push({

        type: "assignDigitalRead",

        variable: match[1],

        pin: resolvePin(match[2])

    });

}
else if (/^(int|bool|byte|long)\s+\w+\s*=\s*analogRead\(/.test(line)) {

    const match = line.match(
        /(?:int|bool|byte|long)\s+(\w+)\s*=\s*analogRead\((.*?)\)/
    );

    output.push({

        type: "assignAnalogRead",

        variable: match[1],

        pin: resolvePin(match[2])

    });

}
// ---------------- Variable = map() ----------------

else if(/^(int|long|float)\s+\w+\s*=\s*map\(/.test(line)){

    const match = line.match(

        /(?:int|long|float)\s+(\w+)\s*=\s*map\((.*?)\)/

    );

    const args =

        match[2].split(",").map(x=>x.trim());

    output.push({

        type:"assignMap",

        variable:match[1],

        input:args[0],

        fromLow:Number(args[1]),

        fromHigh:Number(args[2]),

        toLow:Number(args[3]),

        toHigh:Number(args[4])

    });

}
// ---------------- Variable = Variable ----------------

else if(/^(int|long|float|bool|byte)\s+\w+\s*=\s*\w+$/.test(line)){

    const match = line.match(

        /(?:int|long|float|bool|byte)\s+(\w+)\s*=\s*(\w+)/

    );

    output.push({

        type:"assignVariable",

        variable:match[1],

        value:match[2]

    });

}


        // ---------------- pinMode ----------------

        if(line.startsWith("pinMode")){

            const args =
                line.match(/\((.*?)\)/)[1].split(",");

            output.push({

                type:"pinMode",

                pin:resolvePin(args[0]),

                mode:args[1].trim()

            });

        }

        // ---------------- digitalWrite ----------------

        else if(line.startsWith("digitalWrite")){

            const args =
                line.match(/\((.*?)\)/)[1].split(",");

            output.push({

                type:"digitalWrite",

                pin:resolvePin(args[0]),

                value:args[1].trim(),

isVariable:

!["HIGH","LOW"].includes(

args[1].trim().toUpperCase()

)

            });

        }

        // ---------------- digitalRead ----------------

        else if(line.startsWith("digitalRead")){

            const pin =
                line.match(/\((.*?)\)/)[1];

            output.push({

                type:"digitalRead",

                pin:resolvePin(pin)

            });

        }
        // ---------------- tone ----------------

else if(line.startsWith("tone")){

    const args =
        line.match(/\((.*?)\)/)[1].split(",");

    output.push({

        type:"tone",

        pin:resolvePin(args[0]),

        frequency:args[1]?.trim() || "1000",

isVariable:

args[1]

? isNaN(Number(args[1].trim()))

: false

    });

}

// ---------------- noTone ----------------

else if(line.startsWith("noTone")){

    const pin =
        line.match(/\((.*?)\)/)[1];

    output.push({

        type:"noTone",

        pin:resolvePin(pin)

    });

}

        // ---------------- analogRead ----------------

        else if(line.startsWith("analogRead")){

            const pin =
                line.match(/\((.*?)\)/)[1];

            output.push({

                type:"analogRead",

                pin:resolvePin(pin)

            });

        }

        // ---------------- delay ----------------

        else if(line.startsWith("delay")){

            const ms =
                line.match(/\((.*?)\)/)[1];

            output.push({

                type:"delay",

                time:isNaN(Number(ms))

? ms

: Number(ms),

isVariable:isNaN(Number(ms))

            });

        }

        // ---------------- Servo.attach ----------------

        else if(line.includes(".attach(")){

            const pin =
                line.match(/\((.*?)\)/)[1];

            output.push({

                type:"servoAttach",

                pin:resolvePin(pin)

            });

        }

        // ---------------- Servo.write ----------------

        // ---------------- Servo.write ----------------

else if(line.includes(".write(")){

    const value =
        line.match(/\((.*?)\)/)[1].trim();

    output.push({

        type:"servoWrite",

        value:value,

        isVariable:isNaN(Number(value))

    });

}

        // ---------------- Serial.println ----------------

else if(line.startsWith("Serial.println")){

    const txt = line.match(/\((.*)\)/)[1].trim();

    // Serial.println(digitalRead(...))

    if(txt.startsWith("digitalRead")){

        const pin = txt.match(/digitalRead\((.*?)\)/)[1];

        output.push({

            type:"serialDigitalRead",

            pin:resolvePin(pin)

        });

    }

    // Serial.println(analogRead(...))

    else if(txt.startsWith("analogRead")){

        const pin = txt.match(/analogRead\((.*?)\)/)[1];

        output.push({

            type:"serialAnalogRead",

            pin:resolvePin(pin)

        });

    }

    // Serial.println(variable)

    else if(/^[A-Za-z_]\w*$/.test(txt)){

        output.push({

            type:"serialVariable",

            variable:txt

        });

    }

    // Serial.println("Hello")

    else{

        output.push({

            type:"serial",

            text:txt

        });

    }

}

}