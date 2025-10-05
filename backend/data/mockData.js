// Datos simulados de estaciones de monitoreo
const generateMockStations = (city) => {
    const cityCoordinates = {
      'Mexico City': { lat: 19.4326, lon: -99.1332 },
      'Guadalajara': { lat: 20.6597, lon: -103.3496 },
      'Monterrey': { lat: 25.6866, lon: -100.3161 },
      'Los Angeles': { lat: 34.0522, lon: -118.2437 },
      'New York': { lat: 40.7128, lon: -74.0060 },
      'Santiago': { lat: -33.4489, lon: -70.6693 },
      'Lima': { lat: -12.0464, lon: -77.0428 },
    };
  
    const coords = cityCoordinates[city] || cityCoordinates['Mexico City'];
    
    const stations = [
      {
        name: `${city} Centro`,
        offset: { lat: 0, lon: 0 },
        pm25: Math.random() * 40 + 10, // 10-50
        no2: Math.random() * 60 + 20,   // 20-80
        o3: Math.random() * 50 + 30,    // 30-80
      },
      {
        name: `${city} Norte`,
        offset: { lat: 0.05, lon: 0.01 },
        pm25: Math.random() * 35 + 15,
        no2: Math.random() * 55 + 25,
        o3: Math.random() * 45 + 35,
      },
      {
        name: `${city} Sur`,
        offset: { lat: -0.05, lon: -0.01 },
        pm25: Math.random() * 45 + 20,
        no2: Math.random() * 65 + 30,
        o3: Math.random() * 55 + 25,
      },
      {
        name: `${city} Este`,
        offset: { lat: 0.01, lon: 0.05 },
        pm25: Math.random() * 38 + 12,
        no2: Math.random() * 58 + 22,
        o3: Math.random() * 48 + 32,
      },
      {
        name: `${city} Oeste`,
        offset: { lat: -0.01, lon: -0.05 },
        pm25: Math.random() * 42 + 18,
        no2: Math.random() * 62 + 28,
        o3: Math.random() * 52 + 28,
      },
    ];
  
    return stations.map(station => {
      const measurements = [
        { parameter: 'pm25', value: parseFloat(station.pm25.toFixed(1)), unit: 'µg/m³' },
        { parameter: 'no2', value: parseFloat(station.no2.toFixed(1)), unit: 'ppb' },
        { parameter: 'o3', value: parseFloat(station.o3.toFixed(1)), unit: 'ppb' },
      ];
  
      return {
        location: station.name,
        city: city,
        country: 'Mock Data',
        coordinates: {
          latitude: coords.lat + station.offset.lat,
          longitude: coords.lon + station.offset.lon,
        },
        parameter: 'pm25', // Principal para compatibilidad
        value: parseFloat(station.pm25.toFixed(1)),
        unit: 'µg/m³',
        date: {
          utc: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString(),
        measurements: measurements
      };
    });
  };
  
  // Generar predicción mock (será reemplazado por el modelo real)
  const generateMockPrediction = (city, parameter, targetDate) => {
    const baseValue = Math.random() * 35 + 15; // 15-50
    const variation = (Math.random() - 0.5) * 10; // -5 a +5
    
    return {
      date: targetDate,
      city: city,
      parameter: parameter,
      predictedValue: parseFloat((baseValue + variation).toFixed(2)),
      confidence: parseFloat((Math.random() * 20 + 70).toFixed(1)), // 70-90%
      unit: parameter === 'pm25' ? 'µg/m³' : 'ppb',
      model: 'Mock Model v1.0 (placeholder)',
      historical: {
        average: parseFloat(baseValue.toFixed(2)),
        min: parseFloat((baseValue - 10).toFixed(2)),
        max: parseFloat((baseValue + 15).toFixed(2)),
      }
    };
  };
  
  module.exports = {
    generateMockStations,
    generateMockPrediction
  };