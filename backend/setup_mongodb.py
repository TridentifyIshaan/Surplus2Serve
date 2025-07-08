"""
MongoDB Setup Script for Surplus2Serve Backend

This script sets up the MongoDB integration by:
1. Installing required packages
2. Setting up environment variables
3. Creating initial admin user
4. Testing the connection
"""

import os
import asyncio
import sys
import subprocess
import getpass
from datetime import datetime
import json

def install_packages():
    """Install required MongoDB packages."""
    print("Installing MongoDB packages...")
    
    packages = [
        "motor==3.3.2",
        "pymongo==4.6.0", 
        "bcrypt==4.1.2",
        "PyJWT==2.8.0",
        "python-multipart==0.0.6"
    ]
    
    for package in packages:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✓ Installed {package}")
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install {package}: {e}")
            return False
    
    return True

def setup_environment():
    """Setup environment variables."""
    print("\nSetting up environment variables...")
    
    # Get MongoDB connection string
    mongodb_url = input("Enter MongoDB connection string (default: mongodb://localhost:27017): ").strip()
    if not mongodb_url:
        mongodb_url = "mongodb://localhost:27017"
    
    # Get database name
    db_name = input("Enter database name (default: surplus2serve): ").strip()
    if not db_name:
        db_name = "surplus2serve"
    
    # Generate JWT secret
    jwt_secret = input("Enter JWT secret (leave blank to generate): ").strip()
    if not jwt_secret:
        import secrets
        jwt_secret = secrets.token_urlsafe(32)
        print(f"Generated JWT secret: {jwt_secret}")
    
    # Create .env file
    env_content = f"""# Surplus2Serve MongoDB Configuration
MONGODB_URL={mongodb_url}
DATABASE_NAME={db_name}
JWT_SECRET={jwt_secret}

# Optional settings
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=168
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✓ Created .env file with MongoDB configuration")
    return True

async def create_admin_user():
    """Create initial admin user."""
    print("\nCreating initial admin user...")
    
    try:
        # Import after packages are installed
        from database import connect_to_mongo, get_users_collection
        from db_models import UserType
        import bcrypt
        
        # Connect to MongoDB
        connected = await connect_to_mongo()
        if not connected:
            print("✗ Failed to connect to MongoDB")
            return False
        
        users_collection = get_users_collection()
        
        # Check if admin already exists
        existing_admin = await users_collection.find_one({"user_type": "admin"})
        if existing_admin:
            print("✓ Admin user already exists")
            return True
        
        # Get admin details
        print("\nEnter admin user details:")
        username = input("Username: ").strip()
        email = input("Email: ").strip()
        full_name = input("Full name: ").strip()
        password = getpass.getpass("Password: ")
        
        # Validate input
        if not all([username, email, full_name, password]):
            print("✗ All fields are required")
            return False
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create admin user
        admin_user = {
            "username": username,
            "email": email,
            "full_name": full_name,
            "user_type": "admin",
            "hashed_password": hashed_password,
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await users_collection.insert_one(admin_user)
        print(f"✓ Created admin user with ID: {result.inserted_id}")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to create admin user: {e}")
        return False

async def test_connection():
    """Test MongoDB connection and basic operations."""
    print("\nTesting MongoDB connection...")
    
    try:
        from database import connect_to_mongo, get_database
        
        # Test connection
        connected = await connect_to_mongo()
        if not connected:
            print("✗ MongoDB connection failed")
            return False
        
        # Test database operations
        db = get_database()
        
        # Test write operation
        test_collection = db.test
        test_doc = {"test": True, "timestamp": datetime.utcnow()}
        result = await test_collection.insert_one(test_doc)
        
        # Test read operation
        retrieved = await test_collection.find_one({"_id": result.inserted_id})
        
        # Clean up test document
        await test_collection.delete_one({"_id": result.inserted_id})
        
        if retrieved:
            print("✓ MongoDB connection and operations working correctly")
            return True
        else:
            print("✗ MongoDB read operation failed")
            return False
            
    except Exception as e:
        print(f"✗ MongoDB connection test failed: {e}")
        return False

async def main():
    """Main setup function."""
    print("=== Surplus2Serve MongoDB Setup ===\n")
    
    # Step 1: Install packages
    if not install_packages():
        print("\n✗ Package installation failed. Please install manually:")
        print("pip install motor pymongo bcrypt PyJWT python-multipart")
        return
    
    # Step 2: Setup environment
    if not setup_environment():
        print("\n✗ Environment setup failed")
        return
    
    # Step 3: Test connection
    if not await test_connection():
        print("\n✗ MongoDB connection test failed")
        print("Please check your MongoDB server and connection string")
        return
    
    # Step 4: Create admin user
    if not await create_admin_user():
        print("\n✗ Admin user creation failed")
        return
    
    print("\n=== Setup Complete! ===")
    print("\nNext steps:")
    print("1. Start your FastAPI server: uvicorn main:app --reload")
    print("2. Visit http://localhost:8000/docs for API documentation")
    print("3. Use the admin credentials to login and start using the platform")
    print("\nMongoDB integration is now ready!")

if __name__ == "__main__":
    asyncio.run(main())
