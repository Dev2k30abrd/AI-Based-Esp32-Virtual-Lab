// =============================================
// STEMbotix Arduino Tokenizer v1.0
// =============================================

const TOKEN_TYPES = {

    IDENTIFIER: "IDENTIFIER",
    NUMBER: "NUMBER",
    STRING: "STRING",

    KEYWORD: "KEYWORD",

    SYMBOL: "SYMBOL",

    OPERATOR: "OPERATOR",

    EOF: "EOF"

};

const KEYWORDS = new Set([

    "void",
    "int",
    "long",
    "unsigned",
    "float",
    "double",
    "char",
    "bool",
    "byte",
    "const",

    "if",
    "else",
    "for",
    "while",

    "return",

    "HIGH",
    "LOW",

    "true",
    "false"

]);

function tokenizeArduino(code){

    const tokens=[];

    let i=0;

    while(i<code.length){

        let c=code[i];

        //-----------------------------------
        // whitespace
        //-----------------------------------

        if(/\s/.test(c)){

            i++;
            continue;

        }

        //-----------------------------------
        // single line comment
        //-----------------------------------

        if(c==="/" && code[i+1]==="/"){

            while(i<code.length && code[i]!="\n"){

                i++;

            }

            continue;

        }

        //-----------------------------------
        // multiline comment
        //-----------------------------------

        if(c==="/" && code[i+1]=="*"){

            i+=2;

            while(

                i<code.length &&

                !(code[i]=="*" && code[i+1]==="/")

            ){

                i++;

            }

            i+=2;

            continue;

        }

        //-----------------------------------
        // Number
        //-----------------------------------

        if(/[0-9]/.test(c)){

            let start=i;

            while(

                i<code.length &&

                /[0-9.]/.test(code[i])

            ){

                i++;

            }

            tokens.push({

                type:TOKEN_TYPES.NUMBER,

                value:code.slice(start,i)

            });

            continue;

        }

        //-----------------------------------
        // Identifier
        //-----------------------------------

        if(/[A-Za-z_]/.test(c)){

            let start=i;

            while(

                i<code.length &&

                /[A-Za-z0-9_]/.test(code[i])

            ){

                i++;

            }

            const text=

                code.slice(start,i);

            tokens.push({

                type:

                    KEYWORDS.has(text)

                    ?

                    TOKEN_TYPES.KEYWORD

                    :

                    TOKEN_TYPES.IDENTIFIER,

                value:text

            });

            continue;

        }

        //-----------------------------------
        // String
        //-----------------------------------

        if(c=='"'){

            i++;

            let start=i;

            while(

                i<code.length &&

                code[i]!='"'

            ){

                i++;

            }

            tokens.push({

                type:TOKEN_TYPES.STRING,

                value:code.slice(start,i)

            });

            i++;

            continue;

        }

        //-----------------------------------
        // Two-character operators
        //-----------------------------------

        const two=

            code.substr(i,2);

        if(

            [

                "==",

                "!=",

                ">=",

                "<=",

                "&&",

                "||",

                "++",

                "--",

                "+=",

                "-=",

                "*=",

                "/="

            ].includes(two)

        ){

            tokens.push({

                type:TOKEN_TYPES.OPERATOR,

                value:two

            });

            i+=2;

            continue;

        }

        //-----------------------------------
        // One-character operators
        //-----------------------------------

        if("+-*/%=><!".includes(c)){

            tokens.push({

                type:TOKEN_TYPES.OPERATOR,

                value:c

            });

            i++;

            continue;

        }

        //-----------------------------------
        // Symbols
        //-----------------------------------

        if("(){}[],;".includes(c)){

            tokens.push({

                type:TOKEN_TYPES.SYMBOL,

                value:c

            });

            i++;

            continue;

        }

        //-----------------------------------
        // Unknown
        //-----------------------------------

        console.warn(

            "Unknown Token:",

            c

        );

        i++;

    }

    tokens.push({

        type:TOKEN_TYPES.EOF,

        value:"EOF"

    });

    console.table(tokens);

    return tokens;

}