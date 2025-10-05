import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function AirQualityMap({ latitude, longitude, pm25Value, cityName }) {
  // Determinar color según PM2.5
  const getAQIColor = (value) => {
    if (value <= 12) return '#10b981'; // Verde
    if (value <= 35.4) return '#fbbf24'; // Amarillo
    if (value <= 55.4) return '#f97316'; // Naranja
    if (value <= 150.4) return '#ef4444'; // Rojo
    return '#9333ea'; // Morado
  };

  const color = getAQIColor(pm25Value);

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={[latitude, longitude]}
        zoom={12}
        style={{ height: '250px', width: '100%' }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Círculos de contaminación */}
        <Circle
          center={[latitude, longitude]}
          radius={3000}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 2
          }}
        />
        <Circle
          center={[latitude, longitude]}
          radius={1500}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: 0.25,
            weight: 2
          }}
        />
        <Circle
          center={[latitude, longitude]}
          radius={500}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: 0.35,
            weight: 2
          }}
        />

        {/* Marcador central */}
        <Marker position={[latitude, longitude]} />
      </MapContainer>

      <div className="p-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          {cityName} • PM2.5: {pm25Value.toFixed(1)} µg/m³
        </p>
      </div>
    </div>
  );
}

export default AirQualityMap;