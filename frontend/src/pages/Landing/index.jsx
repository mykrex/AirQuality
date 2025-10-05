import { useState } from 'react';
import { Wind, MapPin, TrendingUp, Satellite, AlertTriangle, ChevronRight, Calendar, Globe } from 'lucide-react';

function LandingPage({ onNavigate }) {
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    {
      icon: <Satellite className="w-8 h-8" />,
      title: "Datos Satelitales NASA TEMPO",
      description: "Monitoreo de contaminación desde el espacio con actualización cada hora",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Estaciones Terrestres",
      description: "Datos en tiempo real de sensores en tierra alrededor del mundo",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Predicción con IA",
      description: "Modelo de machine learning para predecir calidad del aire futura",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <AlertTriangle className="w-8 h-8" />,
      title: "Alertas Personalizadas",
      description: "Notificaciones cuando la calidad del aire afecte tu salud",
      color: "from-orange-500 to-red-600"
    }
  ];

  const stats = [
    { value: "100+", label: "Ciudades Monitoreadas" },
    { value: "24/7", label: "Actualización Continua" },
    { value: "5", label: "Contaminantes Medidos" },
    { value: "85%", label: "Precisión del Modelo" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background animation */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Header */}
        <nav className="relative z-10 px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wind className="w-10 h-10 text-blue-400" />
            <span className="text-2xl font-bold text-white">AirWatch</span>
          </div>
          <button 
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition border border-white/20"
          >
            Iniciar Sesión
          </button>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 text-center">
          <div className="inline-block px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30 mb-6">
            <span className="text-blue-300 text-sm font-semibold">NASA Space Apps Challenge 2025</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Respira Mejor,
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Vive Mejor
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            Monitorea la calidad del aire en tiempo real con datos de satélites NASA y predice 
            condiciones futuras con inteligencia artificial
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <button 
              onClick={() => onNavigate('map')}
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all flex items-center gap-2"
            >
              <Globe className="w-5 h-5" />
              Explorar Mapa
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              onClick={() => onNavigate('predict')}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition border border-white/20 flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Ver Predicciones
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 max-w-6xl mx-auto px-8 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-300 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Funcionalidades Principales
            </h2>
            <p className="text-gray-400 text-lg">
              Tecnología de punta para proteger tu salud
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setSelectedFeature(idx)}
                onMouseLeave={() => setSelectedFeature(null)}
                className={`
                  relative p-6 rounded-2xl backdrop-blur-md border transition-all cursor-pointer
                  ${selectedFeature === idx 
                    ? 'bg-white/20 border-white/40 shadow-2xl scale-105' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }
                `}
              >
                <div className={`
                  inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} 
                  text-white mb-4 shadow-lg
                `}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="relative py-20 px-8 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Cómo Funciona
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Selecciona Ubicación</h3>
              <p className="text-gray-400">
                Elige tu ciudad o haz click en el mapa para ver datos locales
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Análisis en Tiempo Real</h3>
              <p className="text-gray-400">
                Combinamos datos de satélites y estaciones terrestres
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Predicción Inteligente</h3>
              <p className="text-gray-400">
                Nuestro modelo IA predice la calidad del aire futura
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-4xl font-bold text-white mb-4">
              Comienza a Monitorear Ahora
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Únete a miles de usuarios que protegen su salud con datos en tiempo real
            </p>
            <button 
              onClick={() => onNavigate('dashboard')}
              className="px-10 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
            >
              Empezar Gratis
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-8 px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>NASA Space Apps Challenge 2025 • Datos proporcionados por NASA TEMPO & OpenAQ</p>
          <p className="text-sm mt-2">Desarrollado con React • Node.js • Machine Learning</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;