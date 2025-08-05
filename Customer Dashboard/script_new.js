// Enhanced Customer Dashboard with Spoilage Prediction
// Modern JavaScript for Customer Dashboard functionality

class CustomerDashboard {
    constructor() {
        this.products = [
            {
                id: 1,
                name: "Fresh Tomatoes",
                temperature: 12,
                humidity: 85,
                spoilageRisk: 15,
                shelfLife: 7,
                location: "Delhi",
                quantity: 100,
                supplier: "Green Farm Co.",
                daysSinceHarvest: 2
            },
            {
                id: 2,
                name: "Organic Potatoes",
                temperature: 8,
                humidity: 90,
                spoilageRisk: 5,
                shelfLife: 30,
                location: "Punjab",
                quantity: 200,
                supplier: "Punjab Organics",
                daysSinceHarvest: 5
            },
            {
                id: 3,
                name: "Ripe Mangoes",
                temperature: 10,
                humidity: 80,
                spoilageRisk: 25,
                shelfLife: 5,
                location: "Maharashtra",
                quantity: 50,
                supplier: "Mango Valley",
                daysSinceHarvest: 1
            },
            {
                id: 4,
                name: "Fresh Carrots",
                temperature: 5,
                humidity: 95,
                spoilageRisk: 8,
                shelfLife: 21,
                location: "Karnataka",
                quantity: 75,
                supplier: "Root Vegetables Ltd",
                daysSinceHarvest: 3
            },
            {
                id: 5,
                name: "Green Lettuce",
                temperature: 2,
                humidity: 98,
                spoilageRisk: 35,
                shelfLife: 10,
                location: "Delhi",
                quantity: 30,
                supplier: "Leafy Greens Farm",
                daysSinceHarvest: 1
            },
            {
                id: 6,
                name: "Sweet Onions",
                temperature: 15,
                humidity: 70,
                spoilageRisk: 12,
                shelfLife: 45,
                location: "Maharashtra",
                quantity: 150,
                supplier: "Onion Growers Coop",
                daysSinceHarvest: 7
            }
        ];
        
        this.filteredProducts = [...this.products];
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDashboardStats();
        this.renderProducts();
        this.setupPredictionForm();
    }

    bindEvents() {
        // Search and filter events
        document.getElementById('search-input').addEventListener('input', () => this.filterProducts());
        document.getElementById('location-filter').addEventListener('change', () => this.filterProducts());
        document.getElementById('quantity-filter').addEventListener('input', () => this.filterProducts());
        document.getElementById('sort-filter').addEventListener('change', () => this.filterProducts());

        // Prediction form event
        document.getElementById('prediction-form').addEventListener('submit', (e) => this.handlePrediction(e));
    }

    updateDashboardStats() {
        const totalProducts = this.products.length;
        const highRiskProducts = this.products.filter(p => p.spoilageRisk > 20).length;
        const foodSaved = (this.products.reduce((sum, p) => sum + p.quantity, 0) / 1000).toFixed(1);

        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('high-risk').textContent = highRiskProducts;
        document.getElementById('food-saved').textContent = `${foodSaved}t`;
    }

    filterProducts() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const locationFilter = document.getElementById('location-filter').value;
        const minQuantity = parseInt(document.getElementById('quantity-filter').value) || 0;
        const sortBy = document.getElementById('sort-filter').value;

        // Filter products
        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            const matchesLocation = !locationFilter || product.location === locationFilter;
            const matchesQuantity = product.quantity >= minQuantity;
            
