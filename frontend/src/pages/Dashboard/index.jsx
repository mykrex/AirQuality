import { useState, useEffect, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import debounce from 'lodash/debounce';
import { getLocalTime } from '../../utils/geocoding';
import { Clock } from 'lucide-react';
import CityCardExpanded from '../../Components/CityCard';

function Dashboard({ onNavigate }) {
  const [currentTime, setCurrentTime] = useState(getLocalTime());
  const [pinnedCities, setPinnedCities] = useState([]);
  const [isLoadingCity, setIsLoadingCity] = useState(false);

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
            // Extraer ciudad y estado del place_name
            const parts = place.place_name.split(', ');
            const cityName = parts[0];
            const state = parts[1] || 'USA';
            
            // Identificar tipo de lugar
            const placeType = place.place_type[0];
            const typeLabel = placeType === 'region' ? '(Estado)' : 
                             placeType === 'district' ? '(Condado)' : '';
            
            return {
              value: place.id,
              label: `${cityName}${typeLabel ? ' ' + typeLabel : ''}, ${state}`,
              city: cityName,
              state: state,
              coordinates: place.center, // [lng, lat]
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

      setPinnedCities([...pinnedCities, { ...cityOption, airQuality: airQualityData }]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoadingCity(false);
    }
  };

  const removeCity = (cityLabel) => {
    setPinnedCities(pinnedCities.filter(c => c.label !== cityLabel));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        
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
            <p className="text-gray-600">Busca y agrega lugares para ver su calidad del aire</p>
          </div>
        )}
        
      </div>
    </div>
  );
}

export default Dashboard;