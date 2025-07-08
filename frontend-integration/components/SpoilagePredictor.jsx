// components/SpoilagePredictor.jsx
// Main component for spoilage risk prediction

import React, { useState, useEffect } from 'react';
import { useSpoilageAPI } from '../hooks/useSpoilageAPI';
import './SpoilagePredictor.css';

const SpoilagePredictor = () => {
  const {
    loading,
    error,
    clearError,
    predictSpoilageRisk,
    getCommodities
  } = useSpoilageAPI();

  const [formData, setFormData] = useState({
    Commodity_name: '',
    Commodity_Category: '',
    Temperature: '',
    Humidity: '',
    Storage_Type: 'cold_storage',
    Days_Since_Harvest: '',
    Transport_Duration: '',
    Packaging_Quality: 'good',
    Month_num: '',
    Location: '',
    Ethylene_Level: ''
  });

  const [prediction, setPrediction] = useState(null);
  const [commodities, setCommodities] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load commodities on component mount
  useEffect(() => {
    const loadCommodities = async () => {
      try {
        const commoditiesData = await getCommodities();
        setCommodities(commoditiesData);
      } catch (err) {
        console.error('Failed to load commodities:', err);
      }
    };
    loadCommodities();
  }, [getCommodities]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-detect commodity category
    if (name === 'Commodity_name') {
      const category = findCommodityCategory(value);
      setFormData(prev => ({
        ...prev,
        Commodity_Category: category
      }));
    }

    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  // Find commodity category based on name
  const findCommodityCategory = (commodityName) => {
    for (const [category, items] of Object.entries(commodities)) {
      if (items.some(item => 
        item.toLowerCase() === commodityName.toLowerCase()
      )) {
        return category;
      }
    }
    return '';
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPrediction(null);

    try {
      const result = await predictSpoilageRisk(formData);
      setPrediction(result);
    } catch (err) {
      console.error('Prediction failed:', err);
      // Error is already handled by the hook
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      Commodity_name: '',
      Commodity_Category: '',
      Temperature: '',
      Humidity: '',
      Storage_Type: 'cold_storage',
      Days_Since_Harvest: '',
      Transport_Duration: '',
      Packaging_Quality: 'good',
      Month_num: '',
      Location: '',
      Ethylene_Level: ''
    });
    setPrediction(null);
    clearError();
  };

  // Get risk color based on level
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low Risk': return '#4CAF50';
      case 'Medium Risk': return '#FF9800';
      case 'High Risk': return '#F44336';
      default: return '#757575';
    }
  };

  // Get risk icon
  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'Low Risk': return '✅';
      case 'Medium Risk': return '⚠️';
      case 'High Risk': return '🚨';
      default: return '❓';
    }
  };

  return (
    <div className="spoilage-predictor">
      <div className="predictor-header">
        <h2>🌱 Spoilage Risk Predictor</h2>
        <p>AI-powered food spoilage risk assessment for better supply chain management</p>
      </div>

      <form onSubmit={handleSubmit} className="prediction-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>📦 Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="Commodity_name">Commodity Name *</label>
              <input
                type="text"
                id="Commodity_name"
                name="Commodity_name"
                value={formData.Commodity_name}
                onChange={handleInputChange}
                placeholder="e.g., Tomato, Mango, Rice"
                required
                list="commodities-list"
              />
              <datalist id="commodities-list">
                {Object.values(commodities).flat().map((commodity, index) => (
                  <option key={index} value={commodity} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label htmlFor="Commodity_Category">Category</label>
              <select
                id="Commodity_Category"
                name="Commodity_Category"
                value={formData.Commodity_Category}
                onChange={handleInputChange}
              >
                <option value="">Auto-detected</option>
                {Object.keys(commodities).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="Location">Location *</label>
              <input
                type="text"
                id="Location"
                name="Location"
                value={formData.Location}
                onChange={handleInputChange}
                placeholder="e.g., Delhi, Mumbai"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="Month_num">Month *</label>
              <select
                id="Month_num"
                name="Month_num"
                value={formData.Month_num}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Month</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Environmental Conditions */}
        <div className="form-section">
          <h3>🌡️ Environmental Conditions</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="Temperature">Temperature (°C) *</label>
              <input
                type="number"
                id="Temperature"
                name="Temperature"
                value={formData.Temperature}
                onChange={handleInputChange}
                min="0"
                max="50"
                step="0.1"
                required
              />
              <span className="form-hint">0-50°C</span>
            </div>

            <div className="form-group">
              <label htmlFor="Humidity">Humidity (%) *</label>
              <input
                type="number"
                id="Humidity"
                name="Humidity"
                value={formData.Humidity}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.1"
                required
              />
              <span className="form-hint">0-100%</span>
            </div>
          </div>
        </div>

        {/* Storage & Transport */}
        <div className="form-section">
          <h3>📦 Storage & Transport</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="Storage_Type">Storage Type *</label>
              <select
                id="Storage_Type"
                name="Storage_Type"
                value={formData.Storage_Type}
                onChange={handleInputChange}
                required
              >
                <option value="cold_storage">Cold Storage</option>
                <option value="room_temperature">Room Temperature</option>
                <option value="open_air">Open Air</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="Packaging_Quality">Packaging Quality *</label>
              <select
                id="Packaging_Quality"
                name="Packaging_Quality"
                value={formData.Packaging_Quality}
                onChange={handleInputChange}
                required
              >
                <option value="good">Good</option>
                <option value="average">Average</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="Days_Since_Harvest">Days Since Harvest *</label>
              <input
                type="number"
                id="Days_Since_Harvest"
                name="Days_Since_Harvest"
                value={formData.Days_Since_Harvest}
                onChange={handleInputChange}
                min="0"
                max="30"
                required
              />
              <span className="form-hint">0-30 days</span>
            </div>

            <div className="form-group">
              <label htmlFor="Transport_Duration">Transport Duration (hours) *</label>
              <input
                type="number"
                id="Transport_Duration"
                name="Transport_Duration"
                value={formData.Transport_Duration}
                onChange={handleInputChange}
                min="0"
                max="72"
                step="0.1"
                required
              />
              <span className="form-hint">0-72 hours</span>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="form-section">
          <button
            type="button"
            className="toggle-advanced"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '🔽' : '▶️'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="Ethylene_Level">Ethylene Level (ppm)</label>
                <input
                  type="number"
                  id="Ethylene_Level"
                  name="Ethylene_Level"
                  value={formData.Ethylene_Level}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="form-hint">Optional: 0-100 ppm</span>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={resetForm}
            className="btn btn-secondary"
            disabled={loading}
          >
            🔄 Reset
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '🔄 Predicting...' : '🔮 Predict Spoilage Risk'}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">❌</span>
            <div>
              <strong>Prediction Failed</strong>
              <p>{error}</p>
            </div>
            <button onClick={clearError} className="error-close">×</button>
          </div>
        </div>
      )}

      {/* Prediction Results */}
      {prediction && (
        <div className="prediction-results">
          <div className="results-header">
            <h3>🎯 Prediction Results</h3>
            <span className="prediction-time">
              {new Date(prediction.Timestamp).toLocaleString()}
            </span>
          </div>

          <div className="results-grid">
            {/* Main Risk Display */}
            <div className="risk-summary">
              <div 
                className="risk-level"
                style={{ color: getRiskColor(prediction.Risk_Interpretation) }}
              >
                <span className="risk-icon">
                  {getRiskIcon(prediction.Risk_Interpretation)}
                </span>
                <span className="risk-text">
                  {prediction.Risk_Interpretation}
                </span>
              </div>
              
              <div className="risk-score">
                <div className="score-label">Risk Score</div>
                <div className="score-value">
                  {(prediction.Spoilage_Risk_Score * 100).toFixed(1)}%
                </div>
              </div>

              <div className="confidence-score">
                <div className="confidence-label">Confidence</div>
                <div className="confidence-value">
                  {(prediction.Confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Probability Breakdown */}
            <div className="probability-breakdown">
              <h4>Risk Probability Distribution</h4>
              {Object.entries(prediction.Probabilities).map(([risk, prob]) => (
                <div key={risk} className="probability-item">
                  <div className="probability-label">
                    {risk.replace('_', ' ')}
                  </div>
                  <div className="probability-bar">
                    <div 
                      className="probability-fill"
                      style={{
                        width: `${prob * 100}%`,
                        backgroundColor: getRiskColor(risk.replace('_', ' ') + ' Risk')
                      }}
                    />
                  </div>
                  <div className="probability-value">
                    {(prob * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Summary */}
          <div className="input-summary">
            <h4>📋 Input Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Commodity:</span>
                <span className="summary-value">
                  {prediction.Input_Summary.commodity} ({prediction.Input_Summary.category})
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Location:</span>
                <span className="summary-value">{prediction.Input_Summary.location}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Temperature:</span>
                <span className="summary-value">{prediction.Input_Summary.temperature}°C</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Humidity:</span>
                <span className="summary-value">{prediction.Input_Summary.humidity}%</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Storage:</span>
                <span className="summary-value">{prediction.Input_Summary.storage}</span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="recommendations">
            <h4>💡 Recommendations</h4>
            <div className="recommendation-list">
              {prediction.Risk_Interpretation === 'Low Risk' && (
                <div className="recommendation low-risk">
                  ✅ Current conditions are optimal. Continue monitoring and maintain storage conditions.
                </div>
              )}
              {prediction.Risk_Interpretation === 'Medium Risk' && (
                <div className="recommendation medium-risk">
                  ⚠️ Consider improving storage conditions or reducing transport time. Monitor closely.
                </div>
              )}
              {prediction.Risk_Interpretation === 'High Risk' && (
                <div className="recommendation high-risk">
                  🚨 Immediate action required! Consider expedited sale, processing, or improved storage.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpoilagePredictor;
