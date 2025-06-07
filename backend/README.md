# AppointAI Backend

A FastAPI backend for the AppointAI appointment scheduling system.

## Quick Start

1. **Setup virtual environment:**

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Run the development server:**

   ```bash
   fastapi dev main.py
   ```

   Or alternatively:

   ```bash
   uvicorn main:app --reload
   ```

4. **Access the API:**

   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

5. **Stop the server:**
   - Press `Ctrl+C` in the terminal where the server is running
   - Or from another terminal: `pkill -f uvicorn`

## API Endpoints

- `GET /` - Welcome message and API info
- `GET /health` - Health check endpoint
- `GET /api/hello/{name}` - Sample greeting endpoint

## Development

The API includes CORS middleware configured for local frontend development on ports 3000 and 5173.

## Server Management

### Starting the Server

```bash
# Method 1: Using FastAPI CLI (recommended)
fastapi dev main.py

# Method 2: Using uvicorn directly
uvicorn main:app --reload
```

### Stopping the Server

```bash
# Method 1: In the terminal where server is running
Ctrl+C

# Method 2: Kill from another terminal
pkill -f uvicorn

# Method 3: Kill specific FastAPI processes
pkill -f fastapi
```

### Checking Server Status

```bash
# Check if server is running
ps aux | grep -E "(uvicorn|fastapi)" | grep -v grep

# Check what's running on port 8000
lsof -i :8000
```
