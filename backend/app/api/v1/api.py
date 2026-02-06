from fastapi import APIRouter
from app.api.v1.endpoints import auth, events, todos, categories, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/api", tags=["users"]) # Mount user routes at /api root for compatibility or refine prefixes
api_router.include_router(events.router, prefix="/api/events", tags=["events"])
api_router.include_router(todos.router, prefix="/api/todos", tags=["todos"])
api_router.include_router(categories.router, prefix="/api/categories", tags=["categories"])
