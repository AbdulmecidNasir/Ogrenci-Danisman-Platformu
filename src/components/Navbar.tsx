import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, MessageSquare, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  title: string;
}

const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    if (user?.role === 'student') {
      navigate('/student/profile');
    } else if (user?.role === 'advisor') {
      navigate('/advisor/profile');
    }
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <MessageSquare className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-primary">{title}</span>
            </div>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <div className="flex items-center">
              <div className="flex flex-col items-end mr-4">
                <span className="text-sm font-medium">{user?.name} {user?.surname}</span>
                <span className="text-xs text-gray-500">{user?.role === 'student' ? 'Öğrenci' : 'Danışman'}</span>
              </div>
              <button 
                onClick={handleProfileClick}
                className="h-8 w-8 rounded-full overflow-hidden bg-primary hover:bg-primary-dark transition-colors"
              >
                {user?.photoUrl ? (
                  <img 
                    src={user.photoUrl} 
                    alt={`${user.name} ${user.surname}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white">
                    {user?.name?.charAt(0)}{user?.surname?.charAt(0)}
                  </div>
                )}
              </button>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-500 hover:text-primary flex items-center"
            >
              <LogOut size={18} className="mr-1" />
              <span>Çıkış</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-primary hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden"
          >
            <div className="px-4 pt-2 pb-3 space-y-1 border-t">
              <div className="flex items-center py-2">
                <button
                  onClick={handleProfileClick}
                  className="h-8 w-8 rounded-full overflow-hidden bg-primary"
                >
                  {user?.photoUrl ? (
                    <img 
                      src={user.photoUrl} 
                      alt={`${user.name} ${user.surname}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white">
                      {user?.name?.charAt(0)}{user?.surname?.charAt(0)}
                    </div>
                  )}
                </button>
                <div className="ml-3">
                  <div className="text-sm font-medium">{user?.name} {user?.surname}</div>
                  <div className="text-xs text-gray-500">{user?.role === 'student' ? 'Öğrenci' : 'Danışman'}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <LogOut size={18} className="mr-2" />
                <span>Çıkış</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;