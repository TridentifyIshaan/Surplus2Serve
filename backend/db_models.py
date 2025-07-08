"""
Database Models for MongoDB Integration
Defines data structures for users, products, predictions, and analytics
"""

import re
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Try to import database components, handle gracefully if not available
try:
    from database import PyObjectId  # type: ignore
    from bson import ObjectId  # type: ignore
    MONGODB_AVAILABLE = True
except ImportError:
    # Create dummy PyObjectId when MongoDB not available
    class PyObjectId:  # type: ignore
        def __init__(self, value=None):
            self._value = str(value) if value else "000000000000000000000000"
            
        def __str__(self):
            return str(self._value)
    
    class ObjectId:  # type: ignore
        def __init__(self, value=None):
            self._value = str(value) if value else "000000000000000000000000"
            
        def __str__(self):
            return str(self._value)
            
        @staticmethod
        def is_valid(v):
            return False
    
    class ObjectId:  # type: ignore
        def __init__(self, value=None):
            self._value = str(value) if value else "000000000000000000000000"
            
        def __str__(self):
            return str(self._value)
            
        @staticmethod
        def is_valid(v):
            return False
    
    MONGODB_AVAILABLE = False
    
    MONGODB_AVAILABLE = False

# User Models
class UserType(str, Enum):
    SUPPLIER = "supplier"
    CUSTOMER = "customer"
    ADMIN = "admin"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    user_type: UserType
    phone: Optional[str] = Field(None, description="Phone number in international format")
    organization: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is not None and not re.match(r'^\+?[1-9]\d{1,14}$', v):
            raise ValueError('Invalid phone number format')
        return v

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, description="Phone number in international format")
    organization: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is not None and not re.match(r'^\+?[1-9]\d{1,14}$', v):
            raise ValueError('Invalid phone number format')
        return v

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    status: UserStatus = UserStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(UserBase):
    id: str
    status: UserStatus
    created_at: datetime
    last_login: Optional[datetime] = None

# Product Models
class ProductStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"
    EXPIRED = "expired"

class StorageType(str, Enum):
    COLD_STORAGE = "cold_storage"
    ROOM_TEMPERATURE = "room_temperature"
    OPEN_AIR_STORAGE = "open_air_storage"

class ProductBase(BaseModel):
    commodity_name: str = Field(..., min_length=1, max_length=50)
    commodity_category: str = Field(..., min_length=1, max_length=50)
    quantity: float = Field(..., gt=0)
    unit: str = Field(default="kg")
    
    # Storage conditions
    temperature: float = Field(..., ge=-20, le=50)
    humidity: float = Field(..., ge=0, le=100)
    storage_type: StorageType
    days_since_harvest: int = Field(..., ge=0, le=100)
    
    # Location and logistics
    location: str = Field(..., min_length=1, max_length=100)
    pickup_address: str = Field(..., min_length=1, max_length=200)
    
    # Additional details
    packaging_quality: str = Field(default="good")
    transport_duration: Optional[float] = Field(None, ge=0, le=72)
    available_from: datetime
    notes: Optional[str] = Field(None, max_length=500)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    quantity: Optional[float] = Field(None, gt=0)
    temperature: Optional[float] = Field(None, ge=-20, le=50)
    humidity: Optional[float] = Field(None, ge=0, le=100)
    storage_type: Optional[StorageType] = None
    status: Optional[ProductStatus] = None
    notes: Optional[str] = Field(None, max_length=500)

class ProductInDB(ProductBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    supplier_id: PyObjectId
    status: ProductStatus = ProductStatus.AVAILABLE
    
    # Spoilage prediction data
    spoilage_risk_score: Optional[float] = None
    spoilage_risk_category: Optional[int] = None
    estimated_shelf_life: Optional[int] = None
    last_prediction_date: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ProductResponse(ProductBase):
    id: str
    supplier_id: str
    status: ProductStatus
    spoilage_risk_score: Optional[float] = None
    spoilage_risk_category: Optional[int] = None
    estimated_shelf_life: Optional[int] = None
    created_at: datetime

# Prediction Models
class PredictionInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: Optional[PyObjectId] = None
    product_id: Optional[PyObjectId] = None
    
    # Input data
    input_data: Dict[str, Any]
    
    # Prediction results
    spoilage_risk_score: float
    spoilage_risk_category: int
    risk_interpretation: str
    confidence: float
    probabilities: Dict[str, float]
    estimated_shelf_life: Optional[int] = None
    model_version: str
    
    # Metadata
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Training Data Models
class TrainingDataInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    uploaded_by: PyObjectId
    filename: str
    
    # Data content
    data_records: List[Dict[str, Any]]
    total_records: int
    
    # Metadata
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow)
    file_size: int  # in bytes
    validation_status: str = "pending"  # pending, valid, invalid
    validation_errors: Optional[List[str]] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Analytics Models
class AnalyticsEntry(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    
    # Event data
    event_type: str  # prediction, product_submit, user_signup, etc.
    user_id: Optional[PyObjectId] = None
    
    # Event details
    details: Dict[str, Any]
    
    # Metadata
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Search and Filter Models
class ProductFilter(BaseModel):
    commodity_category: Optional[str] = None
    location: Optional[str] = None
    max_spoilage_risk: Optional[float] = None
    min_shelf_life: Optional[int] = None
    status: Optional[ProductStatus] = None
    available_from: Optional[datetime] = None
    available_to: Optional[datetime] = None

class ProductSearch(BaseModel):
    query: Optional[str] = None
    filters: Optional[ProductFilter] = None
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = "desc"  # asc or desc
    page: Optional[int] = Field(default=1, ge=1)
    limit: Optional[int] = Field(default=20, ge=1, le=100)

# API Response Models
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    limit: int
    total_pages: int

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
