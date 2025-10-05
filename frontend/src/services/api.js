// Centraliza todas las llamadas al backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ===== DATOS ACTUALES =====
export const getCurrentAirQuality = async (city) => {
  const response = await fetch(`${API_URL}/api/air-quality/latest/${city}`);
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  return await response.json();
};

export const getAirQualityByCountry = async (countryCode) => {
  const response = await fetch(`${API_URL}/api/air-quality/country/${countryCode}`);
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  return await response.json();
};

// ===== PREDICCIONES =====
export const getPrediction = async (city, date, location = null, parameter = 'pm25') => {
  const response = await fetch(`${API_URL}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, date, location, parameter })
  });
  
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  return await response.json();
};

export const getSimplePrediction = async (city, parameter = 'pm25') => {
  const response = await fetch(`${API_URL}/api/predict-simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, parameter })
  });
  
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  return await response.json();
};

// ===== ESTADO DEL SISTEMA =====
export const getHealth = async () => {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  return await response.json();
};

export const getModelStatus = async () => {
  const response = await fetch(`${API_URL}/api/model-status`);
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  return await response.json();
};

// ===== UTILIDADES =====
export const formatDate = (date) => {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
};

export const getAQILevel = (value, parameter) => {
  if (parameter === 'pm25') {
    if (value <= 12) return { level: 'Buena', color: 'green' };
    if (value <= 35.4) return { level: 'Moderada', color: 'yellow' };
    if (value <= 55.4) return { level: 'Insalubre (Sensibles)', color: 'orange' };
    if (value <= 150.4) return { level: 'Insalubre', color: 'red' };
    return { level: 'Muy Insalubre', color: 'purple' };
  }
  return { level: 'N/A', color: 'gray' };
};