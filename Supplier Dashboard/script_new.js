// Enhanced Supplier Dashboard with Spoilage Prediction
// Modern JavaScript for Supplier Dashboard functionality

class SupplierDashboard {
    constructor() {
        this.products = [
            {
                id: 1,
                name: "Premium Tomatoes",
                category: "Vegetables",
                quantity: 150,
                location: "Punjab",
                harvestDate: "2025-07-05",
                expiryDate: "2025-07-15",
                status: "active",
                spoilageRisk: 12,
                description: "Fresh, organic tomatoes perfect for cooking"
            },
            {
                id: 2,
                name: "Organic Potatoes",
                category: "Vegetables", 
                quantity: 300,
                location: "Delhi",
                harvestDate: "2025-06-28",
                expiryDate: "2025-08-02",
                status: "active",
                spoilageRisk: 8,
                description: "High-quality potatoes, ideal for bulk orders"
            },
            {
                id: 3,
                name: "Sweet Mangoes",
                category: "Fruits",
                quantity: 80,
                location: "Maharashtra",
                harvestDate: "2025-07-03",
                expiryDate: "2025-07-10",
                status: "expiring",
                spoilageRisk: 35,
                description: "Ripe mangoes, best consumed soon"
            },
            {
                id: 4,
                name: "Fresh Carrots",
                category: "Vegetables",
                quantity: 120,
                location: "Karnataka",
                harvestDate: "2025-06-20",
                expiryDate: "2025-07-25",
                status: "active",
                spoilageRisk: 15,
                description: "Crisp, fresh carrots perfect for salads and cooking"
            }
        ];
        
        this.nextId = this.products.length + 1;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDashboardStats();
        this.renderProducts();
        this.setupPredictionForm();
        this.initializeAuth();
    }

