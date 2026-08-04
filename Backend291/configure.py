# ==========================================
# OpenRouter Configuration
# ==========================================

import os
from dotenv import load_dotenv

load_dotenv()

# ------------------------------------------
# API Key
# Put your key in .env as OPENROUTER_API_KEY=...
# Never commit a real key here.
# ------------------------------------------

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "PUT_YOUR_OPENROUTER_API_KEY_HERE")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# ------------------------------------------
# Models
#
# Default = openrouter/free - OpenRouter's own router that
# auto-picks whichever free model is currently up, so nothing
# breaks when a specific free endpoint gets rate-limited or
# rotated out. This is used for EVERY stage unless a request
# explicitly overrides it.
#
# Secondary/manual option = Nemotron 3 Ultra 550B (free) - a
# single strong, named model to pick when you want a fixed
# model instead of the auto router.
# ------------------------------------------

MODELS = {

    "auto_free": "openrouter/free",
    "nemotron_ultra": "nvidia/nemotron-3-ultra-550b-a55b:free",

}

DEFAULT_MODEL = MODELS["auto_free"]

CLARIFY_MODEL = MODELS["auto_free"]

BLOCKLY_MODEL = MODELS["auto_free"]

ARDUINO_MODEL = MODELS["auto_free"]

# ------------------------------------------
# Generation Settings
# ------------------------------------------

TEMPERATURE = 0.2

TOP_P = 0.95

MAX_TOKENS = 2500

TIMEOUT = 120

# ------------------------------------------
# Retry Settings
# One retry per stage if validation fails - small free models
# occasionally emit malformed JSON on first try.
# ------------------------------------------

MAX_RETRIES = 2
