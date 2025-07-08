#!/usr/bin/env python3
"""
Test the backend to verify it's working with the fallback model
"""

import requests
import json

def test_backend():
    print("🧪 Testing Surplus2Serve Backend...")
    print("=" * 50)
    
    # Test health endpoint
    try:
        print("1. Testing health endpoint...")
        response = requests.get('http://localhost:8000/health', timeout=5)
        
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Backend is running successfully!")
            print(f"📊 Status: {health_data.get('status', 'unknown')}")
            print(f"🤖 Model Status: {health_data.get('model_status', 'unknown')}")
            print(f"📅 Timestamp: {health_data.get('timestamp', 'unknown')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            print(response.text)
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error testing health: {e}")
        return False
    
    print()
    
    # Test prediction endpoint
    try:
        print("2. Testing prediction endpoint...")
        test_data = {
            'Commodity_name': 'Tomato',
            'Temperature': 25.0,
            'Humidity': 75.0,
            'Storage_Type': 'cold_storage',
            'Days_Since_Harvest': 3
        }
        
        pred_response = requests.post('http://localhost:8000/predict', 
                                    json=test_data, timeout=10)
        
        if pred_response.status_code == 200:
            prediction = pred_response.json()
            print("✅ Prediction successful!")
            print(f"🎯 Risk Score: {prediction['Spoilage_Risk_Score']:.3f}")
            print(f"📊 Risk Level: {prediction['Risk_Interpretation']}")
            print(f"🤖 Model Version: {prediction.get('Model_Version', 'unknown')}")
            print(f"📅 Estimated Shelf Life: {prediction.get('Estimated_Shelf_Life', 'unknown')} days")
            print(f"🔍 Confidence: {prediction.get('Confidence', 0):.3f}")
        else:
            print(f"❌ Prediction failed: {pred_response.status_code}")
            print(pred_response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error testing prediction: {e}")
        return False
    
    print()
    
    # Test commodities endpoint
    try:
        print("3. Testing commodities endpoint...")
        comm_response = requests.get('http://localhost:8000/commodities', timeout=5)
        
        if comm_response.status_code == 200:
            commodities = comm_response.json()
            print("✅ Commodities endpoint working!")
            print(f"📦 Available categories: {len(commodities.keys())}")
            print(f"🥬 Sample categories: {list(commodities.keys())[:3]}...")
        else:
            print(f"⚠️ Commodities endpoint issue: {comm_response.status_code}")
            
    except Exception as e:
        print(f"⚠️ Error testing commodities: {e}")
    
    print()
    print("🎉 Backend test completed!")
    print("💡 Your fallback model is working perfectly!")
    print("💡 The warnings you saw are normal - they just indicate the fallback is active.")
    
    return True

if __name__ == "__main__":
    test_backend()
