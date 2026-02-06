from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_active_user
from app.schemas.event import EventSchema, EventCreateSchema, EventUpdateSchema
from app.models import User
from app.services.event_service import EventService
from app.core.exceptions import AppointAIException

router = APIRouter()

@router.get("/", response_model=List[EventSchema])
def get_events(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get events for the current user"""
    events = EventService.get_events_by_user(db, current_user.id)
    return [
        EventSchema(
            id=e.id,
            user_id=e.user_id,
            category_id=e.category_id,
            title=e.title,
            date=e.date.isoformat() if e.date else None,
            startTime=e.start_time.strftime("%H:%M") if e.start_time else None,
            endTime=e.end_time.strftime("%H:%M") if e.end_time else None,
            duration=e.duration,
            createdAt=e.created_at.isoformat() if e.created_at else None,
        ) for e in events
    ]

@router.post("/", response_model=EventSchema)
def create_event(
    event_data: EventCreateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new event for the current user"""
    event = EventService.create_event(db, current_user.id, event_data)
    
    return EventSchema(
        id=event.id,
        user_id=event.user_id,
        category_id=event.category_id,
        title=event.title,
        date=event.date.isoformat(),
        startTime=event.start_time.strftime("%H:%M"),
        endTime=event.end_time.strftime("%H:%M"),
        duration=event.duration,
        createdAt=event.created_at.isoformat(),
    )

@router.put("/{event_id}", response_model=EventSchema)
def update_event(
    event_id: int,
    event_data: EventUpdateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing event"""
    event = EventService.update_event(db, current_user.id, event_id, event_data)
    
    return EventSchema(
        id=event.id,
        user_id=event.user_id,
        category_id=event.category_id,
        title=event.title,
        date=event.date.isoformat(),
        startTime=event.start_time.strftime("%H:%M"),
        endTime=event.end_time.strftime("%H:%M"),
        duration=event.duration,
        createdAt=event.created_at.isoformat() if event.created_at else None,
    )

@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an existing event"""
    EventService.delete_event(db, current_user.id, event_id)
    return {"message": "Event deleted successfully"}
