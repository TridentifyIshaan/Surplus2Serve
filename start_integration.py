#!/usr/bin/env python3
"""
Surplus2Serve Quick Start Script
Starts the backend server and provides integration testing capabilities
"""

import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path

def print_banner():
    print("""
╔══════════════════════════════════════════════════════════════╗
║                    🌾 SURPLUS2SERVE 🌾                      ║
║             Spoilage Prediction Platform                     ║
║                                                              ║
║     FastAPI Backend + Frontend Integration                   ║
╚══════════════════════════════════════════════════════════════╝
    """)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required!")
        print(f"Current version: {sys.version}")
        return False
    
    print(f"✅ Python {sys.version.split()[0]} detected")
    return True

def check_backend_files():
    """Check if required backend files exist"""
    backend_dir = Path(__file__).parent / "backend"
    required_files = ["main.py", "models.py", "utils.py", "requirements.txt"]
    
    missing_files = []
    for file in required_files:
        if not (backend_dir / file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing backend files: {', '.join(missing_files)}")
        return False
    
    print("✅ All backend files found")
    return True

def check_model_file():
    """Check if model file exists"""
    model_path = Path(__file__).parent / "Model" / "best_spoilage_model_with_xgboost.pkl"
    
    if not model_path.exists():
        print("⚠️ Model file not found at expected location")
        print(f"Expected: {model_path}")
        print("You may need to train the model first")
        return False
    
    print("✅ Model file found")
    return True

def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing Python dependencies...")
    backend_dir = Path(__file__).parent / "backend"
    
    try:
        # Try requirements.txt first
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", 
            str(backend_dir / "requirements.txt")
        ], check=True, capture_output=True, text=True)
        
        print("✅ Dependencies installed successfully")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install from requirements.txt: {e}")
        print("Trying minimal requirements...")
        
        try:
            # Try minimal requirements as fallback
            result = subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", 
                str(backend_dir / "requirements-minimal.txt")
            ], check=True, capture_output=True, text=True)
            
            print("✅ Minimal dependencies installed successfully")
            return True
            
        except subprocess.CalledProcessError as e2:
            print(f"❌ Failed to install dependencies: {e2}")
            print("Please install manually:")
            print("pip install fastapi uvicorn pandas numpy scikit-learn")
            return False

def start_backend():
    """Start the FastAPI backend server"""
    print("\n🚀 Starting FastAPI backend server...")
    backend_dir = Path(__file__).parent / "backend"
    
    try:
        # Change to backend directory
        os.chdir(backend_dir)
        
        # Start uvicorn server
        process = subprocess.Popen([
            sys.executable, "-m", "uvicorn", "main:app", 
            "--host", "0.0.0.0", "--port", "8000", "--reload"
        ])
        
        print("✅ Backend server started on http://localhost:8000")
        print("📚 API documentation: http://localhost:8000/docs")
        return process
        
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return None

def open_test_page():
    """Open the integration test page"""
    print("\n🔬 Opening integration test page...")
    
    # Wait a moment for server to start
    time.sleep(3)
    
    test_page = Path(__file__).parent / "frontend-integration" / "test-integration.html"
    
    if test_page.exists():
        webbrowser.open(f"file://{test_page.absolute()}")
        print("✅ Test page opened in browser")
    else:
        print("❌ Test page not found")

def open_dashboards():
    """Open the main dashboards"""
    print("\n📊 Opening dashboards...")
    
    supplier_dashboard = Path(__file__).parent / "Supplier Dashboard" / "index.html"
    customer_dashboard = Path(__file__).parent / "Customer Dashboard" / "index.html"
    
    if supplier_dashboard.exists():
        webbrowser.open(f"file://{supplier_dashboard.absolute()}")
        print("✅ Supplier dashboard opened")
    
    if customer_dashboard.exists():
        webbrowser.open(f"file://{customer_dashboard.absolute()}")
        print("✅ Customer dashboard opened")

def show_menu():
    """Show the main menu"""
    print("""
🎯 Choose an option:

1. 🧪 Run Integration Test
2. 📊 Open Supplier Dashboard  
3. 🛒 Open Customer Dashboard
4. 📚 Open API Documentation
5. 🔧 Open Admin Dashboard (via any page)
6. 🔄 Retrain Model (Fix compatibility issues)
7. ❌ Exit

""")

def retrain_model():
    """Retrain the model with current sklearn version"""
    print("\n🔄 Retraining model with current scikit-learn version...")
    backend_dir = Path(__file__).parent / "backend"
    
    try:
        # Change to backend directory
        os.chdir(backend_dir)
        
        # Run retraining script
        result = subprocess.run([
            sys.executable, "retrain_model.py"
        ], check=True, capture_output=True, text=True)
        
        print("✅ Model retraining completed successfully!")
        print("🚀 The new model is compatible with your current environment")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Model retraining failed: {e}")
        if e.stdout:
            print("Output:", e.stdout)
        if e.stderr:
            print("Error:", e.stderr)
        return False
    except Exception as e:
        print(f"❌ Unexpected error during retraining: {e}")
        return False

def main():
    """Main function"""
    print_banner()
    
    # Pre-flight checks
    if not check_python_version():
        return
    
    if not check_backend_files():
        return
    
    check_model_file()  # Warning only, not blocking
    
    # Install dependencies
    print("\n🔍 Checking dependencies...")
    if not install_dependencies():
        response = input("Continue anyway? (y/N): ").lower()
        if response != 'y':
            return
    
    # Start backend
    backend_process = start_backend()
    if not backend_process:
        return
    
    try:
        # Wait for server to start
        print("\n⏳ Waiting for server to start...")
        time.sleep(5)
        
        # Interactive menu
        while True:
            show_menu()
            choice = input("Enter your choice (1-7): ").strip()
            
            if choice == '1':
                open_test_page()
            elif choice == '2':
                supplier_dashboard = Path(__file__).parent / "Supplier Dashboard" / "index.html"
                if supplier_dashboard.exists():
                    webbrowser.open(f"file://{supplier_dashboard.absolute()}")
                    print("✅ Supplier dashboard opened")
            elif choice == '3':
                customer_dashboard = Path(__file__).parent / "Customer Dashboard" / "index.html"
                if customer_dashboard.exists():
                    webbrowser.open(f"file://{customer_dashboard.absolute()}")
                    print("✅ Customer dashboard opened")
            elif choice == '4':
                webbrowser.open("http://localhost:8000/docs")
                print("✅ API documentation opened")
            elif choice == '5':
                print("💡 Admin dashboard available via red gear button (🔧) on any page")
            elif choice == '6':
                print("\n🔄 Retraining model...")
                if retrain_model():
                    print("💡 Please restart the application to use the new model")
                    response = input("Restart now? (y/N): ").lower()
                    if response == 'y':
                        # Restart the backend
                        if backend_process:
                            backend_process.terminate()
                            time.sleep(2)
                        backend_process = start_backend()
                        if backend_process:
                            print("✅ Backend restarted with new model")
            elif choice == '7':
                break
            else:
                print("❌ Invalid choice. Please try again.")
            
            print("\n" + "="*60)
    
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down...")
    
    finally:
        # Clean up
        if backend_process:
            backend_process.terminate()
            print("✅ Backend server stopped")

if __name__ == "__main__":
    main()
