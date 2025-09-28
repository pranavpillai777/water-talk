import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { Camera, MapPin, Upload, FileText, Clock, Trash2 } from 'lucide-react';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Report {
  _id: string;
  userId: string;
  description: string;
  imageUrl: string;
  location: { lat: number; lng: number };
  address: string;
  date: string;
}

interface FormData {
  description: string;
  address: string;
  image: File | null;
  location: { lat: number; lng: number } | null;
}

const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    description: '',
    address: '',
    image: null,
    location: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reports, setReports] = useState<Report[]>([
    {
      _id: '1',
      userId: user?._id || '1',
      description: 'Stagnant water with algae growth near Thane Creek',
      imageUrl: 'https://images.pexels.com/photos/3560167/pexels-photo-3560167.jpeg',
      location: { lat: 19.2183, lng: 72.9781 },
      address: 'Thane Creek, Thane',
      date: '2025-01-15T10:30:00Z',
    }
  ]);

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setFormData(prev => ({
          ...prev,
          location: { lat, lng },
          address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
        }));
      },
    });
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.image) {
      newErrors.image = 'Please upload an image';
    } else {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (formData.image.size > maxSize) {
        newErrors.image = 'Image size must be less than 5MB';
      }
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(formData.image.type)) {
        newErrors.image = 'Only JPG and PNG images are allowed';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 300) {
      newErrors.description = 'Description must be 300 characters or less';
    }

    if (!formData.address.trim() && !formData.location) {
      newErrors.location = 'Please provide an address or click on the map';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear image error
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock API call - in real app, this would upload to server
      const newReport: Report = {
        _id: Date.now().toString(),
        userId: user?._id || '',
        description: formData.description,
        imageUrl: imagePreview || '',
        location: formData.location || { lat: 0, lng: 0 },
        address: formData.address,
        date: new Date().toISOString(),
      };

      setReports(prev => [newReport, ...prev]);

      // Reset form
      setFormData({
        description: '',
        address: '',
        image: null,
        location: null,
      });
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert('Report submitted successfully!');
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error submitting report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="citizen-dashboard">
      <Navbar />
      
      <div className="container-fluid" style={{ paddingTop: '80px' }}>
        <div className="row">
          {/* Report Form */}
          <div className="col-lg-6 p-4">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h4 className="card-title mb-0">
                  <Camera className="me-2" size={20} />
                  Report a Water Issue
                </h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {/* Image Upload */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <Upload className="me-2" size={18} />
                      Upload Photo
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className={`form-control ${errors.image ? 'is-invalid' : ''}`}
                      accept="image/jpeg,image/png"
                      onChange={handleImageChange}
                    />
                    {errors.image && <div className="invalid-feedback">{errors.image}</div>}
                    
                    {imagePreview && (
                      <div className="mt-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="img-thumbnail"
                          style={{ maxHeight: '200px', maxWidth: '100%' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label htmlFor="description" className="form-label fw-semibold">
                      <FileText className="me-2" size={18} />
                      Description
                    </label>
                    <textarea
                      id="description"
                      className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                      rows={4}
                      value={formData.description}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, description: e.target.value }));
                        if (errors.description) {
                          setErrors(prev => ({ ...prev, description: '' }));
                        }
                      }}
                      placeholder="Describe the water pollution issue..."
                      maxLength={300}
                    />
                    <div className="form-text">
                      {formData.description.length}/300 characters
                    </div>
                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                  </div>

                  {/* Address */}
                  <div className="mb-4">
                    <label htmlFor="address" className="form-label fw-semibold">
                      <MapPin className="me-2" size={18} />
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      className="form-control"
                      value={formData.address}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, address: e.target.value }));
                        if (errors.location) {
                          setErrors(prev => ({ ...prev, location: '' }));
                        }
                      }}
                      placeholder="Enter address or click on map"
                    />
                    {errors.location && <div className="text-danger small">{errors.location}</div>}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="col-lg-6 p-4">
            <div className="card shadow h-100">
              <div className="card-header">
                <h5 className="card-title mb-0">Click on map to mark location</h5>
              </div>
              <div className="card-body p-0">
                <MapContainer
                  center={[19.2183, 72.9781]}
                  zoom={12}
                  style={{ height: '400px', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler />
                  {formData.location && (
                    <Marker position={[formData.location.lat, formData.location.lng]} />
                  )}
                  {reports.map((report) => (
                    <Marker
                      key={report._id}
                      position={[report.location.lat, report.location.lng]}
                    />
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Previous Reports */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-header">
                <h4 className="card-title mb-0">
                  <Clock className="me-2" size={20} />
                  Your Previous Reports
                </h4>
              </div>
              <div className="card-body">
                {reports.length === 0 ? (
                  <p className="text-muted text-center py-4">No reports submitted yet.</p>
                ) : (
                  <div className="row">
                    {reports.map((report) => (
                      <div key={report._id} className="col-md-6 col-lg-4 mb-4">
                        <div className="card report-card h-100">
                          <img
                            src={report.imageUrl}
                            className="card-img-top"
                            alt="Report"
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                          <div className="card-body">
                            <p className="card-text">{report.description}</p>
                            <div className="d-flex align-items-center text-muted small mb-2">
                              <MapPin size={14} className="me-1" />
                              {report.address}
                            </div>
                            <div className="d-flex align-items-center text-muted small">
                              <Clock size={14} className="me-1" />
                              {formatDate(report.date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;