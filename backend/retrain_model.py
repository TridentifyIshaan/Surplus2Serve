#!/usr/bin/env python3
"""
Retrain the spoilage prediction model with current scikit-learn version
This script will create a new model compatible with your current environment
"""

import pandas as pd
import numpy as np
import joblib
import os
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import warnings
warnings.filterwarnings('ignore')

def load_training_data():
    """Load or create training data for the model."""
    
    # Check if we have existing training data
    data_paths = [
        "../Model/large_enhanced_produce_spoilage_dataset.csv",
        "../Model/Datasets/datasets_20000.csv",
        "../Model/Datasets/enhanced_produce_spoilage_dataset.csv",
        "training_data.csv"
    ]
    
    for path in data_paths:
        if os.path.exists(path):
            print(f"Loading training data from: {path}")
            try:
                data = pd.read_csv(path)
                if len(data) > 100:  # Ensure we have enough data
                    return data
            except Exception as e:
                print(f"Failed to load {path}: {e}")
                continue
    
    # If no existing data, create synthetic training data
    print("No existing training data found. Creating synthetic dataset...")
    return create_synthetic_data()

def create_synthetic_data(n_samples=5000):
    """Create synthetic training data for demonstration."""
    
    np.random.seed(42)
    
    # Commodity categories and names
    commodities = {
        'Vegetables': ['Tomato', 'Potato', 'Onion', 'Spinach', 'Cauliflower', 'Cabbage'],
        'Fruits': ['Mango', 'Banana', 'Apple', 'Orange', 'Grapes', 'Papaya'],
        'Staple Grains': ['Rice', 'Wheat', 'Maize', 'Bajra'],
        'Pulses': ['Chickpea', 'Red Lentil', 'Green Gram', 'Black Gram']
    }
    
    storage_types = ['cold_storage', 'room_temperature', 'open_air_storage']
    packaging_quality = ['poor', 'average', 'good']
    
    data = []
    
    for _ in range(n_samples):
        # Random commodity selection
        category = np.random.choice(list(commodities.keys()))
        commodity = np.random.choice(commodities[category])
        
        # Generate features based on realistic ranges
        temperature = np.random.normal(25, 8)  # 10-40°C range mostly
        temperature = np.clip(temperature, 5, 45)
        
        humidity = np.random.normal(70, 15)  # 40-95% range mostly
        humidity = np.clip(humidity, 30, 95)
        
        storage_type = np.random.choice(storage_types)
        days_since_harvest = np.random.randint(1, 21)
        transport_duration = np.random.exponential(12)  # Most shipments are short
        transport_duration = np.clip(transport_duration, 1, 72)
        
        packaging = np.random.choice(packaging_quality)
        month_num = np.random.randint(1, 13)
        
        # Calculate spoilage risk based on realistic rules
        risk_score = calculate_synthetic_risk(
            temperature, humidity, storage_type, days_since_harvest,
            transport_duration, packaging, category
        )
        
        # Convert to discrete classes
        if risk_score < 0.3:
            spoilage_risk = 0  # Low
        elif risk_score < 0.7:
            spoilage_risk = 1  # Medium
        else:
            spoilage_risk = 2  # High
        
        data.append({
            'Temperature': temperature,
            'Humidity': humidity,
            'Storage_Type': storage_type,
            'Days_Since_Harvest': days_since_harvest,
            'Transport_Duration': transport_duration,
            'Packaging_Quality': packaging,
            'Month_num': month_num,
            'Commodity_name': commodity,
            'Commodity_Category': category,
            'Location': 'Synthetic',
            'Ethylene_Level': np.random.uniform(0, 10),
            'Spoilage_Risk': spoilage_risk
        })
    
    df = pd.DataFrame(data)
    
    # Save synthetic data for future use
    df.to_csv('synthetic_training_data.csv', index=False)
    print(f"Created synthetic dataset with {len(df)} samples")
    
    return df

