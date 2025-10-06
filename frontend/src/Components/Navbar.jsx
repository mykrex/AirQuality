import { User, Bell as BellIcon } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = ({ currentView, onNavigate, userId, unreadCount = 0 }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'map', label: 'Mapa' },
    { id: 'datos', label: 'Datos' }
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y navegación */}
          <div className="flex items-center gap-8">
            <h1 
              onClick={() => onNavigate('dashboard')}
              className="text-2xl font-bold bg-purple-600 bg-clip-text text-transparent cursor-pointer"
            >
              AirQuality
            </h1>
            
            <div className="hidden md:flex gap-4">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    currentView === item.id
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-700 hover:text-purple-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Acciones derecha */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell 
              userId={userId} 
              onNotificationClick={(notification) => {
                if (notification.viewAll) {
                  onNavigate('notifications');
                }
              }}
            />

            {/* Profile Button */}
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">Mi Perfil</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;