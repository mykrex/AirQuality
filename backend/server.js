const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Importar rutas
const airQualityRoutes = require('./routes/airQuality');
const predictionsRoutes = require('./routes/predictions');

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

if (process.env.NODE_ENV === 'production') {
  corsOptions.origin = process.env.FRONTEND_URL;
}

app.use(cors(corsOptions));
app.use(express.json());

// ===== RUTAS =====
app.use('/api/air-quality', airQualityRoutes);
app.use('/api', predictionsRoutes);

// ===== NASA EARTHDATA API (TEMPO) =====
// TODO: Integrar cuando tengan datos procesados
app.get('/api/nasa/tempo', async (req, res) => {
  try {
    const LAADS_TOKEN = process.env.LAADS_APP_KEY;
    
    if (!LAADS_TOKEN) {
      return res.status(401).json({ 
        error: 'LAADS_APP_KEY no configurado en .env',
        note: 'Esta funcionalidad se activará cuando configures las credenciales de NASA'
      });
    }

    // Aquí iría la integración real con TEMPO
    res.json({
      message: 'TEMPO integration pending',
      note: 'Your team can process TEMPO data and expose it here',
      status: 'not_implemented'
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      tip: 'Genera LAADS_APP_KEY en https://ladsweb.modaps.eosdis.nasa.gov/profile/'
    });
  }
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'NASA Air Quality API running',
    version: '2.0 - Refactored',
    environment: process.env.NODE_ENV || 'development',
    features: {
      airQuality: 'mock_data',
      predictions: 'mock_model (awaiting ML integration)',
      tempo: 'pending',
    },
    endpoints: {
      current_data: {
        by_city: 'GET /api/air-quality/latest/:city',
        by_country: 'GET /api/air-quality/country/:code',
        measurements: 'GET /api/air-quality/measurements?city=X&parameter=Y'
      },
      predictions: {
        advanced: 'POST /api/predict (date, city, location, parameter)',
        simple: 'POST /api/predict-simple (city, parameter)',
        model_status: 'GET /api/model-status'
      },
      nasa: {
        tempo: 'GET /api/nasa/tempo'
      }
    },
    integrationGuide: {
      mlModel: 'Set ML_MODEL_URL in .env to connect Python prediction service',
      openaq: 'Currently using mock data. OpenAQ integration pending.',
      tempo: 'Set LAADS_APP_KEY in .env to enable TEMPO data'
    }
  });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Docs: http://localhost:${PORT}/health`);
  console.log(`\n📍 Quick Test:`);
  console.log(`   curl http://localhost:${PORT}/api/air-quality/latest/Mexico%20City`);
  console.log(`\n🤖 ML Model Status:`);
  console.log(`   curl http://localhost:${PORT}/api/model-status`);
  console.log(`\n💡 Using mock data until real integrations are configured\n`);
});