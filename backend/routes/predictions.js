/** POR AHORA ESTO ES UN EJEMPLO */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { generateMockPrediction } = require('../data/mockData');

// URL del servidor de Python ML (tu equipo lo configurará)
const ML_MODEL_URL = process.env.ML_MODEL_URL || 'http://localhost:5000';

// POST - Obtener predicción para una fecha futura
router.post('/predict', async (req, res) => {
  try {
    const { city, date, location, parameter } = req.body;
    
    // Validar datos
    if (!city || !date) {
      return res.status(400).json({ 
        error: 'city and date are required',
        example: {
          city: 'Mexico City',
          date: '2024-10-15',
          location: { lat: 19.4326, lon: -99.1332 },
          parameter: 'pm25'
        }
      });
    }

    // TODO: Cuando tu equipo tenga el modelo listo, descomentar esto:
    /*
    const mlResponse = await axios.post(`${ML_MODEL_URL}/predict`, {
      city,
      date,
      location: location || { lat: 19.4326, lon: -99.1332 },
      parameter: parameter || 'pm25'
    });
    
    return res.json(mlResponse.data);
    */
    
    // TEMPORAL: Mock prediction
    const prediction = generateMockPrediction(
      city, 
      parameter || 'pm25', 
      date
    );
    
    res.json({
      ...prediction,
      note: 'Mock prediction. Will be replaced with ML model predictions.',
      mlModelStatus: 'pending_integration'
    });
    
  } catch (error) {
    console.error('Prediction Error:', error.message);
    
    // Si el modelo ML no está disponible
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'ML model service unavailable',
        message: 'The prediction model is not running. Using mock data.',
        mlModelUrl: ML_MODEL_URL
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// POST - Predicción simple (compatible con código anterior)
router.post('/predict-simple', async (req, res) => {
  try {
    const { city, parameter } = req.body;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const prediction = generateMockPrediction(
      city,
      parameter || 'pm25',
      tomorrow.toISOString().split('T')[0]
    );
    
    res.json({
      prediction: prediction.predictedValue,
      current: prediction.historical.average,
      average: prediction.historical.average,
      trend: prediction.predictedValue > prediction.historical.average ? 'increasing' : 'decreasing',
      unit: prediction.unit,
      confidence: prediction.confidence
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Health check del modelo ML
router.get('/model-status', async (req, res) => {
  try {
    const response = await axios.get(`${ML_MODEL_URL}/health`, {
      timeout: 2000
    });
    
    res.json({
      status: 'connected',
      mlModel: response.data
    });
    
  } catch (error) {
    res.json({
      status: 'disconnected',
      mlModelUrl: ML_MODEL_URL,
      message: 'ML model service is not running. Using mock predictions.',
      error: error.code
    });
  }
});

module.exports = router;