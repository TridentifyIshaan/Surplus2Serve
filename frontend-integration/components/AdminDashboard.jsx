// components/AdminDashboard.jsx
// Admin dashboard for model management and data upload

import React, { useState, useEffect } from 'react';
import { useSpoilageAPI } from '../hooks/useSpoilageAPI';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const {
    loading,
    error,
    clearError,
    checkHealth,
    uploadTrainingData,
    getModelInfo
  } = useSpoilageAPI();

  const [health, setHealth] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [healthData, modelData] = await Promise.all([
        checkHealth(),
        getModelInfo()
      ]);
      setHealth(healthData);
      setModelInfo(modelData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setUploadStatus(null);
    clearError();
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      setUploadStatus(null);
      clearError();
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    try {
      const result = await uploadTrainingData(selectedFile);
      setUploadStatus(result);
      setSelectedFile(null);
      
      // Refresh model info after upload
      setTimeout(() => {
        getModelInfo().then(setModelInfo);
      }, 1000);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    loadDashboardData();
    setUploadStatus(null);
    clearError();
  };

  // Get health status color
  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'unhealthy': return '#F44336';
      default: return '#FF9800';
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>🔧 Admin Dashboard</h2>
        <p>Manage your Surplus2Serve prediction model</p>
        <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Health Status */}
      <div className="dashboard-section">
        <h3>🏥 System Health</h3>
        <div className="health-grid">
          {health ? (
            <>
              <div className="health-item">
                <div className="health-label">API Status</div>
                <div 
                  className="health-value"
                  style={{ color: getHealthColor(health.status) }}
                >
                  {health.status}
                </div>
              </div>
              <div className="health-item">
                <div className="health-label">Model Status</div>
                <div 
                  className="health-value"
                  style={{ color: health.model_status === 'loaded' ? '#4CAF50' : '#F44336' }}
                >
                  {health.model_status}
                </div>
              </div>
              <div className="health-item">
                <div className="health-label">Version</div>
                <div className="health-value">{health.version}</div>
              </div>
              <div className="health-item">
                <div className="health-label">Last Check</div>
                <div className="health-value">
                  {new Date(health.timestamp).toLocaleString()}
                </div>
              </div>
            </>
          ) : (
            <div className="loading-placeholder">Loading health data...</div>
          )}
        </div>
      </div>

      {/* Model Information */}
      <div className="dashboard-section">
        <h3>🤖 Model Information</h3>
        <div className="model-info">
          {modelInfo && modelInfo.model_loaded ? (
            <div className="model-details">
              <div className="model-item">
                <span className="model-label">Model Type:</span>
                <span className="model-value">{modelInfo.model_type}</span>
              </div>
              <div className="model-item">
                <span className="model-label">Training Data Rows:</span>
                <span className="model-value">{modelInfo.training_data_rows.toLocaleString()}</span>
              </div>
              {modelInfo.last_updated && (
                <div className="model-item">
                  <span className="model-label">Last Updated:</span>
                  <span className="model-value">
                    {new Date(modelInfo.last_updated).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="model-error">
              ❌ Model not loaded or information unavailable
            </div>
          )}
        </div>
      </div>

      {/* Data Upload */}
      <div className="dashboard-section">
        <h3>📊 Upload Training Data</h3>
        <div className="upload-section">
          <div 
            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="upload-content">
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <p><strong>Drop CSV files here or click to browse</strong></p>
                <p>Upload training data to improve model accuracy</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="file-input"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="file-label">
                Choose File
              </label>
            </div>
          </div>

          {selectedFile && (
            <div className="selected-file">
              <div className="file-info">
                <span className="file-icon">📄</span>
                <div className="file-details">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="remove-file"
                >
                  ×
                </button>
              </div>
              <button 
                onClick={handleUpload}
                className="upload-btn"
                disabled={loading}
              >
                {loading ? '🔄 Uploading...' : '🚀 Upload & Retrain'}
              </button>
            </div>
          )}

          <div className="upload-requirements">
            <h4>📋 CSV Requirements</h4>
            <ul>
              <li>Required columns: Temperature, Humidity, Storage_Type, Days_Since_Harvest, Transport_Duration, Packaging_Quality, Month_num, Commodity_name, Spoilage_Risk</li>
              <li>Spoilage_Risk values should be 0 (Low), 1 (Medium), or 2 (High)</li>
              <li>Temperature: 0-50°C, Humidity: 0-100%</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <div className="dashboard-section">
          <h3>✅ Upload Success</h3>
          <div className="upload-success">
            <div className="success-message">
              <p><strong>{uploadStatus.message}</strong></p>
              <div className="upload-stats">
                <div className="stat-item">
                  <span className="stat-label">Rows Added:</span>
                  <span className="stat-value">{uploadStatus.rows_added}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Rows:</span>
                  <span className="stat-value">{uploadStatus.total_rows}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Retraining:</span>
                  <span className="stat-value">
                    {uploadStatus.retraining_started ? '🔄 In Progress' : '❌ Not Started'}
                  </span>
                </div>
              </div>
              <div className="upload-time">
                Uploaded: {new Date(uploadStatus.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="dashboard-section">
          <div className="error-message">
            <div className="error-content">
              <span className="error-icon">❌</span>
              <div>
                <strong>Error</strong>
                <p>{error}</p>
              </div>
              <button onClick={clearError} className="error-close">×</button>
            </div>
          </div>
        </div>
      )}

      {/* API Documentation Link */}
      <div className="dashboard-section">
        <h3>📖 API Documentation</h3>
        <div className="documentation-links">
          <a 
            href={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="doc-link"
          >
            🔗 Interactive API Docs (Swagger UI)
          </a>
          <a 
            href={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/redoc`}
            target="_blank"
            rel="noopener noreferrer"
            className="doc-link"
          >
            📚 API Documentation (ReDoc)
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
