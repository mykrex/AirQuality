import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { MapPin, Activity } from 'lucide-react';
import L from 'leaflet';

// Fix para iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function OpenStreetMap() {
  const [city, setCity] = useState('Mexico City');
  const [airData, setAirData] = useState([]); // Inicializado como array vacío
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([19.4326, -99.1332]);
  const [selectedStation, setSelectedStation] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const fetchAirQuality = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/air-quality/latest/${city}`);
      const data = await response.json();
      
      // CORRECCIÓN: Extraer el array results
      if (data.results && Array.isArray(data.results)) {
        setAirData(data.results);
        
        // Centrar mapa en la primera estación
        if (data.results.length > 0 && data.results[0].coordinates) {
          setMapCenter([
            data.results[0].coordinates.latitude,
            data.results[0].coordinates.longitude
          ]);
        }
      } else {
        setAirData([]);
        setError('No se encontraron datos para esta ciudad');
      }
    } catch (err) {
      setError('Error al obtener datos: ' + err.message);
      setAirData([]);
    } finally {
      setLoading(false);
    }
  }, [city, API_URL]);
  
  useEffect(() => {
    fetchAirQuality();
  }, [fetchAirQuality]);

  const getAQIColor = (value, parameter) => {
    if (parameter === 'pm25') {
      if (value <= 12) return '#10b981';
      if (value <= 35.4) return '#fbbf24';
      if (value <= 55.4) return '#f97316';
      if (value <= 150.4) return '#ef4444';
      return '#9333ea';
    }
    return '#3b82f6';
  };

  const getAQILabel = (value, parameter) => {
    if (parameter === 'pm25') {
      if (value <= 12) return 'Buena';
      if (value <= 35.4) return 'Moderada';
      if (value <= 55.4) return 'Insalubre (Sensibles)';
      if (value <= 150.4) return 'Insalubre';
      return 'Muy Insalubre';
    }
    return 'N/A';
  };

  const createCustomIcon = (value, parameter) => {
    const color = getAQIColor(value, parameter);
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 10px;
        ">
          ${Math.round(value)}
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <MapPin className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Mapa de Calidad del Aire
              </h1>
              <p className="text-gray-600">OpenStreetMap</p>
            </div>
          </div>

          <div className="flex gap-4">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Buscar ciudad..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && fetchAirQuality()}
            />
            <button
              onClick={fetchAirQuality}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={11}
              style={{ height: '600px', width: '100%' }}
              key={mapCenter.join(',')}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* CORRECCIÓN: airData ya es un array */}
              {airData.map((station, idx) => {
                if (!station.coordinates) return null;
                
                const pm25 = station.measurements?.find(m => m.parameter === 'pm25');
                const value = pm25?.value || station.value;
                const parameter = pm25?.parameter || station.parameter;

                return (
                  <div key={idx}>
                    <Marker
                      position={[
                        station.coordinates.latitude,
                        station.coordinates.longitude
                      ]}
                      icon={createCustomIcon(value, parameter)}
                      eventHandlers={{
                        click: () => setSelectedStation(station)
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <h3 className="font-bold text-gray-800 mb-2">
                            {station.location}
                          </h3>
                          <div className="space-y-1 text-sm">
                            {(station.measurements || [station]).map((m, i) => (
                              <div key={i} className="flex justify-between">
                                <span className="text-gray-600 uppercase">
                                  {m.parameter}:
                                </span>
                                <span className="font-semibold text-gray-800">
                                  {m.value} {m.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                    
                    <Circle
                      center={[
                        station.coordinates.latitude,
                        station.coordinates.longitude
                      ]}
                      radius={1000}
                      pathOptions={{
                        color: getAQIColor(value, parameter),
                        fillColor: getAQIColor(value, parameter),
                        fillOpacity: 0.1,
                        weight: 1
                      }}
                    />
                  </div>
                );
              })}
            </MapContainer>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Activity className="text-blue-600" />
                Índice de Calidad (PM2.5)
              </h3>
              <div className="space-y-2">
                {[
                  { range: '0-12', label: 'Buena', color: '#10b981' },
                  { range: '12-35', label: 'Moderada', color: '#fbbf24' },
                  { range: '35-55', label: 'Insalubre (Sensibles)', color: '#f97316' },
                  { range: '55-150', label: 'Insalubre', color: '#ef4444' },
                  { range: '150+', label: 'Muy Insalubre', color: '#9333ea' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.range} µg/m³</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedStation && (
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                <h3 className="font-bold text-lg mb-3">Estación Seleccionada</h3>
                <h4 className="text-xl font-bold mb-4">{selectedStation.location}</h4>
                
                {/* Coordenadas */}
                <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-3">
                  <div className="text-xs opacity-75 mb-1">Coordenadas</div>
                  <div className="font-mono text-sm">
                    <div>Lat: {selectedStation.coordinates.latitude.toFixed(6)}</div>
                    <div>Lon: {selectedStation.coordinates.longitude.toFixed(6)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {(selectedStation.measurements || [selectedStation]).map((m, idx) => {
                    const quality = getAQILabel(m.value, m.parameter);
                    return (
                      <div key={idx} className="bg-white bg-opacity-20 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="uppercase text-sm opacity-90">
                            {m.parameter}
                          </span>
                          <span className="text-2xl font-bold">
                            {m.value} <span className="text-sm">{m.unit}</span>
                          </span>
                        </div>
                        {m.parameter === 'pm25' && (
                          <div className="text-sm mt-1 opacity-90">
                            Nivel: {quality}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!selectedStation && airData.length > 0 && (
              <div className="bg-gray-100 rounded-2xl p-6 text-center">
                <p className="text-gray-600">
                  Haz clic en un marcador para ver detalles
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OpenStreetMap;