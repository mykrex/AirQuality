import { Wind } from 'lucide-react';
import AirQualityMap from './Map';
import AirQualityChart from './Chart';
import AirQualityInsights from './Insights';

function CityCardExpanded({ city, onRemove }) {
  // Generar datos de predicción por hora (24 horas)
  const generateHourlyData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
      const baseValue = 25 + Math.sin(i / 24 * Math.PI * 2) * 15;
      const noise = Math.random() * 5;
      
      data.push({
        hour: hour.getHours(),
        time: hour.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        value: Math.max(5, baseValue + noise),
        aqi: Math.min(150, Math.round((baseValue + noise) * 2)),
        isNow: i === 0
      });
    }
    return data;
  };

  const hourlyData = generateHourlyData();

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return { level: 'Buena', color: 'bg-green-500', desc: 'La calidad del aire es satisfactoria' };
    if (aqi <= 100) return { level: 'Moderada', color: 'bg-yellow-500', desc: 'Aceptable para la mayoría' };
    if (aqi <= 150) return { level: 'Insalubre para grupos sensibles', color: 'bg-orange-500', desc: 'Grupos sensibles pueden experimentar efectos' };
    if (aqi <= 200) return { level: 'Insalubre', color: 'bg-red-500', desc: 'Todos pueden experimentar efectos en la salud' };
    return { level: 'Muy Insalubre', color: 'bg-purple-600', desc: 'Alerta de salud' };
  };

  const aqiInfo = getAQILevel(city.airQuality?.aqi || 96);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6 border border-gray-200">
      {/* Header */}
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

      {/* Grid: 35% izquierda / 65% derecha */}
      <div className="grid lg:grid-cols-5 gap-6 p-6">
        
        {/* COLUMNA IZQUIERDA (2/5 = 40%) - MÁS PEQUEÑA */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mapa */}
          <AirQualityMap
            latitude={city.coordinates ? city.coordinates[1] : 40.712749}
            longitude={city.coordinates ? city.coordinates[0] : -74.005994}
            pm25Value={parseFloat(city.airQuality?.pm25) || 23.1}
            cityName={city.label}
          />

          {/* AQI Card - MÁS COMPACTA */}
          <div className={`${aqiInfo.color} rounded-xl p-4 text-white`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold">{aqiInfo.level}</h3>
                <p className="text-xs opacity-90">{aqiInfo.desc}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{city.airQuality?.aqi || '96'}</div>
                <div className="text-xs opacity-90">AQI</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Wind className="w-3 h-3" />
                  <span className="text-xs">PM2.5</span>
                </div>
                <div className="text-xl font-bold">{city.airQuality?.pm25 || '23.1'}</div>
                <div className="text-xs opacity-90">µg/m³</div>
              </div>

              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Wind className="w-3 h-3" />
                  <span className="text-xs">PM10</span>
                </div>
                <div className="text-xl font-bold">{city.airQuality?.pm10 || '34.7'}</div>
                <div className="text-xs opacity-90">µg/m³</div>
              </div>

              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Wind className="w-3 h-3" />
                  <span className="text-xs">O₃</span>
                </div>
                <div className="text-xl font-bold">{city.airQuality?.o3 || '45.2'}</div>
                <div className="text-xs opacity-90">ppb</div>
              </div>

              <div className="bg-white bg-opacity-20 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Wind className="w-3 h-3" />
                  <span className="text-xs">NO₂</span>
                </div>
                <div className="text-xl font-bold">{city.airQuality?.no2 || '38.5'}</div>
                <div className="text-xs opacity-90">ppb</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white border-opacity-30">
              <p className="text-xs opacity-75">
                Actualizado: {new Date().toLocaleString('es-MX', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (3/5 = 60%) - MÁS GRANDE PARA DESTACAR GRÁFICA */}
        <div className="lg:col-span-3 space-y-4">
          {/* Gráfica - DESTACADA */}
          <AirQualityChart hourlyData={hourlyData} />

          {/* Insights */}
          <AirQualityInsights hourlyData={hourlyData} />
        </div>
      </div>
    </div>
  );
}

export default CityCardExpanded;