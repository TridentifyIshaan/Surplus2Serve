"""
Simplified FastAPI backend for Surplus2Serve - Basic Version
This version works without MongoDB dependencies for initial testing
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import joblib
import os
import traceback
from datetime import datetime
import logging
from typing import Optional, List
import uvicorn

# Import only the basic models that don't require MongoDB
from models import PredictionRequest, PredictionResponse, HealthResponse, UploadResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Surplus2Serve Spoilage Prediction API",
    description="Real-time food spoilage risk prediction platform",
    version="2.0.0-basic",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "https://your-frontend-domain.com",
        "*"  # Allow all origins for development
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
    """Load the trained model on startup."""
    global model
    try:
        # Import utils here to avoid import issues at module level
        from utils import load_model, create_fallback_model
        
        model = load_model(model_path)
        
        # Check if it's a fallback model
        if hasattr(model, 'version') and 'fallback' in str(model.version):
            logger.warning("Using fallback model due to compatibility issues")
        else:
            logger.info("Trained model loaded successfully")
        
        # Initialize training data file if it doesn't exist
        if not os.path.exists(training_data_path):
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
        try:
            from utils import create_fallback_model
            model = create_fallback_model()
            logger.info("Started with fallback model")
        except Exception as fallback_error:
            logger.error(f"Even fallback model failed: {str(fallback_error)}")
            model = None

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    try:
        model_status = "loaded" if model is not None else "not_loaded"
        return HealthResponse(
            status="healthy",
            timestamp=datetime.now().isoformat(),
            model_status=model_status,
            version="2.0.0-basic",
            database_status="not_configured"
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Health check failed")

@app.post("/predict", response_model=PredictionResponse)
async def predict_spoilage_risk(request: PredictionRequest):
    """
    Predict spoilage risk for given produce and conditions.
    """
    try:
        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded")
        
        logger.info(f"Prediction request for {request.Commodity_name}")
        
        # Import utils functions here
        from utils import preprocess_input, get_commodity_category
        
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
        
        # Preprocess and predict
        processed_data = preprocess_input(input_data, model)
        prediction_proba = model.predict_proba(processed_data)[0]
        prediction_class = model.predict(processed_data)[0]
        
        # Calculate results
        risk_score = float(np.max(prediction_proba))
        risk_labels = {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"}
        risk_interpretation = risk_labels.get(prediction_class, "Unknown")
        confidence = float(np.max(prediction_proba))
        model_version = getattr(model, 'version', 'unknown')
        estimated_shelf_life = max(1, int(14 * (1 - risk_score)))
        
        logger.info(f"Prediction completed: {risk_interpretation} (score: {risk_score:.3f})")
        
        return PredictionResponse(
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
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/upload_data", response_model=UploadResponse)
async def upload_training_data(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="CSV file with new training data")
):
    """Upload new training data and trigger model retraining."""
    try:
        # Import utils functions here
        from utils import validate_csv_data, save_training_data, retrain_model_background
        from io import StringIO
        
        if not file.filename or not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
        contents = await file.read()
        
        try:
            new_data = pd.read_csv(StringIO(contents.decode('utf-8')))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")
        
        validation_result = validate_csv_data(new_data)
        if not validation_result["is_valid"]:
            raise HTTPException(status_code=400, detail=validation_result["error"])
        
        rows_added = save_training_data(new_data, training_data_path)
        
        background_tasks.add_task(
            retrain_model_background, 
            training_data_path, 
            model_path
        )
        
        logger.info(f"Training data uploaded: {rows_added} rows added")
        
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

@app.get("/model_info")
async def get_model_info():
    """Get information about the current model."""
    try:
        if model is None:
            return {"status": "Model not loaded"}
        
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
        "version": "2.0.0-basic",
        "description": "Basic version without MongoDB (for testing)",
        "status": "MongoDB integration available in main_mongodb.py",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "upload_data": "/upload_data",
            "model_info": "/model_info",
            "commodities": "/commodities",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
