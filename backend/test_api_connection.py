import requests
import json

# Test data that matches what the dashboards are now sending
test_data = {
    "Commodity_name": "tomato",
    "Temperature": 25.0,
    "Humidity": 80.0,
    "Days_Since_Harvest": 3,
    "Storage_Type": "cold_storage",
    "Transport_Duration": 8.0,
    "Packaging_Quality": "good",
    "Month_num": 8,
    "Location": "Delhi"
}

# Test the prediction endpoint
print("🧪 Testing ML API Prediction Endpoint...")
print("📤 Sending data:", json.dumps(test_data, indent=2))

try:
    response = requests.post(
        'http://localhost:8000/predict',
        headers={'Content-Type': 'application/json'},
        json=test_data,
        timeout=10
    )
    
    print(f"📊 Response Status: {response.status_code}")
    
    if response.ok:
        result = response.json()
        print("✅ SUCCESS! API Response:")
        print(json.dumps(result, indent=2))
        
        # Extract key metrics
        risk_score = result.get('Spoilage_Risk_Score', 0) * 100
        risk_level = result.get('Risk_Interpretation', 'Unknown')
        confidence = result.get('Confidence', 0) * 100
        shelf_life = result.get('Estimated_Shelf_Life', 'N/A')
        
        print(f"\n🎯 Key Results:")
        print(f"   Risk Score: {risk_score:.1f}%")
        print(f"   Risk Level: {risk_level}")
        print(f"   Confidence: {confidence:.1f}%")
        print(f"   Shelf Life: {shelf_life} days")
    else:
        print(f"❌ ERROR: {response.status_code}")
        print(f"📄 Error Details: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("❌ Connection Error: Is the API server running on http://localhost:8000?")
except requests.exceptions.Timeout:
    print("⏰ Timeout Error: API took too long to respond")
except Exception as e:
    print(f"💥 Unexpected Error: {e}")

print("\n" + "="*50)
print("💡 If you see SUCCESS above, the API is working!")
print("💡 If you see errors, check the server logs in the terminal.")