def calculate_synthetic_risk(temp, humidity, storage, days, transport, packaging, category):
    """Calculate synthetic spoilage risk based on rules."""
    
    # Temperature risk
    if temp < 10:
        temp_risk = 0.2
    elif temp < 25:
        temp_risk = 0.4
    else:
        temp_risk = 0.2 + (temp - 25) * 0.03
    
    # Humidity risk  
    if humidity < 50:
        humidity_risk = 0.3
    elif humidity < 80:
        humidity_risk = 0.2
    else:
        humidity_risk = 0.3 + (humidity - 80) * 0.02
    
    # Storage type risk
    storage_risk = {'cold_storage': 0.1, 'room_temperature': 0.4, 'open_air_storage': 0.7}[storage]
    
    # Time-based risk
    time_risk = min(days * 0.05 + transport * 0.01, 0.8)
    
    # Packaging risk
    packaging_risk = {'good': 0.1, 'average': 0.3, 'poor': 0.6}[packaging]
    
    # Category risk
    category_risk = {
        'Fruits': 0.6, 'Vegetables': 0.5, 'Berries': 0.8,
        'Staple Grains': 0.2, 'Pulses': 0.2, 'Oilseeds': 0.2
    }.get(category, 0.4)
    
    # Combine risks
    total_risk = (temp_risk * 0.25 + humidity_risk * 0.15 + storage_risk * 0.2 + 
                  time_risk * 0.25 + packaging_risk * 0.1 + category_risk * 0.05)
    
    return min(total_risk, 1.0)

def engineer_features(df):
    """Simple feature engineering for the model."""
    df_engineered = df.copy()
    
    # Temperature-based features
    df_engineered['Temp_Squared'] = df_engineered['Temperature'] ** 2
    df_engineered['Temp_Extreme'] = ((df_engineered['Temperature'] < 15) | 
                                    (df_engineered['Temperature'] > 35)).astype(int)
    
    # Humidity-based features
    df_engineered['Humidity_Extreme'] = ((df_engineered['Humidity'] < 50) | 
                                        (df_engineered['Humidity'] > 85)).astype(int)
    
    # Time-based features
    df_engineered['Total_Time'] = df_engineered['Days_Since_Harvest'] + df_engineered['Transport_Duration'] / 24
    
    # Interaction features
    df_engineered['Temp_Humidity_Product'] = df_engineered['Temperature'] * df_engineered['Humidity']
    
    return df_engineered

def create_model():
    """Create and train a new spoilage prediction model."""
    
    print("Loading training data...")
    data = load_training_data()
    
    print(f"Data shape: {data.shape}")
    print(f"Spoilage risk distribution:\n{data['Spoilage_Risk'].value_counts()}")
    
    # Feature engineering
    print("Engineering features...")
    data_engineered = engineer_features(data)
    
    # Prepare features and target
    target_col = 'Spoilage_Risk'
    feature_cols = [col for col in data_engineered.columns if col != target_col]
    
    X = data_engineered[feature_cols]
    y = data_engineered[target_col]
    
    # Identify categorical and numerical columns
    categorical_columns = ['Storage_Type', 'Packaging_Quality', 'Commodity_name', 'Commodity_Category', 'Location']
    numerical_columns = [col for col in feature_cols if col not in categorical_columns]
    
    # Create preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_columns),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_columns)
        ]
    )
    
    # Create model pipeline
    model = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        ))
    ])
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("Training model...")
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nModel Performance:")
    print(f"Accuracy: {accuracy:.3f}")
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Low Risk', 'Medium Risk', 'High Risk']))
    
    return model

def save_model(model, filename="best_spoilage_model_with_xgboost.pkl"):
    """Save the trained model."""
    
    # Ensure Model directory exists
    model_dir = Path("../Model")
    model_dir.mkdir(exist_ok=True)
    
    model_path = model_dir / filename
    
    try:
        joblib.dump(model, model_path)
        print(f"Model saved successfully to: {model_path}")
        
        # Also save to backend directory for immediate use
        backend_path = Path("./") / filename
        joblib.dump(model, backend_path)
        print(f"Model also saved to: {backend_path}")
        
        return str(model_path)
        
    except Exception as e:
        print(f"Error saving model: {e}")
        return None

def main():
    """Main function to retrain the model."""
    
    print("=" * 60)
    print("Surplus2Serve Model Retraining")
    print("=" * 60)
    
    try:
        # Create and train model
        model = create_model()
        
        # Save model
        model_path = save_model(model)
        
        if model_path:
            print(f"\n✅ Model retraining completed successfully!")
            print(f"📁 Model saved to: {model_path}")
            print(f"\n🚀 You can now restart your FastAPI backend to use the new model.")
        else:
            print("❌ Failed to save model")
            
    except Exception as e:
        print(f"❌ Error during model retraining: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
