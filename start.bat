@echo off
title Surplus2Serve - Quick Start

echo.
echo ============================================================
echo                    SURPLUS2SERVE
echo              Spoilage Prediction Platform
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo Python is installed
echo.

REM Run the startup script
echo Starting Surplus2Serve integration...
python start_integration.py

echo.
echo ============================================================
echo Thank you for using Surplus2Serve!
echo ============================================================
pause
