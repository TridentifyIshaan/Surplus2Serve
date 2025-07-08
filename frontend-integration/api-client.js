/**
 * API Client for Surplus2Serve Backend Integration
 * Handles all communication with the FastAPI backend
 */

class SpoilageAPI {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Make HTTP request to the API
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.defaultHeaders,
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Health check endpoint
     */
    async healthCheck() {
        return this.makeRequest('/health');
    }

    /**
     * Get spoilage risk prediction
     */
    async predictSpoilage(data) {
        return this.makeRequest('/predict', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Get available commodities
     */
    async getCommodities() {
        return this.makeRequest('/commodities');
    }

    /**
     * Get model information
     */
    async getModelInfo() {
        return this.makeRequest('/model_info');
    }

    /**
     * Upload training data (admin function)
     */
    async uploadTrainingData(file) {
        const formData = new FormData();
        formData.append('file', file);

        return this.makeRequest('/upload_data', {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
                // Don't set Content-Type for FormData
            },
            body: formData
        });
    }

    /**
     * Validate connection to backend
     */
    async validateConnection() {
        try {
            const health = await this.healthCheck();
            return {
                connected: true,
                status: health.status,
                modelStatus: health.model_status
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }
}

// Global API instance
window.spoilageAPI = new SpoilageAPI();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpoilageAPI;
}
