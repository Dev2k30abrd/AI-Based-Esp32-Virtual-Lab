# ==========================================
# OpenRouter Configuration
# ==========================================

import os
from dotenv import load_dotenv

load_dotenv()

# ------------------------------------------
# API Configuration
# ------------------------------------------

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# ------------------------------------------
# Available Models
# ------------------------------------------

MODELS = {

    # Free
    "nemotron": "nvidia/nemotron-3-super-120b-v1:free",

    # OpenAI
    "gptoss120": "openai/gpt-oss-120b",

    # Alibaba
    "qwen32": "qwen/qwen3-32b",

    # Google
    "gemma27": "google/gemma-3-27b-it"

}

# ------------------------------------------
# Default Model
# Used only if frontend does not send a model
# ------------------------------------------

DEFAULT_MODEL = MODELS["nemotron"]

# ------------------------------------------
# Generation Settings
# ------------------------------------------

TEMPERATURE = 0.2

TOP_P = 0.95

MAX_TOKENS = 2500

TIMEOUT = 120