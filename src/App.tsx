import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import CitizenDashboard from './pages/CitizenDashboard';
import NGODashboard from './pages/NGODashboard';
import ProtectedRoute from './components/ProtectedRoute';
import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/citizen-dashboard" 
              element={
                <ProtectedRoute role="citizen">
                  <CitizenDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ngo-dashboard" 
              element={
                <ProtectedRoute role="ngo">
                  <NGODashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;