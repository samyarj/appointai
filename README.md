# AppointAI - Calendar & Task Management App

A modern calendar and task management application built with FastAPI (backend) and React (frontend) with JWT authentication.

## Features

- 🔐 **JWT Authentication** - Secure login with email and password
- 📅 **Calendar Management** - Create and manage events
- ✅ **Task Management** - Todo lists with priorities
- 🏷️ **Categories** - Organize events and tasks
- 👤 **User Profiles** - Personalized user experience
- 📊 **Dashboard Analytics** - Track productivity and progress

## Tech Stack

### Backend

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing

### Frontend

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Vite** - Build tool

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 18+
- PostgreSQL database

### Backend Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd appointai/backend
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   DATABASE_URL=postgresql://user:password@localhost/appointai
   SECRET_KEY=your-secret-key-change-in-production
   FRONTEND_URL=http://localhost:5173
   GEMINI_API_KEY=your-google-gemini-api-key # Required for Chat Assistant
   ```

4. **Run database migration**

   ```bash
   python migrate.py
   ```

5. **Start the backend server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd ../frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env` file:

   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Usage

1. **Access the application**

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

2. **Authentication Flow**

   - Click "Sign up" to create a new account
   - Or click "Sign in" if you already have an account
   - Enter your email and password
   - You'll be redirected to the dashboard

3. **Features**
   - **Dashboard**: View your activity overview and statistics
   - **Events**: Create and manage calendar events
   - **Todos**: Manage tasks with priorities and due dates
   - **Categories**: Organize your events and tasks
   - **Profile**: Update your personal settings

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email and password
- `GET /api/auth/me` - Get current user info

### Events

- `GET /api/events` - Get user's events
- `POST /api/events` - Create new event

### Todos

- `GET /api/todos` - Get user's todos
- `POST /api/todos` - Create new todo

### Categories

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category

### Profile

- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

## Database Schema

### Users

- Basic user information (name, email, password_hash)
- Preferences (timezone, date format, theme)
- Settings (notifications, privacy)

### Events

- Event details (title, date, time)
- User association
- Category association

### Todos

- Task information (title, description, priority)
- Due dates and completion status
- User and category association

### Categories

- Category name, color, and description
- Usage statistics

## Security Features

- **JWT Tokens** - Secure authentication
- **Password Hashing** - bcrypt for secure password storage
- **User Isolation** - Each user sees only their data
- **Token Expiration** - Automatic session management
- **HTTPS Ready** - Production-ready security

## Development

### Backend Development

```bash
# Run with auto-reload
uvicorn main:app --reload

# Run tests
pytest

# Format code
black .
```

### Frontend Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Production Deployment

### Backend

1. Set up PostgreSQL database
2. Configure environment variables
3. Set up reverse proxy (nginx)
4. Use gunicorn for production server

### Frontend

1. Build the application: `npm run build`
2. Serve static files with nginx
3. Configure CORS for production domains

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
