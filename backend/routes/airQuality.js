const express = require('express');
const router = express.Router();
const { generateMockStations } = require('../data/mockData');

// GET datos actuales por ciudad
router.get('/latest/:city', async (req, res) => {
  try {
    const { city } = req.params;
    
    // TODO: Cuando OpenAQ funcione, reemplazar con datos reales
    // const response = await axios.get(`https://api.openaq.org/v3/locations`, {...});
    
    // Por ahora: datos mock
    const results = generateMockStations(city);
    
    res.json({ 
      results,
      meta: {
        found: results.length,
        source: 'mock_data',
        note: 'Using simulated data. Will be replaced with real OpenAQ/NASA data.'
      }
    });
    
  } catch (error) {
    console.error('Air Quality Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET datos por país
router.get('/country/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Mock: generar datos para múltiples ciudades
    const cities = code === 'MX' 
      ? ['Mexico City', 'Guadalajara', 'Monterrey']
      : ['Los Angeles', 'New York'];
    
    const results = cities.flatMap(city => generateMockStations(city));
    
    res.json({ 
      results,
      meta: { found: results.length, source: 'mock_data' }
    });
    
  } catch (error) {
    console.error('Air Quality Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET mediciones (simplificado para mock)
router.get('/measurements', async (req, res) => {
  try {
    const { city, parameter } = req.query;
    
    const allResults = generateMockStations(city || 'Mexico City');
    
    // Filtrar por parámetro si se especifica
    const results = parameter 
      ? allResults.filter(r => r.parameter === parameter)
      : allResults;
    
    res.json({ results });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;