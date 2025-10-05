import { useState, useEffect, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import debounce from 'lodash/debounce';
import { getLocalTime } from '../../utils/geocoding';
import { Clock, User, Bell as BellIcon } from 'lucide-react';
import CityCardExpanded from '../../Components/CityCard';
import NotificationBell from '../../Components/NotificationBell';
import AirQualityRecommendations from '../../Components/AirQualityRecommendations';

function Dashboard({ onNavigate, userId = '1' }) {
  const [currentTime, setCurrentTime] = useState(getLocalTime());
  const [pinnedCities, setPinnedCities] = useState([]);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null); // Para mostrar recomendaciones

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.tu_token_aqui';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getLocalTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Búsqueda con Mapbox - 100k búsquedas GRATIS al mes
  const searchCities = useCallback(
    debounce((inputValue, callback) => {
      if (inputValue.length < 1) {
        callback([]);
        return;
      }
    
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(inputValue)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `country=US&` +
        `types=place,region,district,locality&` +
        `limit=10`
      )
        .then(response => response.json())
        .then(data => {
          const options = data.features.map(place => {
            const parts = place.place_name.split(', ');
            const cityName = parts[0];
            const state = parts[1] || 'USA';
            
            const placeType = place.place_type[0];
            const typeLabel = placeType === 'region' ? '(Estado)' : 
                             placeType === 'district' ? '(Condado)' : '';
            
            return {
              value: place.id,
              label: `${cityName}${typeLabel ? ' ' + typeLabel : ''}, ${state}`,
              city: cityName,
              state: state,
              coordinates: place.center,
              type: placeType
            };
          });
          
          callback(options);
        })
        .catch(error => {
          console.error('Error:', error);
          callback([]);
        });
    }, 500),
    []
  );

  const addCity = async (cityOption) => {
    if (!cityOption) return;
    
    if (pinnedCities.find(c => c.label === cityOption.label)) {
      alert('Esta ciudad ya está agregada');
      return;
    }

    setIsLoadingCity(true);
    
    try {
      const response = await fetch(`${API_URL}/api/air-quality/latest/${cityOption.city}`);
      const data = await response.json();
      
      let airQualityData = null;
      if (data.results && data.results.length > 0) {
        const pm25 = data.results.find(r => r.parameter === 'pm25')?.value || 0;
        const no2 = data.results.find(r => r.parameter === 'no2')?.value || 0;
        const o3 = data.results.find(r => r.parameter === 'o3')?.value || 0;
        
        let aqi = Math.min(Math.round((pm25 / 12) * 50), 500);

        airQualityData = {
          aqi,
          pm25: pm25.toFixed(1),
          pm10: (pm25 * 1.5).toFixed(1),
          o3: o3.toFixed(1),
          no2: no2.toFixed(1),
          timestamp: new Date().toISOString()
        };
      }

      const newCity = { ...cityOption, airQuality: airQualityData };
      setPinnedCities([...pinnedCities, newCity]);
      
      // Auto-seleccionar la primera ciudad para mostrar recomendaciones
      if (pinnedCities.length === 0) {
        setSelectedCity(newCity);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoadingCity(false);
    }
  };

  const removeCity = (cityLabel) => {
    setPinnedCities(pinnedCities.filter(c => c.label !== cityLabel));
    if (selectedCity?.label === cityLabel) {
      setSelectedCity(pinnedCities[0] || null);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.viewAll) {
      onNavigate('notifications');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AirQuality
              </h1>
              
              <div className="hidden md:flex gap-4">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate('map')}
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Mapa
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <NotificationBell 
                userId={userId} 
                onNotificationClick={handleNotificationClick}
              />

              {/* Profile Button */}
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                <User className="w-4 h-4" />
                <span className="hidden md:inline">Mi Perfil</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              <div className="md:col-span-2">
                <h3 className="text-sm text-gray-500 mb-2">
                  Buscar ciudad, estado o condado en USA
                </h3>
                <AsyncSelect
                  cacheOptions
                  loadOptions={searchCities}
                  onChange={addCity}
                  placeholder="Ej: Mississippi, New York, Los Angeles"
                  noOptionsMessage={({ inputValue }) => 
                    inputValue.length < 0 ? "" : "No se encontraron lugares"
                  }
                  loadingMessage={() => "Buscando..."}
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-gray-800 font-mono">
                    {currentTime.time}
                  </p>
                  <p className="text-xs text-gray-600">{currentTime.date}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Cities List */}
          {pinnedCities.length > 0 ? (
            <div className="space-y-6">
              {pinnedCities.map((city) => (
                <CityCardExpanded 
                  key={city.label}
                  city={city} 
                  onRemove={() => removeCity(city.label)}
                />
              ))}
              
              {/* AI Recommendations - Debajo de las ciudades */}
              {selectedCity && selectedCity.airQuality && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Recomendaciones IA para {selectedCity.city}
                  </h2>
                  <AirQualityRecommendations
                    userId={userId}
                    city={selectedCity.city}
                    airQualityData={selectedCity.airQuality}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <BellIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 text-lg mb-2">
                Busca y agrega lugares para ver su calidad del aire
              </p>
              <p className="text-sm text-gray-500">
                💡 Después podrás recibir recomendaciones personalizadas con IA
              </p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default Dashboard;