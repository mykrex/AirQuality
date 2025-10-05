import { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCheck, AlertCircle, TrendingUp, Calendar, Sparkles, ArrowLeft } from 'lucide-react';

const Notifications = ({ userId = '1', onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, alert, recommendation, prediction

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/notifications/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? {...n, read: true} : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/user/${userId}/read-all`, {
        method: 'PATCH'
      });
      
      setNotifications(prev => prev.map(n => ({...n, read: true})));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'recommendation':
        return <Sparkles className="w-5 h-5 text-blue-600" />;
      case 'prediction':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'daily_report':
        return <Calendar className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getUrgencyBadge = (urgency) => {
    const styles = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300'
    };

    const labels = {
      high: 'Urgente',
      medium: 'Importante',
      low: 'Info'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[urgency]}`}>
        {labels[urgency]}
      </span>
    );
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
                <p className="text-sm text-gray-600">
                  {unreadCount > 0 ? (
                    <span className="font-medium text-blue-600">
                      {unreadCount} sin leer
                    </span>
                  ) : (
                    'Todas las notificaciones leídas'
                  )}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {[
              { value: 'all', label: 'Todas', count: notifications.length },
              { value: 'alert', label: 'Alertas', count: notifications.filter(n => n.type === 'alert').length },
              { value: 'recommendation', label: 'Recomendaciones', count: notifications.filter(n => n.type === 'recommendation').length },
              { value: 'prediction', label: 'Predicciones', count: notifications.filter(n => n.type === 'prediction').length }
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No hay notificaciones en esta categoría</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg ${
                  !notification.read ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {getUrgencyBadge(notification.urgency)}
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <span className="text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Marcar como leída"
                        >
                          <CheckCheck className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {notification.recommendations && notification.recommendations.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Recomendaciones:
                      </h4>
                      <ul className="space-y-1">
                        {notification.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Predictions */}
                  {notification.predictions && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-purple-900 mb-3">
                        Pronóstico:
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {notification.predictions.map((pred, idx) => (
                          <div key={idx} className="text-center p-3 bg-white rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">
                              En {pred.hours}h
                            </p>
                            <p className="text-2xl font-bold text-purple-600">
                              {pred.aqi}
                            </p>
                            <p className="text-xs text-gray-500">
                              {pred.level}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {notification.metadata && (
                    <div className="mt-4 flex gap-4 text-sm">
                      {notification.metadata.bestTimeToday && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="font-medium">Mejor hora:</span>
                          <span>{notification.metadata.bestTimeToday}</span>
                        </div>
                      )}
                      {notification.metadata.confidence && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="font-medium">Confianza:</span>
                          <span>{notification.metadata.confidence}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;