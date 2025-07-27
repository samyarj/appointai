from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import SessionLocal
from .models import User, Category, Event, Todo

app = FastAPI(
    title="AppointAI API",
    description="FastAPI backend for AppointAI appointment scheduling system",
    version="1.0.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to AppointAI API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "appointai-backend"}

@app.get("/api/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}!", "service": "appointai"}
