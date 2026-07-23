# ==========================================
# OpenRouter Client
# ==========================================

import json
import re
import requests

from configure import (
    OPENROUTER_API_KEY,
    OPENROUTER_URL,
    DEFAULT_MODEL,
    TEMPERATURE,
    MAX_TOKENS,
    TIMEOUT
)

from prompt import SYSTEM_PROMPT


# ==========================================
# Extract JSON From AI Response
# ==========================================

def extract_json(text):

    text = text.strip()

    text = re.sub(r"```json", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```", "", text)

    if text.startswith("{") and text.endswith("}"):
        return text

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1:
        return text[start:end + 1]

    return text


# ==========================================
# Generate AI Response
# ==========================================

def generate_response(user_prompt, model=None):

    if not model:
        model = DEFAULT_MODEL

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "STEMbotix Virtual Lab"
    }

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        "temperature": TEMPERATURE,
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

        print("\n" + "=" * 100)
        print("FULL OPENROUTER RESPONSE")
        print("=" * 100)
        print(json.dumps(data, indent=2))
        print("=" * 100 + "\n")

        # HTTP Error
        if response.status_code != 200:

            return {
                "success": False,
                "response": data.get("error", data)
            }

        # Missing choices
        if "choices" not in data:

            return {
                "success": False,
                "response": data
            }

        ai_response = data["choices"][0]["message"]["content"]

        print("\n" + "=" * 100)
        print("RAW AI RESPONSE")
        print("=" * 100)
        print(ai_response)
        print("=" * 100 + "\n")

        cleaned = extract_json(ai_response)

        return {
            "success": True,
            "response": cleaned
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