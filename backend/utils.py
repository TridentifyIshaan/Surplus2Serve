"""
Utility functions for the Surplus2Serve spoilage prediction API.
Includes model loading, feature engineering, data preprocessing, and retraining logic.
"""

import pandas as pd
import numpy as np
import joblib
import os
import logging
from typing import Dict, Any, List, Tuple
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

# Enhanced commodities dictionary from your notebook
enhanced_commodities = {
    'Staple Grains': ['Bajra', 'Rice', 'Wheat', 'Maize', 'Jowar', 'Ragi', 'Barley', 'Sorghum', 'Millet', 'Amaranth'],
    'Vegetables': ['Tomato', 'Potato', 'Onion', 'Spinach', 'Cauliflower', 'Cabbage', 'Brinjal', 'Bitter Gourd', 'Lady Finger', 'Bottle Gourd', 'Ridge Gourd', 'Pumpkin'],
    'Fruits': ['Mango', 'Banana', 'Papaya', 'Orange', 'Apple', 'Grapes', 'Guava', 'Lychee', 'Jackfruit', 'Custard Apple', 'Pomegranate', 'Watermelon'],
    'Spices': ['Garlic', 'Ginger', 'Turmeric', 'Cardamom', 'Cinnamon', 'Clove', 'Black Pepper', 'Cumin', 'Coriander', 'Fenugreek'],
    'Pulses': ['Chickpea', 'Red Lentil', 'Yellow Lentil', 'Green Gram', 'Black Gram', 'Pigeon Pea', 'Kidney Bean'],
    'Oilseeds': ['Mustard', 'Sesame', 'Groundnut', 'Sunflower', 'Soybean', 'Linseed', 'Safflower', 'Castor', 'Coconut', 'Palm'],
    'Cash Crops': ['Cotton', 'Sugarcane', 'Jute', 'Coffee', 'Tea', 'Tobacco', 'Rubber', 'Cocoa', 'Indigo', 'Opium'],
    'Nuts': ['Almond', 'Walnut', 'Cashew', 'Pistachio', 'Peanut', 'Hazelnut', 'Pine Nut', 'Chestnut', 'Pecan', 'Brazil Nut'],
    'Medicinal': ['Aloe Vera', 'Ashwagandha', 'Neem', 'Tulsi', 'Lemongrass', 'Mint', 'Stevia', 'Saffron', 'Moringa', 'Brahmi'],
    'Root Crops': ['Sweet Potato', 'Yam', 'Taro', 'Cassava', 'Beet', 'Radish', 'Turnip', 'Carrot', 'Ginger Root', 'Horseradish'],
    'Berries': ['Strawberry', 'Mulberry', 'Gooseberry', 'Jamun', 'Karonda', 'Cranberry', 'Blueberry', 'Blackberry', 'Raspberry', 'Falsa'],
    'Ornamentals': ['Rose', 'Marigold', 'Jasmine', 'Chrysanthemum', 'Orchid', 'Gladiolus', 'Lily', 'Dahlia', 'Aster', 'Balsam']
}

