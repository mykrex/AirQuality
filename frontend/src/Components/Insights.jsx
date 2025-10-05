import { TrendingUp, TrendingDown, Wind, AlertTriangle, CheckCircle } from 'lucide-react';

function AirQualityInsights({ hourlyData }) {
  // Calcular insights
  const calculateInsights = () => {
    const values = hourlyData.map(d => d.value);
    const peakHour = hourlyData.reduce((max, d) => d.value > max.value ? d : max);
    const lowestHour = hourlyData.reduce((min, d) => d.value < min.value ? d : min);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const currentValue = hourlyData[0].value;
    
    return {
      peak: { hour: peakHour.time, value: peakHour.value },
      lowest: { hour: lowestHour.time, value: lowestHour.value },
      average: avgValue.toFixed(1),
      trend: currentValue < avgValue ? 'improving' : 'worsening',
      trendPercent: Math.abs(((currentValue - avgValue) / avgValue * 100)).toFixed(0)
    };
  };

  const insights = calculateInsights();

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-3">Análisis del Día</h3>
      <div className="grid grid-cols-2 gap-3">
        {/* Pico Máximo */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <h4 className="font-bold text-sm text-red-900">Pico Máximo</h4>
          </div>
          <p className="text-xl font-bold text-red-700">{insights.peak.value.toFixed(1)} µg/m³</p>
          <p className="text-xs text-red-600 mt-1">A las {insights.peak.hour}</p>
        </div>

        {/* Mejor Momento */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-green-600" />
            <h4 className="font-bold text-sm text-green-900">Mejor Momento</h4>
          </div>
          <p className="text-xl font-bold text-green-700">{insights.lowest.value.toFixed(1)} µg/m³</p>
          <p className="text-xs text-green-600 mt-1">A las {insights.lowest.hour}</p>
        </div>

        {/* Promedio Diario */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-sm text-blue-900">Promedio Diario</h4>
          </div>
          <p className="text-xl font-bold text-blue-700">{insights.average} µg/m³</p>
          <p className="text-xs text-blue-600 mt-1">Nivel moderado</p>
        </div>

        {/* Tendencia */}
        <div className={`${insights.trend === 'improving' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border-2 rounded-xl p-3`}>
          <div className="flex items-center gap-2 mb-2">
            {insights.trend === 'improving' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            )}
            <h4 className={`font-bold text-sm ${insights.trend === 'improving' ? 'text-green-900' : 'text-orange-900'}`}>
              Tendencia
            </h4>
          </div>
          <p className={`text-xl font-bold ${insights.trend === 'improving' ? 'text-green-700' : 'text-orange-700'}`}>
            {insights.trend === 'improving' ? 'Mejorando' : 'Empeorando'}
          </p>
          <p className={`text-xs mt-1 ${insights.trend === 'improving' ? 'text-green-600' : 'text-orange-600'}`}>
            {insights.trendPercent}% vs promedio
          </p>
        </div>
      </div>
    </div>
  );
}

export default AirQualityInsights;