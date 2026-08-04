# ==========================================
# OpenRouter Client
# Generic caller - any stage passes its own system prompt + model.
# ==========================================

import json
import re
import requests

from configure import (
    OPENROUTER_API_KEY,
    OPENROUTER_URL,
    TEMPERATURE,
    TOP_P,
    MAX_TOKENS,
    TIMEOUT
)


# ==========================================
# Extract JSON From AI Response
# Strips markdown fences, grabs outermost {...}, fixes trailing commas.
# ==========================================

def extract_json(text):

    text = text.strip()

    text = re.sub(r"```json", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```", "", text)

    if not (text.startswith("{") and text.endswith("}")):

        start = text.find("{")
        end = text.rfind("}")

        if start != -1 and end != -1:
            text = text[start:end + 1]

    text = re.sub(r",(\s*[}\]])", r"\1", text)

    return text


# ==========================================
# Extract Arduino code block from AI response
# Model may wrap it in ```cpp fences or return raw code.
# ==========================================

def extract_code(text):

    text = text.strip()

    fence = re.search(r"```(?:cpp|c\+\+|arduino)?\s*(.*?)```", text, flags=re.DOTALL | re.IGNORECASE)

    if fence:
        return fence.group(1).strip()

    return text


# ==========================================
# Stringify Error
# OpenRouter/HTTP errors can come back as a dict
# ({"message": "...", "code": 401} etc) - always
# turn them into a plain readable string so callers
# (and the frontend) never have to guess the shape.
# ==========================================

def _stringify_error(err):

    if isinstance(err, str):
        return err

    if isinstance(err, dict):

        msg = err.get("message")

        if isinstance(msg, str):
            return msg

    try:
        return json.dumps(err)
    except Exception:
        return str(err)


# ==========================================
# Low Level Call
# ==========================================

def call_model(messages, model, json_mode=True):

    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == "PUT_YOUR_OPENROUTER_API_KEY_HERE":

        return {
            "success": False,
            "response": "OPENROUTER_API_KEY not set. Add it to .env (see .env.example)."
        }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "STEMbotix Virtual Lab"
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": TEMPERATURE,
        "top_p": TOP_P,
        "max_tokens": MAX_TOKENS
    }

    try:

        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=TIMEOUT
        )

        data = response.json()

        if response.status_code != 200:

            return {
                "success": False,
                "response": _stringify_error(data.get("error", data))
            }

        if "choices" not in data:

            return {
                "success": False,
                "response": _stringify_error(data)
            }

        raw = data["choices"][0]["message"]["content"]

        cleaned = extract_json(raw) if json_mode else extract_code(raw)

        return {
            "success": True,
            "response": cleaned,
            "raw": raw
        }

    except requests.exceptions.RequestException as e:

        return {
            "success": False,
            "response": f"Request Error: {e}"
        }

    except Exception as e:

        return {
            "success": False,
            "response": f"Unexpected Error: {e}"
        }


# ==========================================
# Stage Helpers
# ==========================================

def generate_json(system_prompt, user_prompt, model, history=None):

    messages = [{"role": "system", "content": system_prompt}]

    if history:
        messages.extend(history)

    messages.append({"role": "user", "content": user_prompt})

    return call_model(messages, model, json_mode=True)


def generate_code(system_prompt, user_prompt, model):

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    return call_model(messages, model, json_mode=False)
