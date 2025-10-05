// App.jsx
import { useState } from 'react';
import LandingPage from './pages/Landing';
import Dashboard from './pages/Dashboard';
import OpenStreetMap from './Components/OpenStreetMap';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentUserId] = useState('1'); // Por ahora hardcodeado, despues puedes se tendria que hacer login real

  const renderView = () => {
    switch(currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} userId={currentUserId} />;
      case 'landing':
        return <LandingPage onNavigate={setCurrentView} />;
      case 'map':
        return <OpenStreetMap onNavigate={setCurrentView} />;
      case 'profile':
        return <Profile userId={currentUserId} onNavigate={setCurrentView} />;
      case 'notifications':
        return <Notifications userId={currentUserId} onNavigate={setCurrentView} />;
      case 'predict':
        // TODO: Cuando tu equipo termine el modelo de predicción
        return <Dashboard onNavigate={setCurrentView} userId={currentUserId} />;
      default:
        return <Dashboard onNavigate={setCurrentView} userId={currentUserId} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderView()}
    </div>
  );
}

export default App;