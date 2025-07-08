"""
FastAPI backend for Surplus2Serve food spoilage risk prediction platform.
Provides real-time spoilage risk predictions with continuous learning capabilities.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import pandas as pd
import numpy as np
import joblib
import os
import traceback
from datetime import datetime, timedelta
import logging
from typing import Optional, List, Dict, Any
import uvicorn
from bson import ObjectId
import bcrypt
import jwt
import json
from io import StringIO

from models import PredictionRequest, PredictionResponse, HealthResponse, UploadResponse
from db_models import (
    UserCreate, UserResponse, UserInDB, UserType,
    ProductCreate, ProductResponse, ProductInDB, ProductUpdate, ProductFilter, ProductSearch,
    PredictionInDB, TrainingDataInDB, AnalyticsEntry,
    APIResponse, PaginatedResponse
)
from database import (
    connect_to_mongo, close_mongo_connection,
    get_users_collection, get_products_collection, get_predictions_collection,
    get_training_data_collection, get_analytics_collection, PyObjectId
)
from utils import (
    load_model, 
    preprocess_input, 
    engineer_features,
    get_commodity_category,
    retrain_model_background,
    validate_csv_data,
    save_training_data
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Settings
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Security
security = HTTPBearer()

# Initialize FastAPI app
app = FastAPI(
    title="Surplus2Serve Spoilage Prediction API",
    description="Real-time food spoilage risk prediction platform with continuous learning",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "https://your-frontend-domain.com",  # Add your production frontend URL
        "*"  # Allow all origins for development (remove in production)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Global variables
model = None
model_path = "../Model/best_spoilage_model_with_xgboost.pkl"
training_data_path = "training_data.csv"

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    global model
    
    # Connect to MongoDB
    mongo_connected = await connect_to_mongo()
    if not mongo_connected:
        logger.warning("MongoDB connection failed - some features will be limited")
    
    # Load the trained model
    try:
        model = load_model(model_path)
        
        # Check if it's a fallback model
        if hasattr(model, 'version') and 'fallback' in str(model.version):
            logger.warning("Using fallback model due to compatibility issues")
            logger.info("To use the trained model, please retrain with current scikit-learn version")
        else:
            logger.info("Trained model loaded successfully")
        
        # Initialize training data file if it doesn't exist
        if not os.path.exists(training_data_path):
            # Create empty training data with proper columns
            initial_data = pd.DataFrame(columns=[
                'Temperature', 'Humidity', 'Storage_Type', 'Days_Since_Harvest',
                'Transport_Duration', 'Packaging_Quality', 'Month_num', 
                'Commodity_name', 'Commodity_Category', 'Location', 
                'Ethylene_Level', 'Spoilage_Risk'
            ])
            initial_data.to_csv(training_data_path, index=False)
            logger.info("Initialized training data file")
            
    except Exception as e:
        logger.error(f"Failed to initialize application: {str(e)}")
        # Don't raise an exception here - let the app start with fallback model
        try:
            from utils import create_fallback_model
            model = create_fallback_model()
            logger.info("Started with fallback model")
        except Exception as fallback_error:
            logger.error(f"Even fallback model failed: {str(fallback_error)}")
            model = None

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown."""
    await close_mongo_connection()

