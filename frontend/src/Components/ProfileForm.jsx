import { useState, useEffect } from 'react';
import { User, Heart, Activity, Bell, MapPin, Save, X, Car, Bike, Footprints, Bus, Shield } from 'lucide-react';

const ProfileForm = ({ userId, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    age: '',
    location: {
      city: '',
      country: 'USA'
    },
    healthConditions: [],
    activityLevel: 'moderate',
    transportation: 'car',
    maskUsage: 'sometimes',
    preferences: {
      outdoorActivities: [],
      exercisePreferences: [],
      notificationSettings: {
        alerts: true,
        dailyReport: true,
        predictions: false
      }
    }
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const healthConditionOptions = [
    { value: 'asthma', label: 'Asma' },
    { value: 'copd', label: 'EPOC' },
    { value: 'allergies', label: 'Alergias' },
    { value: 'heart_disease', label: 'Enfermedad cardíaca' },
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'pregnancy', label: 'Embarazo' },
    { value: 'bronchitis', label: 'Bronquitis' },
    { value: 'emphysema', label: 'Enfisema' }
  ];

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentario' },
    { value: 'light', label: 'Ligero' },
    { value: 'moderate', label: 'Moderado' },
    { value: 'active', label: 'Activo' },
    { value: 'very_active', label: 'Muy activo' }
  ];

  const transportationOptions = [
    { value: 'car', label: 'Auto', icon: Car, description: 'Vehículo privado' },
    { value: 'bike', label: 'Bicicleta', icon: Bike, description: 'Mayor exposición' },
    { value: 'walking', label: 'Caminando', icon: Footprints, description: 'Exposición directa' },
    { value: 'public', label: 'Transporte público', icon: Bus, description: 'Exposición moderada' }
  ];

  const maskUsageOptions = [
    { value: 'never', label: 'Nunca', color: 'red' },
    { value: 'sometimes', label: 'A veces', color: 'yellow' },
    { value: 'always', label: 'Siempre', color: 'green' }
  ];

  const outdoorActivitiesOptions = [
    'running', 'cycling', 'walking', 'hiking', 'sports', 'gardening'
  ];

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/profile/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setProfile({
          ...data.data,
          transportation: data.data.transportation || 'car',
          maskUsage: data.data.maskUsage || 'sometimes'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = userId 
        ? `${API_URL}/api/profile/${userId}`
        : `${API_URL}/api/profile`;
      
      const method = userId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      const data = await response.json();

      if (data.success) {
        if (onSave) onSave(data.data);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const toggleHealthCondition = (condition) => {
    setProfile(prev => ({
      ...prev,
      healthConditions: prev.healthConditions.includes(condition)
        ? prev.healthConditions.filter(c => c !== condition)
        : [...prev.healthConditions, condition]
    }));
  };

  const toggleOutdoorActivity = (activity) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        outdoorActivities: prev.preferences.outdoorActivities.includes(activity)
          ? prev.preferences.outdoorActivities.filter(a => a !== activity)
          : [...prev.preferences.outdoorActivities, activity]
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 space-y-8">
      {/* Información Básica */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Información Básica</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              value={profile.name}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Edad
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={profile.age}
              onChange={(e) => setProfile({...profile, age: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tu edad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={profile.location.city}
                onChange={(e) => setProfile({
                  ...profile,
                  location: {...profile.location, city: e.target.value}
                })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu ciudad"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Condiciones de Salud */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-900">Condiciones de Salud</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Selecciona las condiciones que apliquen. Esto nos ayudará a darte recomendaciones personalizadas.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {healthConditionOptions.map(option => (
            <label
              key={option.value}
              className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                profile.healthConditions.includes(option.value)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={profile.healthConditions.includes(option.value)}
                onChange={() => toggleHealthCondition(option.value)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Nivel de Actividad */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Nivel de Actividad</h2>
        </div>

        <div className="space-y-2">
          {activityLevels.map(level => (
            <label
              key={level.value}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                profile.activityLevel === level.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="activityLevel"
                value={level.value}
                checked={profile.activityLevel === level.value}
                onChange={(e) => setProfile({...profile, activityLevel: e.target.value})}
                className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {level.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Medio de Transporte */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Medio de Transporte Principal</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Selecciona tu medio de transporte habitual. Esto afecta tu nivel de exposición a contaminantes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {transportationOptions.map(option => {
            const Icon = option.icon;
            return (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  profile.transportation === option.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="transportation"
                  value={option.value}
                  checked={profile.transportation === option.value}
                  onChange={(e) => setProfile({...profile, transportation: e.target.value})}
                  className="w-4 h-4 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <Icon className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700 block">
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {option.description}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Uso de Mascarilla */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">Uso de Mascarilla o Protección</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Indica con qué frecuencia utilizas mascarilla al estar al aire libre en días de mala calidad del aire.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {maskUsageOptions.map(option => (
            <label
              key={option.value}
              className={`flex items-center justify-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                profile.maskUsage === option.value && option.color === 'red' ? 'border-red-500 bg-red-50' :
                profile.maskUsage === option.value && option.color === 'yellow' ? 'border-yellow-500 bg-yellow-50' :
                profile.maskUsage === option.value && option.color === 'green' ? 'border-green-500 bg-green-50' :
                'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="maskUsage"
                value={option.value}
                checked={profile.maskUsage === option.value}
                onChange={(e) => setProfile({...profile, maskUsage: e.target.value})}
                className="w-4 h-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {option.label}
              </span>
            </label>
          ))}
        </div>

        {profile.maskUsage === 'never' && profile.healthConditions.length > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ Considerando tus condiciones de salud, te recomendamos usar mascarilla en días de mala calidad del aire.
            </p>
          </div>
        )}
      </div>

      {/* Actividades al Aire Libre */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Actividades al Aire Libre
        </h2>

        <div className="flex flex-wrap gap-2">
          {outdoorActivitiesOptions.map(activity => (
            <button
              key={activity}
              type="button"
              onClick={() => toggleOutdoorActivity(activity)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                profile.preferences.outdoorActivities.includes(activity)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {activity}
            </button>
          ))}
        </div>
      </div>

      {/* Configuración de Notificaciones */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Notificaciones</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <span className="font-medium text-gray-900">Alertas urgentes</span>
              <p className="text-sm text-gray-600">Recibe alertas cuando la calidad del aire sea peligrosa</p>
            </div>
            <input
              type="checkbox"
              checked={profile.preferences.notificationSettings.alerts}
              onChange={(e) => setProfile({
                ...profile,
                preferences: {
                  ...profile.preferences,
                  notificationSettings: {
                    ...profile.preferences.notificationSettings,
                    alerts: e.target.checked
                  }
                }
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <span className="font-medium text-gray-900">Reporte diario</span>
              <p className="text-sm text-gray-600">Resumen diario de la calidad del aire</p>
            </div>
            <input
              type="checkbox"
              checked={profile.preferences.notificationSettings.dailyReport}
              onChange={(e) => setProfile({
                ...profile,
                preferences: {
                  ...profile.preferences,
                  notificationSettings: {
                    ...profile.preferences.notificationSettings,
                    dailyReport: e.target.checked
                  }
                }
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div>
              <span className="font-medium text-gray-900">Predicciones</span>
              <p className="text-sm text-gray-600">Pronósticos de calidad del aire con IA</p>
            </div>
            <input
              type="checkbox"
              checked={profile.preferences.notificationSettings.predictions}
              onChange={(e) => setProfile({
                ...profile,
                preferences: {
                  ...profile.preferences,
                  notificationSettings: {
                    ...profile.preferences.notificationSettings,
                    predictions: e.target.checked
                  }
                }
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        )}
        
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar Perfil'}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;