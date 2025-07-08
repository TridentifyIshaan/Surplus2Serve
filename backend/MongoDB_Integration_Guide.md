# MongoDB Integration Guide for Surplus2Serve

## Overview

This document provides step-by-step instructions for integrating MongoDB with the Surplus2Serve FastAPI backend and updating the frontend to work with the new database-powered API.

## Backend MongoDB Integration

### Prerequisites

1. **MongoDB Server**: Install MongoDB locally or use MongoDB Atlas
   - Local: Download from https://www.mongodb.com/try/download/community
   - Atlas: Create account at https://www.mongodb.com/cloud/atlas

2. **Python Environment**: Ensure you have Python 3.8+ with pip

### Installation Steps

#### Step 1: Install MongoDB Dependencies

```powershell
cd backend
pip install -r requirements-mongodb.txt
```

#### Step 2: Automated Setup (Recommended)

Run the setup script which will:
- Install all required packages
- Configure environment variables
- Test MongoDB connection
- Create initial admin user

```powershell
python setup_mongodb.py
```

#### Step 3: Manual Setup (Alternative)

If you prefer manual setup:

1. **Create .env file** in the backend directory:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=surplus2serve
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=168
```

2. **Start MongoDB** (if running locally):
```powershell
# Windows with MongoDB installed
net start MongoDB

