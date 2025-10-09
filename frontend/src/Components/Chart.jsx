import { useState, useEffect, useRef } from 'react';
import { TrendingUp } from 'lucide-react';

function AirQualityChart({ chartData }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const scrollContainerRef = useRef(null);

  // Procesar datos
  const now = new Date();
  const currentHour = now.getHours();
  
  let finalChartData = [];
  let uniqueHistorical = [];
  let uniquePredictions = [];

  if (chartData && chartData.length > 0) {
    // Procesar todos los datos
    const processedData = chartData.map(point => ({
      ...point,
      isNow: point.isPast && point.hour === currentHour,
    }));

    // Separar históricos y predicciones
    const historicalPoints = processedData.filter(p => p.isPast);
    const predictionPoints = processedData.filter(p => !p.isPast);

    // Eliminar duplicados en históricos y ordenar por hora
    const seenHistoricalHours = new Set();
    const historicalTemp = [];
    
    historicalPoints.forEach(point => {
      if (!seenHistoricalHours.has(point.hour)) {
        seenHistoricalHours.add(point.hour);
        historicalTemp.push(point);
      }
    });
    
    // Ordenar históricos por hora del día (0-23)
    uniqueHistorical = historicalTemp.sort((a, b) => a.hour - b.hour);

    // Predicciones
    uniquePredictions = predictionPoints;

    // Combinar: históricos ordenados + predicciones
    finalChartData = [...uniqueHistorical, ...uniquePredictions];
  }

  useEffect(() => {
    if (scrollContainerRef.current && finalChartData.length > 0) {
      // Buscar el índice de la hora actual
      const currentIndex = finalChartData.findIndex(p => p.isNow);
      
      if (currentIndex !== -1) {
        const barWidth = 40;
        const scrollPosition = Math.max(0, (currentIndex - 3) * barWidth);
        
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollPosition;
          }
        }, 100);
      }
    }
  }, [finalChartData.length]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-800">Histórico + Predicción 24h</h3>
          </div>
        </div>
      </div>
    );
  }

  console.log('Renderizando gráfica con', chartData.length, 'puntos');
  console.log('Datos procesados:', {
    total: finalChartData.length,
    historicos: uniqueHistorical.length,
    predicciones: uniquePredictions.length,
  });

  const getBarColor = (aqi) => {
    if (aqi <= 50) return '#10b981';
    if (aqi <= 100) return '#fbbf24';
    if (aqi <= 150) return '#f97316';
    if (aqi <= 200) return '#ef4444';
    return '#9333ea';
  };

  const maxValue = Math.max(...finalChartData.map(d => d.value || 0), 1);

  const barWidth = 40;
  const totalWidth = finalChartData.length * barWidth;
  const minWidth = 800;
  const scrollWidth = Math.max(totalWidth, minWidth);

  const handleMouseEnter = (point, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setHoveredPoint(point);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 pb-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">
            Histórico + Predicción - <span className="text-blue-600">PM2.5</span>
          </h3>
        </div>

        {/* Leyenda */}
        <div className="flex items-center justify-start gap-6 text-sm mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Histórico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 opacity-60 rounded"></div>
            <span className="text-gray-600">Predicción</span>
          </div>
        </div>
      </div>

      {/* Contenedor scrolleable */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-hidden mb-4" 
        style={{ maxWidth: '100%' }}
      >
        <div className="relative bg-gray-50 border border-gray-200" style={{ 
          height: '280px',
          minWidth: `${scrollWidth}px`
        }}>
          <div className="absolute inset-0 flex items-end justify-start gap-1 p-2 pb-8">
            {finalChartData.map((point, idx) => {
              const value = point.value || 0;
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
              const color = getBarColor(point.aqi || 0);

              return (
                <div
                  key={`${point.time}-${idx}`}
                  className="relative cursor-pointer flex-shrink-0"
                  style={{ 
                    height: '100%',
                    width: `${barWidth - 4}px`
                  }}
                  onMouseEnter={(e) => handleMouseEnter(point, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Barra */}
                  <div className="absolute bottom-0 w-full flex flex-col justify-end h-full">
                    <div
                      className="w-full rounded-t transition-all hover:opacity-80"
                      style={{ 
                        height: `${Math.max(5, height)}%`,
                        backgroundColor: color,
                        opacity: point.isPast ? 1 : 0.6,
                        border: point.isNow ? '3px solid #ef4444' : 'none'
                      }}
                    />
                  </div>
                  
                  {point.isNow && (
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-semibold z-10 shadow-lg">
                      AHORA
                    </div>
                  )}
                  
                  {/* Etiqueta de hora cada 2 horas*/}
                  {idx % 2 === 0 && (
                    <div className="absolute -bottom-7 left-0 text-xs text-gray-600 font-mono whitespace-nowrap">
                      {point.hour.toString().padStart(2, '0')}:00
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredPoint && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 10}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-white rounded-lg shadow-xl border-2 border-blue-500 p-3 min-w-[180px]">
            <div className="text-center mb-2">
              <p className="text-lg font-bold text-gray-800">
                {hoveredPoint.hour.toString().padStart(2, '0')}:00
              </p>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">PM2.5:</span>
                <span className="font-semibold text-blue-600">
                  {hoveredPoint.value?.toFixed(1)} µg/m³
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AQI:</span>
                <span className="font-semibold" style={{ color: getBarColor(hoveredPoint.aqi) }}>
                  {hoveredPoint.aqi}
                </span>
              </div>
            </div>
            
            <div className="mt-2 pt-2 text-center">
              <p className="text-xs text-gray-500">
                {hoveredPoint.isPast ? 'Histórico' : 'Predicción'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AirQualityChart;