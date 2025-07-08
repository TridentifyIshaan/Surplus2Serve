/**
 * Admin Dashboard for Model Management and Data Upload
 * Provides interface for uploading training data and managing the ML model
 */

class AdminDashboard {
    constructor() {
        this.api = window.spoilageAPI;
        this.isConnected = false;
        this.modelInfo = null;
        
        this.init();
    }

    async init() {
        // Check API connection
        const connection = await this.api.validateConnection();
        this.isConnected = connection.connected;
        
        if (this.isConnected) {
            await this.loadModelInfo();
        }

        this.createAdminInterface();
        this.attachEventListeners();
    }

    /**
     * Load current model information
     */
    async loadModelInfo() {
        try {
            this.modelInfo = await this.api.getModelInfo();
        } catch (error) {
            console.warn('Could not load model info:', error);
        }
    }

    /**
     * Create admin interface
     */
    createAdminInterface() {
        // Check if admin interface already exists
        if (document.getElementById('admin-dashboard')) {
            return;
        }

        const adminContainer = document.createElement('div');
        adminContainer.id = 'admin-dashboard';
        adminContainer.className = 'admin-dashboard';
        adminContainer.innerHTML = `
            <div class="admin-header">
                <h2>🔧 Admin Dashboard - Model Management</h2>
                <button id="toggle-admin" class="toggle-btn">Hide Admin Panel</button>
            </div>
            
            <div class="admin-content">
                <div class="admin-section">
                    <h3>📊 Model Status</h3>
                    <div id="model-status" class="status-container">
                        ${this.isConnected ? 'Loading model information...' : 'Backend not connected'}
                    </div>
                </div>

                <div class="admin-section">
                    <h3>📤 Upload Training Data</h3>
                    <div class="upload-container">
                        <div class="upload-info">
                            <p>Upload a CSV file with training data to retrain the model.</p>
                            <p><strong>Required columns:</strong> Temperature, Humidity, Storage_Type, Days_Since_Harvest, Commodity_name, Spoilage_Risk</p>
                        </div>
                        
                        <div class="file-upload-area" id="file-upload-area">
                            <input type="file" id="training-file" accept=".csv" style="display: none;">
                            <div class="upload-prompt">
                                <div class="upload-icon">📁</div>
                                <p>Click to select CSV file or drag and drop</p>
                                <p class="file-info">No file selected</p>
                            </div>
                        </div>
                        
                        <button id="upload-btn" class="upload-btn" disabled>Upload Training Data</button>
                        
                        <div id="upload-progress" class="upload-progress hidden">
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <p class="progress-text">Uploading and retraining model...</p>
                        </div>
                        
                        <div id="upload-results" class="upload-results hidden">
                            <!-- Results will be displayed here -->
                        </div>
                    </div>
                </div>

                <div class="admin-section">
                    <h3>🧪 Test Prediction</h3>
                    <div class="test-container">
                        <form id="test-form" class="test-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="test-commodity">Commodity:</label>
                                    <input type="text" id="test-commodity" value="Tomato" required>
                                </div>
                                <div class="form-group">
                                    <label for="test-temperature">Temperature (°C):</label>
                                    <input type="number" id="test-temperature" value="25" min="0" max="50" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="test-humidity">Humidity (%):</label>
                                    <input type="number" id="test-humidity" value="75" min="0" max="100" required>
                                </div>
                                <div class="form-group">
                                    <label for="test-storage">Storage Type:</label>
                                    <select id="test-storage" required>
                                        <option value="cold_storage">Cold Storage</option>
                                        <option value="room_temperature">Room Temperature</option>
                                        <option value="open_air_storage">Open Air Storage</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="test-days">Days Since Harvest:</label>
                                    <input type="number" id="test-days" value="3" min="0" max="30" required>
                                </div>
                                <div class="form-group">
                                    <button type="submit" class="test-btn" ${!this.isConnected ? 'disabled' : ''}>
                                        Test Prediction
                                    </button>
                                </div>
                            </div>
                        </form>
                        
                        <div id="test-results" class="test-results hidden">
                            <!-- Test results will be displayed here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add admin dashboard to the page
        const mainContent = document.querySelector('main') || document.body;
        mainContent.appendChild(adminContainer);

        this.addAdminStyles();
        
        if (this.isConnected) {
            this.updateModelStatus();
        }
    }

    /**
     * Add CSS styles for admin dashboard
     */
    addAdminStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .admin-dashboard {
                background: #f8f9fa;
                border: 2px solid #007bff;
                border-radius: 10px;
                margin: 20px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }

            .admin-header {
                background: #007bff;
                color: white;
                padding: 15px 20px;
                border-radius: 8px 8px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .admin-header h2 {
                margin: 0;
                font-size: 1.3em;
            }

            .toggle-btn {
                background: rgba(255,255,255,0.2);
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.9em;
            }

            .toggle-btn:hover {
                background: rgba(255,255,255,0.3);
            }

            .admin-content {
                padding: 20px;
            }

            .admin-section {
                background: white;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                border: 1px solid #dee2e6;
            }

            .admin-section h3 {
                margin: 0 0 15px 0;
                color: #495057;
                border-bottom: 2px solid #e9ecef;
                padding-bottom: 10px;
            }

            .status-container {
                background: #e9ecef;
                padding: 15px;
                border-radius: 6px;
                border-left: 4px solid #007bff;
            }

            .status-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 5px 0;
            }

            .status-label {
                font-weight: bold;
                color: #495057;
            }

            .status-value {
                color: #6c757d;
            }

            .file-upload-area {
                border: 2px dashed #ced4da;
                border-radius: 8px;
                padding: 30px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                margin: 15px 0;
            }

            .file-upload-area:hover,
            .file-upload-area.dragover {
                border-color: #007bff;
                background: #f8f9fa;
            }

            .upload-icon {
                font-size: 2em;
                margin-bottom: 10px;
            }

            .file-info {
                color: #6c757d;
                font-size: 0.9em;
                margin-top: 5px;
            }

            .upload-btn {
                background: #28a745;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
                margin-top: 15px;
            }

            .upload-btn:hover:not(:disabled) {
                background: #218838;
            }

            .upload-btn:disabled {
                background: #6c757d;
                cursor: not-allowed;
            }

            .upload-progress {
                margin-top: 15px;
                text-align: center;
            }

            .progress-bar {
                background: #e9ecef;
                border-radius: 10px;
                height: 20px;
                overflow: hidden;
                margin-bottom: 10px;
            }

            .progress-fill {
                background: #007bff;
                height: 100%;
                width: 0%;
                transition: width 0.3s ease;
                border-radius: 10px;
            }

            .progress-text {
                color: #6c757d;
                margin: 0;
            }

            .upload-results {
                margin-top: 15px;
                padding: 15px;
                border-radius: 6px;
            }

            .upload-success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .upload-error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .test-form {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #dee2e6;
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 15px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
            }

            .form-group label {
                font-weight: bold;
                margin-bottom: 5px;
                color: #495057;
            }

            .form-group input,
            .form-group select {
                padding: 8px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 14px;
            }

            .test-btn {
                background: #17a2b8;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                align-self: end;
            }

            .test-btn:hover:not(:disabled) {
                background: #138496;
            }

            .test-btn:disabled {
                background: #6c757d;
                cursor: not-allowed;
            }

            .test-results {
                margin-top: 15px;
                padding: 15px;
                background: white;
                border-radius: 6px;
                border: 1px solid #dee2e6;
            }

            .hidden { display: none !important; }

            @media (max-width: 768px) {
                .form-row {
                    grid-template-columns: 1fr;
                }
                
                .admin-header {
                    flex-direction: column;
                    gap: 10px;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Update model status display
     */
    updateModelStatus() {
        const statusContainer = document.getElementById('model-status');
        if (!statusContainer) return;

        if (!this.isConnected) {
            statusContainer.innerHTML = '<div class="status-item"><span class="status-label">Status:</span><span class="status-value">❌ Backend not connected</span></div>';
            return;
        }

        const statusHTML = `
            <div class="status-item">
                <span class="status-label">Backend Status:</span>
                <span class="status-value">✅ Connected</span>
            </div>
            <div class="status-item">
                <span class="status-label">Model Status:</span>
                <span class="status-value">${this.modelInfo ? '✅ Loaded' : '❌ Not loaded'}</span>
            </div>
            ${this.modelInfo ? `
                <div class="status-item">
                    <span class="status-label">Model Version:</span>
                    <span class="status-value">${this.modelInfo.version}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Training Samples:</span>
                    <span class="status-value">${this.modelInfo.training_samples}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Last Trained:</span>
                    <span class="status-value">${new Date(this.modelInfo.last_trained).toLocaleString()}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Supported Features:</span>
                    <span class="status-value">${this.modelInfo.feature_names.join(', ')}</span>
                </div>
            ` : ''}
        `;

        statusContainer.innerHTML = statusHTML;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Toggle admin panel
        const toggleBtn = document.getElementById('toggle-admin');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleAdminPanel());
        }

        // File upload
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('training-file');
        const uploadBtn = document.getElementById('upload-btn');

        if (fileUploadArea && fileInput) {
            fileUploadArea.addEventListener('click', () => fileInput.click());
            fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            fileUploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.uploadTrainingData());
        }

        // Test form
        const testForm = document.getElementById('test-form');
        if (testForm) {
            testForm.addEventListener('submit', (e) => this.handleTestSubmit(e));
        }
    }

    /**
     * Toggle admin panel visibility
     */
    toggleAdminPanel() {
        const content = document.querySelector('.admin-content');
        const toggleBtn = document.getElementById('toggle-admin');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggleBtn.textContent = 'Hide Admin Panel';
        } else {
            content.style.display = 'none';
            toggleBtn.textContent = 'Show Admin Panel';
        }
    }

    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    /**
     * Handle file drop event
     */
    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.selectFile(files[0]);
        }
    }

    /**
     * Handle file selection
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.selectFile(file);
        }
    }

    /**
     * Select and validate file
     */
    selectFile(file) {
        const fileInfo = document.querySelector('.file-info');
        const uploadBtn = document.getElementById('upload-btn');
        
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            fileInfo.textContent = '❌ Please select a CSV file';
            fileInfo.style.color = '#dc3545';
            uploadBtn.disabled = true;
            return;
        }

        fileInfo.textContent = `✅ Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        fileInfo.style.color = '#28a745';
        uploadBtn.disabled = false;
        
        // Store file for upload
        this.selectedFile = file;
    }

