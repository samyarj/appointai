import os
import json
import logging
from typing import Optional
from sqlalchemy.orm import Session
from groq import AsyncGroq
from app.core.config import settings

from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.event import EventCreateSchema
from app.schemas.todo import TodoCreateSchema
from app.schemas.category import CategoryCreateSchema
from app.services.event_service import EventService
from app.services.todo_service import TodoService
from app.services.category_service import CategoryService
from app.models import User, Category

logger = logging.getLogger(__name__)

class ChatService:
    @staticmethod
    async def process_message(db: Session, user: User, request: ChatRequest) -> ChatResponse:
        api_key = settings.GROQ_API_KEY
        
        if not api_key:
            return ChatResponse(
                response="I'm ready to help, but the GROQ_API_KEY is missing from the backend environment variables. Please add it to use the AI features.",
                action_taken="error"
            )

        # Fetch categories to provide context
        categories = db.query(Category).all()
        category_names = [c.name for c in categories]
        
        # Fetch upcoming events to provide schedule context
        from datetime import date
        try:
            today_str = date.today().isoformat()
            user_events_raw = EventService.get_events_by_user(db, user.id)
            upcoming = [e for e in user_events_raw if str(e.date) >= today_str]
            upcoming.sort(key=lambda x: (x.date, x.start_time))
            events_context = "\n".join([f"- {e.date} {e.start_time.strftime('%H:%M')}-{e.end_time.strftime('%H:%M') if e.end_time else '1h'} : {e.title}" for e in upcoming[:20]]) or "No upcoming events."
        except Exception:
            events_context = "No upcoming events."
        
        system_prompt = f"""
        You are an intelligent scheduling assistant for an app called AppointAI.
        Current Local Time: {request.local_time}
        Existing Categories: {", ".join(category_names)}
        User's Upcoming Events (use this to check for conflicts when scheduling):
        {events_context}
        
        Your goal is to extract the user's intent and entities to perform one of the following actions:
        1. create_event
        2. create_todo
        3. create_category
        4. update_event
        5. delete_event
        6. query_calendar
        7. update_todo
        8. delete_todo
        9. query_todos
        
        Output strictly valid JSON with the following structure:
        {{
            "intent": "create_event" | "create_todo" | "create_category" | "update_event" | "delete_event" | "query_calendar" | "update_todo" | "delete_todo" | "query_todos" | "unknown",
            "entities": {{
                // For create_event/update_event:
                "title": "string",
                "date": "YYYY-MM-DD",
                "startTime": "HH:MM (required string, suggest a free time like '09:00' if not specified)",
                "endTime": "HH:MM (required string, suggest a time like '10:00' if not specified)",
                "category_name": "string (optional)",
                "duration": "string (optional e.g., '1h')",
                "is_recurring": "boolean (optional)",
                "recurrence_rule": "string (optional)",
                "auto_schedule": "boolean (true if user asks to 'find a time' or 'sometime next week' without specific time)",
                "time_range_start": "YYYY-MM-DD (start of search range for auto_schedule)",
                "time_range_end": "YYYY-MM-DD (end of search range for auto_schedule)"
                
                // For create_todo:
                "title": "string",
                "description": "string",
                "priority": "low" | "medium" | "high",
                "due_date": "YYYY-MM-DD (optional)"
                
                 // For category:
                "name": "string",
                "color": "hex string",
                "description": "string"

                 // For query_calendar:
                "date_range_start": "YYYY-MM-DD",
                "date_range_end": "YYYY-MM-DD",

                 // For query_todos:
                "status": "pending" | "completed" | "all"
            }},
            // For update_event, delete_event, update_todo, or delete_todo, provide search_criteria to find the item:
            "search_criteria": {{
                "title_keyword": "string (part of title to match, e.g. 'gym' or 'groceries')",
                "date": "YYYY-MM-DD (optional, if specified)"
            }},
            // For update_event or update_todo, allow explicit updates object (optional, defaults to entities):
            "updates": {{
                 "startTime": "HH:MM",
                 "completed": "boolean"
                 // etc.
            }},
            "response_text": "A natural language confirmation message to show the user. If auto-scheduling, say 'I found a slot at...'"
        }}
        
        Rules:
        - If the user specifies a relative time (tomorrow, next friday), calculate the exact date based on Current Local Time.
        - If time is given without end time, assume 1 hour duration.
        - If the user specifies a range for recurrence (e.g., 'for 3 months', 'until May'), calculate the UNTIL date based on the Current Local Time and include it in the RRULE.
        - If the user specifies a start month for a recurring event, set the "date" field accordingly.
        - If intent is "update_event", "delete_event", "update_todo", or "delete_todo", you MUST provide "search_criteria" derived from the user's request (e.g., "delete my gym class" -> keyword: "gym").
        - If intent is "query_calendar", derive the date range from the user's request (e.g., "this week" -> start=today, end=end of week).
        - If intent is "query_todos", extract the desired status (pending/completed/all). Defaults to 'pending' if the user just asks for 'my todos'.
        - If the user says "sometime next week" or "find a time", set "auto_schedule": true, and set "time_range_start" and "time_range_end" to the requested period.
        - If category is mentioned, try to match with Existing Categories.
        - If you cannot understand, set intent to "unknown".
        """
        
        try:
            logger.info(f"Processing chat request: {request.message}")
            
            client = AsyncGroq(api_key=api_key)
            completion = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": request.message
                    }
                ],
                temperature=0.1, # Lower temperature for better JSON consistency
                max_completion_tokens=1024,
                top_p=1,
                stream=False,
                stop=None,
                response_format={"type": "json_object"}
            )
            
            text_response = completion.choices[0].message.content
            logger.info(f"LLM Raw Response: {text_response}")
            
            parsed = json.loads(text_response)
            logger.info(f"Parsed Intent: {parsed.get('intent')}")
            
            intent = parsed.get("intent")
            entities = parsed.get("entities", {})
            response_text = parsed.get("response_text", "Done.")
            
            # Resolve Category ID
            category_id = None
            cat_name = entities.get("category_name") or entities.get("name") # For create_category, name is in name
            
            if intent == "create_category":
                # Check if exists
                existing = next((c for c in categories if c.name.lower() == str(cat_name).lower()), None)
                if existing:
                    return ChatResponse(response=f"Category '{cat_name}' already exists.")
                
                # Create new
                new_cat_data = CategoryCreateSchema(
                    name=cat_name,
                    color=entities.get("color", "#3B82F6"),
                    description=entities.get("description", "")
                )
                new_cat = CategoryService.create_category(db, new_cat_data)
                return ChatResponse(response=response_text, action_taken="create_category", data={"id": new_cat.id, "name": new_cat.name})
            
            # For Event/Todo, resolve category ID if provided
            if cat_name and intent != "create_category":
                # Find category
                found_cat = next((c for c in categories if c.name.lower() == cat_name.lower()), None)
                if found_cat:
                    category_id = found_cat.id
            
            if intent == "create_event":
                # Check for auto-schedule
                if entities.get("auto_schedule"):
                    # Find slot
                    search_start = entities.get("time_range_start") or entities.get("date")
                    duration = entities.get("duration", "1h")
                    
                    if not search_start:
                         from datetime import date
                         search_start = date.today().isoformat()

                    slot = ChatService.find_available_slot(db, user.id, search_start, duration)
                    if not slot:
                        return ChatResponse(response=f"I couldn't find any free time starting from {search_start} for {duration}.")
                    
                    # Update entities with found slot
                    entities["date"] = slot["date"]
                    entities["startTime"] = slot["startTime"]
                    entities["endTime"] = slot["endTime"]
                    
                    response_text += f" I scheduled it for {slot['date']} from {slot['startTime']} to {slot['endTime']}."

                # Ensure mandatory string fields are present to avoid pydantic validation errors
                start_time = entities.get("startTime")
                if not start_time:
                    start_time = "09:00"
                end_time = entities.get("endTime")
                if not end_time:
                    end_time = "10:00"
                date_str = entities.get("date")
                if not date_str:
                    from datetime import date as dt_date
                    date_str = dt_date.today().isoformat()
                title_str = entities.get("title")
                if not title_str:
                    title_str = "Scheduled Event"

                event_data = EventCreateSchema(
                    title=title_str,
                    date=date_str,
                    startTime=start_time,
                    endTime=end_time,
                    category_id=category_id,

                    duration=entities.get("duration"),
                    is_recurring=entities.get("is_recurring", False),
                    recurrence_rule=entities.get("recurrence_rule")
                )
                EventService.create_event(db, user.id, event_data)
                return ChatResponse(response=response_text, action_taken="create_event")
                
            elif intent == "create_todo":
                todo_data = TodoCreateSchema(
                    title=entities.get("title"),
                    description=entities.get("description"),
                    priority=entities.get("priority", "medium"),
                    due_date=entities.get("due_date"),
                    estimated_duration=entities.get("estimated_duration"),
                    category_id=category_id
                )
                TodoService.create_todo(db, user.id, todo_data)
                return ChatResponse(response=response_text, action_taken="create_todo")
            
            elif intent in ["update_event", "delete_event"]:
                # Logic to find event
                # This requires fetching user events and finding the best match
                user_events = EventService.get_events_by_user(db, user.id)
                search_criteria = parsed.get("search_criteria", {})
                title_query = search_criteria.get("title_keyword", "").lower()
                date_query = search_criteria.get("date")
                
                matched_event = None
                
                # Simple filtering logic
                candidates = []
                for e in user_events:
                    if title_query and title_query in e.title.lower():
                        candidates.append(e)
                
                # If date provided, filter further
                if date_query and candidates:
                    candidates = [c for c in candidates if str(c.date) == date_query]
                
                # If no date provided but multiple candidates, maybe pick the next upcoming one?
                # For now, let's pick the first match or fail if ambiguous
                if len(candidates) == 1:
                    matched_event = candidates[0]
                elif len(candidates) > 1:
                    # Heuristic: Pick the one closest to now (upcoming usually)
                    # Or just pick the first one
                    matched_event = candidates[0]
                elif not candidates and not date_query and title_query:
                     # Try finding exact match?
                     pass
                     
                if not matched_event:
                    return ChatResponse(
                        response=f"I couldn't find an event matching '{title_query}'" + (f" on {date_query}" if date_query else "") + ". Please be more specific."
                    )
                
                if intent == "delete_event":
                    EventService.delete_event(db, user.id, matched_event.id)
                    return ChatResponse(response=response_text, action_taken="delete_event")
                
                elif intent == "update_event":
                    updates = parsed.get("updates", {}) or entities # Support both formats
                    from app.schemas.event import EventUpdateSchema
                    
                    update_data = EventUpdateSchema(
                        title=updates.get("title"),
                        date=updates.get("date"),
                        startTime=updates.get("startTime"),
                        endTime=updates.get("endTime"),
                        category_id=category_id, # If explicitly updating category
                        duration=updates.get("duration"),
                        is_recurring=updates.get("is_recurring"),
                        recurrence_rule=updates.get("recurrence_rule")
                    )
                    EventService.update_event(db, user.id, matched_event.id, update_data)
                    return ChatResponse(response=response_text, action_taken="update_event")
                    
            elif intent in ["update_todo", "delete_todo"]:
                user_todos = TodoService.get_todos_by_user(db, user.id)
                search_criteria = parsed.get("search_criteria", {})
                title_query = search_criteria.get("title_keyword", "").lower()
                
                matched_todo = None
                
                candidates = []
                for t in user_todos:
                    if title_query and title_query in t.title.lower():
                        candidates.append(t)
                
                if len(candidates) >= 1:
                    matched_todo = candidates[0]
                     
                if not matched_todo:
                    return ChatResponse(
                        response=f"I couldn't find a task matching '{title_query}'. Please be more specific."
                    )
                
                if intent == "delete_todo":
                    TodoService.delete_todo(db, user.id, matched_todo.id)
                    return ChatResponse(response=response_text, action_taken="delete_todo")
                
                elif intent == "update_todo":
                    updates = parsed.get("updates", {}) or entities
                    from app.schemas.todo import TodoUpdateSchema
                    
                    update_data = TodoUpdateSchema(
                        title=updates.get("title"),
                        description=updates.get("description"),
                        priority=updates.get("priority"),
                        estimated_duration=updates.get("estimated_duration"),
                        due_date=updates.get("due_date"),
                        category_id=category_id,
                        completed=updates.get("completed")
                    )
                    TodoService.update_todo(db, user.id, matched_todo.id, update_data)
                    return ChatResponse(response=response_text, action_taken="update_todo")
            
            elif intent == "query_calendar":
                from datetime import date
                # Fetch events and return summary
                entities = parsed.get("entities", {})
                start_date_str = entities.get("date_range_start") or entities.get("date")
                end_date_str = entities.get("date_range_end")
                
                # Default to today if no date
                if not start_date_str:
                    start_date_str = date.today().isoformat()
                if not end_date_str:
                    end_date_str = start_date_str
                
                user_events = EventService.get_events_by_user(db, user.id)
                
                # Filter locally for simplicity (or update service to filter)
                relevant_events = []
                for e in user_events:
                    # Simple string comparison works for ISO dates YYYY-MM-DD
                    if start_date_str <= str(e.date) <= end_date_str:
                        relevant_events.append(e)
                
                if not relevant_events:
                    summary = f"You have no events scheduled between {start_date_str} and {end_date_str}."
                else:
                    lines = [f"Here is your schedule from {start_date_str} to {end_date_str}:"]
                    for e in sorted(relevant_events, key=lambda x: (x.date, x.start_time)):
                        lines.append(f"- {e.date} {e.start_time.strftime('%H:%M')} - {e.title}")
                    summary = "\n".join(lines)
                
                return ChatResponse(response=summary)

            elif intent == "query_todos":
                user_todos = TodoService.get_todos_by_user(db, user.id)
                entities = parsed.get("entities", {})
                status_filter = entities.get("status", "pending")
                
                relevant_todos = []
                for t in user_todos:
                    if status_filter == "pending" and t.completed:
                        continue
                    if status_filter == "completed" and not t.completed:
                        continue
                    relevant_todos.append(t)
                
                if not relevant_todos:
                    summary = f"You have no {status_filter} todos at the moment."
                else:
                    lines = [f"Here are your {status_filter} todos:"]
                    for t in relevant_todos:
                        status_str = "[x]" if t.completed else "[ ]"
                        lines.append(f"- {status_str} {t.title}")
                    summary = "\n".join(lines)
                
                return ChatResponse(response=summary)

            else:
                return ChatResponse(response=response_text)
                
        except Exception as e:
            logger.error(f"LLM Error: {str(e)}", exc_info=True)
            return ChatResponse(
                response="Sorry, I ran into an issue processing your request. Please try again.",
                action_taken="error"
            )

    @staticmethod
    def find_available_slot(db: Session, user_id: int, start_date_str: str, duration_str: str = "1h", range_days: int = 7) -> Optional[dict]:
        from datetime import datetime, timedelta, time, date

        # Parse duration
        duration_minutes = 60 # Default
        if duration_str:
            if 'h' in duration_str:
                try:
                    duration_minutes = int(float(duration_str.replace('h', '')) * 60)
                except ValueError:
                   pass
            elif 'm' in duration_str:
                try:
                     duration_minutes = int(duration_str.replace('m', ''))
                except ValueError:
                    pass
        
        start_date = date.fromisoformat(start_date_str)
        user_events = EventService.get_events_by_user(db, user_id)
        
        # Simple heuristic: Check 9am - 5pm for next 7 days
        work_start = time(9, 0)
        work_end = time(17, 0)
        
        for i in range(range_days):
            check_date = start_date + timedelta(days=i)
            day_events = [e for e in user_events if e.date == check_date]
            day_events.sort(key=lambda x: x.start_time)
            
            # Create a list of busy slots for the day
            busy_slots = []
            for e in day_events:
                start_dt = datetime.combine(check_date, e.start_time)
                # Parse end time properly or assume duration
                if e.end_time:
                     end_dt = datetime.combine(check_date, e.end_time)
                else:
                     end_dt = start_dt + timedelta(hours=1)
                busy_slots.append((start_dt, end_dt))
            
            # Check for free slot starting from work_start
            current_slot_start = datetime.combine(check_date, work_start)
            day_end_limit = datetime.combine(check_date, work_end)
            
            # Check availability against busy slots
            while current_slot_start + timedelta(minutes=duration_minutes) <= day_end_limit:
                 slot_end = current_slot_start + timedelta(minutes=duration_minutes)
                 is_busy = False
                 for b_start, b_end in busy_slots:
                     # Overlap check: (StartA < EndB) and (EndA > StartB)
                     if current_slot_start < b_end and slot_end > b_start:
                         is_busy = True
                         # Jump past this busy slot
                         current_slot_start = b_end
                         break
                 
                 if not is_busy:
                     return {
                         "date": check_date.isoformat(),
                         "startTime": current_slot_start.strftime("%H:%M"),
                         "endTime": slot_end.strftime("%H:%M")
                     }
                 # If busy, current_slot_start was already advanced to b_end above
        
        return None
