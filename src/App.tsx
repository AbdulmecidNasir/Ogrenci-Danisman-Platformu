import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/Dashboard';
import AdvisorDashboard from './pages/advisor/Dashboard';
import Profile from './pages/student/Profile';
import NotFound from './pages/NotFound';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdvisorProfile from './pages/advisor/Profile';

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated ? (
          <Navigate to={user?.role === 'advisor' ? '/advisor/dashboard' : '/student/dashboard'} />
        ) : (
          <Navigate to="/login" />
        )
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/student/*" element={
        <ProtectedRoute allowedRole="student">
          <Routes>
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="profile" element={<Profile />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      <Route path="/advisor/*" element={
        <ProtectedRoute allowedRole="advisor">
          <Routes>
            <Route path="dashboard" element={<AdvisorDashboard />} />
            <Route path="profile" element={<AdvisorProfile />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;