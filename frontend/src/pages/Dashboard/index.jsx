import { useState, useEffect, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import debounce from 'lodash/debounce';
import { getLocalTime } from '../../utils/geocoding';
import { Clock, Bell as BellIcon } from 'lucide-react';
import CityCardExpanded from '../../Components/CityCard';
import Navbar from '../../Components/Navbar';
import { getPredictions } from '../../services/airQualityService';

function Dashboard({ onNavigate, userId = '1' }) {
  const [currentTime, setCurrentTime] = useState(getLocalTime());
  const [pinnedCities, setPinnedCities] = useState([]);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.tu_token_aqui';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getLocalTime()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      const [lng, lat] = cityOption.coordinates;
      
      console.log('🔍 Obteniendo predicción para:', cityOption.label, '- Coords:', lat, lng);
      
      // Obtener predicción del modelo ML
      const mlData = await getPredictions(lat, lng, 24);
      
      let airQualityData = null;
      
      if (mlData.success) {
        console.log('✅ Modelo ML respondió correctamente');
        console.log('Current PM2.5:', mlData.current_pm25);
        console.log('Predicciones:', mlData.predictions.length);
        
        airQualityData = {
          aqi: mlData.current_aqi || Math.round(mlData.current_pm25 * 2),
          pm25: mlData.current_pm25.toFixed(1),
          pm10: (mlData.current_pm25 * 1.5).toFixed(1),
          o3: mlData.current_o3?.toFixed(1) || '0.0',
          no2: mlData.current_no2?.toFixed(1) || '0.0',
          co: Number(mlData.current_co) || 0,
          timestamp: new Date().toISOString(),
          predictions: mlData.predictions,
          source: 'ml_model'
        };
      } else {
        console.warn('⚠️ Modelo ML no disponible, usando fallback');
        const pm25 = 25 + Math.random() * 15;
        airQualityData = {
          aqi: Math.round((pm25 / 12) * 50),
          pm25: pm25.toFixed(1),
          pm10: (pm25 * 1.5).toFixed(1),
          o3: '45.2',
          no2: '38.5',
          timestamp: new Date().toISOString(),
          source: 'mock'
        };
      }

      const newCity = { ...cityOption, airQuality: airQualityData };
      setPinnedCities([...pinnedCities, newCity]);
      
      if (pinnedCities.length === 0) {
        setSelectedCity(newCity);
      }
      
      console.log('✅ Ciudad agregada:', newCity.label, '- Fuente:', airQualityData.source);
    } catch (error) {
      console.error('❌ Error al obtener datos:', error);
      alert('Error al obtener datos. Usando datos de ejemplo.');
      
      // Fallback completo
      const pm25 = 25 + Math.random() * 15;
      const newCity = { 
        ...cityOption, 
        airQuality: {
          aqi: Math.round((pm25 / 12) * 50),
          pm25: pm25.toFixed(1),
          pm10: (pm25 * 1.5).toFixed(1),
          o3: '45.2',
          no2: '38.5',
          timestamp: new Date().toISOString(),
          source: 'error_fallback'
        }
      };
      setPinnedCities([...pinnedCities, newCity]);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar reutilizable */}
      <Navbar 
        currentView="dashboard"
        onNavigate={onNavigate}
        userId={userId}
      />

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              <div className="md:col-span-2">
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
                  isDisabled={isLoadingCity}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
                {isLoadingCity && (
                  <p className="text-sm text-blue-600 mt-2">
                    Consultando modelo ML...
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-4">
                <div className="flex-1">
                  <p className="text-xl font-bold text-gray-800 font-mono">
                    {currentTime.time}
                  </p>
                  <p className="text-xs text-gray-600">{currentTime.date}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
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
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <BellIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 text-lg mb-2">
                Busca y agrega lugares para ver su calidad del aire
              </p>
              <p className="text-sm text-gray-500">
                Después podrás recibir recomendaciones personalizadas con IA
              </p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default Dashboard;