    bindEvents() {
        // Action button events
        document.getElementById('add-product-btn').addEventListener('click', () => this.showAddProductForm());
        document.getElementById('predict-spoilage-btn').addEventListener('click', () => this.showPredictionTool());
        document.getElementById('bulk-upload-btn').addEventListener('click', () => this.showBulkUpload());

        // Form events
        document.getElementById('cancel-form-btn').addEventListener('click', () => this.hideAddProductForm());
        document.getElementById('cancel-prediction-btn').addEventListener('click', () => this.hidePredictionTool());
        document.getElementById('product-form').addEventListener('submit', (e) => this.handleAddProduct(e));
        document.getElementById('prediction-form').addEventListener('submit', (e) => this.handlePrediction(e));

        // Profile dropdown events
        document.getElementById('profile-btn').addEventListener('click', () => this.toggleProfileMenu());
        document.getElementById('signin-btn').addEventListener('click', () => this.handleSignIn());
        document.getElementById('signout-btn').addEventListener('click', () => this.handleSignOut());
        document.getElementById('edit-profile-btn').addEventListener('click', () => this.editProfile());
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('notifications-btn').addEventListener('click', () => this.openNotifications());

        // Close profile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-dropdown')) {
                this.closeProfileMenu();
            }
        });
    }

    initializeAuth() {
        // Check if user is already signed in (from localStorage or session)
        const savedUser = localStorage.getItem('surplus2serve_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            this.updateUserProfile(user);
        } else {
            this.updateUserProfile(null);
        }
    }

    toggleProfileMenu() {
        const profileBtn = document.getElementById('profile-btn');
        const profileMenu = document.getElementById('profile-menu');
        
        profileBtn.classList.toggle('active');
        profileMenu.classList.toggle('hidden');
    }

    closeProfileMenu() {
        const profileBtn = document.getElementById('profile-btn');
        const profileMenu = document.getElementById('profile-menu');
        
        profileBtn.classList.remove('active');
        profileMenu.classList.add('hidden');
    }

    handleSignIn() {
        // Redirect to login page
        window.location.href = '../Login Page Supplier/index.html';
    }

    handleSignOut() {
        // Clear user data
        localStorage.removeItem('surplus2serve_user');
        this.updateUserProfile(null);
        this.closeProfileMenu();
        this.showNotification('Successfully signed out!', 'success');
    }

    updateUserProfile(user) {
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const signinBtn = document.getElementById('signin-btn');
        const signoutBtn = document.getElementById('signout-btn');

        if (user) {
            profileName.textContent = user.username || user.email || 'Supplier';
            profileEmail.textContent = user.email || 'supplier@example.com';
            signinBtn.classList.add('hidden');
            signoutBtn.classList.remove('hidden');
        } else {
            profileName.textContent = 'Guest User';
            profileEmail.textContent = 'guest@example.com';
            signinBtn.classList.remove('hidden');
            signoutBtn.classList.add('hidden');
        }
    }

    editProfile() {
        this.closeProfileMenu();
        this.showNotification('Profile editing feature coming soon!', 'info');
    }

    openSettings() {
        this.closeProfileMenu();
        this.showNotification('Settings page coming soon!', 'info');
    }

    openNotifications() {
        this.closeProfileMenu();
        this.showNotification('Notifications feature coming soon!', 'info');
    }

    updateDashboardStats() {
        const totalProducts = this.products.length;
        const expiringSoon = this.products.filter(p => {
            const daysUntilExpiry = this.getDaysUntilExpiry(p.expiryDate);
            return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
        }).length;
        
        // Calculate estimated revenue saved (dummy calculation)
        const totalQuantity = this.products.reduce((sum, p) => sum + p.quantity, 0);
        const revenueSaved = Math.round(totalQuantity * 35 / 1000); // Approx ₹35 per kg

        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('expiring-soon').textContent = expiringSoon;
        document.getElementById('revenue-saved').textContent = `₹${revenueSaved}k`;
    }

    getDaysUntilExpiry(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getProductStatus(expiryDate) {
        const days = this.getDaysUntilExpiry(expiryDate);
        if (days <= 0) return 'expired';
        if (days <= 3) return 'expiring';
        return 'active';
    }

    showAddProductForm() {
        document.getElementById('product-form-section').classList.remove('hidden');
        document.getElementById('prediction-section').classList.add('hidden');
        document.getElementById('product-form-section').scrollIntoView({ behavior: 'smooth' });
    }

    hideAddProductForm() {
        document.getElementById('product-form-section').classList.add('hidden');
        document.getElementById('product-form').reset();
    }

    showPredictionTool() {
        document.getElementById('prediction-section').classList.remove('hidden');
        document.getElementById('product-form-section').classList.add('hidden');
        document.getElementById('prediction-section').scrollIntoView({ behavior: 'smooth' });
    }

    hidePredictionTool() {
        document.getElementById('prediction-section').classList.add('hidden');
        document.getElementById('prediction-form').reset();
        document.getElementById('prediction-result').classList.add('hidden');
    }

    showBulkUpload() {
        this.showNotification('Bulk upload feature coming soon!', 'info');
    }

    handleAddProduct(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const newProduct = {
            id: this.nextId++,
            name: formData.get('product-name'),
            category: formData.get('category'),
            quantity: parseInt(formData.get('quantity')),
            location: formData.get('location'),
            harvestDate: formData.get('harvest-date'),
            expiryDate: formData.get('expiry-date'),
            description: formData.get('description'),
            status: this.getProductStatus(formData.get('expiry-date')),
            spoilageRisk: Math.floor(Math.random() * 30) + 5 // Random for demo
        };

        this.products.unshift(newProduct);
        this.updateDashboardStats();
        this.renderProducts();
        this.hideAddProductForm();
        this.showNotification(`${newProduct.name} has been added successfully!`, 'success');
    }

    deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.products = this.products.filter(p => p.id !== productId);
            this.updateDashboardStats();
            this.renderProducts();
            this.showNotification('Product deleted successfully!', 'success');
        }
    }

    editProduct(productId) {
        this.showNotification('Edit functionality coming soon!', 'info');
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        
        if (this.products.length === 0) {
            grid.innerHTML = '<div class="no-products">No products listed yet. Add your first product!</div>';
            return;
        }

        grid.innerHTML = this.products.map(product => `
            <div class="product-card">
                <div class="product-header">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-category">${product.category}</div>
                </div>
                <div class="product-details">
                    <div class="detail-item">
                        <span class="detail-label">Quantity</span>
                        <span class="detail-value">${product.quantity} kg</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Location</span>
                        <span class="detail-value">${product.location}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Harvest Date</span>
                        <span class="detail-value">${this.formatDate(product.harvestDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Expiry Date</span>
                        <span class="detail-value">${this.formatDate(product.expiryDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Days Left</span>
                        <span class="detail-value">${Math.max(0, this.getDaysUntilExpiry(product.expiryDate))} days</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status</span>
                        <span class="status-badge ${product.status}">${this.getStatusText(product.status)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Spoilage Risk</span>
                        <span class="detail-value" style="color: ${this.getRiskColor(product.spoilageRisk)}">${product.spoilageRisk}%</span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="edit-btn" onclick="dashboard.editProduct(${product.id})">
                        Edit
                    </button>
                    <button class="delete-btn" onclick="dashboard.deleteProduct(${product.id})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    getStatusText(status) {
        switch (status) {
            case 'active': return 'Active';
            case 'expiring': return 'Expiring Soon';
            case 'expired': return 'Expired';
            default: return 'Unknown';
        }
    }

    getRiskColor(risk) {
        if (risk <= 15) return '#10b981';
        if (risk <= 30) return '#f59e0b';
        return '#ef4444';
    }

    setupPredictionForm() {
        // Add commodity-specific defaults
        const commodityDefaults = {
            'tomato': { temp: 12, humidity: 85, storage: 'cold_storage' },
            'potato': { temp: 8, humidity: 90, storage: 'cold_storage' },
            'onion': { temp: 15, humidity: 70, storage: 'ambient' },
            'apple': { temp: 2, humidity: 90, storage: 'cold_storage' },
            'banana': { temp: 14, humidity: 85, storage: 'ambient' },
            'carrot': { temp: 5, humidity: 95, storage: 'cold_storage' },
            'lettuce': { temp: 2, humidity: 98, storage: 'cold_storage' },
            'mango': { temp: 10, humidity: 80, storage: 'ambient' }
        };

        document.getElementById('pred-commodity').addEventListener('change', (e) => {
            const commodity = e.target.value;
            if (commodityDefaults[commodity]) {
                const defaults = commodityDefaults[commodity];
                document.getElementById('pred-temperature').value = defaults.temp;
                document.getElementById('pred-humidity').value = defaults.humidity;
                document.getElementById('pred-storage-type').value = defaults.storage;
            }
        });
    }

    async handlePrediction(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            commodity: formData.get('commodity'),
            temperature: parseFloat(formData.get('temperature')),
            humidity: parseFloat(formData.get('humidity')),
            daysSinceHarvest: parseInt(formData.get('days-harvest')),
            storageType: formData.get('storage-type'),
            transportDuration: parseFloat(formData.get('transport-duration'))
        };

        // Show loading state
        const predictBtn = document.getElementById('predict-btn');
        const originalText = predictBtn.innerHTML;
        predictBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Predicting...';
        predictBtn.disabled = true;

        try {
            // Try to use the actual ML model API first
            let prediction;
            try {
                prediction = await this.callMLModelAPI(data);
            } catch (apiError) {
                console.log('ML API unavailable, using fallback prediction:', apiError.message);
                // Fallback to local calculation
                prediction = this.calculateSpoilageRisk(data);
            }
            
            this.displayPredictionResult(prediction);
            this.showNotification('Prediction completed successfully!', 'success');
        } catch (error) {
            console.error('Prediction error:', error);
            this.showNotification('Prediction failed. Please try again.', 'error');
        } finally {
            // Restore button
            predictBtn.innerHTML = originalText;
            predictBtn.disabled = false;
        }
    }

    async callMLModelAPI(data) {
        // Prepare data for the ML model API
        const apiData = {
            commodity_name: data.commodity,
            temperature: data.temperature,
            humidity: data.humidity,
            days_since_harvest: data.daysSinceHarvest,
            storage_type: data.storageType,
            transport_duration: data.transportDuration,
            // Add default values for required fields
            quantity: 100,
            ph_level: 6.5,
            brix_level: 12,
            firmness: 7,
            color_score: 8,
            ethylene_production: 0.5,
            respiration_rate: 0.3,
            weight_loss: 0.02,
            surface_area: 50,
            packaging_type: 'plastic',
            light_exposure: 'low',
            vibration_level: 'low',
            co2_level: 0.04,
            o2_level: 21,
            previous_storage_condition: 'good',
            handling_quality: 'good',
            supply_chain_length: 'medium'
        };

        // Call the ML model API
        const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        
        // Transform API response to match our expected format
        return {
            riskScore: Math.round(result.spoilage_risk_score * 100),
            shelfLife: result.shelf_life_days || Math.round((1 - result.spoilage_risk_score) * 10),
            recommendation: result.recommendation || this.getRecommendation(result.spoilage_risk_score),
            confidence: result.confidence || 0.85
        };
    }

    calculateSpoilageRisk(data) {
        // Simplified ML prediction algorithm
        let riskScore = 0;
        
        // Temperature factor
        const optimalTemps = {
            'tomato': 12, 'potato': 8, 'onion': 15, 'apple': 2,
            'banana': 14, 'carrot': 5, 'lettuce': 2, 'mango': 10
        };
        
        const optimalTemp = optimalTemps[data.commodity] || 10;
        const tempDeviation = Math.abs(data.temperature - optimalTemp);
        riskScore += tempDeviation * 2;

        // Humidity factor
        const optimalHumidity = data.commodity === 'onion' ? 70 : 85;
        const humidityDeviation = Math.abs(data.humidity - optimalHumidity);
        riskScore += humidityDeviation * 0.5;

        // Days since harvest
        riskScore += data.daysSinceHarvest * 3;

        // Transport duration
        riskScore += data.transportDuration * 0.5;

        // Storage type modifier
        if (data.storageType === 'ambient') riskScore += 10;
        if (data.storageType === 'controlled_atmosphere') riskScore -= 5;

        // Commodity-specific factors
        const commodityRiskFactors = {
            'lettuce': 1.5, 'banana': 1.3, 'mango': 1.2, 'tomato': 1.0,
            'apple': 0.8, 'carrot': 0.7, 'potato': 0.5, 'onion': 0.4
        };
        
        riskScore *= commodityRiskFactors[data.commodity] || 1.0;

        // Ensure score is within 0-100 range
        riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));

        return {
            riskScore,
            shelfLife: Math.round((100 - riskScore) / 10),
            recommendation: this.getRecommendation(riskScore / 100),
            recommendations: this.generateRecommendations(riskScore, data),
            confidence: 0.8
        };
    }

    getRecommendation(riskPercentage) {
        if (riskPercentage > 0.7) {
            return "Distribute immediately - high spoilage risk detected";
        } else if (riskPercentage > 0.4) {
            return "Prioritize for distribution within 2-3 days";
        } else {
            return "Suitable for longer-term storage and distribution";
        }
    }

    generateRecommendations(riskScore, data) {
        const recommendations = [];
        
        if (riskScore > 50) {
            recommendations.push("⚠️ High spoilage risk detected! Consider immediate sale or processing.");
            recommendations.push("🧊 Implement enhanced cold chain management.");
            recommendations.push("📢 Market this batch as 'quick sale' items with discounted pricing.");
        } else if (riskScore > 25) {
            recommendations.push("⚡ Monitor conditions closely and prioritize this batch for distribution.");
            recommendations.push("📦 Consider upgrading packaging quality.");
            recommendations.push("🚚 Expedite transportation to reduce shelf time.");
        } else {
            recommendations.push("✅ Low spoilage risk - product is in excellent condition.");
            recommendations.push("📈 Suitable for extended storage or long-distance transport.");
            recommendations.push("💰 Premium pricing recommended for high-quality produce.");
        }

        // Specific recommendations based on conditions
        const optimalTemps = {
            'tomato': 12, 'potato': 8, 'onion': 15, 'apple': 2,
            'banana': 14, 'carrot': 5, 'lettuce': 2, 'mango': 10
        };
        
        const optimalTemp = optimalTemps[data.commodity] || 10;
        if (Math.abs(data.temperature - optimalTemp) > 5) {
            recommendations.push(`🌡️ Adjust temperature closer to ${optimalTemp}°C for optimal storage.`);
        }

        if (data.daysSinceHarvest > 7) {
            recommendations.push("📅 Product has been in storage for extended period - prioritize for sale.");
        }

        if (data.transportDuration > 24) {
            recommendations.push("🚛 Long transport duration detected - consider local markets first.");
        }

        return recommendations;
    }

    displayPredictionResult(prediction) {
        const resultDiv = document.getElementById('prediction-result');
        const riskPercentage = document.getElementById('risk-percentage');
        const riskFill = document.getElementById('risk-fill');
        const riskLabel = document.getElementById('risk-label');
        const recommendations = document.getElementById('recommendations');

        // Update risk display
        riskPercentage.textContent = `${prediction.riskScore}%`;
        riskFill.style.width = `${prediction.riskScore}%`;
        
        // Update risk label and color
        if (prediction.riskScore <= 25) {
            riskLabel.textContent = 'Low Risk';
            riskLabel.style.color = '#10b981';
            riskFill.style.background = '#10b981';
        } else if (prediction.riskScore <= 50) {
            riskLabel.textContent = 'Medium Risk';
            riskLabel.style.color = '#f59e0b';
            riskFill.style.background = '#f59e0b';
        } else {
            riskLabel.textContent = 'High Risk';
            riskLabel.style.color = '#ef4444';
            riskFill.style.background = '#ef4444';
        }

        // Update recommendations
        const recommendationsList = prediction.recommendations || [prediction.recommendation || 'No specific recommendations available.'];
        recommendations.innerHTML = `
            <div style="background: #f8fafc; padding: 1rem; border-radius: 0.75rem; margin-top: 1rem;">
                <h4 style="margin-bottom: 1rem; color: #334155; display: flex; align-items: center; gap: 0.5rem;">
                    <span class="material-symbols-outlined" style="color: #2563eb;">lightbulb</span>
                    AI Recommendations
                </h4>
                ${prediction.shelfLife ? `<p style="margin-bottom: 0.75rem; padding: 0.5rem; background: white; border-radius: 0.5rem; border-left: 4px solid #2563eb;"><strong>Estimated Shelf Life:</strong> ${prediction.shelfLife} days</p>` : ''}
                ${prediction.confidence ? `<p style="margin-bottom: 0.75rem; padding: 0.5rem; background: white; border-radius: 0.5rem; border-left: 4px solid #10b981;"><strong>Prediction Confidence:</strong> ${Math.round(prediction.confidence * 100)}%</p>` : ''}
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${recommendationsList.map(rec => `<li style="margin-bottom: 0.5rem; padding: 0.75rem; background: white; border-radius: 0.5rem; border-left: 4px solid #f59e0b;">${rec}</li>`).join('')}
                </ul>
            </div>
        `;

        // Show result
        resultDiv.classList.remove('hidden');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 0.75rem;
                color: white;
                font-weight: 500;
                z-index: 1000;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
                transform: translateX(100%);
                transition: transform 0.3s ease-in-out;
            ">
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.firstElementChild.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.firstElementChild.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new SupplierDashboard();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupplierDashboard;
}
