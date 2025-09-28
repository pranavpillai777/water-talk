import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, UserCheck, Eye, EyeOff, LogIn } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
  role: 'citizen' | 'ngo' | '';
}

interface FormErrors {
  email?: string;
  password?: string;
  role?: string;
  login?: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    role: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (!formData.role) {
      newErrors.role = 'Please select your role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors(prev => ({ ...prev, login: undefined }));
    
    try {
      const success = await login(formData.email, formData.password, formData.role);
      if (success) {
        navigate(formData.role === 'citizen' ? '/citizen-dashboard' : '/ngo-dashboard');
      } else {
        setErrors(prev => ({
          ...prev,
          login: 'Invalid credentials. Please check your email, password, and role.'
        }));
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors(prev => ({
        ...prev,
        login: 'An error occurred. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="login-page min-vh-100 d-flex align-items-center"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1
        }}
      ></div>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg border-0" style={{ position: 'relative', zIndex: 2 }}>
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-primary mb-2">Welcome Back</h2>
                  <p className="text-muted">Sign in to your account</p>
                </div>

                {/* Demo credentials */}
                <div className="alert alert-info" role="alert">
                  <strong>Demo Credentials:</strong><br />
                  Citizen: citizen@example.com / password123<br />
                  NGO: ngo@example.com / password123
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Email Field */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      <Mail size={18} className="me-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>

                  {/* Password Field */}
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      <Lock size={18} className="me-2" />
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                  </div>

                  {/* Role Selection */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <UserCheck size={18} className="me-2" />
                      Login as:
                    </label>
                    <div className="mt-2">
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="role"
                          id="citizen"
                          value="citizen"
                          checked={formData.role === 'citizen'}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="citizen">
                          Citizen
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="role"
                          id="ngo"
                          value="ngo"
                          checked={formData.role === 'ngo'}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="ngo">
                          NGO
                        </label>
                      </div>
                    </div>
                    {errors.role && <div className="text-danger small">{errors.role}</div>}
                  </div>

                  {errors.login && (
                    <div className="alert alert-danger" role="alert">
                      {errors.login}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : (
                      <>
                        <LogIn size={18} className="me-2" />
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="text-muted">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-primary text-decoration-none fw-semibold">
                      Sign up here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;