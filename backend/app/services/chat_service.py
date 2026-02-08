import os
import json
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from groq import AsyncGroq

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
        api_key = os.getenv("GROQ_API_KEY")
        
        if not api_key:
            return ChatResponse(
                response="I'm ready to help, but the GROQ_API_KEY is missing from the backend environment variables. Please add it to use the AI features.",
                action_taken="error"
            )

        # Fetch categories to provide context
        categories = db.query(Category).all()
        category_names = [c.name for c in categories]
        
        system_prompt = f"""
        You are an intelligent scheduling assistant for an app called AppointAI.
        Current Local Time: {request.local_time}
        Existing Categories: {", ".join(category_names)}
        
        Your goal is to extract the user's intent and entities to perform one of the following actions:
        1. create_event
        2. create_todo
        3. create_category
        
        Output strictly valid JSON with the following structure:
        {{
            "intent": "create_event" | "create_todo" | "create_category" | "unknown",
            "entities": {{
                // For event:
                "title": "string",
                "date": "YYYY-MM-DD",
                "startTime": "HH:MM",
                "endTime": "HH:MM",
                "category_name": "string (optional)",

                "duration": "string (optional e.g., '1h')",
                "is_recurring": "boolean (optional)",
                "recurrence_rule": "string (optional, RRULE format e.g., 'FREQ=WEEKLY;INTERVAL=1')"
                
                // For todo:
                "title": "string",
                "description": "string",
                "priority": "low" | "medium" | "high",
                "due_date": "YYYY-MM-DD (optional)",
                "estimated_duration": "string (optional)",
                "category_name": "string (optional)"

                // For category:
                "name": "string",
                "color": "hex string (optional, generate a nice one if missing)",
                "description": "string (optional)"
            }},
            "response_text": "A natural language confirmation message to show the user."
        }}
        
        Rules:
        - If the user specifies a relative time (tomorrow, next friday), calculate the exact date based on Current Local Time.
        - If time is given without end time, assume 1 hour duration.
        - If the user specifies a range for recurrence (e.g., 'for 3 months', 'until May'), calculate the UNTIL date based on the Current Local Time and include it in the RRULE (e.g., FREQ=WEEKLY;UNTIL=20231231T000000Z).
        - If the user specifies a start month for a recurring event (e.g., "Mondays in February, March, and April"), set the "date" field to the first occurrence date within that period.
        - If the user mentions recurrence (e.g., 'every Monday', 'daily', 'weekly'), set is_recurring to true and generate a valid RRULE string for recurrence_rule.
        - If category is mentioned, try to match with Existing Categories. If it's a new category and the intent is NOT create_category, you can still suggest it or map to Uncategorized.
        - If you cannot understand, set intent to "unknown" and ask for clarification in response_text.
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
                event_data = EventCreateSchema(
                    title=entities.get("title"),
                    date=entities.get("date"),
                    startTime=entities.get("startTime"),
                    endTime=entities.get("endTime"),
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
                
            else:
                return ChatResponse(response=response_text)
                
        except Exception as e:
            logger.error(f"LLM Error: {str(e)}", exc_info=True)
            return ChatResponse(
                response=f"Sorry, I ran into an issue filtering your request: {str(e)}",
                action_taken="error"
            )
