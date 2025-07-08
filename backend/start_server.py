"""
Test script to start the Surplus2Serve FastAPI server
"""

import uvicorn
import sys
import os

def start_server():
    """Start the FastAPI server"""
    try:
        print("Starting Surplus2Serve FastAPI server...")
        print("Server will be available at: http://localhost:8000")
        print("API docs will be available at: http://localhost:8000/docs")
        print("\nPress Ctrl+C to stop the server")
        
        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = start_server()
    sys.exit(0 if success else 1)