def create_fallback_model():
    """
    Create a simple fallback model when the trained model can't be loaded.
    This is a rule-based model that provides reasonable spoilage predictions.
    """
    logger.info("Creating fallback rule-based model...")
    
    class FallbackSpoilageModel:
        def __init__(self):
            self.version = "fallback_v1.0"
            self.feature_names = [
                'Temperature', 'Humidity', 'Days_Since_Harvest', 
                'Storage_Type', 'Commodity_Category'
            ]
            # Risk thresholds for different storage types
            self.storage_factors = {
                'cold_storage': 0.7,
                'room_temperature': 1.0,
                'open_air_storage': 1.5
            }
            # Perishability by category
            self.category_risk = {
                'Fruits': 0.8,
                'Vegetables': 0.7,
                'Berries': 0.9,
                'Ornamentals': 0.8,
                'Root Crops': 0.5,
                'Medicinal': 0.4,
                'Staple Grains': 0.2,
                'Pulses': 0.2,
                'Oilseeds': 0.2,
                'Nuts': 0.3,
                'Spices': 0.3,
                'Cash Crops': 0.4
            }
        
        def predict(self, X):
            """Predict spoilage risk using rule-based logic."""
            predictions = []
            
            for _, row in X.iterrows():
                risk_score = self._calculate_risk(row)
                
                # Convert to discrete classes (0: Low, 1: Medium, 2: High)
                if risk_score < 0.3:
                    prediction = 0  # Low risk
                elif risk_score < 0.7:
                    prediction = 1  # Medium risk
                else:
                    prediction = 2  # High risk
                
                predictions.append(prediction)
            
            return np.array(predictions)
        
        def predict_proba(self, X):
            """Predict probability for each class."""
            probabilities = []
            
            for _, row in X.iterrows():
                risk_score = self._calculate_risk(row)
                
                # Convert continuous risk to probabilities
                if risk_score < 0.3:
                    # Low risk
                    probs = [1.0 - risk_score, risk_score * 0.7, risk_score * 0.3]
                elif risk_score < 0.7:
                    # Medium risk
                    probs = [0.3 - risk_score * 0.3, 1.0 - abs(0.5 - risk_score), risk_score - 0.3]
                else:
                    # High risk
                    probs = [0.1, 1.0 - risk_score, risk_score]
                
                # Normalize probabilities
                total = sum(probs)
                probs = [p / total for p in probs]
                probabilities.append(probs)
            
            return np.array(probabilities)
        
        def _calculate_risk(self, row):
            """Calculate spoilage risk based on rules."""
            # Base risk from temperature (optimal around 4-10°C for most foods)
            temp = row.get('Temperature', 25)
            if temp < 0:
                temp_risk = 0.3  # Frozen
            elif temp <= 10:
                temp_risk = 0.2  # Good refrigeration
            elif temp <= 25:
                temp_risk = 0.5  # Room temperature
            else:
                temp_risk = 0.8 + min((temp - 25) * 0.02, 0.2)  # High temperature
            
            # Humidity risk (optimal around 60-70% for most foods)
            humidity = row.get('Humidity', 75)
            if humidity < 40:
                humidity_risk = 0.4  # Too dry
            elif humidity <= 80:
                humidity_risk = 0.2  # Good humidity
            else:
                humidity_risk = 0.3 + min((humidity - 80) * 0.01, 0.3)  # Too humid
            
            # Days since harvest
            days = row.get('Days_Since_Harvest', 3)
            days_risk = min(days * 0.05, 0.8)  # Increases with age
            
            # Storage type factor
            storage_type = str(row.get('Storage_Type', 'room_temperature')).lower()
            storage_factor = self.storage_factors.get(storage_type, 1.0)
            
            # Commodity category risk
            category = row.get('Commodity_Category', 'Vegetables')
            category_risk = self.category_risk.get(category, 0.5)
            
            # Combine all factors
            base_risk = (temp_risk * 0.3 + humidity_risk * 0.2 + days_risk * 0.3 + category_risk * 0.2)
            final_risk = min(base_risk * storage_factor, 1.0)
            
            return final_risk
    
    return FallbackSpoilageModel()

def load_model(model_path: str):
    """Load the trained spoilage prediction model with fallback options."""
    try:
        if not os.path.exists(model_path):
            logger.warning(f"Model file not found: {model_path}")
            return create_fallback_model()
        
        # Try to load the existing model
        try:
            model = joblib.load(model_path)
            logger.info(f"Model loaded successfully from {model_path}")
            return model
        except (AttributeError, ImportError, ValueError) as e:
            logger.warning(f"Failed to load existing model due to version incompatibility: {str(e)}")
            logger.info("Creating fallback model instead...")
            return create_fallback_model()
            
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        logger.info("Attempting to create fallback model...")
        return create_fallback_model()

def get_commodity_category(commodity: str) -> str:
    """Get the category for a given commodity name."""
    for category, commodities in enhanced_commodities.items():
        if commodity in commodities:
            return category
    return "Unknown"

def get_season(month: int) -> str:
    """Convert month number to season."""
    if month in [12, 1, 2]:
        return 'Winter'
    elif month in [3, 4, 5]:
        return 'Spring'
    elif month in [6, 7, 8, 9]:
        return 'Monsoon'
    else:
        return 'Post_Monsoon'

