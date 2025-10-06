import { useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';

function AirQualityChart({ chartData }) {
  const [selectedHour, setSelectedHour] = useState(null);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-800">Histórico + Predicción 24h</h3>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  console.log('Renderizando gráfica con', chartData.length, 'puntos');
  console.log('Primer punto:', chartData[0]);
  console.log('Último punto:', chartData[chartData.length - 1]);

  const getBarColor = (aqi) => {
    if (aqi <= 50) return '#10b981';
    if (aqi <= 100) return '#fbbf24';
    if (aqi <= 150) return '#f97316';
    if (aqi <= 200) return '#ef4444';
    return '#9333ea';
  };

  const maxValue = Math.max(...chartData.map(d => d.value || 0));
  console.log('Valor máximo PM2.5:', maxValue);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Histórico + Predicción 24h - PM2.5</h3>
        </div>
        
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-gray-600">Histórico</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-600 rounded opacity-60"></div>
            <span className="text-gray-600">Predicción</span>
          </div>
        </div>
      </div>

      <div className="relative h-64 bg-gray-50" style={{ border: '1px solid #e5e7eb' }}>
        <div className="absolute inset-0 flex items-end justify-between gap-1 p-2">
          {chartData.map((point, idx) => {
            const value = point.value || 0;
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const color = getBarColor(point.aqi || 0);

            return (
              <div
                key={idx}
                className="flex-1 relative group cursor-pointer"
                style={{ height: '100%' }} // Contenedor full height
              >
                <div className="absolute bottom-0 w-full flex flex-col justify-end h-full">
                  <div
                    className="w-full rounded-t transition-all hover:opacity-80"
                    style={{ 
                      height: `${Math.max(10, height)}%`, // Mínimo 10% para que se vea
                      backgroundColor: color,
                      opacity: point.isPast ? 1 : 0.6,
                      border: point.isNow ? '3px solid #ef4444' : 'none'
                    }}
                  />
                </div>
                
                {point.isNow && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-semibold z-10">
                    AHORA
                  </div>
                )}
                
                {!point.isPast && idx > 0 && chartData[idx - 1].isPast && (
                  <div className="absolute -left-1 top-0 h-full w-0.5 bg-purple-600"></div>
                )}
                
                {idx % 3 === 0 && (
                  <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
                    {point.time}
                  </div>
                )}
                
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                  <div className="bg-white p-3 rounded-lg shadow-lg border-2 border-blue-500 whitespace-nowrap">
                    <p className="font-bold text-gray-800 mb-1">{point.time}</p>
                    <p className="text-sm">PM2.5: <span className="font-semibold">{value.toFixed(1)} µg/m³</span></p>
                    <p className="text-sm">AQI: <span className="font-semibold">{point.aqi}</span></p>
                    <p className="text-xs text-gray-500 mt-1">
                      {point.isPast ? '✓ Histórico' : '🔮 Predicción'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedHour && (
        <div className="mt-8 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">{selectedHour.time}</span> - 
            PM2.5: <span className="font-bold">{selectedHour.value?.toFixed(1) || '0'} µg/m³</span> | 
            AQI: <span className="font-bold">{selectedHour.aqi}</span> |
            {selectedHour.isPast ? ' ✓ Histórico' : ' Predicción'}
          </p>
        </div>
      )}
    </div>
  );
}

export default AirQualityChart;