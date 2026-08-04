# ==========================================
# Pydantic Models
# ==========================================

from pydantic import BaseModel, Field
from typing import Optional


# ==========================================
# Chat Request
# One endpoint, conversational - client just keeps sending
# the session_id it got back so history carries over.
# ==========================================

class ChatRequest(BaseModel):

    prompt: str = Field(
        ...,
        description="User message / circuit request"
    )

    session_id: Optional[str] = Field(
        default=None,
        description="Returned from a previous call - omit on first message to start a new session"
    )

    model: Optional[str] = Field(
        default=None,
        description="Override model for every stage this turn (advanced/testing use)"
    )
