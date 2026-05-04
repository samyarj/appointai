"""Service-layer tests for EventService."""

from datetime import date
from app.services.event_service import EventService
from app.schemas.event import EventCreateSchema, EventUpdateSchema
from app.core.exceptions import NotFoundException
import pytest


class TestEventService:
    def test_create_event(self, db, sample_user):
        event_data = EventCreateSchema(
            title="Team Meeting",
            date=date(2026, 6, 15),
            startTime="09:00",
            endTime="10:00",
            duration="1h",
        )
        event = EventService.create_event(db, sample_user.id, event_data)

        assert event.id is not None
        assert event.title == "Team Meeting"
        assert event.date == date(2026, 6, 15)
        assert event.user_id == sample_user.id

    def test_get_events_by_user(self, db, sample_user):
        # Create two events
        for title in ("Event A", "Event B"):
            EventService.create_event(
                db,
                sample_user.id,
                EventCreateSchema(
                    title=title,
                    date=date(2026, 6, 15),
                    startTime="09:00",
                    endTime="10:00",
                ),
            )

        events = EventService.get_events_by_user(db, sample_user.id)
        assert len(events) == 2

    def test_get_events_by_user_returns_empty_for_other_user(self, db, sample_user):
        EventService.create_event(
            db,
            sample_user.id,
            EventCreateSchema(
                title="Private",
                date=date(2026, 6, 15),
                startTime="09:00",
                endTime="10:00",
            ),
        )
        events = EventService.get_events_by_user(db, 9999)
        assert len(events) == 0

    def test_update_event(self, db, sample_user):
        event = EventService.create_event(
            db,
            sample_user.id,
            EventCreateSchema(
                title="Old Title",
                date=date(2026, 6, 15),
                startTime="09:00",
                endTime="10:00",
            ),
        )

        updated = EventService.update_event(
            db,
            sample_user.id,
            event.id,
            EventUpdateSchema(title="New Title"),
        )
        assert updated.title == "New Title"

    def test_update_event_not_found(self, db, sample_user):
        with pytest.raises(NotFoundException):
            EventService.update_event(
                db,
                sample_user.id,
                9999,
                EventUpdateSchema(title="Nope"),
            )

    def test_delete_event(self, db, sample_user):
        event = EventService.create_event(
            db,
            sample_user.id,
            EventCreateSchema(
                title="Delete Me",
                date=date(2026, 6, 15),
                startTime="09:00",
                endTime="10:00",
            ),
        )
        EventService.delete_event(db, sample_user.id, event.id)

        remaining = EventService.get_events_by_user(db, sample_user.id)
        assert len(remaining) == 0

    def test_delete_event_not_found(self, db, sample_user):
        with pytest.raises(NotFoundException):
            EventService.delete_event(db, sample_user.id, 9999)
