# Surplus2Serve Backend API

A scalable FastAPI backend for real-time food spoilage risk prediction with continuous learning capabilities.

## 🚀 Features

- **Real-time Predictions**: XGBoost-powered spoilage risk assessment
- **Continuous Learning**: Model retraining with new data uploads
- **Production Ready**: Containerized with Docker for cloud deployment
- **RESTful API**: OpenAPI/Swagger documentation
- **CORS Enabled**: Ready for React frontend integration
- **Background Tasks**: Asynchronous model retraining

## 📋 API Endpoints

### Core Endpoints

- `POST /predict` - Predict spoilage risk for produce
- `GET /health` - Health check and system status
- `POST /upload_data` - Upload training data and trigger retraining
- `GET /model_info` - Get current model information
- `GET /commodities` - List supported commodities by category
- `GET /docs` - Interactive API documentation (Swagger UI)

## 🛠️ Installation & Setup

### Local Development

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/macOS
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Ensure model file exists**
   - The model file `best_spoilage_model_with_xgboost.pkl` should be in `../Model/`
   - If not, run your training notebook to generate it

5. **Run the development server**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Access the API**
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Health check: http://localhost:8000/health

### Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t surplus2serve-api .
   ```

2. **Run container**
   ```bash
   docker run -p 8000:8000 surplus2serve-api
   ```

## ☁️ Cloud Deployment

### Deploy to Render

1. **Connect your GitHub repository**
2. **Create new Web Service**
3. **Configure deployment settings**:
   - **Environment**: Docker
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Port**: 8000

### Deploy to Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

### Deploy to Fly.io

1. **Install Fly CLI**
2. **Initialize and deploy**
   ```bash
   fly apps create surplus2serve-api
   fly deploy
   ```

## 📊 API Usage Examples

### Predict Spoilage Risk

```javascript
// Example React/Axios call
import axios from 'axios';

const predictSpoilageRisk = async (produceData) => {
  try {
    const response = await axios.post('http://localhost:8000/predict', {
      Commodity_name: "Tomato",
      Commodity_Category: "Vegetables",
      Temperature: 28.5,
      Humidity: 75.0,
      Storage_Type: "cold_storage",
      Days_Since_Harvest: 3,
      Transport_Duration: 8.0,
      Packaging_Quality: "good",
      Month_num: 7,
      Location: "Delhi",
      Ethylene_Level: 2.5
    });

    const prediction = response.data;
    console.log('Risk:', prediction.Risk_Interpretation);
    console.log('Score:', prediction.Spoilage_Risk_Score);
    console.log('Confidence:', prediction.Confidence);
    
    return prediction;
  } catch (error) {
    console.error('Prediction failed:', error.response?.data);
    throw error;
  }
};
```

### Upload Training Data

```javascript
const uploadTrainingData = async (csvFile) => {
  const formData = new FormData();
  formData.append('file', csvFile);

  try {
    const response = await axios.post(
      'http://localhost:8000/upload_data',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error.response?.data);
    throw error;
  }
};
```

### Python Client Example

```python
import requests
import pandas as pd

# Prediction example
prediction_data = {
    "Commodity_name": "Mango",
    "Temperature": 32.0,
    "Humidity": 80.0,
    "Storage_Type": "room_temperature",
    "Days_Since_Harvest": 5,
    "Transport_Duration": 12.0,
    "Packaging_Quality": "average",
    "Month_num": 6,
    "Location": "Mumbai"
}

response = requests.post(
    "http://localhost:8000/predict",
    json=prediction_data
)

if response.status_code == 200:
    result = response.json()
    print(f"Risk: {result['Risk_Interpretation']}")
    print(f"Score: {result['Spoilage_Risk_Score']:.3f}")
else:
    print(f"Error: {response.text}")
