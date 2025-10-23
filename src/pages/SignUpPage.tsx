import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, UserCheck, Eye, EyeOff, MapPin } from 'lucide-react';
import { Icon } from 'leaflet';

// Fix for default Leaflet markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'citizen' | 'ngo' | '';
  ngoLat?: number;
  ngoLng?: number;
  ngoArea?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  ngoLat?: string;
  ngoLng?: string;
  ngoArea?: string;
}

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    else if (!/^[a-zA-Z\s]+$/.test(formData.name))
      newErrors.name = 'Name can only contain letters and spaces';

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Please enter a valid email address';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters long';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    if (!formData.role) newErrors.role = 'Please select a role';

    // NGO-specific validation
    if (formData.role === 'ngo') {
      if (formData.ngoLat === undefined || formData.ngoLng === undefined)
        newErrors.ngoLat = 'Please select your location on the map';
      if (!formData.ngoArea || formData.ngoArea.trim() === '')
        newErrors.ngoArea = 'Please enter your area of operation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field as user types
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const success = await signup(formData);
      if (success) {
        navigate(formData.role === 'citizen' ? '/citizen-dashboard' : '/ngo-dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Map component for NGO location selection
  const LocationSelector: React.FC = () => {
    const [position, setPosition] = useState<[number, number] | null>(
      formData.ngoLat && formData.ngoLng ? [formData.ngoLat, formData.ngoLng] : null
    );

    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        setFormData(prev => ({ ...prev, ngoLat: lat, ngoLng: lng }));
        setErrors(prev => ({ ...prev, ngoLat: undefined, ngoLng: undefined }));
      }
    });

    return position ? <Marker position={position} /> : null;
  };

  return (
    <div
      className="signup-page min-vh-100 d-flex align-items-center"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg)',
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
          <div className="col-md-8 col-lg-7">
            <div className="card shadow-lg border-0" style={{ position: 'relative', zIndex: 2 }}>
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-primary mb-2">Join Water Talk</h2>
                  <p className="text-muted">Create your account to get started</p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Full Name */}
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label fw-semibold">
                      <User size={18} className="me-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      <Mail size={18} className="me-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="Enter your email"
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      <Lock size={18} className="me-2" />
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
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

                  {/* Confirm Password */}
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label fw-semibold">
                      <Lock size={18} className="me-2" />
                      Confirm Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
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
                          Citizen - Report water pollution issues
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
                          NGO - View and respond to reports
                        </label>
                      </div>
                    </div>
                    {errors.role && <div className="text-danger small">{errors.role}</div>}
                  </div>

                  {/* NGO-specific fields */}
                  {formData.role === 'ngo' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          <MapPin size={18} className="me-2" />
                          Select your location
                        </label>
                        <div style={{ height: '300px' }}>
                          <MapContainer
                            center={[19.2183, 72.9781]}
                            zoom={11}
                            style={{ height: '100%', width: '100%' }}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <LocationSelector />
                          </MapContainer>
                        </div>
                        {(errors.ngoLat || errors.ngoLng) && (
                          <div className="text-danger small mt-1">{errors.ngoLat || errors.ngoLng}</div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label htmlFor="ngoArea" className="form-label fw-semibold">
                          <MapPin size={18} className="me-2" />
                          Area of Operation
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.ngoArea ? 'is-invalid' : ''}`}
                          id="ngoArea"
                          name="ngoArea"
                          placeholder="Enter city, town, or region"
                          value={formData.ngoArea || ''}
                          onChange={handleInputChange}
                        />
                        {errors.ngoArea && <div className="invalid-feedback">{errors.ngoArea}</div>}
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="text-muted">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                      Login here
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
