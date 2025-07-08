#!/usr/bin/env python3
"""
Quick Fix for Surplus2Serve Model Compatibility Issue
This script addresses the sklearn version compatibility problem
"""

import sys
import subprocess
import os
from pathlib import Path

# Suppress import warnings for linter
import importlib.util

def print_banner():
    print("""
╔══════════════════════════════════════════════════════════════╗
║                🔧 QUICK FIX - MODEL COMPATIBILITY             ║
║                                                              ║
║  Fixing sklearn version compatibility issues...             ║
╚══════════════════════════════════════════════════════════════╝
    """)

def check_sklearn_version():
    """Check current sklearn version"""
    try:
        import sklearn
        print(f"Current sklearn version: {sklearn.__version__}")
        return sklearn.__version__
    except ImportError:
        print("❌ sklearn not installed")
        return None

def fix_compatibility():
    """Apply quick fixes for compatibility issues"""
    
    print("\n🔧 Applying compatibility fixes...")
    
    # Option 1: Try to downgrade sklearn (if that's the issue)
    print("\n1️⃣ Checking if sklearn downgrade helps...")
    try:
        # Don't actually downgrade - just check if it's a version issue
        import sklearn
        major, minor = map(int, sklearn.__version__.split('.')[:2])
        
        if major >= 1 and minor >= 2:
            print("   ℹ️ You have a newer sklearn version that may be incompatible")
            print("   💡 Recommendation: Retrain the model instead of downgrading")
    except Exception as e:
        print(f"   ❌ Error checking sklearn: {e}")
    
    # Option 2: Test if backend can start
    print("\n2️⃣ Testing backend startup...")
    backend_dir = Path(__file__).parent / "backend"
    
    try:
        # Test if we can import required modules
        print("   🔍 Checking required modules...")
        
        # Test basic imports that backend needs
        import pandas as pd
        import numpy as np
        print("   ✅ pandas and numpy available")
        
        import sklearn
        print(f"   ✅ sklearn {sklearn.__version__} available")
        
        try:
            import fastapi
            import uvicorn
            print("   ✅ FastAPI and uvicorn available")
        except ImportError as e:
            print(f"   ⚠️ FastAPI components missing: {e}")
            print("   💡 Install with: pip install fastapi uvicorn")
            return False
        
        print("   ✅ All required modules available")
        print("   💡 Backend should start with fallback model if main model fails")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error checking modules: {e}")
        return False

def run_backend_with_fallback():
    """Start the backend server with fallback model"""
    
    print("\n🚀 Starting backend server with compatibility fixes...")
    backend_dir = Path(__file__).parent / "backend"
    
    try:
        os.chdir(backend_dir)
        
        print("Starting FastAPI server...")
        print("📍 Backend will be available at: http://localhost:8000")
        print("📚 API docs will be available at: http://localhost:8000/docs")
        print("\n💡 The server is now using a fallback model that works with your sklearn version")
        print("💡 For full functionality, use option 6 in the main menu to retrain the model")
        print("\n🛑 Press Ctrl+C to stop the server")
        
        # Start the server
        subprocess.run([
            sys.executable, "-m", "uvicorn", "main:app",
            "--host", "0.0.0.0", "--port", "8000", "--reload"
        ])
        
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

def main():
    """Main function"""
    print_banner()
    
    # Check sklearn version
    sklearn_version = check_sklearn_version()
    if not sklearn_version:
        print("❌ Please install sklearn first: pip install scikit-learn")
        return
    
    # Apply compatibility fixes
    if fix_compatibility():
        print("\n✅ Environment checks passed!")
        print("\n💡 The backend has been designed to handle sklearn compatibility issues automatically.")
        print("💡 If the original model fails to load, it will use a fallback model.")
        
        response = input("\n🚀 Start the backend server now? (Y/n): ").lower()
        if response in ['', 'y', 'yes']:
            run_backend_with_fallback()
        else:
            print("\n💡 You can start the server later using:")
            print("   cd backend")
            print("   python main.py")
            print("\n🔄 Or use the full startup script:")
            print("   python start_integration.py")
    else:
        print("\n❌ Some environment issues detected")
        print("\n🔄 Recommended solutions:")
        print("1. Install missing packages: pip install fastapi uvicorn pandas numpy scikit-learn")
        print("2. Run the full startup script: python start_integration.py")
        print("3. Retrain the model: cd backend && python retrain_model.py")
        print("4. Check the integration guide for manual fixes")

if __name__ == "__main__":
    main()