```

## 📁 Project Structure

```
backend/
├── main.py              # FastAPI application
├── models.py            # Pydantic request/response models
├── utils.py             # Utility functions and feature engineering
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker configuration
├── README.md           # This file
└── training_data.csv   # Generated training data (auto-created)
```

## 🔧 Configuration

### Environment Variables

- `MODEL_PATH`: Path to the trained model file
- `TRAINING_DATA_PATH`: Path to store training data
- `LOG_LEVEL`: Logging level (INFO, DEBUG, WARNING, ERROR)

### Model Input Schema

```json
{
  "Commodity_name": "string",
  "Commodity_Category": "string (optional)",
  "Temperature": "float (0-50°C)",
  "Humidity": "float (0-100%)",
  "Storage_Type": "string (cold_storage|room_temperature|open_air)",
  "Days_Since_Harvest": "integer (0-30)",
  "Transport_Duration": "float (0-72 hours)",
  "Packaging_Quality": "string (poor|average|good)",
  "Month_num": "integer (1-12)",
  "Location": "string",
  "Ethylene_Level": "float (optional, 0-100 ppm)"
}
```

### Model Output Schema

```json
{
  "Spoilage_Risk_Score": "float (0.0-1.0)",
  "Spoilage_Risk": "integer (0=Low, 1=Medium, 2=High)",
  "Risk_Interpretation": "string",
  "Confidence": "float (0.0-1.0)",
  "Probabilities": {
    "Low_Risk": "float",
    "Medium_Risk": "float", 
    "High_Risk": "float"
  },
  "Timestamp": "string (ISO format)",
  "Input_Summary": "object"
}
```

## 🧪 Testing

### Test Health Check
```bash
curl http://localhost:8000/health
```

### Test Prediction
```bash
curl -X POST "http://localhost:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{
       "Commodity_name": "Apple",
       "Temperature": 25,
       "Humidity": 70,
       "Storage_Type": "cold_storage",
       "Days_Since_Harvest": 2,
       "Transport_Duration": 6,
       "Packaging_Quality": "good",
       "Month_num": 10,
       "Location": "Kashmir"
     }'
```

## 📈 Model Retraining

The API supports continuous learning through the `/upload_data` endpoint:

1. **Upload CSV with new training data**
2. **Background retraining automatically triggered**
3. **Model updated with improved accuracy**
4. **Backup created before model replacement**

### CSV Format for Training Data

```csv
Temperature,Humidity,Storage_Type,Days_Since_Harvest,Transport_Duration,Packaging_Quality,Month_num,Commodity_name,Commodity_Category,Location,Ethylene_Level,Spoilage_Risk
25.0,70.0,cold_storage,2,6.0,good,10,Apple,Fruits,Kashmir,1.5,0
35.0,85.0,open_air,8,20.0,poor,7,Tomato,Vegetables,Delhi,3.2,2
```

## 🔍 Monitoring & Logging

- **Health endpoint**: Monitor system status
- **Logging**: Structured logging for debugging
- **Retraining logs**: Track model performance over time
- **Error handling**: Comprehensive error responses

## 🛡️ Security Considerations

- **Input validation**: Pydantic models ensure data integrity
- **CORS configuration**: Restrict origins in production
- **File upload limits**: 10MB maximum file size
- **Error handling**: No sensitive information in error responses

## 🚀 Performance Optimization

- **Model caching**: Model loaded once at startup
- **Feature engineering**: Optimized pandas operations
- **Background tasks**: Non-blocking model retraining
- **Docker**: Multi-stage builds for smaller images

## 📞 Support

For issues or questions:
1. Check the logs: `docker logs <container_id>`
2. Verify model file location and permissions
3. Ensure all dependencies are installed
4. Check API documentation at `/docs`

## 🔄 Development Workflow

1. **Make changes** to the code
2. **Test locally** with `uvicorn main:app --reload`
3. **Test with Docker** to ensure deployment compatibility
4. **Deploy** to your chosen cloud platform
5. **Monitor** using health checks and logs

---

**Ready to reduce food waste with AI-powered spoilage prediction!** 🌱✨
