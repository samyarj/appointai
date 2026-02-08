from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Event
from app.schemas.event import EventCreateSchema, EventUpdateSchema
from app.core.exceptions import NotFoundException, InternalServerException

class EventService:
    @staticmethod
    def get_events_by_user(db: Session, user_id: int) -> List[Event]:
        return db.query(Event).filter(Event.user_id == user_id).all()

    @staticmethod
    def create_event(db: Session, user_id: int, event_data: EventCreateSchema) -> Event:
        try:
            event = Event(
                user_id=user_id,
                title=event_data.title,
                date=datetime.strptime(event_data.date, "%Y-%m-%d").date(),
                start_time=datetime.strptime(event_data.startTime, "%H:%M").time(),
                end_time=datetime.strptime(event_data.endTime, "%H:%M").time(),
                category_id=event_data.category_id,
                duration=event_data.duration,
                is_recurring=event_data.is_recurring,
                recurrence_rule=event_data.recurrence_rule,
                created_at=datetime.utcnow()
            )
            db.add(event)
            db.commit()
            db.refresh(event)
            return event
        except Exception as e:
            db.rollback()
            raise InternalServerException(detail=f"Failed to create event: {str(e)}")

    @staticmethod
    def get_event_by_id(db: Session, event_id: int, user_id: int) -> Optional[Event]:
        return db.query(Event).filter(
            Event.id == event_id, 
            Event.user_id == user_id
        ).first()

    @staticmethod
    def update_event(db: Session, user_id: int, event_id: int, event_data: EventUpdateSchema) -> Event:
        try:
            event = EventService.get_event_by_id(db, event_id, user_id)
            if not event:
                raise NotFoundException(detail="Event not found")
            
            # Update fields if provided
            if event_data.title is not None:
                event.title = event_data.title
            if event_data.date is not None:
                event.date = datetime.strptime(event_data.date, "%Y-%m-%d").date()
            if event_data.startTime is not None:
                event.start_time = datetime.strptime(event_data.startTime, "%H:%M").time()
            if event_data.endTime is not None:
                event.end_time = datetime.strptime(event_data.endTime, "%H:%M").time()
            if event_data.category_id is not None:
                event.category_id = event_data.category_id
            if event_data.duration is not None:
                event.duration = event_data.duration
            if event_data.is_recurring is not None:
                event.is_recurring = event_data.is_recurring
            if event_data.recurrence_rule is not None:
                event.recurrence_rule = event_data.recurrence_rule
                
            db.commit()
            db.refresh(event)
            return event
            
        except NotFoundException:
            raise
        except Exception as e:
            db.rollback()
            raise InternalServerException(detail=f"Failed to update event: {str(e)}")

    @staticmethod
    def delete_event(db: Session, user_id: int, event_id: int) -> None:
        try:
            event = EventService.get_event_by_id(db, event_id, user_id)
            if not event:
                raise NotFoundException(detail="Event not found")
            
            db.delete(event)
            db.commit()
        except NotFoundException:
            raise
        except Exception as e:
            db.rollback()
            raise InternalServerException(detail=f"Failed to delete event: {str(e)}")