# Authentication Utilities
def create_access_token(data: dict):
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verify JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user."""
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        users_collection = get_users_collection()
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return UserInDB(**user)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    try:
        model_status = "loaded" if model is not None else "not_loaded"
        
        # Check MongoDB connection
        try:
            users_collection = get_users_collection()
            await users_collection.find_one({}, {"_id": 1})
            db_status = "connected"
        except:
            db_status = "disconnected"
        
        return HealthResponse(
            status="healthy",
            timestamp=datetime.now().isoformat(),
            model_status=model_status,
            version="2.0.0",
            database_status=db_status
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Health check failed")

# Authentication Endpoints
@app.post("/auth/register", response_model=APIResponse)
async def register_user(user_data: UserCreate):
    """Register a new user."""
    try:
        users_collection = get_users_collection()
        
        # Check if user already exists
        existing_user = await users_collection.find_one({
            "$or": [
                {"email": user_data.email},
                {"username": user_data.username}
            ]
        })
        
        if existing_user:
            if existing_user["email"] == user_data.email:
                raise HTTPException(status_code=400, detail="Email already registered")
            else:
                raise HTTPException(status_code=400, detail="Username already taken")
        
        # Create new user
        hashed_password = hash_password(user_data.password)
        user_dict = user_data.dict(exclude={"password"})
        user_dict["hashed_password"] = hashed_password
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        
        result = await users_collection.insert_one(user_dict)
        
        # Log registration analytics
        analytics_collection = get_analytics_collection()
        await analytics_collection.insert_one({
            "event_type": "user_registration",
            "user_id": result.inserted_id,
            "details": {
                "user_type": user_data.user_type,
                "organization": user_data.organization
            },
            "timestamp": datetime.utcnow()
        })
        
        return APIResponse(
            success=True,
            message="User registered successfully",
            data={"user_id": str(result.inserted_id)}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/auth/login", response_model=APIResponse)
async def login_user(email: str, password: str):
    """Login user and return access token."""
    try:
        users_collection = get_users_collection()
        
        # Find user by email
        user = await users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Update last login
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user["_id"])})
        
        # Log login analytics
        analytics_collection = get_analytics_collection()
        await analytics_collection.insert_one({
            "event_type": "user_login",
            "user_id": user["_id"],
            "details": {"user_type": user["user_type"]},
            "timestamp": datetime.utcnow()
        })
        
        return APIResponse(
            success=True,
            message="Login successful",
            data={
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": str(user["_id"]),
                    "username": user["username"],
                    "email": user["email"],
                    "user_type": user["user_type"]
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        user_type=current_user.user_type,
        phone=current_user.phone,
        organization=current_user.organization,
        location=current_user.location,
        status=current_user.status,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )

@app.post("/predict", response_model=PredictionResponse)
async def predict_spoilage_risk(
    request: PredictionRequest,
    current_user: Optional[UserInDB] = Depends(get_current_user),
    background_request: Request = None
):
    """
    Predict spoilage risk for given produce and conditions.
    
    Returns spoilage risk score (0-1) and category (0=Low, 1=Medium, 2=High).
    """
    try:
        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded")
        
        logger.info(f"Prediction request for {request.Commodity_name}")
        
        # Convert request to DataFrame
        input_data = pd.DataFrame([{
            'Temperature': request.Temperature,
            'Humidity': request.Humidity,
            'Storage_Type': request.Storage_Type,
            'Days_Since_Harvest': request.Days_Since_Harvest,
            'Transport_Duration': request.Transport_Duration or 8.0,
            'Packaging_Quality': request.Packaging_Quality or "good",
            'Month_num': request.Month_num or 7,
            'Commodity_name': request.Commodity_name,
            'Commodity_Category': request.Commodity_Category or get_commodity_category(request.Commodity_name),
            'Location': request.Location or "Delhi",
            'Ethylene_Level': request.Ethylene_Level or 0.0
        }])
        
        # Engineer features and preprocess
        processed_data = preprocess_input(input_data, model)
        
        # Make prediction
        prediction_proba = model.predict_proba(processed_data)[0]
        prediction_class = model.predict(processed_data)[0]
        
        # Calculate risk score (0-1 scale)
        risk_score = float(np.max(prediction_proba))
        
        # Risk interpretation
        risk_labels = {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"}
        risk_interpretation = risk_labels.get(prediction_class, "Unknown")
        
        # Confidence score
        confidence = float(np.max(prediction_proba))
        
        # Model version
        model_version = getattr(model, 'version', 'unknown')
        
        # Estimate shelf life based on risk score
        estimated_shelf_life = max(1, int(14 * (1 - risk_score)))  # 1-14 days based on risk
        
        logger.info(f"Prediction completed: {risk_interpretation} (score: {risk_score:.3f})")
        
        # Create response
        response = PredictionResponse(
            Spoilage_Risk_Score=risk_score,
            Spoilage_Risk=int(prediction_class),
            Risk_Interpretation=risk_interpretation,
            Confidence=confidence,
            Probabilities={
                "Low_Risk": float(prediction_proba[0]),
                "Medium_Risk": float(prediction_proba[1]),
                "High_Risk": float(prediction_proba[2])
            },
            Model_Version=model_version,
            Estimated_Shelf_Life=estimated_shelf_life,
            Timestamp=datetime.now().isoformat(),
            Input_Summary={
                "commodity": request.Commodity_name,
                "category": request.Commodity_Category or get_commodity_category(request.Commodity_name),
                "temperature": request.Temperature,
                "humidity": request.Humidity,
                "storage": request.Storage_Type,
                "location": request.Location
            }
        )
        
        # Log prediction to MongoDB (if available)
        try:
            predictions_collection = get_predictions_collection()
            prediction_record = {
                "user_id": current_user.id if current_user else None,
                "input_data": request.dict(),
                "spoilage_risk_score": risk_score,
                "spoilage_risk_category": int(prediction_class),
                "risk_interpretation": risk_interpretation,
                "confidence": confidence,
                "probabilities": response.Probabilities,
                "estimated_shelf_life": estimated_shelf_life,
                "model_version": model_version,
                "timestamp": datetime.utcnow(),
                "ip_address": getattr(background_request, 'client', {}).get('host') if background_request else None
            }
            await predictions_collection.insert_one(prediction_record)
            
            # Log analytics
            analytics_collection = get_analytics_collection()
            await analytics_collection.insert_one({
                "event_type": "prediction_made",
                "user_id": current_user.id if current_user else None,
                "details": {
                    "commodity_name": request.Commodity_name,
                    "commodity_category": request.Commodity_Category,
                    "risk_score": risk_score,
                    "risk_category": int(prediction_class)
                },
                "timestamp": datetime.utcnow()
            })
            
        except Exception as db_error:
            logger.warning(f"Failed to log prediction to database: {str(db_error)}")
        
        return response
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/upload_data", response_model=UploadResponse)
async def upload_training_data(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="CSV file with new training data"),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Upload new training data and trigger model retraining.
    
    Expected CSV columns: Temperature, Humidity, Storage_Type, Days_Since_Harvest,
    Transport_Duration, Packaging_Quality, Month_num, Commodity_name, 
    Commodity_Category, Location, Ethylene_Level, Spoilage_Risk
    """
    try:
        # Check user permissions (only admin and suppliers can upload)
        if current_user.user_type not in [UserType.ADMIN, UserType.SUPPLIER]:
            raise HTTPException(status_code=403, detail="Insufficient permissions to upload training data")
        
        # Validate file type
        if not file.filename or not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
        # Read uploaded CSV
        contents = await file.read()
        
        # Load and validate data
        try:
            new_data = pd.read_csv(StringIO(contents.decode('utf-8')))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")
        
        # Validate data structure
        validation_result = validate_csv_data(new_data)
        if not validation_result["is_valid"]:
            raise HTTPException(status_code=400, detail=validation_result["error"])
        
        # Save to traditional CSV file (for backward compatibility)
        rows_added = save_training_data(new_data, training_data_path)
        
        # Save to MongoDB
        try:
            training_data_collection = get_training_data_collection()
            
            # Convert DataFrame to list of dictionaries
            data_records = new_data.to_dict('records')
            
            training_record = {
                "uploaded_by": current_user.id,
                "filename": file.filename,
                "data_records": data_records,
                "total_records": len(data_records),
                "upload_timestamp": datetime.utcnow(),
                "file_size": len(contents),
                "validation_status": "valid",
                "validation_errors": None
            }
            
            await training_data_collection.insert_one(training_record)
            
            # Log analytics
            analytics_collection = get_analytics_collection()
            await analytics_collection.insert_one({
                "event_type": "training_data_uploaded",
                "user_id": current_user.id,
                "details": {
                    "filename": file.filename,
                    "rows_added": rows_added,
                    "file_size": len(contents)
                },
                "timestamp": datetime.utcnow()
            })
            
        except Exception as db_error:
            logger.warning(f"Failed to save training data to MongoDB: {str(db_error)}")
        
        # Trigger background retraining
        background_tasks.add_task(
            retrain_model_background, 
            training_data_path, 
            model_path
        )
        
        logger.info(f"Training data uploaded: {rows_added} rows added by user {current_user.username}")
        
        return UploadResponse(
            message="Training data uploaded successfully",
            rows_added=rows_added,
            total_rows=len(pd.read_csv(training_data_path)),
            retraining_started=True,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/model_info")
async def get_model_info():
    """Get information about the current model."""
    try:
        if model is None:
            return {"status": "Model not loaded"}
        
        # Get model information
        model_info = {
            "model_type": str(type(model)),
            "model_loaded": True,
            "training_data_rows": len(pd.read_csv(training_data_path)) if os.path.exists(training_data_path) else 0,
            "last_updated": datetime.fromtimestamp(
                os.path.getmtime(model_path)
            ).isoformat() if os.path.exists(model_path) else None
        }
        
        return model_info
        
    except Exception as e:
        logger.error(f"Model info error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

@app.get("/commodities")
async def get_commodities():
    """Get list of supported commodities by category."""
    try:
        from utils import enhanced_commodities
        return enhanced_commodities
    except Exception as e:
        logger.error(f"Commodities error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get commodities: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Surplus2Serve Spoilage Prediction API",
        "version": "2.0.0",
        "description": "MongoDB-integrated food spoilage prediction platform",
        "features": [
            "User authentication and management",
            "Product listing and management",
            "Real-time spoilage prediction",
            "Training data upload and model retraining",
            "Analytics and dashboard",
            "Multi-user support with role-based access"
        ],
        "endpoints": {
            "health": "/health",
            "authentication": {
                "register": "/auth/register",
                "login": "/auth/login",
                "profile": "/auth/me"
            },
            "products": {
                "create": "/products",
                "search": "/products",
                "get": "/products/{id}",
                "update": "/products/{id}",
                "my_products": "/my-products"
            },
            "prediction": "/predict",
            "training": "/upload_data",
            "analytics": {
                "dashboard": "/analytics/dashboard",
                "prediction_details": "/analytics/predictions/{id}"
            },
            "utilities": {
                "model_info": "/model_info",
                "commodities": "/commodities"
            },
            "documentation": {
                "swagger": "/docs",
                "redoc": "/redoc"
            }
        }
    }

# Product Management Endpoints
@app.post("/products", response_model=APIResponse)
async def create_product(
    product_data: ProductCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Create a new product listing."""
    try:
        # Only suppliers can create products
        if current_user.user_type != UserType.SUPPLIER:
            raise HTTPException(status_code=403, detail="Only suppliers can create products")
        
        products_collection = get_products_collection()
        
        # Create product document
        product_dict = product_data.dict()
        product_dict["supplier_id"] = current_user.id
        product_dict["created_at"] = datetime.utcnow()
        product_dict["updated_at"] = datetime.utcnow()
        
        # Add commodity category if not provided
        if not product_dict.get("commodity_category"):
            product_dict["commodity_category"] = get_commodity_category(product_dict["commodity_name"])
        
        result = await products_collection.insert_one(product_dict)
        
        # Generate initial spoilage prediction
        try:
            prediction_request = PredictionRequest(
                Commodity_name=product_data.commodity_name,
                Commodity_Category=product_dict["commodity_category"],
                Temperature=product_data.temperature,
                Humidity=product_data.humidity,
                Storage_Type=product_data.storage_type.value,
                Days_Since_Harvest=product_data.days_since_harvest,
                Transport_Duration=product_data.transport_duration,
                Packaging_Quality=product_data.packaging_quality,
                Location=product_data.location
            )
            
            # Make prediction (reuse existing prediction logic)
            prediction_response = await predict_spoilage_risk(prediction_request)
            
            # Update product with prediction results
            await products_collection.update_one(
                {"_id": result.inserted_id},
                {"$set": {
                    "spoilage_risk_score": prediction_response.Spoilage_Risk_Score,
                    "spoilage_risk_category": prediction_response.Spoilage_Risk,
                    "estimated_shelf_life": prediction_response.Estimated_Shelf_Life,
                    "last_prediction_date": datetime.utcnow()
                }}
            )
            
            # Log prediction to database
            predictions_collection = get_predictions_collection()
            await predictions_collection.insert_one({
                "user_id": current_user.id,
                "product_id": result.inserted_id,
                "input_data": prediction_request.dict(),
                "spoilage_risk_score": prediction_response.Spoilage_Risk_Score,
                "spoilage_risk_category": prediction_response.Spoilage_Risk,
                "risk_interpretation": prediction_response.Risk_Interpretation,
                "confidence": prediction_response.Confidence,
                "probabilities": prediction_response.Probabilities,
                "estimated_shelf_life": prediction_response.Estimated_Shelf_Life,
                "model_version": prediction_response.Model_Version,
                "timestamp": datetime.utcnow()
            })
            
        except Exception as pred_error:
            logger.warning(f"Failed to generate initial prediction: {str(pred_error)}")
        
        # Log analytics
        analytics_collection = get_analytics_collection()
        await analytics_collection.insert_one({
            "event_type": "product_created",
            "user_id": current_user.id,
            "details": {
                "product_id": str(result.inserted_id),
                "commodity_name": product_data.commodity_name,
                "commodity_category": product_dict["commodity_category"],
                "location": product_data.location
            },
            "timestamp": datetime.utcnow()
        })
        
        return APIResponse(
            success=True,
            message="Product created successfully",
            data={"product_id": str(result.inserted_id)}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Product creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create product")

@app.get("/products", response_model=PaginatedResponse)
async def search_products(
    commodity_category: Optional[str] = None,
    location: Optional[str] = None,
    max_spoilage_risk: Optional[float] = None,
    min_shelf_life: Optional[int] = None,
    page: int = 1,
    limit: int = 20
):
    """Search products with filters."""
    try:
        products_collection = get_products_collection()
        
        # Build filter query
        filter_query = {"status": "available"}
        
        if commodity_category:
            filter_query["commodity_category"] = {"$regex": commodity_category, "$options": "i"}
        
        if location:
            filter_query["location"] = {"$regex": location, "$options": "i"}
        
        if max_spoilage_risk is not None:
            filter_query["spoilage_risk_score"] = {"$lte": max_spoilage_risk}
        
        if min_shelf_life is not None:
            filter_query["estimated_shelf_life"] = {"$gte": min_shelf_life}
        
        # Count total results
        total = await products_collection.count_documents(filter_query)
        
        # Get paginated results
        skip = (page - 1) * limit
        cursor = products_collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        products = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for product in products:
            product["id"] = str(product.pop("_id"))
            product["supplier_id"] = str(product["supplier_id"])
        
        total_pages = (total + limit - 1) // limit
        
        return PaginatedResponse(
            items=products,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"Product search error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search products")

@app.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    """Get product by ID."""
    try:
        products_collection = get_products_collection()
        
        product = await products_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Convert ObjectId to string
        product["id"] = str(product.pop("_id"))
        product["supplier_id"] = str(product["supplier_id"])
        
        return ProductResponse(**product)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get product error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get product")

@app.put("/products/{product_id}", response_model=APIResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update product information."""
    try:
        products_collection = get_products_collection()
        
        # Check if product exists and user owns it
        product = await products_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        if product["supplier_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this product")
        
        # Update product
        update_data = {k: v for k, v in product_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
        
        # If conditions changed, regenerate prediction
        condition_fields = {"temperature", "humidity", "storage_type"}
        if any(field in update_data for field in condition_fields):
            # Regenerate prediction logic here
            pass
        
        return APIResponse(
            success=True,
            message="Product updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Product update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update product")

@app.get("/my-products", response_model=PaginatedResponse)
async def get_my_products(
    page: int = 1,
    limit: int = 20,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get current user's products."""
    try:
        products_collection = get_products_collection()
        
        # Get user's products
        filter_query = {"supplier_id": current_user.id}
        
        total = await products_collection.count_documents(filter_query)
        skip = (page - 1) * limit
        cursor = products_collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        products = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for product in products:
            product["id"] = str(product.pop("_id"))
            product["supplier_id"] = str(product["supplier_id"])
        
        total_pages = (total + limit - 1) // limit
        
        return PaginatedResponse(
            items=products,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"Get my products error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get products")

# Analytics and Dashboard Endpoints
@app.get("/analytics/dashboard")
async def get_dashboard_analytics(
    days: int = 30,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get dashboard analytics for the specified time period."""
    try:
        # Check permissions
        if current_user.user_type not in [UserType.ADMIN, UserType.SUPPLIER]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        analytics_collection = get_analytics_collection()
        predictions_collection = get_predictions_collection()
        products_collection = get_products_collection()
        
        # Date range
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Base query filter
        date_filter = {"timestamp": {"$gte": start_date}}
        if current_user.user_type == UserType.SUPPLIER:
            user_filter = {"user_id": current_user.id}
        else:
            user_filter = {}
        
        # Get prediction statistics
        prediction_stats = await predictions_collection.aggregate([
            {"$match": {**date_filter, **user_filter}},
            {"$group": {
                "_id": None,
                "total_predictions": {"$sum": 1},
                "avg_risk_score": {"$avg": "$spoilage_risk_score"},
                "high_risk_count": {"$sum": {"$cond": [{"$eq": ["$spoilage_risk_category", 2]}, 1, 0]}},
                "medium_risk_count": {"$sum": {"$cond": [{"$eq": ["$spoilage_risk_category", 1]}, 1, 0]}},
                "low_risk_count": {"$sum": {"$cond": [{"$eq": ["$spoilage_risk_category", 0]}, 1, 0]}}
            }}
        ]).to_list(length=1)
        
        # Get product statistics
        product_filter = {"created_at": {"$gte": start_date}}
        if current_user.user_type == UserType.SUPPLIER:
            product_filter["supplier_id"] = current_user.id
        
        product_stats = await products_collection.aggregate([
            {"$match": product_filter},
            {"$group": {
                "_id": None,
                "total_products": {"$sum": 1},
                "avg_spoilage_risk": {"$avg": "$spoilage_risk_score"},
                "available_products": {"$sum": {"$cond": [{"$eq": ["$status", "available"]}, 1, 0]}},
                "expired_products": {"$sum": {"$cond": [{"$eq": ["$status", "expired"]}, 1, 0]}}
            }}
        ]).to_list(length=1)
        
        # Get commodity distribution
        commodity_distribution = await products_collection.aggregate([
            {"$match": product_filter},
            {"$group": {
                "_id": "$commodity_category",
                "count": {"$sum": 1},
                "avg_risk": {"$avg": "$spoilage_risk_score"}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]).to_list(length=10)
        
        # Get daily prediction trends
        daily_trends = await predictions_collection.aggregate([
            {"$match": {**date_filter, **user_filter}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "predictions": {"$sum": 1},
                "avg_risk": {"$avg": "$spoilage_risk_score"}
            }},
            {"$sort": {"_id": 1}}
        ]).to_list(length=days)
        
        return {
            "summary": {
                "total_predictions": prediction_stats[0]["total_predictions"] if prediction_stats else 0,
                "avg_risk_score": round(prediction_stats[0]["avg_risk_score"], 3) if prediction_stats else 0,
                "risk_distribution": {
                    "high": prediction_stats[0]["high_risk_count"] if prediction_stats else 0,
                    "medium": prediction_stats[0]["medium_risk_count"] if prediction_stats else 0,
                    "low": prediction_stats[0]["low_risk_count"] if prediction_stats else 0
                },
                "total_products": product_stats[0]["total_products"] if product_stats else 0,
                "available_products": product_stats[0]["available_products"] if product_stats else 0,
                "expired_products": product_stats[0]["expired_products"] if product_stats else 0
            },
            "commodity_distribution": commodity_distribution,
            "daily_trends": daily_trends,
            "period_days": days
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard analytics")

@app.get("/analytics/predictions/{prediction_id}")
async def get_prediction_details(
    prediction_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get detailed information about a specific prediction."""
    try:
        predictions_collection = get_predictions_collection()
        
        prediction = await predictions_collection.find_one({"_id": ObjectId(prediction_id)})
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")
        
        # Check permissions
        if (current_user.user_type == UserType.SUPPLIER and 
            prediction.get("user_id") != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to view this prediction")
        
        # Convert ObjectId to string
        prediction["id"] = str(prediction.pop("_id"))
        if prediction.get("user_id"):
            prediction["user_id"] = str(prediction["user_id"])
        if prediction.get("product_id"):
            prediction["product_id"] = str(prediction["product_id"])
        
        return prediction
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get prediction details error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get prediction details")

@app.get("/users/{user_id}/profile")
async def get_user_profile(
    user_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get user profile information."""
    try:
        # Users can only view their own profile unless they're admin
        if current_user.user_type != UserType.ADMIN and str(current_user.id) != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this profile")
        
        users_collection = get_users_collection()
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove sensitive information
        user.pop("hashed_password", None)
        user["id"] = str(user.pop("_id"))
        
        # Get user statistics if it's a supplier
        if user["user_type"] == UserType.SUPPLIER:
            products_collection = get_products_collection()
            predictions_collection = get_predictions_collection()
            
            product_count = await products_collection.count_documents({"supplier_id": ObjectId(user_id)})
            prediction_count = await predictions_collection.count_documents({"user_id": ObjectId(user_id)})
            
            user["statistics"] = {
                "total_products": product_count,
                "total_predictions": prediction_count
            }
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user profile error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user profile")
