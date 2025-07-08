# Frontend-Backend Integration Guide for Surplus2Serve

## 🚀 Overview

This integration package connects your existing HTML/JavaScript frontend with the FastAPI backend to provide real-time spoilage risk predictions. The integration enhances both the Supplier and Customer dashboards with AI-powered features.

## 📁 Integration Files Structure

```
frontend-integration/
├── api-client.js                 # Core API communication client
├── spoilage-prediction.js        # Supplier dashboard enhancements
├── customer-dashboard-enhancer.js # Customer dashboard enhancements
├── admin-dashboard.js            # Admin panel for model management
└── integration-guide.md          # This file
```

## 🔧 Setup Instructions

### 1. Backend Setup

First, ensure your FastAPI backend is running:

```bash
# Navigate to backend directory
cd "c:\Users\Srujal\Desktop\Surplus2Serve\backend"

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python main.py
```

The backend will be available at `http://localhost:8000`

### 2. Frontend Integration

Your HTML files have been updated to include the integration scripts:

- **Supplier Dashboard**: Enhanced with real-time spoilage prediction
- **Customer Dashboard**: Enhanced with spoilage risk filtering and analysis
- **Admin Dashboard**: Available on any page via the red gear button (🔧)

### 3. API Configuration

The API client defaults to `http://localhost:8000`. To change this:

```javascript
// In any of your scripts, before using the API:
window.spoilageAPI = new SpoilageAPI('http://your-backend-url:port');
```

## 🌟 New Features

### Supplier Dashboard Enhancements

1. **Real-time Spoilage Prediction**
   - Automatically appears in the supply form
   - Analyzes spoilage risk based on form inputs
   - Provides recommendations for storage and handling

2. **Risk Analysis Display**
   - Visual risk indicators (Low/Medium/High)
   - Confidence scores and shelf life estimates
   - Actionable recommendations

3. **Form Validation**
   - Ensures all required fields are filled before prediction
   - Real-time field validation

### Customer Dashboard Enhancements

1. **Spoilage Risk Filtering**
   - Filter items by spoilage risk level
   - Minimum shelf life filtering
   - Advanced search with risk considerations

2. **Batch Analysis**
   - Analyze multiple items simultaneously
   - Sort by spoilage risk (best items first)
   - Detailed item cards with all relevant information

3. **Visual Risk Indicators**
   - Color-coded risk badges
   - Detailed item information
   - Supplier and storage details

### Admin Dashboard Features

1. **Model Management**
   - Current model status and information
   - Training data upload
   - Model retraining capabilities

2. **Testing Interface**
   - Test predictions with custom inputs
   - Validate model performance
   - Debug prediction issues

3. **Data Upload**
   - CSV training data upload
   - Drag-and-drop file interface
   - Real-time upload progress

## 📊 API Endpoints Used

The frontend integration uses these backend endpoints:

- `GET /health` - Check backend status
- `POST /predict` - Get spoilage predictions
- `GET /commodities` - List available commodities
- `GET /model_info` - Get model information
- `POST /upload_data` - Upload training data (admin)

## 🎯 Usage Examples

### Making a Prediction

```javascript
// Example prediction request
const predictionData = {
    Commodity_name: "Tomato",
    Temperature: 25.5,
    Humidity: 75.0,
    Storage_Type: "cold_storage",
    Days_Since_Harvest: 3
};

const result = await window.spoilageAPI.predictSpoilage(predictionData);
console.log('Spoilage Risk:', result.spoilage_risk);
```

### Checking Backend Status

```javascript
// Check if backend is connected
const status = await window.spoilageAPI.validateConnection();
if (status.connected) {
    console.log('Backend is ready:', status.modelStatus);
} else {
    console.error('Backend error:', status.error);
}
```

## 🔍 Testing the Integration

### 1. Test Supplier Dashboard

1. Navigate to `Supplier Dashboard/index.html`
2. Click "Add New Surplus Product"
3. Fill in the form fields:
   - Select a commodity type and crop
   - Enter temperature, humidity, storage type
   - Enter days since harvest
4. Click "Analyze Spoilage Risk"
5. Review the prediction results and recommendations

### 2. Test Customer Dashboard

1. Navigate to `Customer Dashboard/index.html`
2. Click "🔬 Analyze Available Items"
3. Wait for the analysis to complete
4. Use filters to search by spoilage risk
5. Review item cards with risk information

### 3. Test Admin Dashboard

1. On any page, click the red gear button (🔧) in the bottom-right
2. Review model status information
3. Test a prediction using the test form
4. (Optional) Upload training data CSV

## 🛠️ Customization Options

### Styling

Each integration file includes CSS that can be customized:

```javascript
// Modify colors, fonts, layouts in the addStyles() functions
// Example: Change risk colors
.risk-low { background: #your-color; }
.risk-medium { background: #your-color; }
.risk-high { background: #your-color; }
```

### API Configuration

```javascript
// Change API base URL
window.spoilageAPI = new SpoilageAPI('http://production-url.com');

// Add custom headers
window.spoilageAPI.defaultHeaders['Authorization'] = 'Bearer your-token';
```

### Prediction Thresholds

```javascript
// Modify risk level thresholds in getRiskLevel() functions
// Current: Low (<30%), Medium (30-70%), High (>70%)
```

## 🚨 Troubleshooting

### Backend Not Connected

**Symptoms**: Warning messages about API unavailability
**Solutions**:
1. Ensure backend is running on `http://localhost:8000`
2. Check CORS settings in `backend/main.py`
3. Verify firewall/antivirus not blocking connections

### Prediction Errors

**Symptoms**: "Prediction Failed" messages
**Solutions**:
1. Check input data format and ranges
2. Verify model is loaded in backend
3. Check backend logs for detailed errors

### File Upload Issues

**Symptoms**: CSV upload fails
**Solutions**:
1. Ensure CSV has required columns
2. Check file size limits
3. Verify file format (must be valid CSV)

### Performance Issues

**Solutions**:
1. Reduce batch analysis size
2. Implement pagination for large datasets
3. Add loading states for better UX

## 📈 Deployment Considerations

### Production Deployment

1. **Update API URLs**:
   ```javascript
   // Change from localhost to production URL
   window.spoilageAPI = new SpoilageAPI('https://your-api-domain.com');
   ```

2. **CORS Configuration**:
   ```python
   # In backend/main.py, update allowed origins
   allow_origins=[
       "https://your-frontend-domain.com",
       # Remove "*" and localhost URLs
   ]
   ```

3. **Security**:
   - Add authentication to admin endpoints
   - Implement rate limiting
   - Validate file uploads thoroughly

### Scalability

1. **API Caching**: Cache commodity lists and model info
2. **Batch Processing**: Implement pagination for large datasets
3. **Error Handling**: Add retry logic for failed predictions

## 🤝 Support

For issues or questions:

1. Check browser console for error messages
2. Verify backend logs for API errors
3. Test individual components in isolation
4. Review network requests in browser DevTools

## 🔄 Future Enhancements

Potential improvements:
1. Real-time notifications for high-risk items
2. Historical trend analysis
3. Mobile-responsive design
4. Offline mode capabilities
5. Advanced analytics dashboard
6. Integration with inventory management systems

---

## Quick Start Checklist

- [ ] Backend running on localhost:8000
- [ ] Model loaded successfully
- [ ] Supplier dashboard shows prediction interface
- [ ] Customer dashboard shows enhanced search
- [ ] Admin dashboard accessible via gear button
- [ ] Test prediction works end-to-end
- [ ] All required files included in frontend-integration folder

Happy coding! 🚀
