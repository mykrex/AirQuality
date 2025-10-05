import { useState } from 'react';
import LandingPage from './pages/Landing';
import Dashboard from './pages/Dashboard';
import OpenStreetMap from './Components/OpenStreetMap';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch(currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />;
      case 'landing':
        return <LandingPage onNavigate={setCurrentView} />;
      case 'map':
        return <OpenStreetMap onNavigate={setCurrentView} />;
      case 'predict':
        // TODO: Crear componente de predicciones
        return <Dashboard onNavigate={setCurrentView} />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div>
      {renderView()}
    </div>
  );
}

export default App;