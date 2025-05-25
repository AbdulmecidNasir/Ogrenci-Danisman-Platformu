import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login({ username, password, role });
      toast.success(`${role === 'student' ? 'Öğrenci' : 'Danışman'} girişi başarılı!`);
      navigate(role === 'student' ? '/student/dashboard' : '/advisor/dashboard');
    } catch (error) {
      toast.error('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Login Form */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <MessageSquare size={48} className="text-primary" />
            </div>
            <h1 className="text-3xl font-bold mt-4 text-primary">Hoş Geldiniz</h1>
            <p className="text-gray-600 mt-2">Öğrenci-Danışman İletişim Platformu</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-4 mb-6">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`px-6 py-2 rounded-full ${
                  role === 'student'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700'
                } transition-all duration-300`}
              >
                Öğrenci
              </button>
              <button
                type="button"
                onClick={() => setRole('advisor')}
                className={`px-6 py-2 rounded-full ${
                  role === 'advisor'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700'
                } transition-all duration-300`}
              >
                Danışman
              </button>
            </div>

            <div>
              <label htmlFor="username" className="form-label">
                {role === 'student' ? 'Öğrenci Numarası' : 'Kullanıcı Adı'}
              </label>
              <input
                id="username"
                type="text"
                className="input-field"
                placeholder={role === 'student' ? '123456789' : 'kullaniciadi'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">Şifre</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex justify-center items-center"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>

            {role === 'student' && (
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Hesabınız yok mu?{' '}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Kayıt Ol
                  </Link>
                </p>
              </div>
            )}
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
            <h2 className="text-4xl font-bold mb-6">Kolay İletişim</h2>
            <p className="text-xl mb-8">
              Öğrenciler ve danışmanlar arasında hızlı ve etkili iletişim platformu
            </p>
            <div className="flex justify-center">
              <img 
                src="https://images.pexels.com/photos/4145354/pexels-photo-4145354.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Students and advisors communicating" 
                className="rounded-lg shadow-lg w-full max-w-md"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;