    /**
     * Upload training data
     */
    async uploadTrainingData() {
        if (!this.selectedFile) return;

        const progressDiv = document.getElementById('upload-progress');
        const resultsDiv = document.getElementById('upload-results');
        const uploadBtn = document.getElementById('upload-btn');
        
        // Show progress, hide results
        progressDiv.classList.remove('hidden');
        resultsDiv.classList.add('hidden');
        uploadBtn.disabled = true;
        
        // Simulate progress
        const progressFill = document.querySelector('.progress-fill');
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 90) progress = 90;
            progressFill.style.width = `${progress}%`;
        }, 200);

        try {
            const result = await this.api.uploadTrainingData(this.selectedFile);
            
            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            
            setTimeout(() => {
                progressDiv.classList.add('hidden');
                this.displayUploadSuccess(result);
                
                // Refresh model info
                this.loadModelInfo().then(() => this.updateModelStatus());
            }, 500);
            
        } catch (error) {
            clearInterval(progressInterval);
            progressDiv.classList.add('hidden');
            this.displayUploadError(error);
        } finally {
            uploadBtn.disabled = false;
        }
    }

    /**
     * Display upload success
     */
    displayUploadSuccess(result) {
        const resultsDiv = document.getElementById('upload-results');
        resultsDiv.className = 'upload-results upload-success';
        resultsDiv.innerHTML = `
            <h4>✅ Upload Successful!</h4>
            <p><strong>Message:</strong> ${result.message}</p>
            <p><strong>Rows Processed:</strong> ${result.rows_processed}</p>
            <p><strong>Status:</strong> ${result.status}</p>
            ${result.retraining_started ? '<p>🔄 Model retraining has started in the background.</p>' : ''}
        `;
        resultsDiv.classList.remove('hidden');
    }

    /**
     * Display upload error
     */
    displayUploadError(error) {
        const resultsDiv = document.getElementById('upload-results');
        resultsDiv.className = 'upload-results upload-error';
        resultsDiv.innerHTML = `
            <h4>❌ Upload Failed</h4>
            <p><strong>Error:</strong> ${error.message}</p>
            <p>Please check your file format and try again.</p>
        `;
        resultsDiv.classList.remove('hidden');
    }

    /**
     * Handle test form submission
     */
    async handleTestSubmit(e) {
        e.preventDefault();
        
        const testData = {
            Commodity_name: document.getElementById('test-commodity').value,
            Temperature: parseFloat(document.getElementById('test-temperature').value),
            Humidity: parseFloat(document.getElementById('test-humidity').value),
            Storage_Type: document.getElementById('test-storage').value,
            Days_Since_Harvest: parseInt(document.getElementById('test-days').value)
        };

        const resultsDiv = document.getElementById('test-results');
        resultsDiv.innerHTML = '<div class="loading-spinner"></div><p>Running prediction...</p>';
        resultsDiv.classList.remove('hidden');

        try {
            const result = await this.api.predictSpoilage(testData);
            this.displayTestResults(result);
        } catch (error) {
            this.displayTestError(error);
        }
    }

    /**
     * Display test results
     */
    displayTestResults(result) {
        const resultsDiv = document.getElementById('test-results');
        const riskLevel = this.getRiskLevel(result.spoilage_risk);
        
        resultsDiv.innerHTML = `
            <h4>🧪 Test Prediction Results</h4>
            <div class="status-item">
                <span class="status-label">Spoilage Risk:</span>
                <span class="status-value">${riskLevel.icon} ${(result.spoilage_risk * 100).toFixed(1)}% (${riskLevel.label})</span>
            </div>
            <div class="status-item">
                <span class="status-label">Confidence:</span>
                <span class="status-value">${(result.confidence * 100).toFixed(1)}%</span>
            </div>
            <div class="status-item">
                <span class="status-label">Estimated Shelf Life:</span>
                <span class="status-value">${result.estimated_shelf_life} days</span>
            </div>
            <div class="status-item">
                <span class="status-label">Model Version:</span>
                <span class="status-value">${result.model_version}</span>
            </div>
        `;
    }

    /**
     * Display test error
     */
    displayTestError(error) {
        const resultsDiv = document.getElementById('test-results');
        resultsDiv.innerHTML = `
            <h4>❌ Test Failed</h4>
            <p><strong>Error:</strong> ${error.message}</p>
        `;
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
}

// Function to show admin dashboard
function showAdminDashboard() {
    if (!window.adminDashboard) {
        window.adminDashboard = new AdminDashboard();
    }
}

// Add admin access button to any page
document.addEventListener('DOMContentLoaded', () => {
    // Add a small admin access button (hidden by default)
    const adminAccess = document.createElement('div');
    adminAccess.innerHTML = `
        <button id="show-admin" style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2em;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            z-index: 1000;
            opacity: 0.7;
        " title="Admin Dashboard">
            🔧
        </button>
    `;
    
    document.body.appendChild(adminAccess);
    
    document.getElementById('show-admin').addEventListener('click', showAdminDashboard);
});
