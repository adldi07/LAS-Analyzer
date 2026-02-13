import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const wellApi = {
  // Upload LAS file
  uploadLASFile: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/wells', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress?.(percentCompleted);
      },
    });

    return response.data;
  },

  // Get well metadata
  getWell: async (wellId) => {
    const response = await api.get(`/wells/${wellId}`);
    return response.data;
  },

  // Get measurement data
  getMeasurements: async (wellId, curves, depthStart, depthStop) => {
    const response = await api.get(`/wells/${wellId}/data`, {
      params: {
        curves: curves.join(','),
        depthStart,
        depthStop,
      },
    });
    return response.data;
  },

  // AI Interpretation
  interpretWell: async (wellId, curves, depthStart, depthStop) => {
    const response = await api.post(`/wells/${wellId}/interpret`, {
      curves,
      depthStart,
      depthStop,
    });
    return response.data;
  },

  // Chatbot
  sendChatMessage: async (wellId, message, history) => {
    const response = await api.post(`/wells/${wellId}/chat`, {
      message,
      history,
    });
    return response.data;
  },
};

export default api;