# Or start manually
mongod --dbpath "C:\data\db"
```

3. **Test the connection**:
```powershell
python -c "import asyncio; from database import connect_to_mongo; asyncio.run(connect_to_mongo())"
```

### Updated API Endpoints

The MongoDB integration adds the following new endpoints:

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user profile

#### Product Management
- `POST /products` - Create product (requires authentication)
- `GET /products` - Search products with filters
- `GET /products/{id}` - Get specific product
- `PUT /products/{id}` - Update product (owner only)
- `GET /my-products` - Get current user's products

#### Analytics & Dashboard
- `GET /analytics/dashboard` - Get dashboard statistics
- `GET /analytics/predictions/{id}` - Get prediction details
- `GET /users/{id}/profile` - Get user profile

#### Enhanced Existing Endpoints
- `POST /predict` - Now logs predictions to database
- `POST /upload_data` - Requires authentication, logs to database
- `GET /health` - Shows database connection status

## Frontend Integration Updates

### Step 1: Update API Client

The existing `api-client.js` needs to be enhanced to handle authentication:

```javascript
// Enhanced API client with authentication support
class APIClient {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('authToken');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API request failed');
        }

        return response.json();
    }

    // Authentication methods
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.success && response.data.access_token) {
            this.setToken(response.data.access_token);
        }
        
        return response;
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // Product methods
    async createProduct(productData) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async searchProducts(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/products?${params}`);
    }

    async getMyProducts(page = 1, limit = 20) {
        return this.request(`/my-products?page=${page}&limit=${limit}`);
    }

    // Analytics methods
    async getDashboardAnalytics(days = 30) {
        return this.request(`/analytics/dashboard?days=${days}`);
    }
}
```

### Step 2: Add Authentication UI

Create login and registration forms for the supplier and customer dashboards:

```html
<!-- Add to supplier dashboard -->
<div id="auth-section" class="auth-section">
    <div id="login-form" class="auth-form">
        <h3>Login</h3>
        <input type="email" id="login-email" placeholder="Email" required>
        <input type="password" id="login-password" placeholder="Password" required>
        <button onclick="handleLogin()">Login</button>
        <p>Don't have an account? <a href="#" onclick="showRegisterForm()">Register</a></p>
    </div>
    
    <div id="register-form" class="auth-form hidden">
        <h3>Register as Supplier</h3>
        <input type="text" id="reg-username" placeholder="Username" required>
        <input type="email" id="reg-email" placeholder="Email" required>
        <input type="text" id="reg-fullname" placeholder="Full Name" required>
        <input type="text" id="reg-organization" placeholder="Organization">
        <input type="text" id="reg-location" placeholder="Location">
        <input type="password" id="reg-password" placeholder="Password" required>
        <button onclick="handleRegister()">Register</button>
        <p>Already have an account? <a href="#" onclick="showLoginForm()">Login</a></p>
    </div>
</div>

<div id="dashboard-content" class="hidden">
    <!-- Existing dashboard content -->
</div>
```

### Step 3: Update JavaScript Logic

```javascript
// Initialize API client
const apiClient = new APIClient();

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (apiClient.token) {
            const user = await apiClient.getCurrentUser();
            showDashboard(user);
        } else {
            showAuthSection();
        }
    } catch (error) {
        showAuthSection();
    }
});

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await apiClient.login(email, password);
        if (response.success) {
            const user = response.data.user;
            showDashboard(user);
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function handleRegister() {
    const userData = {
        username: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        full_name: document.getElementById('reg-fullname').value,
        user_type: 'supplier', // or 'customer' for customer dashboard
        organization: document.getElementById('reg-organization').value,
        location: document.getElementById('reg-location').value,
        password: document.getElementById('reg-password').value
    };
    
    try {
        const response = await apiClient.register(userData);
        if (response.success) {
            alert('Registration successful! Please login.');
            showLoginForm();
        }
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

function showDashboard(user) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-content').classList.remove('hidden');
    
    // Update UI with user info
    document.querySelector('.profile-icon').textContent = user.username;
    
    // Load user's products
    loadMyProducts();
}

function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('dashboard-content').classList.add('hidden');
}

async function loadMyProducts() {
    try {
        const response = await apiClient.getMyProducts();
        displayProducts(response.items);
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

// Enhanced product creation with database persistence
async function submitProductForm(formData) {
    try {
        const response = await apiClient.createProduct(formData);
        if (response.success) {
            alert('Product created successfully!');
            loadMyProducts(); // Reload products
            hideProductForm();
        }
    } catch (error) {
        alert('Failed to create product: ' + error.message);
    }
}
```

### Step 4: Update CSS for Authentication

```css
.auth-section {
    max-width: 400px;
    margin: 50px auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.auth-form input {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.auth-form button {
    padding: 12px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

.auth-form button:hover {
    background: #45a049;
}

.hidden {
    display: none !important;
}
```

## Testing the Integration

### Backend Testing

1. **Start the server**:
```powershell
cd backend
uvicorn main:app --reload --port 8000
```

2. **Test endpoints**:
```powershell
# Health check with database status
curl http://localhost:8000/health

# API documentation
# Visit http://localhost:8000/docs
```

### Frontend Testing

1. **Open the Supplier Dashboard**: Navigate to `Supplier Dashboard/index.html`
2. **Register a new supplier account**
3. **Login with the new account**
4. **Create a product** and verify it appears in the database
5. **Test prediction functionality** and check that predictions are logged

### Database Verification

Connect to MongoDB and verify data:

```javascript
// MongoDB shell or Compass
use surplus2serve

// Check collections
show collections

// View users
db.users.find({})

// View products
db.products.find({})

// View predictions
db.predictions.find({})
```

## Migration from File-based Storage

If you have existing data in CSV files, you can migrate it:

1. **Export existing data** to a backup location
2. **Use the upload endpoint** to add training data to MongoDB
3. **Verify data integrity** by comparing counts and samples

## Security Considerations

1. **Change default JWT secret** in production
2. **Use strong passwords** for admin accounts
3. **Enable MongoDB authentication** in production
4. **Use HTTPS** for production deployment
5. **Configure CORS** properly for your frontend domain

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**:
   - Check if MongoDB service is running
   - Verify connection string in .env file
   - Check firewall settings

2. **Authentication Errors**:
   - Verify JWT secret configuration
   - Check token expiration
   - Ensure proper header format

3. **Import Errors**:
   - Install all requirements: `pip install -r requirements-mongodb.txt`
   - Check Python version compatibility

4. **CORS Issues**:
   - Update CORS origins in main.py
   - Check frontend URL configuration

### Logs and Debugging

- Check FastAPI logs for detailed error messages
- Use MongoDB logs to debug database issues
- Enable debug mode in development: `uvicorn main:app --reload --log-level debug`

## Next Steps

1. **Deploy to production** with proper security configurations
2. **Add more analytics features** using MongoDB aggregation
3. **Implement real-time notifications** for spoilage alerts
4. **Add admin dashboard** for user and system management
5. **Integrate with external services** (notifications, payments, etc.)

## Support

For issues or questions:
1. Check the FastAPI documentation: https://fastapi.tiangolo.com/
2. MongoDB documentation: https://docs.mongodb.com/
3. Review the backend logs for detailed error messages
4. Test individual endpoints using the interactive docs at `/docs`
