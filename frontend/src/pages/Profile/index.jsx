import { useState } from 'react';
import ProfileForm from '../../Components/ProfileForm';
import { User, CheckCircle, ArrowLeft } from 'lucide-react';

const Profile = ({ userId = '1', onNavigate }) => {
  const [saved, setSaved] = useState(false);

  const handleSave = (profileData) => {
    console.log('Profile saved:', profileData);
    setSaved(true);
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al Dashboard
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-8 mb-6 text-white">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
              <p className="text-blue-100">
                Personaliza tu experiencia para recibir recomendaciones adaptadas a ti
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">¡Perfil guardado exitosamente!</p>
              <p className="text-sm text-green-700">
                Tus recomendaciones se actualizarán según tu nueva información.
              </p>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <ProfileForm 
          userId={userId} 
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default Profile;