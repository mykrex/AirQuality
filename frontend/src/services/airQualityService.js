// src/services/airQualityService.js

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Obtiene datos completos para la gráfica:
 * - Histórico del día actual (hasta la hora actual)
 * - Predicciones del modelo (horas restantes del día)
 */
export async function getCompleteChartData(latitude, longitude) {
    try {
      console.log('getCompleteChartData llamado con:', { latitude, longitude });
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      
      console.log('Fecha local del navegador:', today);
      console.log('Hora actual:', now.toLocaleString());
      
      // Obtener histórico del día actual
      console.log('Solicitando datos históricos para:', today);
      const historicalResponse = await fetch(`${API_URL}/api/ml/historical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude,
          longitude,
          start_date: today,
          end_date: today
        })
      });
      
      const historicalData = await historicalResponse.json();
      console.log('Datos históricos recibidos:', historicalData.success ? `${historicalData.historical?.length || 0} puntos` : 'ERROR');
      
      // Obtener predicciones del modelo
      const predictResponse = await fetch(`${API_URL}/api/ml/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude,
          longitude,
          hours_ahead: 24
        })
      });
      
      const predictData = await predictResponse.json();
      
      // Procesar datos históricos
      const historical = (historicalData.historical || []).map(item => {
        const time = new Date(item.time);
        return {
          hour: time.getHours(),
          time: time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          value: item.pm25,
          pm10: item.pm10 || 0,
          uv_index: item.uv_index || 0,
          o3: item.o3 || 0,
          no2: item.no2 || 0,
          aqi: item.aqi,
          isNow: time.getHours() === now.getHours() && time.getDate() === now.getDate(),
          isPast: true
        };
      });
      
      // Procesar predicciones
      const predictions = [];
      const currentHour = now.getHours();
      
      if (predictData.success && predictData.predictions) {
        // Filtrar para mostrar solo hasta el final del día (hora 23)
        predictData.predictions.forEach((pred, idx) => {
          const futureHour = (currentHour + pred.hours_ahead) % 24;
          
          // Solo agregar si futureHour > currentHour (evita duplicados del día siguiente)
          if (futureHour > currentHour) {
            predictions.push({
              hour: futureHour,
              time: `${futureHour.toString().padStart(2, '0')}:00`,
              value: pred.pm25,
              pm10: pred.pm10 || pred.pm25 * 1.5,
              uv_index: pred.uv_index || 0,
              o3: 0,
              no2: 0,
              aqi: pred.aqi,
              isNow: false,
              isPast: false
            });
          }
        });
      }
      
      // Combinar y ordenar
      const combined = [...historical, ...predictions].sort((a, b) => a.hour - b.hour);
      
      console.log('Datos combinados:', {
        total: combined.length,
        histórico: historical.length,
        predicciones: predictions.length,
        horas: combined.map(d => d.hour)
      });
      
      return {
        success: true,
        data: combined,
        current: {
          pm25: predictData.current_pm25,
          aqi: predictData.current_aqi,
          o3: predictData.current_o3,
          no2: predictData.current_no2,
          co: predictData.current_co
        }
      };
      
    } catch (error) {
      console.error('Error getting complete chart data:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

/**
 * Obtiene predicciones del modelo ML
 */
export async function getPredictions(latitude, longitude, hoursAhead = 24) {
  try {
    const response = await fetch(`${API_URL}/api/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude,
        longitude,
        hours_ahead: hoursAhead
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error getting predictions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene datos históricos
 */
export async function getHistoricalData(latitude, longitude, startDate, endDate) {
  try {
    const response = await fetch(`${API_URL}/api/ml/historical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude,
        longitude,
        start_date: startDate,
        end_date: endDate
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error getting historical data:', error);
    return { success: false, error: error.message };
  }
}