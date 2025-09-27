import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Droplets, LogOut, User } from 'lucide-react';

interface NavbarProps {
  transparent?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ transparent = false }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar navbar-expand-lg ${transparent ? 'navbar-dark' : 'navbar-light bg-white shadow-sm'} fixed-top`}>
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <Droplets className="me-2" size={28} color={transparent ? '#fff' : '#0ea5e9'} />
          <span className={`fw-bold ${transparent ? 'text-white' : 'text-primary'}`}>
            Water Talk
          </span>
        </Link>

        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {!isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${transparent ? 'text-white' : ''}`} to="/">
                    About
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${transparent ? 'text-white' : ''}`} to="/">
                    Contact
                  </Link>
                </li>
              </>
            ) : (
              <li className="nav-item dropdown">
                <a 
                  className={`nav-link dropdown-toggle d-flex align-items-center ${transparent ? 'text-white' : ''}`}
                  href="#" 
                  role="button" 
                  data-bs-toggle="dropdown"
                >
                  <User size={18} className="me-2" />
                  {user?.name}
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center" 
                      onClick={handleLogout}
                    >
                      <LogOut size={16} className="me-2" />
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;