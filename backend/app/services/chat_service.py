import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
import google.generativeai as genai

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
    def _configure_genai():
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return False
        genai.configure(api_key=api_key)
        return True

    @staticmethod
    async def process_message(db: Session, user: User, request: ChatRequest) -> ChatResponse:
        has_key = ChatService._configure_genai()
        
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
                "duration": "string (optional e.g., '1h')"
                
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
        - If category is mentioned, try to match with Existing Categories. If it's a new category and the intent is NOT create_category, you can still suggest it or map to Uncategorized.
        - If you cannot understand, set intent to "unknown" and ask for clarification in response_text.
        """
        
        if not has_key:
            # Fallback for when no API key is present (Simple Regex or message)
            return ChatResponse(
                response="I'm ready to help, but the GEMINI_API_KEY is missing from the backend environment variables. Please add it to use the AI features.",
                action_taken="error"
            )

        try:
            logger.info(f"Processing chat request: {request.message}")
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content([system_prompt, request.message])
            
            # clean response parsing
            text_response = response.text.strip()
            logger.info(f"LLM Raw Response: {text_response}")
            
            if text_response.startswith("```json"):
                text_response = text_response.replace("```json", "").replace("```", "")
            
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
                    duration=entities.get("duration")
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
