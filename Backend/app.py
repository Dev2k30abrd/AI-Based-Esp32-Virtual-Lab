# ==========================================
# STEMbotix Virtual Lab API
# ==========================================

from validator import validate_ai_response
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from model import AIRequest
from openrouter import generate_response

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

        "status":"running",

        "message":"STEMbotix Virtual Lab API"

    }


# ==========================================
# AI Route
# ==========================================

@app.post("/generate")
def generate(request: AIRequest):

    ai_result = generate_response(
        user_prompt=request.prompt,
        model=request.model
    )

    if not ai_result["success"]:
        return ai_result

    print("\n================ RAW AI RESPONSE ================\n")
    print(ai_result["response"])

    validated = validate_ai_response(
        ai_result["response"]
    )

    print("\n================ VALIDATED RESPONSE ================\n")
    print(validated)

    return validated