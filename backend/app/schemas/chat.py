from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ChatRequest(BaseModel):
    message: str
    local_time: str  # ISO format string to help LLM understand "tomorrow", "this afternoon"

class ChatResponse(BaseModel):
    response: str
    action_taken: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
