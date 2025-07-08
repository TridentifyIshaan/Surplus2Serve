/**
 * Main Integration Script for Surplus2Serve Platform
 * Handles API communication, state management, and UI updates
 */

class Surplus2ServeAPI {
    constructor() {
        this.baseURL = 'http://localhost:8000';
        this.isOnline = false;
        this.checkConnection();
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            this.isOnline = response.ok;
        } catch (error) {
            this.isOnline = false;
        }
        return this.isOnline;
    }

    async predictSpoilage(data) {
        if (!this.isOnline) {
            return this.generateDemoPrediction(data);
        }

        try {
            const response = await fetch(`${this.baseURL}/predict_spoilage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            console.warn('API call failed, using demo prediction:', error);
            return this.generateDemoPrediction(data);
        }
    }

    generateDemoPrediction(data) {
        // Demo prediction logic
        let risk = 0.3;
        
        const commodityRisks = {
            'tomato': 0.6, 'banana': 0.7, 'mango': 0.5,
            'potato': 0.2, 'onion': 0.3, 'rice': 0.1, 'wheat': 0.1
        };
        risk = commodityRisks[data.commodity_name] || risk;
        
        if (data.storage_temperature > 25) risk += 0.2;
        if (data.storage_temperature < 4) risk += 0.1;
        if (data.humidity > 80) risk += 0.15;
        if (data.humidity < 40) risk += 0.1;
        
        return {
            spoilage_risk_score: Math.min(risk, 0.95),
            shelf_life_days: Math.round((1 - risk) * 10),
            recommendation: this.getRiskRecommendation(Math.min(risk, 0.95))
        };
    }

    getRiskRecommendation(risk) {
        if (risk > 0.7) return "Distribute immediately - high spoilage risk";
        if (risk > 0.4) return "Prioritize for distribution within 2-3 days";
        return "Suitable for longer-term storage and distribution";
    }

    async getProducts() {
        if (!this.isOnline) {
            return this.getDemoProducts();
        }

        try {
            const response = await fetch(`${this.baseURL}/products`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Failed to fetch products, using demo data');
        }
        return this.getDemoProducts();
    }

    getDemoProducts() {
        return [
            {
                id: '1',
                commodity_name: 'Tomato',
                quantity: 50,
                location: 'Mumbai',
                spoilage_risk_score: 0.6,
                shelf_life_days: 4,
                supplier_name: 'Fresh Farms Ltd',
                status: 'available'
            },
            {
                id: '2',
                commodity_name: 'Rice',
                quantity: 100,
                location: 'Delhi',
                spoilage_risk_score: 0.1,
                shelf_life_days: 30,
                supplier_name: 'Grain Solutions',
                status: 'available'
            },
            {
                id: '3',
                commodity_name: 'Banana',
                quantity: 25,
                location: 'Bangalore',
                spoilage_risk_score: 0.8,
                shelf_life_days: 2,
                supplier_name: 'Tropical Fruits Co',
                status: 'available'
            }
        ];
    }
}

// Utility functions
const utils = {
    formatDate: (date) => {
        return new Date(date).toLocaleDateString();
    },

    getRiskColor: (risk) => {
        return risk > 0.7 ? '#ff4444' : risk > 0.4 ? '#ffaa00' : '#44ff44';
    },

    getRiskText: (risk) => {
        return risk > 0.7 ? 'High' : risk > 0.4 ? 'Medium' : 'Low';
    },

    showNotification: (message, type = 'info') => {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    validateForm: (formData) => {
        for (const [key, value] of formData.entries()) {
            if (!value.trim()) {
                throw new Error(`${key} is required`);
            }
        }
        return true;
    }
};

// Local storage management
const storage = {
    save: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    },

    load: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    remove: (key) => {
        localStorage.removeItem(key);
    }
};

// Authentication management
const auth = {
    currentUser: null,

    login: (credentials) => {
        // Demo authentication
        const user = {
            id: Date.now(),
            username: credentials.username,
            type: credentials.type || 'supplier',
            loginTime: new Date().toISOString()
        };
        
        auth.currentUser = user;
        storage.save('currentUser', user);
        utils.showNotification(`Welcome back, ${user.username}!`, 'success');
        return user;
    },

    logout: () => {
        auth.currentUser = null;
        storage.remove('currentUser');
        utils.showNotification('Logged out successfully', 'info');
        window.location.href = '../index.html';
    },

    checkAuth: () => {
        const user = storage.load('currentUser');
        if (user) {
            auth.currentUser = user;
            return true;
        }
        return false;
    },

    requireAuth: () => {
        if (!auth.checkAuth()) {
            window.location.href = '../Login Page Supplier/index.html';
            return false;
        }
        return true;
    }
};

// Initialize API
const api = new Surplus2ServeAPI();

// Export for global use
window.Surplus2Serve = {
    api,
    utils,
    storage,
    auth
};

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    auth.checkAuth();
});
