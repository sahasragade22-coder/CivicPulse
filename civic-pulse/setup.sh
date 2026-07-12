#!/bin/bash
# CivicPulse Quick Start Script

echo "🚀 CivicPulse Phase 1 - Quick Start"
echo "===================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+"
    exit 1
fi

echo "✅ Python and Node.js found"
echo ""

# Setup Backend
echo "📦 Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
echo "✅ Virtual environment activated"

pip install -r requirements.txt --quiet
echo "✅ Backend dependencies installed"

cd ..

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd frontend

npm install --silent
echo "✅ Frontend dependencies installed"

cd ..

echo ""
echo "===================================="
echo "✅ Setup Complete!"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  source venv/bin/activate  # Mac/Linux"
echo "  # OR"
echo "  # .\\venv\\Scripts\\activate  # Windows"
echo "  python app.py"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "Test Credentials:"
echo "  Citizen Login:"
echo "    Email: citizen@gmail.com"
echo "    Password: citizen123"
echo ""
echo "  Officer Login:"
echo "    Email: officer@ghmc.gov.in"
echo "    Password: officer123"
echo ""
echo "🎉 Happy Testing!"
