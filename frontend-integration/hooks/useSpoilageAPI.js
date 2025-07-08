// hooks/useSpoilageAPI.js
// Custom React hook for Surplus2Serve API integration

import { useState, useCallback } from 'react';
import axios from 'axios';

// Configure API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const useSpoilageAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Health check endpoint
  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/health');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Health check failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Predict spoilage risk
  const predictSpoilageRisk = useCallback(async (formData) => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      const requiredFields = [
        'Commodity_name',
        'Temperature', 
        'Humidity',
        'Storage_Type',
        'Days_Since_Harvest',
        'Transport_Duration',
        'Packaging_Quality',
        'Month_num',
        'Location'
      ];

      for (const field of requiredFields) {
        if (!formData[field] && formData[field] !== 0) {
          throw new Error(`${field} is required`);
        }
      }

      // Format the request data
      const requestData = {
        Commodity_name: formData.Commodity_name,
        Commodity_Category: formData.Commodity_Category || null,
        Temperature: parseFloat(formData.Temperature),
        Humidity: parseFloat(formData.Humidity),
        Storage_Type: formData.Storage_Type,
        Days_Since_Harvest: parseInt(formData.Days_Since_Harvest),
        Transport_Duration: parseFloat(formData.Transport_Duration),
        Packaging_Quality: formData.Packaging_Quality,
        Month_num: parseInt(formData.Month_num),
        Location: formData.Location,
        Ethylene_Level: formData.Ethylene_Level ? parseFloat(formData.Ethylene_Level) : null
      };

      const response = await apiClient.post('/predict', requestData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Prediction failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload training data
  const uploadTrainingData = useCallback(async (file) => {
    try {
      setLoading(true);
      setError(null);

      if (!file) {
        throw new Error('No file provided');
      }

      if (!file.name.endsWith('.csv')) {
        throw new Error('Only CSV files are supported');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/upload_data', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get model information
  const getModelInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/model_info');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to get model info';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get supported commodities
  const getCommodities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/commodities');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to get commodities';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    clearError,
    checkHealth,
    predictSpoilageRisk,
    uploadTrainingData,
    getModelInfo,
    getCommodities,
  };
};

export default useSpoilageAPI;
