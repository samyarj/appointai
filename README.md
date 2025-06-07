# AppointAI - Appointment Scheduling System

A full-stack appointment scheduling application built with FastAPI (backend) and React (frontend).

## 🏗️ Project Structure

```
appointai/
├── backend/          # FastAPI Python backend
│   ├── main.py       # FastAPI application
│   ├── requirements.txt
│   └── README.md     # Backend-specific docs
├── frontend/         # React TypeScript frontend
│   ├── src/
│   ├── package.json
│   └── README.md     # Frontend-specific docs
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### 1. Backend Setup (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Frontend Setup (React)

```bash
cd frontend
npm install
```

### 3. Run Development Servers

**Terminal 1 - Backend:**

```bash
cd backend
source .venv/bin/activate
fastapi dev main.py
# Server: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# Server: http://localhost:5173
```

## 🔗 API Integration

The frontend is configured to communicate with the backend API:

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- CORS is configured for local development

## 📁 Development

### Backend (FastAPI)

- **Framework:** FastAPI with Uvicorn
- **Language:** Python 3.11
- **Features:** Auto-generated API docs, CORS enabled
- **Development:** Hot reload enabled

### Frontend (React)

- **Framework:** React with TypeScript
- **Build Tool:** Vite
- **Features:** Hot reload, TypeScript support
- **Development:** Fast refresh enabled

## 🛠️ Available Scripts

### Backend

```bash
cd backend
fastapi dev main.py    # Development server
uvicorn main:app --reload  # Alternative dev server
pip freeze > requirements.txt  # Update dependencies
```

### Frontend

```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🔧 Environment Variables

Create `.env` files in respective directories:

**backend/.env:**

```
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=your-secret-key
```

**frontend/.env:**

```
VITE_API_URL=http://localhost:8000
```

## 📦 Deployment

### Backend

- Can be deployed to any platform supporting Python (Heroku, Railway, DigitalOcean, AWS, etc.)
- Requires Python 3.11+ and pip

### Frontend

- Can be deployed to any static hosting (Vercel, Netlify, GitHub Pages, etc.)
- Build output is in `frontend/dist/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both backend and frontend
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
