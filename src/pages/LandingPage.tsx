import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowRight, Users, MapPin, Shield } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <Navbar transparent />
      
      {/* Hero Section */}
      <section className="hero-section position-relative">
        <div 
          className="hero-bg"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '100vh',
            position: 'relative'
          }}
        >
          <div className="hero-overlay"></div>
          <div className="container h-100 d-flex align-items-center position-relative">
            <div className="row w-100">
              <div className="col-lg-8 mx-auto text-center text-white">
                <h1 className="display-3 fw-bold mb-4 hero-title">
                  Water Talk
                </h1>
                <p className="lead mb-4 hero-subtitle">
                  Together for Cleaner Waters
                </p>
                <p className="fs-5 mb-5 hero-tagline">
                  Report. Respond. Restore. Help your city fight water pollution.
                </p>
                <div className="hero-buttons">
                  <Link 
                    to="/login" 
                    className="btn btn-primary btn-lg me-3 px-4 py-3"
                  >
                    Login
                    <ArrowRight className="ms-2" size={20} />
                  </Link>
                  <Link 
                    to="/signup" 
                    className="btn btn-outline-light btn-lg px-4 py-3"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="display-5 fw-bold mb-3">How It Works</h2>
              <p className="lead text-muted">Simple steps to make a difference</p>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-card text-center p-4 h-100">
                <div className="feature-icon mb-3">
                  <MapPin size={48} className="text-primary" />
                </div>
                <h4 className="fw-bold mb-3">Report Issues</h4>
                <p className="text-muted">
                  Citizens can easily report polluted water bodies by uploading photos and marking locations on the map.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card text-center p-4 h-100">
                <div className="feature-icon mb-3">
                  <Users size={48} className="text-success" />
                </div>
                <h4 className="fw-bold mb-3">NGO Response</h4>
                <p className="text-muted">
                  NGOs can view all reports on an interactive map and coordinate cleanup efforts effectively.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card text-center p-4 h-100">
                <div className="feature-icon mb-3">
                  <Shield size={48} className="text-info" />
                </div>
                <h4 className="fw-bold mb-3">Track Progress</h4>
                <p className="text-muted">
                  Monitor cleanup progress and see the positive impact on water bodies in your community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <p className="mb-0">&copy; 2025 Water Talk. Making a difference, one report at a time.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;