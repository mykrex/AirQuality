import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

const NotificationBell = ({ userId, onNotificationClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (userId) {
      fetchUnreadNotifications();
      // Poll cada 2 minutos
      const interval = setInterval(fetchUnreadNotifications, 120000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchUnreadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/notifications/user/${userId}/unread`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.count);
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
      
      // Actualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 border-red-300 text-red-900';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      default: return 'bg-blue-100 border-blue-300 text-blue-900';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'high': return '!';
      case 'medium': return '';
      default: return '';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            <button
              onClick={() => setShowDropdown(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No hay notificaciones nuevas</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${
                    notification.urgency === 'high' ? 'border-red-500' :
                    notification.urgency === 'medium' ? 'border-yellow-500' :
                    'border-blue-500'
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (onNotificationClick) {
                      onNotificationClick(notification);
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{getUrgencyIcon(notification.urgency)}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <span className="text-xs text-gray-400 mt-2 block">
                        {new Date(notification.createdAt).toLocaleString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  if (onNotificationClick) {
                    onNotificationClick({ viewAll: true });
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-center"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;