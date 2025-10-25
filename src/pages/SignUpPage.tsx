import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, UserCheck, Eye, EyeOff, MapPin } from 'lucide-react';
import MapPicker from '../components/MapPicker';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'citizen' | 'ngo' | '';
  latitude?: number;
  longitude?: number;
  operationArea?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  location?: string;
  operationArea?: string;
  signup?: string;
}

const SignUpPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    latitude: 19.2183,
    longitude: 72.9781,
    operationArea: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Please select your role';
    }

    if (formData.role === 'ngo') {
      if (!formData.operationArea?.trim()) {
        newErrors.operationArea = 'Operation area is required for NGOs';
      }
      if (!formData.latitude || !formData.longitude) {
        newErrors.location = 'Please select your location on the map';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors(prev => ({ ...prev, signup: undefined }));

    try {
      const success = await signup(formData);
      if (success) {
        navigate('/login');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setErrors(prev => ({
        ...prev,
        signup: err.message || 'Registration failed. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="signup-page min-vh-100 d-flex align-items-center"
      style={{
        backgroundImage: 'url(https://www.fodors.com/wp-content/uploads/2021/05/19_EpicBodiesOfWater__LakePehoe_shutterstock_1017479992-1536x1024.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
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
          zIndex: 1,
        }}
      ></div>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div
              className="card shadow-lg border-0"
              style={{ position: 'relative', zIndex: 2 }}
            >
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-primary mb-2">Join Water Talk</h2>
                  <p className="text-muted">Create your account to get started</p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Name Field */}
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label fw-semibold">
                      <User size={18} className="me-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )}
                  </div>

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
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
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
                    {errors.password && (
                      <div className="invalid-feedback d-block">{errors.password}</div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label fw-semibold">
                      <Lock size={18} className="me-2" />
                      Confirm Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <div className="invalid-feedback d-block">{errors.confirmPassword}</div>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <UserCheck size={18} className="me-2" />
                      I am a:
                    </label>
                    <select
                      className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      <option value="">Select your role</option>
                      <option value="citizen">Citizen</option>
                      <option value="ngo">NGO</option>
                    </select>
                    {errors.role && (
                      <div className="invalid-feedback">{errors.role}</div>
                    )}
                  </div>

                  {/* NGO-specific fields */}
                  {formData.role === 'ngo' && (
                    <>
                      <div className="mb-3">
                        <label htmlFor="operationArea" className="form-label fw-semibold">
                          Operation Area
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.operationArea ? 'is-invalid' : ''}`}
                          id="operationArea"
                          name="operationArea"
                          value={formData.operationArea}
                          onChange={handleInputChange}
                          placeholder="e.g., Thane, Mumbai"
                        />
                        {errors.operationArea && (
                          <div className="invalid-feedback">{errors.operationArea}</div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          <MapPin size={18} className="me-2" />
                          Location
                        </label>
                        <div className="row mb-2">
                          <div className="col-6">
                            <input
                              type="number"
                              step="any"
                              className="form-control"
                              placeholder="Latitude"
                              value={formData.latitude || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                            />
                          </div>
                          <div className="col-6">
                            <input
                              type="number"
                              step="any"
                              className="form-control"
                              placeholder="Longitude"
                              value={formData.longitude || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                            />
                          </div>
                        </div>
                        <MapPicker
                          lat={formData.latitude || 19.2183}
                          lng={formData.longitude || 72.9781}
                          onLocationChange={handleLocationChange}
                          height="250px"
                        />
                        <small className="text-muted">Click on the map to set your location</small>
                        {errors.location && (
                          <div className="text-danger small mt-1">{errors.location}</div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Signup Error */}
                  {errors.signup && (
                    <div className="alert alert-danger" role="alert">
                      {errors.signup}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold mb-3"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>

                <div className="text-center">
                  <p className="text-muted">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="text-primary text-decoration-none fw-semibold"
                    >
                      Sign in here
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

export default SignUpPage;