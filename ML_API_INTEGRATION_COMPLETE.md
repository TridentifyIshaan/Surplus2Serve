# ML API Integration Guide

## ✅ COMPLETED UPDATES

### 1. Customer Dashboard (`script_new.js`)
- ✅ **Updated handlePrediction()** to call real ML API
- ✅ **Fixed storage type mapping** (ambient → room_temperature)
- ✅ **Added API fallback** if server is unavailable
- ✅ **Added generateRecommendationsFromAPI()** for better insights
- ✅ **Proper data formatting** for API requests
- ✅ **Debug logging** for troubleshooting

### 2. Supplier Dashboard (`script_new.js`) 
- ✅ **Updated handlePrediction()** to call real ML API
- ✅ **Fixed storage type mapping** (ambient → room_temperature)
- ✅ **Added supplier-specific recommendations**
- ✅ **Added business insights** and pricing suggestions
- ✅ **Enhanced error handling** with fallback
- ✅ **Debug logging** for troubleshooting

## � KEY FIXES APPLIED

### Storage Type Mapping Issue Fixed
**Problem**: Form values didn't match API expectations
- Form: `ambient`, `controlled_atmosphere`  
- API Expected: `room_temperature`, `cold_storage`, `open_air`

**Solution**: Added mapping in both dashboards:
```javascript
const storageTypeMapping = {
    'cold_storage': 'cold_storage',
    'ambient': 'room_temperature', 
    'controlled_atmosphere': 'cold_storage'
};
```

### Enhanced Error Handling
- ✅ **Detailed error logging** shows exact API errors
- ✅ **422 Unprocessable Entity** errors now debuggable
- ✅ **Graceful fallback** to local calculations
- ✅ **User-friendly error messages**

## �🚀 HOW TO TEST

### Step 1: Start Backend Server
```bash
cd backend
python main.py
```
Or double-click: `backend/start_ml_api.bat`

### Step 2: Test API Connection
```bash
cd backend
python test_api_connection.py
```

### Step 3: Open Dashboard
- Customer Dashboard: `Customer Dashboard/index_new.html`
- Supplier Dashboard: `Supplier Dashboard/index.html`

### Step 4: Test Prediction
1. Fill out spoilage prediction form
2. Click "Predict Spoilage Risk"
3. Check browser console (F12) for debug logs
4. Should now call real ML model at `http://localhost:8000/predict`

## 📊 API RESPONSE FORMAT

```json
{
  "Spoilage_Risk_Score": 0.75,
  "Risk_Interpretation": "High Risk",
  "Confidence": 0.89,
  "Probabilities": {
    "Low_Risk": 0.1,
    "Medium_Risk": 0.15,
    "High_Risk": 0.75
  },
  "Estimated_Shelf_Life": 3,
  "Model_Version": "XGBoost_v1.0",
  "Input_Summary": {
    "commodity": "Tomato",
    "temperature": 25.5,
    "humidity": 80.0
  }
}
```

## 🔄 FALLBACK BEHAVIOR

If API is unavailable:
- ⚠️ Shows warning: "API unavailable. Using fallback prediction..."
- 🔄 Falls back to local JavaScript calculation
- ✅ Still provides predictions (less accurate)

## 🎯 TESTING CHECKLIST

- [ ] Backend server starts without errors
- [ ] API test script returns SUCCESS
- [ ] Customer dashboard calls API successfully  
- [ ] Supplier dashboard calls API successfully
- [ ] Console shows "Sending prediction data" logs
- [ ] Console shows "Received prediction" logs
- [ ] Fallback works when server is down
- [ ] Predictions show ML model insights
- [ ] Recommendations are relevant and actionable

## 🚨 TROUBLESHOOTING

**422 Unprocessable Entity Error (FIXED):**
- ✅ Storage type mapping now correct
- ✅ All required fields properly formatted
- ✅ Debug logs show exact data being sent

**API Connection Issues:**
- Ensure backend server is running on port 8000
- Check browser console (F12) for detailed error logs
- Verify no firewall blocking localhost:8000
- Run `test_api_connection.py` to verify API

**Model Loading Issues:**
- Check if `best_spoilage_model_with_xgboost.pkl` exists
- Verify Python dependencies are installed
- Check backend terminal for model loading errors

## 🔍 DEBUG MODE

Both dashboards now include debug logging:
- Open browser console (F12 → Console tab)
- Look for "Sending prediction data:" logs
- Look for "Received prediction:" logs  
- Look for "API Error Details:" if issues occur
