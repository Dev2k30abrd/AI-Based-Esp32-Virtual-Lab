# ==========================================
# Pydantic Models
# ==========================================

from pydantic import BaseModel, Field
from typing import Optional


# ==========================================
# AI Request
# ==========================================

class AIRequest(BaseModel):

    prompt: str = Field(
        ...,
        description="User prompt"
    )

    model: Optional[str] = Field(
        default=None,
        description="OpenRouter model"
    )


# ==========================================
# AI Response
# ==========================================

class AIResponse(BaseModel):

    success: bool

    response: str