import { useState } from 'react';
import ProfileForm from '../../Components/ProfileForm';
import Navbar from '../../Components/Navbar';
import { User, CheckCircle } from 'lucide-react';

const Profile = ({ userId = '1', onNavigate }) => {
  const [saved, setSaved] = useState(false);

  const handleSave = (profileData) => {
    console.log('Profile saved:', profileData);
    setSaved(true);
    
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar reutilizable */}
      <Navbar 
        currentView="profile"
        onNavigate={onNavigate}
        userId={userId}
      />

      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="rounded-lg shadow-md p-8 mb-6 text-purple-600">
            <div className="flex items-center gap-4">
                <h5 className="text-3xl font-bold mb-2">Personaliza tu experiencia para recibir recomendaciones adaptadas a ti</h5>
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
    </div>
  );
};

export default Profile;