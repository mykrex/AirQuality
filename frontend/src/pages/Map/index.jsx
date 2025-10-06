import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { MapPin, Activity, Navigation, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import Navbar from '../../Components/Navbar';
import AirQualityChart from '../../Components/Chart';
import { getCompleteChartData, getPredictions } from '../../services/airQualityService';

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function Map({ onNavigate, userId = '1' }) {
  const [userLocation, setUserLocation] = useState({
    lat: 38.9072,
    lng: -77.0369,
    timestamp: new Date()
  });
  
  const [airQualityData, setAirQualityData] = useState({
    current: { pm25: 0, aqi: 0, level: 'Cargando...' }
  });

  const [chartData, setChartData] = useState([]);
  const [isTracking, setIsTracking] = useState(true);
  const [loading, setLoading] = useState(false);

  // Simular movimiento del usuario en Washington DC
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setUserLocation(prev => {
        const deltaLat = (Math.random() - 0.5) * 0.5;
        const deltaLng = (Math.random() - 0.5) * 0.5;
        
        const newLat = Math.max(38.79, Math.min(39.00, prev.lat + deltaLat));
        const newLng = Math.max(-77.12, Math.min(-76.91, prev.lng + deltaLng));

        return {
          lat: newLat,
          lng: newLng,
          timestamp: new Date()
        };
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [isTracking]);

  // Actualizar calidad del aire cuando cambie la ubicación
  useEffect(() => {
    updateAirQuality();
  }, [userLocation.lat, userLocation.lng]);

  const updateAirQuality = async () => {
    try {
      setLoading(true);
      
      // Obtener predicción actual
      const predictData = await getPredictions(userLocation.lat, userLocation.lng, 24);
      
      if (predictData.success) {
        setAirQualityData({
          current: {
            pm25: predictData.current_pm25?.toFixed(1) || '0',
            aqi: predictData.current_aqi || 0,
            level: getAQILevel(predictData.current_aqi || 0),
            o3: predictData.current_o3?.toFixed(1) || '0',
            no2: predictData.current_no2?.toFixed(1) || '0',
            co: predictData.current_co || 0
          }
        });
        
        // Obtener datos completos para la gráfica
        const completeData = await getCompleteChartData(userLocation.lat, userLocation.lng);
        
        if (completeData.success) {
          setChartData(completeData.data);
          console.log('📊 Datos del mapa cargados:', completeData.data.length, 'puntos');
        }
      }
    } catch (error) {
      console.error('Error actualizando calidad del aire:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return 'Buena';
    if (aqi <= 100) return 'Moderada';
    if (aqi <= 150) return 'Insalubre (Sensibles)';
    if (aqi <= 200) return 'Insalubre';
    return 'Muy Insalubre';
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#10b981';
    if (aqi <= 100) return '#fbbf24';
    if (aqi <= 150) return '#f97316';
    if (aqi <= 200) return '#ef4444';
    return '#9333ea';
  };

  const createUserIcon = () => {
    return L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="
          background: #3b82f6;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 4px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 1.5s infinite;
        ">
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  const getInsights = () => {
    const aqi = airQualityData.current.aqi;
    
    if (aqi <= 50) {
      return {
        color: 'green',
        icon: '✓',
        title: 'Condiciones excelentes',
        message: 'Es un buen momento para actividades al aire libre.',
        recommendations: [
          'Perfecto para ejercicio outdoor',
          'No se necesita protección especial',
          'Disfruta del aire fresco'
        ]
      };
    } else if (aqi <= 100) {
      return {
        color: 'yellow',
        icon: 'ℹ',
        title: 'Calidad moderada',
        message: 'Aceptable para la mayoría, pero algunos sensibles pueden verse afectados.',
        recommendations: [
          'Personas sensibles: limita actividad intensa',
          'Considera usar mascarilla si eres vulnerable',
          'Monitorea tu condición física'
        ]
      };
    } else if (aqi <= 150) {
      return {
        color: 'orange',
        icon: '⚠',
        title: 'Insalubre para grupos sensibles',
        message: 'Grupos sensibles deben reducir actividad al aire libre.',
        recommendations: [
          'Reduce actividad física intensa',
          'Usa mascarilla si tienes condiciones respiratorias',
          'Prefiere actividades en interiores'
        ]
      };
    } else {
      return {
        color: 'red',
        icon: '⛔',
        title: 'Calidad insalubre',
        message: 'Todos pueden experimentar efectos en la salud.',
        recommendations: [
          'Evita actividades al aire libre',
          'Usa mascarilla N95 si debes salir',
          'Mantente en interiores con filtros de aire'
        ]
      };
    }
  };

  const insights = getInsights();
  const currentColor = getAQIColor(airQualityData.current.aqi);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar 
        currentView="map"
        onNavigate={onNavigate}
        userId={userId}
      />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    Tracking en Tiempo Real
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsTracking(!isTracking)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    isTracking
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-400 text-white hover:bg-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Navigation className={`w-4 h-4 ${isTracking ? 'animate-pulse' : ''}`} />
                    {isTracking ? 'Tracking Activo' : 'Tracking Pausado'}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Contenedor principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Mapa (2/3) */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden" style={{ zIndex: 1 }}>
              <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={14}
                style={{ height: '500px', width: '100%', zIndex: 1 }}
                zoomControl={true}
              >
                <MapUpdater center={[userLocation.lat, userLocation.lng]} />
                
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={500}
                  pathOptions={{
                    color: currentColor,
                    fillColor: currentColor,
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                />

                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={createUserIcon()}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-gray-800 mb-2">Tu ubicación</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">PM2.5:</span>
                          <span className="font-semibold">{airQualityData.current.pm25} µg/m³</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">AQI:</span>
                          <span className="font-semibold">{airQualityData.current.aqi}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nivel:</span>
                          <span className="font-semibold">{airQualityData.current.level}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* Sidebar (1/3) */}
            <div className="space-y-6">
              
              {/* Calidad actual */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Activity className="text-blue-600" />
                  Calidad Actual
                  {loading && <span className="text-xs text-gray-500">(actualizando...)</span>}
                </h3>
                
                <div 
                  className="p-6 rounded-xl text-white text-center"
                  style={{ backgroundColor: currentColor }}
                >
                  <div className="text-5xl font-bold mb-2">
                    {airQualityData.current.aqi}
                  </div>
                  <div className="text-lg opacity-90">
                    AQI: {airQualityData.current.level}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white border-opacity-30">
                    <div className="text-sm">
                      PM2.5: {airQualityData.current.pm25} µg/m³
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className={`bg-white rounded-2xl shadow-xl p-6 border-l-4 border-${insights.color}-500`}>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <span className="text-2xl">{insights.icon}</span>
                  {insights.title}
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  {insights.message}
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-800">Recomendaciones:</h4>
                  {insights.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className={`text-${insights.color}-600 mt-1`}>•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gráfica abajo (full width) */}
          <div className="mt-6">
            <AirQualityChart chartData={chartData} />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

export default Map;