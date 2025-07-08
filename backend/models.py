"""
Pydantic models for request/response validation in the Surplus2Serve API.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any

class PredictionRequest(BaseModel):
    """Request model for spoilage risk prediction."""
    
    Commodity_name: str = Field(
        ...,
        description="Name of the commodity (e.g., 'Tomato', 'Rice', 'Mango')",
        examples=["Tomato"]
    )
    Commodity_Category: Optional[str] = Field(
        default=None,
        description="Category of the commodity (auto-detected if not provided)",
        examples=["Vegetables"]
    )
    
    Temperature: float = Field(
        ...,
        ge=0,
        le=50,
        description="Temperature in Celsius (0-50°C)",
        examples=[25.5]
    )
    
    Humidity: float = Field(
        ...,
        ge=0,
        le=100,
        description="Relative humidity percentage (0-100%)",
        examples=[75.0]
    )
    
    Storage_Type: str = Field(
        ...,
        description="Type of storage",
        examples=["cold_storage"]
    )
    
    Days_Since_Harvest: int = Field(
        ...,
        ge=0,
        le=30,
        description="Days since harvest (0-30 days)",
        examples=[3]
    )
    
    Transport_Duration: Optional[float] = Field(
        default=8.0,
        ge=0,
        le=72,
        description="Transport duration in hours (0-72 hours)",
        examples=[8.5]
    )
    
    Packaging_Quality: Optional[str] = Field(
        default="good",
        description="Quality of packaging",
        examples=["good"]
    )
    
    Month_num: Optional[int] = Field(
        default=7,
        ge=1,
        le=12,
        description="Month number (1-12)",
        examples=[7]
    )
    
    Location: Optional[str] = Field(
        default="Delhi",
        description="Location/region",
        examples=["Delhi"]
    )
    
    Ethylene_Level: Optional[float] = Field(
        default=None,
        ge=0,
        le=100,
        description="Ethylene level (optional, 0-100 ppm)",
        examples=[2.5]
    )
    
    @field_validator('Storage_Type')
    @classmethod
    def validate_storage_type(cls, v):
        valid_storage_types = ['cold_storage', 'room_temperature', 'open_air']
        if v not in valid_storage_types:
            raise ValueError(f'Storage type must be one of: {valid_storage_types}')
        return v
    
    @field_validator('Packaging_Quality')
    @classmethod
    def validate_packaging_quality(cls, v):
        valid_packaging = ['poor', 'average', 'good']
        if v not in valid_packaging:
            raise ValueError(f'Packaging quality must be one of: {valid_packaging}')
        return v
class PredictionResponse(BaseModel):
    """Response model for spoilage risk prediction."""
    Spoilage_Risk_Score: float = Field(
        ...,
        description="Spoilage risk score (0.0 - 1.0, higher means more risk)",
        examples=[0.75]
    )
    
    Spoilage_Risk: int = Field(
        ...,
        description="Spoilage risk category (0=Low, 1=Medium, 2=High)",
        examples=[2]
    )
    
    Risk_Interpretation: str = Field(
        ...,
        description="Human-readable risk interpretation",
        examples=["High Risk"]
    )
    
    Confidence: float = Field(
        ...,
        description="Model confidence score (0.0 - 1.0)",
        examples=[0.89]
    )
    
    Probabilities: Dict[str, float] = Field(
        ...,
        description="Probability distribution across risk categories",
        examples=[{
            "Low_Risk": 0.1,
            "Medium_Risk": 0.2,
            "High_Risk": 0.7
        }]
    )
    
    Timestamp: str = Field(
        ...,
        description="Prediction timestamp in ISO format",
        examples=["2024-07-07T10:30:00"]
    )
    
    Input_Summary: Dict[str, Any] = Field(
        ...,
        description="Summary of input parameters",
        examples=[{
            "commodity": "Tomato",
            "category": "Vegetables",
            "temperature": 25.5,
            "humidity": 75.0,
            "storage": "cold_storage",
            "location": "Delhi"
        }]
    )
    
    Model_Version: Optional[str] = Field(
        default=None,
        description="Version of the model used for prediction",
        examples=["v1.0", "fallback_v1.0"]
    )
    
    Estimated_Shelf_Life: Optional[int] = Field(
        default=None,
        description="Estimated shelf life in days based on risk score",
        examples=[7]
    )
    

class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str = Field(..., description="API health status", examples=["healthy"])
    timestamp: str = Field(..., description="Health check timestamp", examples=["2024-07-07T10:30:00"])
    model_status: str = Field(..., description="Model loading status", examples=["loaded"])
    version: str = Field(..., description="API version", examples=["2.0.0"])
    database_status: Optional[str] = Field(None, description="Database connection status", examples=["connected"])

class UploadResponse(BaseModel):
    """Response model for data upload."""
    message: str = Field(..., description="Upload status message", examples=["Training data uploaded successfully"])
    rows_added: int = Field(..., description="Number of rows added", examples=[100])
    total_rows: int = Field(..., description="Total rows in training dataset", examples=[5000])
    retraining_started: bool = Field(..., description="Whether retraining was triggered", examples=[True])
    timestamp: str = Field(..., description="Upload timestamp", examples=["2024-07-07T10:30:00"])
    timestamp: str = Field(..., description="Upload timestamp", examples=["2024-07-07T10:30:00"])

class ErrorResponse(BaseModel):
    """Response model for errors."""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(default=None, description="Detailed error information")
    timestamp: str = Field(..., description="Error timestamp")
    timestamp: str = Field(..., description="Error timestamp")

# Configuration models for different environments
class APISettings(BaseModel):
    """API configuration settings."""
    
    model_path: str = Field(default="../Model/best_spoilage_model_with_xgboost.pkl")
    training_data_path: str = Field(default="training_data.csv")
    max_file_size: int = Field(default=10 * 1024 * 1024)  # 10MB
    allowed_file_types: list = Field(default=[".csv"])
    cors_origins: list = Field(default=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000"
    ])
    log_level: str = Field(default="INFO")
    
class ModelInfo(BaseModel):
    """Model information response."""
    
    model_type: str = Field(..., description="Type of ML model")
    model_loaded: bool = Field(..., description="Whether model is loaded")
    training_data_rows: int = Field(..., description="Number of training samples")
    last_updated: Optional[str] = Field(None, description="Last model update timestamp")
    features_count: Optional[int] = Field(None, description="Number of input features")
    accuracy: Optional[float] = Field(None, description="Model accuracy if available")
