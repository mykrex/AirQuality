import { BarChart3 } from 'lucide-react';
import Navbar from '../../Components/Navbar';

function DatosPage({ onNavigate, userId = '1' }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar 
        currentView="datos"
        onNavigate={onNavigate}
        userId={userId}
      />

      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Boletines</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Índice de Calidad del Aire - Últimos 30 Días
            </h2>
            <p className="text-gray-600 mb-6">
              Esta gráfica muestra el AQI (Air Quality Index) recopilado durante los últimos 30 días en Washington DC. 
              Los datos se obtuvieron mediante la API de Open-Meteo y muestran mediciones por hora de múltiples contaminantes atmosféricos.
            </p>
            
            <div className="bg-gray-100 rounded-lg p-4">
              <img 
                src="/Figure_1.png" 
                alt="Gráfica histórica de calidad del aire"
                className="w-full h-auto rounded-lg"
              />
            </div>

            <div className="mt-6 space-y-3 text-sm text-gray-700">
              <p>
                <strong>Ubicación:</strong> Washington DC (38.8951°N, -77.0364°W)
              </p>
              <p>
                <strong>Período analizado:</strong> 30 días de datos históricos
              </p>
              <p>
                <strong>Frecuencia de medición:</strong> Por hora
              </p>
              <p>
                <strong>Contaminantes monitoreados:</strong> PM2.5, PM10, O₃ (Ozono), CO (Monóxido de Carbono), 
                NO₂ (Dióxido de Nitrógeno), SO₂ (Dióxido de Azufre)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatosPage;