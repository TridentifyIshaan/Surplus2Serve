# MongoDB Integration for Surplus2Serve

## Overview

This integration adds MongoDB support to the Surplus2Serve platform, transforming it from a file-based system to a scalable, production-ready database solution.

## What's New

### 🔐 Authentication System
- User registration and login
- JWT-based authentication
- Role-based access control (Supplier, Customer, Admin)
- Secure password hashing

### 📊 Database Persistence
- MongoDB collections for users, products, predictions, and analytics
- Automatic data indexing for performance
- Structured data models with validation

### 🛡️ Enhanced Security
- Bearer token authentication
- Password encryption with bcrypt
- Input validation and sanitization
- CORS configuration

### 📈 Analytics & Insights
- Dashboard with prediction statistics
- User activity tracking
- Product performance metrics
- Risk distribution analysis

## Quick Start

### 1. Install Dependencies
```powershell
cd backend
pip install -r requirements-mongodb.txt
```

### 2. Setup MongoDB Integration
```powershell
# Option A: Automated setup (recommended)
python setup_mongodb.py

# Option B: Manual setup
.\setup_mongodb_integration.ps1
```

### 3. Start the Server
```powershell
uvicorn main:app --reload
```

### 4. Test the Integration
```powershell
python test_mongodb_integration.py
```

### 5. Access the API
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Interactive Testing**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile

### Products
- `POST /products` - Create product (authenticated)
- `GET /products` - Search products with filters
- `GET /products/{id}` - Get specific product
- `PUT /products/{id}` - Update product
- `GET /my-products` - Get user's products

### Predictions
- `POST /predict` - Generate spoilage prediction
- `GET /analytics/predictions/{id}` - Get prediction details

### Analytics
- `GET /analytics/dashboard` - Dashboard statistics
- `GET /users/{id}/profile` - User profile

### Utilities
- `GET /health` - System health check
- `POST /upload_data` - Upload training data
- `GET /commodities` - Supported commodities

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  full_name: String,
  user_type: "supplier" | "customer" | "admin",
  hashed_password: String,
  organization: String,
  location: String,
  status: "active" | "inactive" | "suspended",
  created_at: Date,
  updated_at: Date,
  last_login: Date
}
```

### Products Collection
```javascript
{
  _id: ObjectId,
  supplier_id: ObjectId,
  commodity_name: String,
  commodity_category: String,
  quantity: Number,
  unit: String,
  temperature: Number,
  humidity: Number,
  storage_type: String,
  days_since_harvest: Number,
  location: String,
  pickup_address: String,
  spoilage_risk_score: Number,
  spoilage_risk_category: Number,
  estimated_shelf_life: Number,
  status: "available" | "reserved" | "sold" | "expired",
  created_at: Date,
  updated_at: Date
}
```

### Predictions Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  product_id: ObjectId,
  input_data: Object,
  spoilage_risk_score: Number,
  spoilage_risk_category: Number,
  risk_interpretation: String,
  confidence: Number,
  probabilities: Object,
  estimated_shelf_life: Number,
  model_version: String,
  timestamp: Date
}
```

## Frontend Integration

### Updated Supplier Dashboard Flow
1. **User Registration/Login**
   - New users register with organization details
   - Returning users login with email/password
   - JWT token stored for authenticated requests

2. **Product Management**
   - Create products with automatic spoilage prediction
   - View all user's products with risk scores
   - Update product information and conditions

3. **Analytics Dashboard**
   - View prediction statistics
   - Monitor product performance
   - Track risk distribution trends

### Customer Dashboard Enhancements
- Browse available products with risk filtering
- View detailed product information and predictions
- Contact suppliers for product inquiries

## Environment Configuration

Create a `.env` file in the backend directory:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=surplus2serve
JWT_SECRET=your-secure-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=168
```

## Development Workflow

### 1. Development Setup
```powershell
# Install dependencies
pip install -r requirements-mongodb.txt

# Set up MongoDB
python setup_mongodb.py

# Start development server
uvicorn main:app --reload --log-level debug
```

### 2. Testing
```powershell
# Run integration tests
python test_mongodb_integration.py

# Manual API testing
# Visit http://localhost:8000/docs
```

### 3. Frontend Development
```javascript
// Initialize API client with authentication
const apiClient = new APIClient('http://localhost:8000');

// Login and store token
const response = await apiClient.login(email, password);
if (response.success) {
    apiClient.setToken(response.data.access_token);
}

// Make authenticated requests
const products = await apiClient.getMyProducts();
const prediction = await apiClient.predict(predictionData);
```

## Production Deployment

### 1. Security Checklist
- [ ] Change default JWT secret
- [ ] Enable MongoDB authentication
- [ ] Configure CORS for production domains
- [ ] Use HTTPS for all endpoints
- [ ] Set up proper logging
- [ ] Configure database backups

### 2. Environment Variables
```env
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME=surplus2serve_prod
JWT_SECRET=cryptographically-secure-secret
JWT_EXPIRATION_HOURS=24
CORS_ORIGINS=["https://yourdomain.com"]
LOG_LEVEL=INFO
```

### 3. Deployment Commands
```bash
# Install production dependencies
pip install -r requirements-mongodb.txt

# Run database migrations
python setup_mongodb.py

# Start production server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Monitoring & Maintenance

### Database Indexes
The system automatically creates optimized indexes for:
- User email and username (unique)
- Product supplier and category
- Prediction timestamps and risk scores
- Analytics event types and timestamps

### Performance Optimization
- Connection pooling with Motor driver
- Async database operations
- Efficient aggregation pipelines
- Proper indexing strategy

### Backup Strategy
```bash
# Export collections
mongodump --db surplus2serve --out backup/

# Import collections
mongorestore --db surplus2serve backup/surplus2serve/
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```
   Solution: Check MongoDB service status and connection string
   Windows: net start MongoDB
   Connection: Verify MONGODB_URL in .env
   ```

2. **Authentication Errors**
   ```
   Solution: Check JWT secret and token format
   Verify: JWT_SECRET in .env file
   Token: Ensure Bearer token format in headers
   ```

3. **Import Errors**
   ```
   Solution: Install all MongoDB dependencies
   Command: pip install -r requirements-mongodb.txt
   ```

4. **Permission Denied**
   ```
   Solution: Check user roles and authentication
   Debug: Use /auth/me endpoint to verify user data
   ```

### Debug Commands
```powershell
# Check database connection
python -c "import asyncio; from database import connect_to_mongo; print(asyncio.run(connect_to_mongo()))"

# Test API endpoints
curl http://localhost:8000/health

# View MongoDB collections
mongo surplus2serve --eval "show collections"
```

## Migration Guide

### From File-based to MongoDB

1. **Backup existing data**
   ```powershell
   copy training_data.csv training_data_backup.csv
   ```

2. **Import training data**
   ```powershell
   # Use the upload endpoint with admin user
   curl -X POST -F "file=@training_data.csv" -H "Authorization: Bearer $TOKEN" http://localhost:8000/upload_data
   ```

3. **Verify data integrity**
   ```javascript
   // Check record counts in MongoDB
   db.training_data.count()
   db.predictions.count()
   ```

## Support & Documentation

- **API Documentation**: http://localhost:8000/docs
- **Interactive API**: http://localhost:8000/redoc
- **MongoDB Documentation**: https://docs.mongodb.com/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/

## Version History

- **v2.0.0**: MongoDB integration with authentication
- **v1.0.0**: File-based system (legacy)

---

**MongoDB Integration Status**: ✅ Complete and Ready for Production

The Surplus2Serve platform now includes a robust, scalable database backend with user authentication, product management, and comprehensive analytics capabilities.
