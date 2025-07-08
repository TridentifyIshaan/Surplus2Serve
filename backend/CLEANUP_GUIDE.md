# Surplus2Serve Backend - File Cleanup Guide

## Files to KEEP (Essential)

### Core Application Files
- ✅ `main.py` - Main FastAPI application (basic version)
- ✅ `main_mongodb.py` - MongoDB-integrated version
- ✅ `models.py` - Pydantic models for API
- ✅ `utils.py` - Utility functions
- ✅ `database.py` - MongoDB connection management
- ✅ `db_models.py` - MongoDB data models

### Configuration Files
- ✅ `requirements.txt` - Basic Python dependencies
- ✅ `requirements-mongodb.txt` - MongoDB-specific dependencies
- ✅ `.env` - Environment variables (if exists)
- ✅ `Dockerfile` - Docker configuration

### Setup and Installation
- ✅ `setup_mongodb.py` - MongoDB setup script
- ✅ `setup_mongodb_integration.ps1` - PowerShell setup script
- ✅ `install_packages.py` - Package installation script
- ✅ `start_server.py` - Server startup script

### Testing and Model Training
- ✅ `test_mongodb_integration.py` - Integration test suite
- ✅ `retrain_model.py` - Model retraining functionality
- ✅ `training_data.csv` - Training data file

### Documentation
- ✅ `README.md` - Basic documentation
- ✅ `README_MongoDB.md` - MongoDB integration documentation
- ✅ `MongoDB_Integration_Guide.md` - Detailed integration guide

## Files to REMOVE (No longer needed)

### Duplicate/Replaced Files
- ❌ `main_basic.py` - Duplicate of main.py
- ❌ `quick_start.py` - Replaced by install_packages.py + start_server.py
- ❌ `test_api.py` - Replaced by test_mongodb_integration.py
- ❌ `setup.py` - Replaced by setup_mongodb.py
- ❌ `setup.ps1` - Replaced by setup_mongodb_integration.ps1
- ❌ `requirements-minimal.txt` - Using requirements.txt instead

### Misplaced Files
- ❌ `SpoilagePredictor.jsx` - React component (belongs in frontend)

### Temporary/Log Files
- ❌ `retraining_log.txt` - Old log file
- ❌ `__pycache__/` - Python cache directory
- ❌ `venv/` - Virtual environment (if exists)

### Generated Files
- ❌ `cleanup.ps1` - Cleanup script (can be removed after use)

## Manual Cleanup Commands

Run these commands in the backend directory to clean up:

```powershell
# Remove duplicate/replaced files
Remove-Item -Force -ErrorAction SilentlyContinue main_basic.py
Remove-Item -Force -ErrorAction SilentlyContinue quick_start.py
Remove-Item -Force -ErrorAction SilentlyContinue test_api.py
Remove-Item -Force -ErrorAction SilentlyContinue setup.py
Remove-Item -Force -ErrorAction SilentlyContinue setup.ps1
Remove-Item -Force -ErrorAction SilentlyContinue requirements-minimal.txt
Remove-Item -Force -ErrorAction SilentlyContinue SpoilagePredictor.jsx
Remove-Item -Force -ErrorAction SilentlyContinue retraining_log.txt

# Remove directories
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue __pycache__
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue venv

# Remove cleanup script itself
Remove-Item -Force -ErrorAction SilentlyContinue cleanup.ps1
```

## Final Backend Structure

After cleanup, your backend directory should contain:

```
backend/
├── main.py                           # Main FastAPI app (basic)
├── main_mongodb.py                   # MongoDB-integrated version
├── models.py                         # API models
├── utils.py                          # Utility functions
├── database.py                       # MongoDB connection
├── db_models.py                      # MongoDB data models
├── requirements.txt                  # Basic dependencies
├── requirements-mongodb.txt          # MongoDB dependencies
├── setup_mongodb.py                  # MongoDB setup
├── setup_mongodb_integration.ps1     # PowerShell setup
├── install_packages.py               # Package installer
├── start_server.py                   # Server starter
├── test_mongodb_integration.py       # Integration tests
├── retrain_model.py                  # Model retraining
├── training_data.csv                 # Training data
├── README.md                         # Basic docs
├── README_MongoDB.md                 # MongoDB docs
├── MongoDB_Integration_Guide.md      # Integration guide
├── Dockerfile                        # Docker config
└── .env                              # Environment vars (optional)
```

This structure provides:
- 🚀 Basic version ready to run (main.py)
- 🗄️ MongoDB integration ready (main_mongodb.py)
- 📚 Comprehensive documentation
- 🔧 Easy setup and testing tools
- 🧹 Clean, organized file structure
