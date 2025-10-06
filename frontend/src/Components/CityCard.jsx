import { useState, useEffect } from 'react';
import { Wind, Loader } from 'lucide-react';
import AirQualityMap from './Map';
import AirQualityChart from './Chart';
import AirQualityInsights from './Insights';
import { getCompleteChartData } from '../services/airQualityService';

function CityCardExpanded({ city, onRemove }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentData, setCurrentData] = useState(null);

  useEffect(() => {
    if (city.coordinates) {
      loadChartData();
      
      // Actualizar cada 5 minutos
      const interval = setInterval(loadChartData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [city.coordinates]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      const [lng, lat] = city.coordinates;
      
      const result = await getCompleteChartData(lat, lng);
      
      if (result.success) {
        setChartData(result.data);
        setCurrentData(result.current);
        console.log('✅ Datos del modelo cargados:', result.data.length, 'puntos');
      } else {
        console.error('❌ Error obteniendo datos:', result.error);
        // Usar datos mock como fallback
        
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const data = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Histórico
    for (let i = 0; i <= currentHour; i++) {
      const baseValue = 25 + Math.sin(i / 24 * Math.PI * 2) * 15;
      const noise = Math.random() * 5;
      
      data.push({
        hour: i,
        time: `${i.toString().padStart(2, '0')}:00`,
        value: Math.max(5, baseValue + noise),
        aqi: Math.min(150, Math.round((baseValue + noise) * 2)),
        isNow: i === currentHour,
        isPast: true
      });
    }
    
    // Predicciones mock
    for (let i = currentHour + 1; i < 24; i++) {
      const baseValue = 25 + Math.sin(i / 24 * Math.PI * 2) * 15;
      const noise = Math.random() * 5;
      
      data.push({
        hour: i,
        time: `${i.toString().padStart(2, '0')}:00`,
        value: Math.max(5, baseValue + noise),
        aqi: Math.min(150, Math.round((baseValue + noise) * 2)),
        isNow: false,
        isPast: false
      });
    }
    
    return data;
  };

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return { level: 'Buena', color: 'bg-green-500', desc: 'La calidad del aire es satisfactoria' };
    if (aqi <= 100) return { level: 'Moderada', color: 'bg-yellow-500', desc: 'Aceptable para la mayoría' };
    if (aqi <= 150) return { level: 'Insalubre para grupos sensibles', color: 'bg-orange-500', desc: 'Grupos sensibles pueden experimentar efectos' };
    if (aqi <= 200) return { level: 'Insalubre', color: 'bg-red-500', desc: 'Todos pueden experimentar efectos en la salud' };
    return { level: 'Muy Insalubre', color: 'bg-purple-600', desc: 'Alerta de salud' };
  };

  // Usar datos del modelo o fallback a los datos de la ciudad
  const displayAQI = currentData?.aqi || city.airQuality?.aqi || 96;
  const displayPM25 = currentData?.pm25 || city.airQuality?.pm25 || '23.1';
  const aqiInfo = getAQILevel(displayAQI);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6 border border-gray-200">
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{city.label}</h2>
          <p className="text-sm opacity-90 font-mono">
            {city.coordinates && `Lat: ${city.coordinates[1].toFixed(6)}, Lon: ${city.coordinates[0].toFixed(6)}`}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-2 hover:bg-blue-700 rounded-full transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-gray-600">Cargando datos del modelo ML...</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6 p-6">
          <div className="lg:col-span-2 space-y-4">
            <AirQualityMap
              latitude={city.coordinates ? city.coordinates[1] : 40.712749}
              longitude={city.coordinates ? city.coordinates[0] : -74.005994}
              pm25Value={parseFloat(displayPM25)}
              cityName={city.label}
            />

            <div className={`${aqiInfo.color} rounded-xl p-4 text-white`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold">{aqiInfo.level}</h3>
                  <p className="text-xs opacity-90">{aqiInfo.desc}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{displayAQI}</div>
                  <div className="text-xs opacity-90">AQI</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Wind className="w-3 h-3" />
                    <span className="text-xs">PM2.5</span>
                  </div>
                  <div className="text-xl font-bold">{displayPM25}</div>
                  <div className="text-xs opacity-90">µg/m³</div>
                </div>

                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Wind className="w-3 h-3" />
                    <span className="text-xs">CO</span>
                  </div>
                  <div className="text-xl font-bold">
                    {(() => {
                      const co = city.airQuality?.co || currentData?.co;
                      if (co && typeof co === 'number') {
                        return co.toFixed(0);
                      }
                      return '0';
                    })()}
                  </div>
                  <div className="text-xs opacity-90">μg/m³</div>
                </div>

                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Wind className="w-3 h-3" />
                    <span className="text-xs">O₃</span>
                  </div>
                  <div className="text-xl font-bold">
                    {city.airQuality?.o3 || currentData?.o3 || '0.0'}
                  </div>
                  <div className="text-xs opacity-90">ppb</div>
                </div>

                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Wind className="w-3 h-3" />
                    <span className="text-xs">NO₂</span>
                  </div>
                  <div className="text-xl font-bold">
                    {city.airQuality?.no2 || currentData?.no2 || '0.0'}
                  </div>
                  <div className="text-xs opacity-90">ppb</div>
                </div>
              </div>

              <div className="mt-3 pt-3">
                <p className="text-xs opacity-75">
                  {currentData ? '' : '📊 Datos de referencia'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <AirQualityChart chartData={chartData} />
            <AirQualityInsights hourlyData={chartData} />
          </div>
        </div>
      )}
    </div>
  );
}

export default CityCardExpanded;