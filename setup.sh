#!/bin/bash

echo "🚀 Setting up AppointAI with JWT Authentication"
echo "==============================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is running (optional check)
if ! pg_isready &> /dev/null; then
    echo "⚠️  PostgreSQL doesn't seem to be running. Make sure PostgreSQL is installed and running."
fi

echo ""
echo "📦 Installing backend dependencies..."
cd backend
python3 -m pip install -r requirements.txt

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "🔧 Setting up environment files..."

# Backend environment setup
cd ../backend
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created backend .env file"
    echo "⚠️  Please edit backend/.env with your configuration:"
    echo "   - DATABASE_URL"
    echo "   - SECRET_KEY"
else
    echo "✅ Backend .env file already exists"
fi

# Frontend environment setup
cd ../frontend
if [ ! -f .env ]; then
    echo "VITE_API_URL=http://localhost:8000" > .env
    echo "✅ Created frontend .env file"
else
    echo "✅ Frontend .env file already exists"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Configure your database:"
echo "   - Update DATABASE_URL in backend/.env"
echo "   - Run: cd backend && python migrate.py"
echo ""
echo "2. Start the servers:"
echo "   Backend:  cd backend && uvicorn main:app --reload"
echo "   Frontend: cd frontend && npm run dev"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "4. Create your first account:"
echo "   - Go to http://localhost:5173"
echo "   - Click 'Sign up' to create an account"
echo "   - Or click 'Sign in' if you already have an account"
echo ""
echo "✨ Setup complete! Follow the steps above to get started." 