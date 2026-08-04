# STEMbotix Virtual Lab Backend

## Setup
1. `pip install -r requirements.txt`
2. Copy your OpenRouter key into `.env`:
   `OPENROUTER_API_KEY=sk-or-...` (free key: https://openrouter.ai/keys)
3. `uvicorn app:app --reload`

## Flow (single endpoint: POST /chat)
Body: `{"prompt": "...", "session_id": "<optional, from previous reply>"}`

1. **Clarify** - if the prompt is too vague, response type is `clarify`
   with a `message` (+ optional `suggestions`). Send the user's answer
   back on the SAME `session_id` to continue.
2. **Blockly stage** - once clear, an LLM builds the circuit graph
   (components/connections/logic), validated against `components.py`'s
   pin rules (auto-repairs ids, drops invalid pins/rules, retries once
   on bad JSON).
3. **Arduino stage** - a second LLM call turns the *validated* circuit
   into Arduino code, checked for setup()/loop(), balanced braces,
   and pin coverage (retries once, auto-repairs missing setup/loop).
4. Response type `circuit_ready` -> `components`, `connections`,
   `logic`, `arduino`, `warnings` - hand straight to the simulator.

Models per stage are set in `configure.py` (`CLARIFY_MODEL`,
`BLOCKLY_MODEL`, `ARDUINO_MODEL`), defaulting to free OpenRouter
models (Nemotron Ultra, Qwen3 Coder, Llama 3.3). Swap the `MODELS`
dict entries to try others.
