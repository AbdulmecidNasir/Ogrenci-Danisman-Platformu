import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FormData {
  name: string;
  surname: string;
  email: string;
  studentId: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    surname: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Ad gereklidir';
    if (!formData.surname.trim()) newErrors.surname = 'Soyad gereklidir';
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-posta gereklidir';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }
    
    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Öğrenci numarası gereklidir';
    } else if (!/^\d+$/.test(formData.studentId)) {
      newErrors.studentId = 'Öğrenci numarası sadece rakam içermelidir';
    }
    
    if (!formData.password) {
      newErrors.password = 'Şifre gereklidir';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await register(formData);
      toast.success('Kayıt başarılı! Giriş yapılıyor...');
      navigate('/student/dashboard');
    } catch (error) {
      toast.error('Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Registration Form */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="flex justify-center">
              <MessageSquare size={40} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold mt-3 text-primary">Öğrenci Kaydı</h1>
            <p className="text-gray-600 mt-1 text-sm">Hesabınızı oluşturun ve danışmanınızla iletişime geçin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="form-label">Ad</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={`input-field ${errors.name ? 'border-danger' : ''}`}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="surname" className="form-label">Soyad</label>
                <input
                  id="surname"
                  name="surname"
                  type="text"
                  className={`input-field ${errors.surname ? 'border-danger' : ''}`}
                  value={formData.surname}
                  onChange={handleChange}
                  required
                />
                {errors.surname && <p className="form-error">{errors.surname}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="form-label">E-posta</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`input-field ${errors.email ? 'border-danger' : ''}`}
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="studentId" className="form-label">Öğrenci Numarası</label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                className={`input-field ${errors.studentId ? 'border-danger' : ''}`}
                value={formData.studentId}
                onChange={handleChange}
                required
              />
              {errors.studentId && <p className="form-error">{errors.studentId}</p>}
            </div>

            <div>
              <label htmlFor="password" className="form-label">Şifre</label>
              <input
                id="password"
                name="password"
                type="password"
                className={`input-field ${errors.password ? 'border-danger' : ''}`}
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">Şifre Tekrarı</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={`input-field ${errors.confirmPassword ? 'border-danger' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex justify-center items-center mt-6"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Zaten hesabınız var mı?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Giriş Yap
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Right side - Image/Brand */}
      <div className="hidden md:block md:w-1/2 bg-primary">
        <div className="h-full flex flex-col justify-center items-center text-white p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-lg"
          >
            <h2 className="text-4xl font-bold mb-6">Hemen Başlayın</h2>
            <p className="text-xl mb-8">
              Danışmanınızla hızlı ve kolay bir şekilde iletişim kurun
            </p>
            <div className="flex justify-center">
              <img 
                src="https://images.pexels.com/photos/5905885/pexels-photo-5905885.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Student registration" 
                className="rounded-lg shadow-lg w-full max-w-md"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;