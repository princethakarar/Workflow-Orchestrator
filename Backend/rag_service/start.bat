@echo off
echo ============================================
echo  Workflow Orchestrator - RAG Microservice
echo ============================================
echo.

REM Check Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.9+ and try again.
    pause
    exit /b 1
)

REM Install / upgrade dependencies
echo [1/2] Installing Python dependencies...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [ERROR] pip install failed. Check your internet connection.
    pause
    exit /b 1
)

echo [2/2] Starting RAG service on http://localhost:5001
echo        (Press Ctrl+C to stop)
echo.
python app.py

pause
