import { useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Clock, CheckCircle, Loader } from 'lucide-react';

const AirQualityRecommendations = ({ userId, city, airQualityData }) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [showPredictions, setShowPredictions] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/notifications/generate/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, city })
      });

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.data.fullRecommendations);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Error al generar recomendaciones');
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/notifications/generate/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, city })
      });

      const data = await response.json();
      
      if (data.success) {
        setPredictions(data.data.predictions);
        setShowPredictions(true);
      }
    } catch (error) {
      console.error('Error generating predictions:', error);
      alert('Error al generar predicciones');
    } finally {
      setLoading(false);
    }
  };

  const checkAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/generate/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, city })
      });

      const data = await response.json();
      
      if (data.success && data.alert) {
        alert(`⚠️ ALERTA: ${data.alert.message}`);
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      activity: '🏃',
      health: '❤️',
      indoor: '🏠',
      outdoor: '🌳',
      general: 'ℹ️'
    };
    return icons[category] || '📋';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'border-red-400 bg-red-50',
      medium: 'border-yellow-400 bg-yellow-50',
      low: 'border-blue-400 bg-blue-50'
    };
    return colors[priority] || 'border-gray-400 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={generateRecommendations}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          Recomendaciones con IA
        </button>

        <button
          onClick={generatePredictions}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <TrendingUp className="w-5 h-5" />
          )}
          Ver Pronóstico
        </button>

        <button
          onClick={checkAlerts}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
        >
          <AlertTriangle className="w-5 h-5" />
          Verificar Alertas
        </button>
      </div>

      {/* Recommendations Display */}
      {recommendations && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-blue-200">
          {/* Header */}
          <div className={`p-6 ${
            recommendations.urgency === 'high' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
            recommendations.urgency === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
            'bg-gradient-to-r from-blue-500 to-cyan-500'
          } text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Recomendaciones Personalizadas</h3>
                <p className="text-lg opacity-90">{recommendations.summary}</p>
              </div>
              <Sparkles className="w-8 h-8" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Key Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  {recommendations.shouldGoOutside ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-semibold text-gray-900">Salir al exterior</span>
                </div>
                <p className="text-sm text-gray-700">
                  {recommendations.shouldGoOutside 
                    ? 'Condiciones aceptables' 
                    : 'No recomendado'}
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">Mejor momento</span>
                </div>
                <p className="text-sm text-gray-700">{recommendations.bestTimeToday}</p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-900">Próxima revisión</span>
                </div>
                <p className="text-sm text-gray-700">{recommendations.nextCheck}</p>
              </div>
            </div>

            {/* Detailed Recommendations */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Recomendaciones detalladas:
              </h4>
              <div className="space-y-3">
                {recommendations.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${getPriorityColor(rec.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getCategoryIcon(rec.category)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-gray-900">{rec.title}</h5>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            rec.priority === 'high' ? 'bg-red-200 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {rec.priority === 'high' ? 'Alta' : 
                             rec.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Predictions Display */}
      {showPredictions && predictions && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-purple-200">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Pronóstico de Calidad del Aire</h3>
                <p className="text-lg opacity-90">
                  Tendencia: <span className="font-semibold">{predictions.trend}</span>
                </p>
              </div>
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Predictions Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predictions.predictions.map((pred, idx) => (
                <div
                  key={idx}
                  className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 text-center"
                >
                  <p className="text-sm text-gray-600 mb-2">En {pred.hours} horas</p>
                  <p className="text-4xl font-bold text-purple-600 mb-2">{pred.aqi}</p>
                  <p className="text-sm font-medium text-gray-900">{pred.level}</p>
                </div>
              ))}
            </div>

            {/* Factors */}
            {predictions.factors && predictions.factors.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Factores que influyen:</h4>
                <ul className="space-y-2">
                  {predictions.factors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confidence */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Nivel de confianza</span>
                <span className="text-2xl font-bold text-blue-600">{predictions.confidence}%</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${predictions.confidence}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">
          💡 <strong>Tip:</strong> Las recomendaciones se generan usando inteligencia artificial de Gemini, 
          analizando tu perfil de salud, nivel de actividad y las condiciones actuales del aire.
        </p>
      </div>
    </div>
  );
};

export default AirQualityRecommendations;