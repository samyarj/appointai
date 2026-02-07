# AppointAI Backend

FastAPI backend for AppointAI (auth, events, todos, categories, chat).

**Setup and how to run:** see the [root README](../README.md).

## This folder

- **Entrypoint:** `main.py` — run with `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- **Migrations:** `python migrate.py`
- **API docs when running:** http://localhost:8000/docs
