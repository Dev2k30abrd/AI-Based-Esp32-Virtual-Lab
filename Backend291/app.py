# ==========================================
# STEMbotix Virtual Lab API
# Chatbot pipeline:
#   1. Clarify  - ask questions if the prompt is unclear
#   2. Blockly  - LLM generates circuit graph JSON, validated
#   3. Arduino  - LLM generates code from the validated circuit, validated
#   4. Ready for simulation
# ==========================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from model import ChatRequest
from openrouter import generate_json, generate_code
from session import get_or_create, add_message, get_history

from clarify_prompt import CLARIFY_SYSTEM_PROMPT
from blockly_prompt import BLOCKLY_SYSTEM_PROMPT
from arduino_prompt import ARDUINO_SYSTEM_PROMPT, build_arduino_user_prompt

from blockly_validator import validate_blockly
from arduino_validator import validate_arduino

from configure import CLARIFY_MODEL, BLOCKLY_MODEL, ARDUINO_MODEL, MAX_RETRIES

import json

app = FastAPI(
    title="STEMbotix Virtual Lab API"
)

# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ==========================================
# Health Check
# ==========================================

@app.get("/")
def home():

    return {
        "status": "running",
        "message": "STEMbotix Virtual Lab API"
    }


# ==========================================
# Chat / Generate Route
# ==========================================

@app.post("/chat")
def chat(request: ChatRequest):

    session_id = get_or_create(request.session_id)

    add_message(session_id, "user", request.prompt)

    clarify_model = request.model or CLARIFY_MODEL
    blockly_model = request.model or BLOCKLY_MODEL
    arduino_model = request.model or ARDUINO_MODEL

    # ------------------------------------------
    # Stage 1: Clarify
    # ------------------------------------------

    clarify_result = generate_json(
        system_prompt=CLARIFY_SYSTEM_PROMPT,
        user_prompt=request.prompt,
        model=clarify_model,
        history=get_history(session_id)[:-1]
    )

    if not clarify_result["success"]:

        return {
            "type": "error",
            "stage": "clarify",
            "session_id": session_id,
            "message": clarify_result["response"]
        }

    try:
        decision = json.loads(clarify_result["response"])
    except Exception:
        decision = {"status": "ready", "refined_prompt": request.prompt}

    if decision.get("status") != "ready":

        message = decision.get("message", "Could you give a bit more detail?")

        add_message(session_id, "assistant", message)

        return {
            "type": "clarify",
            "session_id": session_id,
            "message": message,
            "suggestions": decision.get("suggestions", [])
        }

    refined_prompt = decision.get("refined_prompt", request.prompt)

    # ------------------------------------------
    # Stage 2: Blockly circuit JSON (with retry)
    # ------------------------------------------

    circuit = None
    blockly_error = None

    for attempt in range(MAX_RETRIES + 1):

        blockly_result = generate_json(
            system_prompt=BLOCKLY_SYSTEM_PROMPT,
            user_prompt=refined_prompt,
            model=blockly_model
        )

        if not blockly_result["success"]:
            blockly_error = blockly_result["response"]
            continue

        validated = validate_blockly(blockly_result["response"])

        if validated["success"]:
            circuit = validated["circuit"]
            break

        blockly_error = validated["error"]

    if circuit is None:

        return {
            "type": "error",
            "stage": "blockly",
            "session_id": session_id,
            "message": f"Could not generate a valid circuit: {blockly_error}"
        }

    # ------------------------------------------
    # Stage 3: Arduino code (with retry)
    # ------------------------------------------

    arduino_code = None
    arduino_warnings = []
    arduino_error = None

    arduino_user_prompt = build_arduino_user_prompt(circuit)

    for attempt in range(MAX_RETRIES + 1):

        code_result = generate_code(
            system_prompt=ARDUINO_SYSTEM_PROMPT,
            user_prompt=arduino_user_prompt,
            model=arduino_model
        )

        if not code_result["success"]:
            arduino_error = code_result["response"]
            continue

        code_validated = validate_arduino(code_result["response"], circuit)

        if code_validated["success"]:
            arduino_code = code_validated["code"]
            arduino_warnings = code_validated["warnings"]
            break

        arduino_error = code_validated["error"]

    if arduino_code is None:

        # Circuit is still good even if Arduino gen failed - hand
        # it back so the frontend can show the circuit and let the
        # user retry code generation instead of losing everything.

        return {
            "type": "error",
            "stage": "arduino",
            "session_id": session_id,
            "message": f"Circuit built, but Arduino code generation failed: {arduino_error}",
            "components": circuit["components"],
            "connections": circuit["connections"],
            "logic": circuit["logic"]
        }

    # ------------------------------------------
    # Stage 4: Ready for simulation
    # ------------------------------------------

    add_message(session_id, "assistant", "Circuit and Arduino code generated.")

    return {
        "type": "circuit_ready",
        "session_id": session_id,
        "components": circuit["components"],
        "connections": circuit["connections"],
        "logic": circuit["logic"],
        "arduino": arduino_code,
        "warnings": arduino_warnings
    }
