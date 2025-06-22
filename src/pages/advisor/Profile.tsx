import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { User, Mail, BookOpen, Save, ArrowLeft, Camera, X, Trash2 } from 'lucide-react';
import axios from 'axios';
import Navbar from '../../components/Navbar';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    username: '',
    officeNumber: '',
    officeHoursStart: '',
    officeHoursEnd: '',
    officeDays: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Format time values for display
      const formatTimeForDisplay = (time: string | null | undefined) => {
        if (!time) return '';
        // If it's already in HH:mm format, return as is
        if (time.match(/^\d{2}:\d{2}$/)) return time;
        // If it's a full date string or time with seconds, extract just the HH:mm part
        try {
          const timeStr = time.split('T')[1] || time;
          return timeStr.split(':').slice(0, 2).join(':');
        } catch (e) {
          return '';
        }
      };

      setFormData({
        name: user.name || '',
        surname: user.surname || '',
        email: user.email || '',
        username: user.username || '',
        officeNumber: user.officeNumber || '',
        officeHoursStart: formatTimeForDisplay(user.officeHoursStart),
        officeHoursEnd: formatTimeForDisplay(user.officeHoursEnd),
        officeDays: user.officeDays || ''
      });
      setPhotoPreview(user.photoUrl || null);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Format time values to ensure they're in the correct format
      const formattedData = {
        ...formData,
        // Ensure time values are in HH:mm format
        officeHoursStart: formData.officeHoursStart || null,
        officeHoursEnd: formData.officeHoursEnd || null
      };

      console.log('Sending update request with data:', formattedData);

      const response = await axios.put(`http://localhost:5000/api/advisor/${user.id}`, formattedData);
      
      console.log('Update response:', response.data);

      // Format the response data to match the expected format
      const formatTimeFromResponse = (time: string | null) => {
        if (!time) return null;
        try {
          const timeStr = time.split('T')[1] || time;
          return timeStr.split(':').slice(0, 2).join(':');
        } catch (e) {
          return null;
        }
      };

      const formattedResponse = {
        ...response.data,
        officeHoursStart: formatTimeFromResponse(response.data.office_hours_start),
        officeHoursEnd: formatTimeFromResponse(response.data.office_hours_end),
        officeNumber: response.data.office_number,
        officeDays: response.data.office_days
      };

      updateUser({
        ...user,
        name: formattedResponse.name,
        surname: formattedResponse.surname,
        email: formattedResponse.email,
        username: formattedResponse.username,
        officeNumber: formattedResponse.officeNumber,
        officeHoursStart: formattedResponse.officeHoursStart,
        officeHoursEnd: formattedResponse.officeHoursEnd,
        officeDays: formattedResponse.officeDays,
      });

      // Eğer yeni fotoğraf seçildiyse yükle
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        await axios.put(`http://localhost:5000/api/advisor/${user.id}/profile-photo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      toast.success('Profil başarıyla güncellendi');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.error || 'Profil güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user) return;

    try {
      const response = await axios.delete(`http://localhost:5000/api/advisor/${user.id}/profile-photo`);
      
      if (response.data.advisor) {
        updateUser({
          ...user,
          ...response.data.advisor,
          photoUrl: null,
        });
        toast.success('Profil fotoğrafı başarıyla silindi');
      }
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      const errorMessage = error.response?.data?.error || 'Fotoğraf silinirken bir hata oluştu';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Profil" />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-primary text-white p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/advisor/dashboard')}
                className="flex items-center text-white hover:text-gray-200 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Geri Dön
              </button>
              <h1 className="text-2xl font-bold">Profil Bilgileri</h1>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="relative group">
                  <div 
                    className="h-32 w-32 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-bold overflow-hidden"
                    style={{
                      backgroundImage: user?.photoUrl ? `url(${user.photoUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {!user?.photoUrl && `${user?.name?.charAt(0)}${user?.surname?.charAt(0)}`}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-2">
                      <button
                        onClick={handlePhotoClick}
                        className="p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-colors"
                      >
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                        ) : (
                          <Camera size={20} className="text-white" />
                        )}
                      </button>
                      {user?.photoUrl && (
                        <button
                          onClick={handleDeletePhoto}
                          className="p-2 bg-red-500 bg-opacity-50 rounded-full hover:bg-opacity-70 transition-colors"
                        >
                          <Trash2 size={20} className="text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Profile Information */}
              <div className="flex-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ad
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2 rounded-md border ${
                          isEditing ? 'border-gray-300 focus:ring-2 focus:ring-primary' : 'border-gray-200 bg-gray-50'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Soyad
                      </label>
                      <input
                        type="text"
                        name="surname"
                        value={formData.surname}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2 rounded-md border ${
                          isEditing ? 'border-gray-300 focus:ring-2 focus:ring-primary' : 'border-gray-200 bg-gray-50'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2 rounded-md border ${
                        isEditing ? 'border-gray-300 focus:ring-2 focus:ring-primary' : 'border-gray-200 bg-gray-50'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2 rounded-md border ${
                        isEditing ? 'border-gray-300 focus:ring-2 focus:ring-primary' : 'border-gray-200 bg-gray-50'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ofis Numarası
                    </label>
                    <input
                      type="text"
                      name="officeNumber"
                      value={formData.officeNumber}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2 rounded-md border ${
                        isEditing ? 'border-gray-300 focus:ring-2 focus:ring-primary' : 'border-gray-200 bg-gray-50'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Çalışma Günleri
                    </label>
                    <input
                      type="text"
                      name="officeDays"
                      value={formData.officeDays}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2 rounded-md border ${
                        isEditing ? 'border-gray-300 focus:ring-2 focus:ring-primary' : 'border-gray-200 bg-gray-50'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Başlangıç Saati
                    </label>
                    <input
                      type="time"
                      name="officeHoursStart"
                      value={formData.officeHoursStart}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2 rounded-md border ${
                        isEditing ? 'border-gray-300 focus:ring-2 focus:ring-primary' : 'border-gray-200 bg-gray-50'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bitiş Saati
                    </label>
                    <input
                      type="time"
                      name="officeHoursEnd"
                      value={formData.officeHoursEnd}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2 rounded-md border ${
                        isEditing ? 'border-gray-300 focus:ring-2 focus:ring-primary' : 'border-gray-200 bg-gray-50'
                      }`}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              name: user?.name || '',
                              surname: user?.surname || '',
                              email: user?.email || '',
                              username: user?.username || '',
                              officeNumber: user?.officeNumber || '',
                              officeHoursStart: user?.officeHoursStart || '',
                              officeHoursEnd: user?.officeHoursEnd || '',
                              officeDays: user?.officeDays || ''
                            });
                          }}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center"
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Save size={18} className="mr-2" />
                              Kaydet
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                      >
                        Düzenle
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile; 