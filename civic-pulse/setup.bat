@echo off
REM CivicPulse Quick Start Script for Windows

echo.
echo 🚀 CivicPulse Phase 1 - Quick Start
echo ====================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+
    exit /b 1
)
echo ✅ Python found

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 16+
    exit /b 1
)
echo ✅ Node.js found
echo.

REM Setup Backend
echo 📦 Setting up Backend...
cd backend

if not exist "venv" (
    python -m venv venv
    echo ✅ Virtual environment created
)

call venv\Scripts\activate.bat
echo ✅ Virtual environment activated

pip install -r requirements.txt --quiet
echo ✅ Backend dependencies installed

cd ..

REM Setup Frontend
echo.
echo 📦 Setting up Frontend...
cd frontend

call npm install --silent
echo ✅ Frontend dependencies installed

cd ..

echo.
echo ====================================
echo ✅ Setup Complete!
echo.
echo To start the application:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   venv\Scripts\activate
echo   python app.py
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Then open: http://localhost:5173
echo.
echo Test Credentials:
echo   Citizen Login:
echo     Email: citizen@gmail.com
echo     Password: citizen123
echo.
echo   Officer Login:
echo     Email: officer@ghmc.gov.in
echo     Password: officer123
echo.
echo 🎉 Happy Testing!
echo.
pause
