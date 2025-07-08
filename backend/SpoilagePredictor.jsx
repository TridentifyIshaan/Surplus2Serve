// SpoilagePredictor.jsx - React component for Surplus2Serve API integration
// This demonstrates how to connect your React frontend to the FastAPI backend

import React, { useState } from 'react';
import axios from 'axios';

const SpoilagePredictor = () => {
  const [formData, setFormData] = useState({
    Commodity_name: '',
    Temperature: '',
    Humidity: '',
    Storage_Type: 'cold_storage',
    Days_Since_Harvest: '',
    Transport_Duration: '',
    Packaging_Quality: 'good',
    Month_num: '',
    Location: ''
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API base URL - adjust for your deployment
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      // Convert string values to appropriate types
      const requestData = {
        ...formData,
        Temperature: parseFloat(formData.Temperature),
        Humidity: parseFloat(formData.Humidity),
        Days_Since_Harvest: parseInt(formData.Days_Since_Harvest),
        Transport_Duration: parseFloat(formData.Transport_Duration),
        Month_num: parseInt(formData.Month_num)
      };

      const response = await axios.post(`${API_BASE_URL}/predict`, requestData);
      setPrediction(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Please try again.');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low Risk': return '#4CAF50';
      case 'Medium Risk': return '#FF9800';
      case 'High Risk': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <div className="spoilage-predictor" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>🌱 Spoilage Risk Predictor</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label>Commodity Name:</label>
            <input
              type="text"
              name="Commodity_name"
              value={formData.Commodity_name}
              onChange={handleInputChange}
              placeholder="e.g., Tomato, Mango, Rice"
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div>
            <label>Location:</label>
            <input
              type="text"
              name="Location"
              value={formData.Location}
              onChange={handleInputChange}
              placeholder="e.g., Delhi, Mumbai"
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div>
            <label>Temperature (°C):</label>
            <input
              type="number"
              name="Temperature"
              value={formData.Temperature}
              onChange={handleInputChange}
              min="0"
              max="50"
              step="0.1"
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div>
            <label>Humidity (%):</label>
            <input
              type="number"
              name="Humidity"
              value={formData.Humidity}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.1"
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div>
            <label>Storage Type:</label>
            <select
              name="Storage_Type"
              value={formData.Storage_Type}
              onChange={handleInputChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="cold_storage">Cold Storage</option>
              <option value="room_temperature">Room Temperature</option>
              <option value="open_air">Open Air</option>
            </select>
          </div>

          <div>
            <label>Packaging Quality:</label>
            <select
              name="Packaging_Quality"
              value={formData.Packaging_Quality}
              onChange={handleInputChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div>
            <label>Days Since Harvest:</label>
            <input
              type="number"
              name="Days_Since_Harvest"
              value={formData.Days_Since_Harvest}
              onChange={handleInputChange}
              min="0"
              max="30"
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div>
            <label>Transport Duration (hours):</label>
            <input
              type="number"
              name="Transport_Duration"
              value={formData.Transport_Duration}
              onChange={handleInputChange}
              min="0"
              max="72"
              step="0.1"
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div>
            <label>Month (1-12):</label>
            <input
              type="number"
              name="Month_num"
              value={formData.Month_num}
              onChange={handleInputChange}
              min="1"
              max="12"
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? '🔄 Predicting...' : '🔮 Predict Spoilage Risk'}
        </button>
      </form>

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          border: '1px solid #ef5350'
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {prediction && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h3>🎯 Prediction Results</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginTop: '15px'
          }}>
            <div>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: getRiskColor(prediction.Risk_Interpretation),
                marginBottom: '10px'
              }}>
                {prediction.Risk_Interpretation}
              </div>
              
              <div>
                <strong>Risk Score:</strong> {(prediction.Spoilage_Risk_Score * 100).toFixed(1)}%
              </div>
              
              <div>
                <strong>Confidence:</strong> {(prediction.Confidence * 100).toFixed(1)}%
              </div>
              
              <div>
                <strong>Commodity:</strong> {prediction.Input_Summary.commodity}
              </div>
            </div>

            <div>
              <h4>Risk Probabilities:</h4>
              {Object.entries(prediction.Probabilities).map(([risk, prob]) => (
                <div key={risk} style={{ marginBottom: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{risk.replace('_', ' ')}</span>
                    <span>{(prob * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${prob * 100}%`,
                      height: '100%',
                      backgroundColor: getRiskColor(risk.replace('_', ' ') + ' Risk'),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666'
          }}>
            <strong>Prediction timestamp:</strong> {new Date(prediction.Timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpoilagePredictor;

// Usage in your App.js:
/*
import SpoilagePredictor from './components/SpoilagePredictor';

function App() {
  return (
    <div className="App">
      <SpoilagePredictor />
    </div>
  );
}
*/

// Environment variables (.env file):
/*
REACT_APP_API_URL=http://localhost:8000
# For production, replace with your deployed API URL
# REACT_APP_API_URL=https://your-api-domain.com
*/
