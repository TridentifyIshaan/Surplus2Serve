@echo off
echo Starting Surplus2Serve ML Backend Server...
echo.
echo This will start the spoilage prediction API server
echo Server will be available at: http://localhost:8000
echo API docs will be available at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

cd backend
python start_server.py

pause
