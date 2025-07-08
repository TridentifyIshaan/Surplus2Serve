"""
Install Required Packages for Surplus2Serve
"""

import subprocess
import sys

def install_package(package):
    """Install a package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✓ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install {package}: {e}")
        return False

def main():
    """Install all required packages"""
    print("Installing required packages for Surplus2Serve...")
    
    # Basic packages that should work with pip
    basic_packages = [
        "fastapi",
        "uvicorn[standard]",
        "pandas",
        "numpy", 
        "scikit-learn",
        "joblib",
        "python-multipart"
    ]
    
    # MongoDB packages (optional)
    mongodb_packages = [
        "motor",
        "pymongo", 
        "bcrypt",
        "PyJWT",
        "email-validator"
    ]
    
    print("\n=== Installing Basic Packages ===")
    basic_success = 0
    for package in basic_packages:
        if install_package(package):
            basic_success += 1
    
    print(f"\nBasic packages: {basic_success}/{len(basic_packages)} installed successfully")
    
    print("\n=== Installing MongoDB Packages (optional) ===")
    mongodb_success = 0
    for package in mongodb_packages:
        if install_package(package):
            mongodb_success += 1
    
    print(f"MongoDB packages: {mongodb_success}/{len(mongodb_packages)} installed successfully")
    
    if basic_success == len(basic_packages):
        print("\n✅ All basic packages installed! You can now run the server.")
        print("Run: python start_server.py")
    else:
        print(f"\n⚠️  Some basic packages failed to install. Please install them manually.")
    
    if mongodb_success == len(mongodb_packages):
        print("✅ MongoDB packages also installed! You can use the full MongoDB features.")
    else:
        print("⚠️  Some MongoDB packages failed. The basic version will work without them.")

if __name__ == "__main__":
    main()
