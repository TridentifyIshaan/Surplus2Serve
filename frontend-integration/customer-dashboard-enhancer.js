/**
 * Customer Dashboard Enhancement with Spoilage Prediction Integration
 * Adds real-time spoilage analysis to the customer search functionality
 */

class CustomerDashboardEnhancer {
    constructor() {
        this.api = window.spoilageAPI;
        this.isConnected = false;
        this.commodities = [];
        
        this.init();
    }

    async init() {
        // Check API connection
        const connection = await this.api.validateConnection();
        this.isConnected = connection.connected;
        
        if (this.isConnected) {
            await this.loadCommodities();
        }

        this.enhanceSearchInterface();
        this.attachEventListeners();
    }

    /**
     * Load available commodities from API
     */
    async loadCommodities() {
        try {
            const result = await this.api.getCommodities();
            this.commodities = result.commodities || [];
        } catch (error) {
            console.warn('Could not load commodities:', error);
        }
    }

    /**
     * Enhance the search interface with spoilage prediction features
     */
    enhanceSearchInterface() {
        const searchSection = document.querySelector('.search-section');
        if (!searchSection) return;

        // Add spoilage prediction controls
        const spoilageControls = document.createElement('div');
        spoilageControls.className = 'spoilage-controls';
        spoilageControls.innerHTML = `
            <div class="control-group">
                <label for="spoilage-filter">Filter by Spoilage Risk:</label>
                <select id="spoilage-filter">
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low Risk (< 30%)</option>
                    <option value="medium">Medium Risk (30-70%)</option>
                    <option value="high">High Risk (> 70%)</option>
                </select>
            </div>
            <div class="control-group">
                <label for="shelf-life-filter">Minimum Shelf Life (days):</label>
                <input type="number" id="shelf-life-filter" min="1" max="30" placeholder="e.g., 7">
            </div>
            <button id="predict-batch-btn" class="predict-batch-btn" ${!this.isConnected ? 'disabled' : ''}>
                🔬 Analyze Available Items
            </button>
        `;

        searchSection.appendChild(spoilageControls);

        // Add results container
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'enhanced-results';
        resultsContainer.className = 'enhanced-results';
        searchSection.insertAdjacentElement('afterend', resultsContainer);

        this.addCustomerStyles();
    }

    /**
     * Add CSS styles for customer dashboard enhancements
     */
    addCustomerStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .spoilage-controls {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
                border: 1px solid #dee2e6;
            }

            .control-group {
                display: inline-block;
                margin-right: 15px;
                margin-bottom: 10px;
            }

            .control-group label {
                display: block;
                font-weight: bold;
                margin-bottom: 5px;
                color: #495057;
            }

            .control-group select,
            .control-group input {
                padding: 8px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 14px;
            }

            .predict-batch-btn {
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                margin-left: 15px;
            }

            .predict-batch-btn:hover:not(:disabled) {
                background: #218838;
            }

            .predict-batch-btn:disabled {
                background: #6c757d;
                cursor: not-allowed;
            }

            .enhanced-results {
                margin-top: 20px;
            }

            .results-header {
                background: #007bff;
                color: white;
                padding: 15px;
                border-radius: 8px 8px 0 0;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
                padding: 15px;
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 0 0 8px 8px;
            }

            .item-card {
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 15px;
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: transform 0.2s ease;
            }

