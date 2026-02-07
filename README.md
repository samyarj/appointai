# AppointAI

Calendar and task management app with JWT auth — FastAPI backend, React + TypeScript frontend.

---

## How to run the app

You need **three things** before running: Python, Node.js, and PostgreSQL. Then start the backend and frontend in two terminals.

### 1. Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **PostgreSQL** (installed and running)

### 2. One-time setup

From the project root:

```bash
# Install backend and frontend dependencies (and create .env files if missing)
./setup.sh
```

If you don’t use `setup.sh`, do this manually:

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend**

```bash
cd frontend
npm install
```

### 3. Environment variables

**Backend** — in `backend/.env` (create from scratch if needed):

```env
DATABASE_URL=postgresql://user:password@localhost/appointai
SECRET_KEY=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your-google-gemini-api-key
```

**Frontend** — in `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

### 4. Database

Create the PostgreSQL database and run migrations:

```bash
cd backend
python migrate.py
```

### 5. Start the app (two terminals)

**Terminal 1 — Backend**

```bash
cd backend
source .venv/bin/activate   # if you use a venv
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

### 6. Open the app

- **App (UI):** [http://localhost:5173](http://localhost:5173)
- **API docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API base:** [http://localhost:8000](http://localhost:8000)

Sign up or sign in at the app URL to use the dashboard, events, todos, and categories.

---

## Project layout

| Path        | Role                                                           |
| ----------- | -------------------------------------------------------------- |
| `backend/`  | FastAPI app, SQLAlchemy, JWT auth, PostgreSQL                  |
| `frontend/` | React 19 + TypeScript + Vite + Tailwind                        |
| `setup.sh`  | One-command install for backend + frontend deps and .env stubs |

Backend and frontend each have a short `README.md` with folder-specific notes; **run instructions live only in this file.**

---

## Quick reference

| Task           | Command                                                              |
| -------------- | -------------------------------------------------------------------- |
| Backend (dev)  | `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000` |
| Frontend (dev) | `cd frontend && npm run dev`                                         |
| Migrate DB     | `cd backend && python migrate.py`                                    |
| Frontend build | `cd frontend && npm run build`                                       |

---

## Tech stack

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL, JWT (python-jose), bcrypt
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router

---

## License

MIT
