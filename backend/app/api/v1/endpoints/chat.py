from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_active_user
from app.schemas.chat import ChatRequest, ChatResponse
from app.models import User
from app.services.chat_service import ChatService

router = APIRouter()

@router.post("", response_model=ChatResponse)
async def chat_interaction(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Process natural language chat input to perform scheduling actions.
    """
    return await ChatService.process_message(db, current_user, request)