def get_perishability_score(category: str) -> int:
    """Assign perishability scores to commodity categories."""
    perishability_map = {
        'Staple Grains': 1, 'Pulses': 1, 'Oilseeds': 1, 'Nuts': 1,
        'Spices': 2, 'Medicinal': 2, 'Cash Crops': 2,
        'Root Crops': 3, 'Vegetables': 4, 'Fruits': 4,
        'Berries': 5, 'Ornamentals': 5
    }
    return perishability_map.get(category, 3)

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply feature engineering to the input data.
    Based on your notebook's feature engineering logic.
    """
    df_engineered = df.copy()
    
    # 1. Temperature-based features
    df_engineered['Temp_Squared'] = df_engineered['Temperature'] ** 2
    df_engineered['Temp_Category'] = pd.cut(df_engineered['Temperature'],
                                          bins=[0, 20, 25, 30, 35, 50],
                                          labels=['Very_Cool', 'Cool', 'Moderate', 'Warm', 'Hot'])
    df_engineered['Temp_Extreme'] = ((df_engineered['Temperature'] < 15) |
                                    (df_engineered['Temperature'] > 35)).astype(int)

    # 2. Humidity-based features
    df_engineered['Humidity_Category'] = pd.cut(df_engineered['Humidity'],
                                               bins=[0, 60, 75, 85, 100],
                                               labels=['Low', 'Moderate', 'High', 'Very_High'])
    df_engineered['Humidity_Extreme'] = ((df_engineered['Humidity'] < 55) |
                                        (df_engineered['Humidity'] > 90)).astype(int)

    # 3. Heat Index (combination of temperature and humidity)
    T = df_engineered['Temperature']
    H = df_engineered['Humidity']
    df_engineered['Heat_Index'] = (T + H) / 2 + (T * H) / 100

    # 4. Vapor Pressure Deficit (VPD) - important for plant physiology
    saturation_vp = 0.611 * np.exp((17.27 * T) / (T + 237.3))  # kPa
    actual_vp = saturation_vp * (H / 100)
    df_engineered['VPD'] = saturation_vp - actual_vp

    # 5. Storage and transport interaction features
    storage_scores = {'cold_storage': 3, 'room_temperature': 2, 'open_air': 1}
    packaging_scores = {'good': 3, 'average': 2, 'poor': 1}
    
    df_engineered['Storage_Quality_Score'] = (
        df_engineered['Storage_Type'].map(storage_scores).fillna(1) * 
        df_engineered['Packaging_Quality'].map(packaging_scores).fillna(1)
    )

    # 6. Time-based features
    df_engineered['Harvest_Freshness'] = np.where(df_engineered['Days_Since_Harvest'] <= 3, 'Fresh',
                                                  np.where(df_engineered['Days_Since_Harvest'] <= 7, 'Moderate',
                                                          'Old'))

    df_engineered['Transport_Category'] = pd.cut(df_engineered['Transport_Duration'],
                                                bins=[0, 6, 12, 20, 72],
                                                labels=['Short', 'Medium', 'Long', 'Very_Long'])

    # 7. Total exposure time (combining harvest time and transport)
    df_engineered['Total_Exposure_Time'] = (df_engineered['Days_Since_Harvest'] * 24) + df_engineered['Transport_Duration']

    # 8. Seasonal features
    df_engineered['Season'] = df_engineered['Month_num'].apply(get_season)
    df_engineered['Is_Monsoon'] = df_engineered['Month_num'].isin([6, 7, 8, 9]).astype(int)
    df_engineered['Is_Winter'] = df_engineered['Month_num'].isin([11, 12, 1, 2]).astype(int)
    df_engineered['Is_Summer'] = df_engineered['Month_num'].isin([3, 4, 5]).astype(int)

    # 9. Commodity-specific features
    df_engineered['Commodity_Perishability'] = df_engineered['Commodity_Category'].map(get_perishability_score)
    df_engineered['Is_Highly_Perishable'] = (df_engineered['Commodity_Perishability'] >= 4).astype(int)

    # 10. Risk interaction features
    df_engineered['Temp_Humidity_Risk'] = ((df_engineered['Temperature'] > 30) &
                                          (df_engineered['Humidity'] > 75)).astype(int)

    df_engineered['Poor_Conditions'] = ((df_engineered['Storage_Type'] == 'open_air') &
                                       (df_engineered['Packaging_Quality'] == 'poor')).astype(int)

    df_engineered['High_Exposure_Risk'] = ((df_engineered['Days_Since_Harvest'] > 7) &
                                          (df_engineered['Transport_Duration'] > 15)).astype(int)

    # 11. Environmental stress indicators
    df_engineered['Environmental_Stress'] = (
        (df_engineered['Temp_Extreme'] * 2) +
        (df_engineered['Humidity_Extreme'] * 1) +
        (df_engineered['Is_Monsoon'] * 1)
    )

    # 12. Quality degradation rate
    base_degradation = df_engineered['Commodity_Perishability'] / 5
    temp_factor = np.where(df_engineered['Temperature'] > 30,
                          1 + (df_engineered['Temperature'] - 30) * 0.1,
                          1)
    humidity_factor = np.where(df_engineered['Humidity'] > 75,
                              1 + (df_engineered['Humidity'] - 75) * 0.01,
                              1)
    storage_factor = df_engineered['Storage_Type'].map({'cold_storage': 0.5, 'room_temperature': 1.0, 'open_air': 1.5})

    df_engineered['Degradation_Rate'] = base_degradation * temp_factor * humidity_factor * storage_factor

    # 13. Polynomial features
    df_engineered['Temp_Humidity_Interaction'] = df_engineered['Temperature'] * df_engineered['Humidity']
    df_engineered['Days_Transport_Interaction'] = df_engineered['Days_Since_Harvest'] * df_engineered['Transport_Duration']

    return df_engineered

def preprocess_input(input_df: pd.DataFrame, model=None) -> pd.DataFrame:
    """
    Preprocess input data for prediction.
    Apply feature engineering and ensure compatibility with the model.
    """
    try:
        # Check if it's a fallback model
        is_fallback = (model is not None and 
                      hasattr(model, 'version') and 
                      'fallback' in str(model.version))
        
        if is_fallback:
            # For fallback model, we only need basic features
            processed_df = input_df.copy()
            
            # Ensure required columns exist with defaults
            if 'Commodity_Category' not in processed_df.columns:
                processed_df['Commodity_Category'] = processed_df['Commodity_name'].apply(get_commodity_category)
            
            return processed_df[['Temperature', 'Humidity', 'Days_Since_Harvest', 
                               'Storage_Type', 'Commodity_Category']].copy()
        
        else:
            # For trained model, apply full feature engineering
            engineered_df = engineer_features(input_df)
            
            # Remove columns that are not needed for prediction
            # Keep only the features that were used during training
            feature_columns = [
                'Temperature', 'Humidity', 'Days_Since_Harvest', 'Transport_Duration', 'Month_num',
                'Storage_Type', 'Packaging_Quality', 'Commodity_name', 'Commodity_Category',
                'Temp_Squared', 'Heat_Index', 'VPD', 'Storage_Quality_Score', 'Total_Exposure_Time',
                'Commodity_Perishability', 'Degradation_Rate', 'Environmental_Stress',
                'Temp_Humidity_Interaction', 'Days_Transport_Interaction',
                'Temp_Extreme', 'Humidity_Extreme', 'Is_Monsoon', 'Is_Winter', 'Is_Summer',
                'Is_Highly_Perishable', 'Temp_Humidity_Risk', 'Poor_Conditions', 'High_Exposure_Risk',
                'Temp_Category', 'Humidity_Category', 'Harvest_Freshness', 'Transport_Category', 'Season'
            ]
            
            # Select only available columns
            available_columns = [col for col in feature_columns if col in engineered_df.columns]
            processed_df = engineered_df[available_columns]
            
            return processed_df
        
    except Exception as e:
        logger.error(f"Error in preprocessing: {str(e)}")
        raise

def validate_csv_data(data: pd.DataFrame) -> Dict[str, Any]:
    """Validate uploaded CSV data structure."""
    required_columns = [
        'Temperature', 'Humidity', 'Storage_Type', 'Days_Since_Harvest',
        'Transport_Duration', 'Packaging_Quality', 'Month_num', 'Commodity_name',
        'Spoilage_Risk'
    ]
    
    missing_columns = [col for col in required_columns if col not in data.columns]
    
    if missing_columns:
        return {
            "is_valid": False,
            "error": f"Missing required columns: {missing_columns}"
        }
    
    # Check data types and ranges
    try:
        # Temperature should be numeric and reasonable
        if not pd.api.types.is_numeric_dtype(data['Temperature']):
            return {"is_valid": False, "error": "Temperature must be numeric"}
        
        # Humidity should be between 0-100
        if not all(0 <= h <= 100 for h in data['Humidity']):
            return {"is_valid": False, "error": "Humidity must be between 0-100"}
        
        # Spoilage_Risk should be 0, 1, or 2
        if not all(risk in [0, 1, 2] for risk in data['Spoilage_Risk']):
            return {"is_valid": False, "error": "Spoilage_Risk must be 0, 1, or 2"}
        
        return {"is_valid": True, "error": None}
        
    except Exception as e:
        return {"is_valid": False, "error": f"Data validation error: {str(e)}"}

def save_training_data(new_data: pd.DataFrame, training_data_path: str) -> int:
    """Save new training data to the training dataset."""
    try:
        # Load existing data if it exists
        if os.path.exists(training_data_path):
            existing_data = pd.read_csv(training_data_path)
            combined_data = pd.concat([existing_data, new_data], ignore_index=True)
        else:
            combined_data = new_data
        
        # Remove duplicates
        initial_len = len(combined_data)
        combined_data = combined_data.drop_duplicates()
        final_len = len(combined_data)
        
        # Save combined data
        combined_data.to_csv(training_data_path, index=False)
        
        rows_added = len(new_data) - (initial_len - final_len)
        logger.info(f"Added {rows_added} new rows to training data")
        
        return rows_added
        
    except Exception as e:
        logger.error(f"Error saving training data: {str(e)}")
        raise

def retrain_model_background(training_data_path: str, model_path: str):
    """
    Retrain the model in the background using new data.
    This function will run asynchronously when new data is uploaded.
    """
    try:
        logger.info("Starting background model retraining...")
        
        # Load training data
        data = pd.read_csv(training_data_path)
        
        if len(data) < 100:  # Need minimum data for training
            logger.warning(f"Insufficient data for retraining: {len(data)} rows")
            return
        
        # Prepare features and target
        X = data.drop(['Spoilage_Risk'], axis=1, errors='ignore')
        y = data['Spoilage_Risk']
        
        # Apply feature engineering
        X_engineered = engineer_features(X)
        
        # Define feature columns for preprocessing
        categorical_features = [
            'Storage_Type', 'Packaging_Quality', 'Commodity_name', 'Commodity_Category',
            'Temp_Category', 'Humidity_Category', 'Harvest_Freshness', 'Transport_Category', 'Season'
        ]
        
        numerical_features = [
            'Temperature', 'Humidity', 'Days_Since_Harvest', 'Transport_Duration', 'Month_num',
            'Temp_Squared', 'Heat_Index', 'VPD', 'Storage_Quality_Score', 'Total_Exposure_Time',
            'Commodity_Perishability', 'Degradation_Rate', 'Environmental_Stress',
            'Temp_Humidity_Interaction', 'Days_Transport_Interaction',
            'Temp_Extreme', 'Humidity_Extreme', 'Is_Monsoon', 'Is_Winter', 'Is_Summer',
            'Is_Highly_Perishable', 'Temp_Humidity_Risk', 'Poor_Conditions', 'High_Exposure_Risk'
        ]
        
        # Filter features that exist in the data
        categorical_features = [col for col in categorical_features if col in X_engineered.columns]
        numerical_features = [col for col in numerical_features if col in X_engineered.columns]
        
        # Create preprocessing pipeline
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), numerical_features),
                ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
            ]
        )
        
        # Create and train new model
        model_pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('classifier', RandomForestClassifier(
                n_estimators=150,
                max_depth=15,
                min_samples_split=5,
                random_state=42,
                n_jobs=-1
            ))
        ])
        
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X_engineered, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train the model
        model_pipeline.fit(X_train, y_train)
        
        # Evaluate the model
        y_pred = model_pipeline.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        logger.info(f"Model retrained with accuracy: {accuracy:.4f}")
        
        # Save the new model
        backup_path = f"{model_path}.backup"
        if os.path.exists(model_path):
            # Create backup of old model
            os.rename(model_path, backup_path)
        
        joblib.dump(model_pipeline, model_path)
        logger.info(f"New model saved to {model_path}")
        
        # Log retraining results
        with open("retraining_log.txt", "a") as f:
            f.write(f"{datetime.now().isoformat()}: Retrained with {len(data)} samples, "
                   f"accuracy: {accuracy:.4f}\n")
        
    except Exception as e:
        logger.error(f"Error during model retraining: {str(e)}")
        # Restore backup if it exists
        backup_path = f"{model_path}.backup"
        if os.path.exists(backup_path):
            os.rename(backup_path, model_path)
            logger.info("Restored backup model due to retraining failure")
