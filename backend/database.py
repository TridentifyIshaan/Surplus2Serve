"""
MongoDB Database Configuration and Connection Management
Handles all database operations for Surplus2Serve platform
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import logging

# Try to import MongoDB dependencies, fail gracefully if not available
try:
    from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase  # type: ignore
    from pymongo import IndexModel, ASCENDING, DESCENDING  # type: ignore
    from bson import ObjectId  # type: ignore
    MONGODB_AVAILABLE = True
except ImportError as e:
    logging.warning(f"MongoDB packages not available: {e}")
    MONGODB_AVAILABLE = False
    
    # Create dummy classes for when MongoDB is not available
    class AsyncIOMotorClient:  # type: ignore
        def __init__(self, *args, **kwargs):
            pass
        
        def __getitem__(self, key):
            return AsyncIOMotorDatabase()
        
        def close(self):
            pass
        
        @property
        def admin(self):
            class Admin:
                async def command(self, command):
                    pass
            return Admin()
    
    class AsyncIOMotorDatabase:  # type: ignore
        def __init__(self, *args, **kwargs):
            pass
        
        @property
        def users(self):
            return AsyncIOMotorCollection("users")
        
        @property
        def products(self):
            return AsyncIOMotorCollection("products")
        
        @property
        def predictions(self):
            return AsyncIOMotorCollection("predictions")
        
        @property
        def training_data(self):
            return AsyncIOMotorCollection("training_data")
        
        @property
        def analytics(self):
            return AsyncIOMotorCollection("analytics")
    
    class AsyncIOMotorCollection:  # type: ignore
        def __init__(self, name):
            self.name = name
        
        async def create_indexes(self, indexes):
            pass
    
    class IndexModel:  # type: ignore
        def __init__(self, *args, **kwargs):
            pass
    
    class ObjectId:  # type: ignore
        def __init__(self, *args, **kwargs):
            pass
        
        @staticmethod
        def is_valid(v):
            return False
    
    ASCENDING = 1
    DESCENDING = -1

logger = logging.getLogger(__name__)

class MongoDB:
    client: Optional[Any] = None
    database: Optional[Any] = None

# MongoDB connection settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "surplus2serve")

# Global database instance
mongodb = MongoDB()

async def connect_to_mongo():
    """Create database connection"""
    if not MONGODB_AVAILABLE:
        logger.warning("MongoDB packages not installed. Database features will be disabled.")
        return False
    
    try:
        mongodb.client = AsyncIOMotorClient(MONGODB_URL)
        mongodb.database = mongodb.client[DATABASE_NAME]
        
        # Test the connection
        await mongodb.client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {DATABASE_NAME}")
        
        # Create indexes
        await create_indexes()
        
        return True
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        return False

async def close_mongo_connection():
    """Close database connection"""
    if MONGODB_AVAILABLE and mongodb.client:
        mongodb.client.close()
        logger.info("Disconnected from MongoDB")

async def create_indexes():
    """Create database indexes for optimal performance"""
    if not MONGODB_AVAILABLE:
        logger.warning("MongoDB not available, skipping index creation")
        return
    
    try:
        db = mongodb.database
        if not db:
            logger.warning("Database not connected, skipping index creation")
            return
        
        # Users collection indexes
        await db.users.create_indexes([
            IndexModel([("email", ASCENDING)], unique=True),
            IndexModel([("username", ASCENDING)], unique=True),
            IndexModel([("user_type", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)])
        ])
        
        # Products collection indexes
        await db.products.create_indexes([
            IndexModel([("supplier_id", ASCENDING)]),
            IndexModel([("commodity_name", ASCENDING)]),
            IndexModel([("commodity_category", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("location", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
            IndexModel([("spoilage_risk_score", ASCENDING)])
        ])
        
        # Predictions collection indexes
        await db.predictions.create_indexes([
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("product_id", ASCENDING)]),
            IndexModel([("timestamp", DESCENDING)]),
            IndexModel([("spoilage_risk", ASCENDING)]),
            IndexModel([("model_version", ASCENDING)])
        ])
        
        # Training data collection indexes
        await db.training_data.create_indexes([
            IndexModel([("uploaded_by", ASCENDING)]),
            IndexModel([("upload_timestamp", DESCENDING)]),
            IndexModel([("commodity_category", ASCENDING)])
        ])
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")

def get_database():
    """Get database instance"""
    if not MONGODB_AVAILABLE:
        return None
    return mongodb.database

# Collection helpers
def get_users_collection():
    """Get users collection"""
    if not MONGODB_AVAILABLE or not mongodb.database:
        return None
    return mongodb.database.users

def get_products_collection():
    """Get products collection"""
    if not MONGODB_AVAILABLE or not mongodb.database:
        return None
    return mongodb.database.products

def get_predictions_collection():
    """Get predictions collection"""
    if not MONGODB_AVAILABLE or not mongodb.database:
        return None
    return mongodb.database.predictions

def get_training_data_collection():
    """Get training data collection"""
    if not MONGODB_AVAILABLE or not mongodb.database:
        return None
    return mongodb.database.training_data

def get_analytics_collection():
    """Get analytics collection"""
    if not MONGODB_AVAILABLE or not mongodb.database:
        return None
    return mongodb.database.analytics

# Utility functions
class PyObjectId:
    """Custom ObjectId class for Pydantic"""
    
    def __init__(self, value=None):
        if MONGODB_AVAILABLE and ObjectId:
            self._id = ObjectId(value) if value else ObjectId()
        else:
            self._id = str(value) if value else "000000000000000000000000"
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not MONGODB_AVAILABLE:
            # Return string representation when MongoDB not available
            return str(v) if v else "000000000000000000000000"
        
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")
    
    def __str__(self):
        return str(self._id)

def serialize_datetime(dt):
    """Serialize datetime to ISO string"""
    if isinstance(dt, datetime):
        return dt.isoformat()
    return dt

def deserialize_datetime(dt_str):
    """Deserialize ISO string to datetime"""
    if isinstance(dt_str, str):
        return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
    return dt_str