            .item-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }

            .item-header {
                display: flex;
                justify-content: between;
                align-items: center;
                margin-bottom: 10px;
            }

            .item-title {
                font-weight: bold;
                font-size: 1.1em;
                color: #343a40;
            }

            .risk-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8em;
                font-weight: bold;
                text-transform: uppercase;
            }

            .risk-badge.low { background: #d4edda; color: #155724; }
            .risk-badge.medium { background: #fff3cd; color: #856404; }
            .risk-badge.high { background: #f8d7da; color: #721c24; }

            .item-details {
                margin-top: 10px;
            }

            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 0.9em;
            }

            .detail-label {
                color: #6c757d;
            }

            .detail-value {
                font-weight: bold;
                color: #495057;
            }

            .loading-message {
                text-align: center;
                padding: 40px;
                color: #6c757d;
            }

            .error-message {
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
                border: 1px solid #f5c6cb;
            }

            .no-results {
                text-align: center;
                padding: 40px;
                color: #6c757d;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const predictBtn = document.getElementById('predict-batch-btn');
        if (predictBtn) {
            predictBtn.addEventListener('click', () => this.performBatchAnalysis());
        }

        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.enhancedSearch());
        }

        // Add enter key support for search
        const searchBar = document.getElementById('search-bar');
        if (searchBar) {
            searchBar.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.enhancedSearch();
                }
            });
        }
    }

    /**
     * Perform batch spoilage analysis on mock data
     */
    async performBatchAnalysis() {
        const resultsContainer = document.getElementById('enhanced-results');
        
        // Show loading
        resultsContainer.innerHTML = `
            <div class="loading-message">
                <div class="loading-spinner"></div>
                <p>Analyzing available items for spoilage risk...</p>
            </div>
        `;

        try {
            // Generate mock data for demonstration
            const mockItems = this.generateMockInventory();
            const analyzedItems = await this.analyzeItems(mockItems);
            
            this.displayAnalyzedResults(analyzedItems);
        } catch (error) {
            this.displayError(error);
        }
    }

    /**
     * Generate mock inventory data for demonstration
     */
    generateMockInventory() {
        const commodities = ['Tomato', 'Rice', 'Mango', 'Onion', 'Wheat', 'Apple', 'Potato', 'Carrot'];
        const storageTypes = ['cold_storage', 'room_temperature', 'open_air_storage'];
        const items = [];

        for (let i = 0; i < 10; i++) {
            const commodity = commodities[Math.floor(Math.random() * commodities.length)];
            items.push({
                id: `item_${i + 1}`,
                name: commodity,
                quantity: Math.floor(Math.random() * 100) + 10,
                temperature: Math.floor(Math.random() * 30) + 10,
                humidity: Math.floor(Math.random() * 50) + 40,
                storage_type: storageTypes[Math.floor(Math.random() * storageTypes.length)],
                days_since_harvest: Math.floor(Math.random() * 10) + 1,
                location: 'Sample Farm',
                supplier: `Supplier ${i + 1}`
            });
        }

        return items;
    }

    /**
     * Analyze items for spoilage risk
     */
    async analyzeItems(items) {
        const analyzed = [];

        for (const item of items) {
            try {
                const predictionData = {
                    Commodity_name: item.name,
                    Temperature: item.temperature,
                    Humidity: item.humidity,
                    Storage_Type: item.storage_type,
                    Days_Since_Harvest: item.days_since_harvest
                };

                const prediction = await this.api.predictSpoilage(predictionData);
                
                analyzed.push({
                    ...item,
                    spoilage_risk: prediction.spoilage_risk,
                    confidence: prediction.confidence,
                    estimated_shelf_life: prediction.estimated_shelf_life,
                    risk_level: this.getRiskLevel(prediction.spoilage_risk)
                });
            } catch (error) {
                console.warn(`Failed to analyze ${item.name}:`, error);
                analyzed.push({
                    ...item,
                    spoilage_risk: null,
                    error: error.message
                });
            }
        }

        return analyzed;
    }

    /**
     * Enhanced search with spoilage filtering
     */
    enhancedSearch() {
        const searchTerm = document.getElementById('search-bar').value.toLowerCase();
        const minQuantity = parseInt(document.getElementById('quantity-filter').value) || 0;
        const spoilageFilter = document.getElementById('spoilage-filter').value;
        const minShelfLife = parseInt(document.getElementById('shelf-life-filter').value) || 0;

        // For demonstration, we'll use the last analyzed results
        // In a real implementation, this would query your backend
        const lastResults = this.getLastAnalyzedResults();
        
        if (lastResults.length === 0) {
            this.displayNoResults('No items to search. Please run "Analyze Available Items" first.');
            return;
        }

        const filtered = lastResults.filter(item => {
            // Search term filter
            if (searchTerm && !item.name.toLowerCase().includes(searchTerm)) {
                return false;
            }

            // Quantity filter
            if (item.quantity < minQuantity) {
                return false;
            }

            // Spoilage risk filter
            if (spoilageFilter !== 'all' && item.risk_level && item.risk_level.level !== spoilageFilter) {
                return false;
            }

            // Shelf life filter
            if (minShelfLife > 0 && item.estimated_shelf_life < minShelfLife) {
                return false;
            }

            return true;
        });

        this.displayAnalyzedResults(filtered, `Search Results (${filtered.length} items)`);
    }

    /**
     * Get last analyzed results from local storage
     */
    getLastAnalyzedResults() {
        try {
            const stored = localStorage.getItem('lastAnalyzedResults');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Store analyzed results to local storage
     */
    storeAnalyzedResults(results) {
        try {
            localStorage.setItem('lastAnalyzedResults', JSON.stringify(results));
        } catch (error) {
            console.warn('Could not store results:', error);
        }
    }

    /**
     * Display analyzed results
     */
    displayAnalyzedResults(items, title = 'Available Items with Spoilage Analysis') {
        const resultsContainer = document.getElementById('enhanced-results');
        
        if (items.length === 0) {
            this.displayNoResults('No items match your search criteria.');
            return;
        }

        // Store results for search functionality
        this.storeAnalyzedResults(items);

        // Sort by spoilage risk (ascending - best first)
        const sortedItems = items.sort((a, b) => {
            if (a.spoilage_risk === null) return 1;
            if (b.spoilage_risk === null) return -1;
            return a.spoilage_risk - b.spoilage_risk;
        });

        const resultsHTML = `
            <div class="results-header">
                <span>${title}</span>
                <span>${items.length} items found</span>
            </div>
            <div class="results-grid">
                ${sortedItems.map(item => this.createItemCard(item)).join('')}
            </div>
        `;

        resultsContainer.innerHTML = resultsHTML;
    }

    /**
     * Create HTML card for an item
     */
    createItemCard(item) {
        const riskBadge = item.spoilage_risk !== null 
            ? `<span class="risk-badge ${item.risk_level.level}">${item.risk_level.label}</span>`
            : '<span class="risk-badge medium">Analysis Failed</span>';

        const spoilagePercent = item.spoilage_risk !== null 
            ? `${(item.spoilage_risk * 100).toFixed(1)}%`
            : 'N/A';

        const shelfLife = item.estimated_shelf_life || 'Unknown';

        return `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-title">${item.name}</div>
                    ${riskBadge}
                </div>
                <div class="item-details">
                    <div class="detail-row">
                        <span class="detail-label">Quantity:</span>
                        <span class="detail-value">${item.quantity} kg</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Spoilage Risk:</span>
                        <span class="detail-value">${spoilagePercent}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Shelf Life:</span>
                        <span class="detail-value">${shelfLife} days</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Storage:</span>
                        <span class="detail-value">${item.storage_type.replace(/_/g, ' ')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Temperature:</span>
                        <span class="detail-value">${item.temperature}°C</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Humidity:</span>
                        <span class="detail-value">${item.humidity}%</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Days Since Harvest:</span>
                        <span class="detail-value">${item.days_since_harvest}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Supplier:</span>
                        <span class="detail-value">${item.supplier}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Display no results message
     */
    displayNoResults(message) {
        const resultsContainer = document.getElementById('enhanced-results');
        resultsContainer.innerHTML = `
            <div class="no-results">
                ${message}
            </div>
        `;
    }

    /**
     * Display error message
     */
    displayError(error) {
        const resultsContainer = document.getElementById('enhanced-results');
        resultsContainer.innerHTML = `
            <div class="error-message">
                ❌ Analysis failed: ${error.message}
                <br>Please check your connection and try again.
            </div>
        `;
    }

    /**
     * Get risk level information
     */
    getRiskLevel(riskScore) {
        if (riskScore < 0.3) {
            return { level: 'low', label: 'Low Risk' };
        } else if (riskScore < 0.7) {
            return { level: 'medium', label: 'Medium Risk' };
        } else {
            return { level: 'high', label: 'High Risk' };
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.customerDashboardEnhancer = new CustomerDashboardEnhancer();
});