            return matchesSearch && matchesLocation && matchesQuantity;
        });

        // Sort products
        if (sortBy) {
            this.filteredProducts.sort((a, b) => {
                switch (sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'spoilage':
                        return a.spoilageRisk - b.spoilageRisk;
                    case 'shelf':
                        return b.shelfLife - a.shelfLife;
                    case 'quantity':
                        return b.quantity - a.quantity;
                    default:
                        return 0;
                }
            });
        }

        this.renderProducts();
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        
        if (this.filteredProducts.length === 0) {
            grid.innerHTML = '<div class="no-products">No products match your search criteria.</div>';
            return;
        }

        grid.innerHTML = this.filteredProducts.map(product => `
            <div class="product-card">
                <div class="product-header">
                    <div>
                        <h3 class="product-title">${product.name}</h3>
                        <div class="supplier">by ${product.supplier}</div>
                    </div>
                    <span class="risk-badge ${this.getRiskClass(product.spoilageRisk)}">
                        ${this.getRiskText(product.spoilageRisk)} Risk
                    </span>
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
                        <span class="detail-label">Temperature</span>
                        <span class="detail-value">${product.temperature}°C</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Humidity</span>
                        <span class="detail-value">${product.humidity}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Shelf Life</span>
                        <span class="detail-value">${product.shelfLife} days</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Spoilage Risk</span>
                        <span class="detail-value" style="color: ${this.getRiskColor(product.spoilageRisk)}">${product.spoilageRisk}%</span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="request-btn" onclick="dashboard.requestProduct(${product.id})">
                        Request Donation
                    </button>
                </div>
            </div>
        `).join('');
    }

    getRiskClass(risk) {
        if (risk <= 15) return 'low';
        if (risk <= 30) return 'medium';
        return 'high';
    }

    getRiskText(risk) {
        if (risk <= 15) return 'Low';
        if (risk <= 30) return 'Medium';
        return 'High';
    }

    getRiskColor(risk) {
        if (risk <= 15) return '#22c55e';
        if (risk <= 30) return '#f59e0b';
        return '#ef4444';
    }

    requestProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showNotification(`Request submitted for ${product.name}!`, 'success');
            // Here you would typically send a request to the backend
        }
    }

    setupPredictionForm() {
        // Initialize form with default values for demo
        const form = document.getElementById('prediction-form');
        
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

        document.getElementById('commodity').addEventListener('change', (e) => {
            const commodity = e.target.value;
            if (commodityDefaults[commodity]) {
                const defaults = commodityDefaults[commodity];
                document.getElementById('temperature').value = defaults.temp;
                document.getElementById('humidity').value = defaults.humidity;
                document.getElementById('storage-type').value = defaults.storage;
            }
        });
    }

    async handlePrediction(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Map form values to API expected values
        const storageTypeMapping = {
            'cold_storage': 'cold_storage',
            'ambient': 'room_temperature', 
            'controlled_atmosphere': 'cold_storage' // Treat as enhanced cold storage
        };
        
        const rawStorageType = formData.get('storage-type');
        const mappedStorageType = storageTypeMapping[rawStorageType] || 'room_temperature';
        
        const data = {
            Commodity_name: formData.get('commodity'),
            Temperature: parseFloat(formData.get('temperature')),
            Humidity: parseFloat(formData.get('humidity')),
            Days_Since_Harvest: parseInt(formData.get('days-harvest')),
            Storage_Type: mappedStorageType,
            Transport_Duration: parseFloat(formData.get('transport-duration')),
            Packaging_Quality: 'good', // Default value
            Month_num: new Date().getMonth() + 1, // Current month
            Location: 'Delhi' // Default location
        };

        console.log('Sending prediction data:', data); // Debug log

        // Show loading state
        const predictBtn = document.getElementById('predict-btn');
        const originalText = predictBtn.innerHTML;
        predictBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Predicting...';
        predictBtn.disabled = true;

        try {
            // Call actual ML model API
            const response = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorDetails = await response.text();
                console.error('API Error Details:', errorDetails);
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorDetails}`);
            }

            const prediction = await response.json();
            console.log('Received prediction:', prediction); // Debug log
            
            this.displayPredictionResult({
                riskScore: Math.round(prediction.Spoilage_Risk_Score * 100),
                commodity: prediction.Input_Summary.commodity,
                recommendations: this.generateRecommendationsFromAPI(prediction),
                confidence: Math.round(prediction.Confidence * 100),
                modelVersion: prediction.Model_Version,
                shelfLife: prediction.Estimated_Shelf_Life
            });
        } catch (error) {
            console.error('Prediction API Error:', error);
            
            // Fallback to demo calculation if API fails
            this.showNotification('API unavailable. Using fallback prediction...', 'warning');
            const fallbackData = {
                commodity: formData.get('commodity'),
                temperature: parseFloat(formData.get('temperature')),
                humidity: parseFloat(formData.get('humidity')),
                daysSinceHarvest: parseInt(formData.get('days-harvest')),
                storageType: formData.get('storage-type'),
                transportDuration: parseFloat(formData.get('transport-duration'))
            };
            const prediction = this.calculateSpoilageRisk(fallbackData);
            this.displayPredictionResult(prediction);
        } finally {
            // Restore button
            predictBtn.innerHTML = originalText;
            predictBtn.disabled = false;
        }
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
            commodity: data.commodity,
            recommendations: this.generateRecommendations(riskScore, data)
        };
    }

    generateRecommendations(riskScore, data) {
        const recommendations = [];
        
        if (riskScore > 50) {
            recommendations.push("⚠️ High spoilage risk detected! Consider immediate sale or processing.");
            recommendations.push("🧊 Implement enhanced cold chain management.");
        } else if (riskScore > 25) {
            recommendations.push("⚡ Monitor conditions closely and prioritize this batch.");
            recommendations.push("📦 Consider upgrading packaging quality.");
        } else {
            recommendations.push("✅ Low spoilage risk - product is in good condition.");
            recommendations.push("📈 Suitable for extended storage or long-distance transport.");
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
            recommendations.push("📅 Product has been stored for extended period - prioritize sale.");
        }

        return recommendations;
    }

    generateRecommendationsFromAPI(prediction) {
        const recommendations = [];
        const riskScore = prediction.Spoilage_Risk_Score * 100;
        
        // Risk-based recommendations
        if (prediction.Risk_Interpretation === 'High Risk') {
            recommendations.push("🚨 HIGH SPOILAGE RISK! Immediate action required.");
            recommendations.push("💨 Consider emergency sale, processing, or donation.");
            recommendations.push("🧊 Implement maximum cold chain protocols.");
        } else if (prediction.Risk_Interpretation === 'Medium Risk') {
            recommendations.push("⚡ Medium risk detected - monitor conditions closely.");
            recommendations.push("📦 Consider upgrading storage conditions.");
            recommendations.push("🕒 Prioritize this batch for early distribution.");
        } else {
            recommendations.push("✅ Low spoilage risk - product is in good condition.");
            recommendations.push("📈 Suitable for extended storage or long-distance transport.");
            recommendations.push("💚 Optimal conditions maintained.");
        }

        // Add shelf life information
        if (prediction.Estimated_Shelf_Life) {
            recommendations.push(`📅 Estimated shelf life: ${prediction.Estimated_Shelf_Life} days`);
        }

        // Add confidence information
        if (prediction.Confidence) {
            const confidence = Math.round(prediction.Confidence * 100);
            recommendations.push(`🎯 Model confidence: ${confidence}%`);
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
            riskLabel.style.color = '#22c55e';
            riskFill.style.background = '#22c55e';
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
        recommendations.innerHTML = `
            <h4 style="margin-bottom: 1rem; color: #374151;">Recommendations for ${prediction.commodity}:</h4>
            <ul style="list-style: none; padding: 0;">
                ${prediction.recommendations.map(rec => `<li style="margin-bottom: 0.5rem; padding: 0.5rem; background: #f9fafb; border-radius: 0.5rem;">${rec}</li>`).join('')}
            </ul>
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
                background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
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
    window.dashboard = new CustomerDashboard();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomerDashboard;
}
