const express = require('express');
const router = express.Router();
const axios = require('axios');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

/**
 * Obtiene predicción del modelo ML
 */
router.post('/predict', async (req, res) => {
  try {
    const { latitude, longitude, hours_ahead = 24 } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'latitude and longitude are required'
      });
    }

    try {
      const response = await axios.post(`${ML_API_URL}/predict`, {
        latitude,
        longitude,
        hours_ahead
      }, { timeout: 30000 });
      
      return res.json(response.data);
    } catch (mlError) {
      console.warn('ML API not available, using fallback:', mlError.message);
      const fallbackData = await getFallbackPrediction(latitude, longitude);
      return res.json(fallbackData);
    }
  } catch (error) {
    console.error('Error in predict route:', error.message);
    res.status(500).json({
      success: false,
      error: 'Prediction service unavailable'
    });
  }
});

/**
 * Obtiene datos históricos del día actual
 */
router.post('/historical', async (req, res) => {
    try {
      const { latitude, longitude, start_date, end_date } = req.body;
      
      if (!latitude || !longitude || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'latitude, longitude, start_date and end_date are required'
        });
      }
  
      // Usar el mismo endpoint que el código de referencia
      const url = 'https://air-quality-api.open-meteo.com/v1/air-quality';
      const params = {
        latitude,
        longitude,
        start_date,
        end_date,
        hourly: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide,uv_index'
      };
  
      const response = await axios.get(url, { params, timeout: 60000 });
      const data = response.data;
      
      const hourly = data.hourly || {};
      const times = hourly.time || [];
      
      // Filtrar hasta la hora actual
      const now = new Date();
      
      const historical = times
        .map((time, i) => {
          const timeObj = new Date(time);
          
          // Solo hasta la hora actual
          if (timeObj > now) return null;
          
          const pm25 = hourly.pm2_5?.[i] || 0;
          
          return {
            time,
            pm25,
            pm10: hourly.pm10?.[i] || 0,
            uv_index: hourly.uv_index?.[i] || 0,
            co: hourly.carbon_monoxide?.[i] || 0,
            no2: hourly.nitrogen_dioxide?.[i] || 0,
            o3: hourly.ozone?.[i] || 0,
            so2: hourly.sulphur_dioxide?.[i] || 0,
            aqi: pm25ToAQI(pm25)
          };
        })
        .filter(item => item !== null);
  
      console.log(`Histórico: ${historical.length} puntos desde ${start_date} hasta ahora`);
  
      res.json({
        success: true,
        historical,
        timezone: data.timezone
      });
      
    } catch (error) {
      console.error('Error fetching historical:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * Fallback usando Open-Meteo directamente
 */
async function getFallbackPrediction(latitude, longitude) {
  try {
    const url = 'https://air-quality-api.open-meteo.com/v1/air-quality';
    const vars = [
      'pm10', 'pm2_5', 'carbon_monoxide', 'carbon_dioxide',
      'nitrogen_dioxide', 'ozone', 'sulphur_dioxide', 'uv_index'
    ].join(',');

    const params = {
      latitude,
      longitude,
      current: vars,
      hourly: 'pm2_5,pm10,uv_index',
      timezone: 'auto',
      forecast_days: 1
    };

    const response = await axios.get(url, { params, timeout: 30000 });
    const data = response.data;

    const currentPM25 = data.current?.pm2_5 || 0;
    const hourlyPM25 = data.hourly?.pm2_5 || [];
    const hourlyPM10 = data.hourly?.pm10 || [];
    const hourlyUV = data.hourly?.uv_index || [];

    const predictions = Array.from({ length: 24 }, (_, i) => {
      const pm25 = hourlyPM25[i] || currentPM25;
      const pm10 = hourlyPM10[i] || pm25 * 1.5;
      const uv = hourlyUV[i] || 0;
      
      return {
        hours_ahead: i + 1,
        pm25: Math.max(0, pm25),
        pm10: Math.max(0, pm10),
        uv_index: Math.max(0, uv),
        aqi: pm25ToAQI(pm25)
      };
    });

    return {
      success: true,
      current_pm25: currentPM25,
      predictions,
      source: 'fallback'
    };
  } catch (error) {
    console.error('Fallback also failed:', error.message);
    throw error;
  }
}

/**
 * Convierte PM2.5 a AQI
 */
function pm25ToAQI(pm25) {
  if (pm25 <= 12) return Math.round((pm25 / 12) * 50);
  if (pm25 <= 35.4) return Math.round(50 + ((pm25 - 12) / 23.4) * 50);
  if (pm25 <= 55.4) return Math.round(100 + ((pm25 - 35.4) / 20) * 50);
  if (pm25 <= 150.4) return Math.round(150 + ((pm25 - 55.4) / 94.6) * 100);
  if (pm25 <= 250.4) return Math.round(200 + ((pm25 - 150.4) / 100) * 100);
  return Math.round(300 + ((pm25 - 250.4) / 99.6) * 100);
}

module.exports = router;