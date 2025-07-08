/**
 * Spoilage Prediction Integration for Supplier Dashboard
 * Enhances the existing supplier form with real-time spoilage predictions
 */

class SpoilagePredictionManager {
    constructor() {
        this.api = window.spoilageAPI;
        this.predictionContainer = null;
        this.lastPrediction = null;
        this.isConnected = false;
        
        this.init();
    }

    async init() {
        // Check API connection
        const connection = await this.api.validateConnection();
        this.isConnected = connection.connected;
        
        if (!this.isConnected) {
            console.warn('Backend API not available:', connection.error);
            this.showConnectionWarning();
        }

        this.setupPredictionUI();
        this.attachEventListeners();
    }

    /**
     * Show warning if backend is not connected
     */
    showConnectionWarning() {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'api-warning';
        warningDiv.innerHTML = `
            <div class="warning-message">
                ⚠️ Spoilage prediction service is currently unavailable. 
                Forms can still be submitted but without risk analysis.
            </div>
        `;
        
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.insertAdjacentElement('afterend', warningDiv);
        }
    }

    /**
     * Create prediction UI elements
     */
    setupPredictionUI() {
        // Create prediction container
        this.predictionContainer = document.createElement('div');
        this.predictionContainer.id = 'spoilage-prediction';
        this.predictionContainer.className = 'prediction-container hidden';
        this.predictionContainer.innerHTML = `
            <div class="prediction-header">
                <h3>🔬 Spoilage Risk Analysis</h3>
                <button type="button" id="predict-btn" class="predict-btn" disabled>
                    Analyze Spoilage Risk
                </button>
            </div>
            <div id="prediction-results" class="prediction-results hidden">
                <!-- Results will be displayed here -->
            </div>
            <div id="prediction-loading" class="prediction-loading hidden">
                <div class="loading-spinner"></div>
                <p>Analyzing spoilage risk...</p>
            </div>
        `;

        // Add CSS styles
        this.addPredictionStyles();
    }

    /**
     * Add CSS styles for prediction UI
     */
    addPredictionStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .api-warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 10px;
                margin: 10px;
                border-radius: 5px;
                text-align: center;
            }

            .prediction-container {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                margin: 20px 0;
                padding: 20px;
                transition: all 0.3s ease;
            }

            .prediction-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .prediction-header h3 {
                margin: 0;
                color: #495057;
                font-size: 1.2em;
            }

            .predict-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .predict-btn:hover:not(:disabled) {
                background: #0056b3;
                transform: translateY(-1px);
            }

            .predict-btn:disabled {
                background: #6c757d;
                cursor: not-allowed;
            }

            .prediction-results {
                background: white;
                border-radius: 6px;
                padding: 15px;
                margin-top: 15px;
            }

            .risk-level {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 15px;
                padding: 10px;
                border-radius: 5px;
                font-weight: bold;
            }

            .risk-low { background: #d4edda; color: #155724; }
            .risk-medium { background: #fff3cd; color: #856404; }
            .risk-high { background: #f8d7da; color: #721c24; }

            .prediction-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }

            .detail-item {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 5px;
                border-left: 3px solid #007bff;
            }

            .detail-label {
                font-weight: bold;
                color: #495057;
                display: block;
                margin-bottom: 5px;
            }

            .detail-value {
                color: #6c757d;
            }

            .prediction-loading {
                text-align: center;
                padding: 20px;
            }

            .loading-spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #007bff;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .hidden { display: none !important; }
        `;
        document.head.appendChild(style);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Listen for form submissions to inject prediction UI
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-product-btn') {
                setTimeout(() => this.enhanceForm(), 100);
            }
        });

        // Listen for predict button clicks
        document.addEventListener('click', (e) => {
            if (e.target.id === 'predict-btn') {
                this.performPrediction();
            }
        });

        // Listen for form field changes to enable/disable prediction
        document.addEventListener('input', (e) => {
            const form = document.getElementById('supplyForm');
            if (form && form.contains(e.target)) {
                this.updatePredictionButton();
            }
        });

        document.addEventListener('change', (e) => {
            const form = document.getElementById('supplyForm');
            if (form && form.contains(e.target)) {
                this.updatePredictionButton();
            }
        });
    }

    /**
     * Enhance the supply form with prediction functionality
     */
    enhanceForm() {
        const form = document.getElementById('supplyForm');
        if (!form || document.getElementById('spoilage-prediction')) {
            return;
        }

        // Insert prediction container after crop selection
        const cropField = document.getElementById('crop');
        if (cropField) {
            const parentDiv = cropField.closest('label').nextElementSibling || cropField.parentNode;
            parentDiv.insertAdjacentElement('afterend', this.predictionContainer);
            this.predictionContainer.classList.remove('hidden');
        }

        this.updatePredictionButton();
    }

    /**
     * Update prediction button state based on form completion
     */
    updatePredictionButton() {
        const btn = document.getElementById('predict-btn');
        if (!btn) return;

        const requiredFields = this.getRequiredFieldsForPrediction();
        const allFilled = requiredFields.every(field => field.value && field.value.trim() !== '');
        
        btn.disabled = !allFilled || !this.isConnected;
        
        if (!this.isConnected) {
            btn.textContent = 'API Unavailable';
        } else if (allFilled) {
            btn.textContent = 'Analyze Spoilage Risk';
        } else {
            btn.textContent = 'Fill Required Fields';
        }
    }

    /**
     * Get required fields for prediction
     */
    getRequiredFieldsForPrediction() {
        return [
            document.getElementById('commodity'),
            document.getElementById('crop'),
            document.getElementById('temperature'),
            document.getElementById('humidity'),
            document.getElementById('storage type'),
            document.getElementById('days since harvest')
        ].filter(field => field !== null);
    }

    /**
     * Perform spoilage prediction
     */
    async performPrediction() {
        const loadingDiv = document.getElementById('prediction-loading');
        const resultsDiv = document.getElementById('prediction-results');
        
        // Show loading, hide results
        loadingDiv.classList.remove('hidden');
        resultsDiv.classList.add('hidden');

        try {
            const predictionData = this.gatherPredictionData();
            const result = await this.api.predictSpoilage(predictionData);
            
            this.lastPrediction = result;
            this.displayPredictionResults(result);
            
        } catch (error) {
            this.displayPredictionError(error);
        } finally {
            loadingDiv.classList.add('hidden');
        }
    }

    /**
     * Gather data from form for prediction
     */
    gatherPredictionData() {
        const cropName = document.getElementById('crop').value;
        const commodityCategory = document.getElementById('commodity').value;
        const temperature = parseFloat(document.getElementById('temperature').value);
        const humidity = parseFloat(document.getElementById('humidity').value);
        const storageType = document.getElementById('storage type').value.toLowerCase().replace(/\s+/g, '_');
        const daysSinceHarvest = parseInt(document.getElementById('days since harvest').value);

        return {
            Commodity_name: cropName,
            Commodity_Category: commodityCategory,
            Temperature: temperature,
            Humidity: humidity,
            Storage_Type: storageType,
            Days_Since_Harvest: daysSinceHarvest
        };
    }

    /**
     * Display prediction results
     */
    displayPredictionResults(result) {
        const resultsDiv = document.getElementById('prediction-results');
        
        const riskLevel = this.getRiskLevel(result.spoilage_risk);
        const riskClass = `risk-${riskLevel.level}`;
        
        resultsDiv.innerHTML = `
            <div class="risk-level ${riskClass}">
                ${riskLevel.icon} 
                <span>Spoilage Risk: ${riskLevel.label} (${(result.spoilage_risk * 100).toFixed(1)}%)</span>
            </div>
            
            <div class="prediction-details">
                <div class="detail-item">
                    <span class="detail-label">Confidence Score</span>
                    <span class="detail-value">${(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Shelf Life Estimate</span>
                    <span class="detail-value">${result.estimated_shelf_life} days</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Model Version</span>
                    <span class="detail-value">${result.model_version}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Prediction Time</span>
                    <span class="detail-value">${new Date(result.timestamp).toLocaleString()}</span>
                </div>
            </div>
            
            <div class="recommendations">
                <h4>💡 Recommendations:</h4>
                <ul>
                    ${this.generateRecommendations(result).map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
        
        resultsDiv.classList.remove('hidden');
    }

    /**
     * Get risk level information
     */
    getRiskLevel(riskScore) {
        if (riskScore < 0.3) {
            return { level: 'low', label: 'Low Risk', icon: '✅' };
        } else if (riskScore < 0.7) {
            return { level: 'medium', label: 'Medium Risk', icon: '⚠️' };
        } else {
            return { level: 'high', label: 'High Risk', icon: '🚨' };
        }
    }

    /**
     * Generate recommendations based on prediction
     */
    generateRecommendations(result) {
        const recommendations = [];
        const data = this.gatherPredictionData();
        
        if (result.spoilage_risk > 0.7) {
            recommendations.push('Consider immediate sale or processing to minimize losses');
            recommendations.push('Implement stricter storage conditions');
        }
        
        if (data.Temperature > 25) {
            recommendations.push('Lower storage temperature to extend shelf life');
        }
        
        if (data.Humidity > 80) {
            recommendations.push('Reduce humidity levels to prevent spoilage');
        }
        
        if (data.Days_Since_Harvest > 7) {
            recommendations.push('Prioritize this item for quick distribution');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Current storage conditions are optimal');
            recommendations.push('Monitor regularly for any changes');
        }
        
        return recommendations;
    }

    /**
     * Display prediction error
     */
    displayPredictionError(error) {
        const resultsDiv = document.getElementById('prediction-results');
        resultsDiv.innerHTML = `
            <div class="risk-level risk-high">
                ❌ Prediction Failed: ${error.message}
            </div>
            <p>Please check your input data and try again. If the problem persists, contact support.</p>
        `;
        resultsDiv.classList.remove('hidden');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.spoilagePredictionManager = new SpoilagePredictionManager();
});
