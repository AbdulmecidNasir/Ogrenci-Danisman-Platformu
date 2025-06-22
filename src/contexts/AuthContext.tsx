import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  username: string;
  role: 'student' | 'advisor';
  photoUrl?: string | null;
  officeNumber?: string;
  officeHoursStart?: string;
  officeHoursEnd?: string;
  officeDays?: string;
}

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string; role: string }) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


// Get the API URL from environment or use a default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { username: string; password: string; role: string }) => {
    setIsLoading(true);
    try {
      console.log('Attempting login with:', { 
        username: credentials.username, 
        role: credentials.role,
        passwordLength: credentials.password?.length 
      });

      const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
      console.log('Login response:', response.data);

      if (!response.data || !response.data.id) {
        throw new Error('Geçersiz sunucu yanıtı');
      }

      const userData = response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 'Giriş yapılırken bir hata oluştu';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/student/register`, userData);
      const newUser = response.data;
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Başarılı kayıt sonrası giriş sayfasına yönlendir
      toast.success('Kayıt başarılı! Giriş yapabilirsiniz.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Kayıt sırasında bir hata oluştu');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};