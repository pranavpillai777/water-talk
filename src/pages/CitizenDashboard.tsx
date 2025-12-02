import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import Navbar from '../components/Navbar';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import { Clock, MapPin, Upload, FileText, Camera, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../supabase';
import { validateImageFile, validateImageDimensions, formatFileSize, getImageInfo } from '../utils/imageValidation';

// Leaflet default marker fix
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FormData {
  description: string;
  location: { lat: number; lng: number } | null;
  address: string;
}

interface FormErrors {
  image?: string;
  description?: string;
  location?: string;
}

const CitizenDashboard: React.FC = () => {
  const { user, reports: globalReports, addReport } = useAuth();
  const [activeTab, setActiveTab] = useState<'report' | 'submissions'>('report');
  const [formData, setFormData] = useState<FormData>({
    description: '',
    location: null,
    address: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageInfo, setImageInfo] = useState<{
    width: number;
    height: number;
    size: string;
    type: string;
  } | null>(null);
  const [isValidatingImage, setIsValidatingImage] = useState(false);

  // ✅ NEW: Replace local filtering with Supabase fetch
  const [userReports, setUserReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserReports = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('complaint_time', { ascending: false });

      if (error) {
        console.error('Error fetching user complaints:', error);
      } else {
        setUserReports(data);
      }
    };

    fetchUserReports();
  }, [user]);

  // Map click handler
  const MapClickHandler: React.FC = () => {
    useMapEvents({
      click(e) {
        const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
        setFormData(prev => ({ ...prev, location: newLocation }));
        if (errors.location) setErrors(prev => ({ ...prev, location: undefined }));
      },
    });
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!selectedFile) newErrors.image = 'Image is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location) newErrors.location = 'Please select a location on the map';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsValidatingImage(true);
      setErrors(prev => ({ ...prev, image: undefined }));
      
      try {
        // Basic file validation (size, type)
        const fileValidation = validateImageFile(file);
        if (!fileValidation.isValid) {
          setErrors(prev => ({ ...prev, image: fileValidation.error }));
          setSelectedFile(null);
          setImagePreview('');
          setImageInfo(null);
          setIsValidatingImage(false);
          return;
        }
        
        // Dimension validation
        const dimensionValidation = await validateImageDimensions(file);
        if (!dimensionValidation.isValid) {
          setErrors(prev => ({ ...prev, image: dimensionValidation.error }));
          setSelectedFile(null);
          setImagePreview('');
          setImageInfo(null);
          setIsValidatingImage(false);
          return;
        }
        
        // Get image info for display
        const info = await getImageInfo(file);
        setImageInfo(info);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = e => {
          setImagePreview(e.target?.result as string);
          setSelectedFile(file);
          setIsValidatingImage(false);
        };
        reader.readAsDataURL(file);
        
      } catch (error) {
        console.error('Image validation error:', error);
        setErrors(prev => ({ ...prev, image: 'Failed to process image. Please try another file.' }));
        setSelectedFile(null);
        setImagePreview('');
        setImageInfo(null);
        setIsValidatingImage(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  // Submit complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (!selectedFile || !user?.id) {
        alert('Missing file or user info.');
        setIsSubmitting(false);
        return;
      }

      // 1. Upload the image to Supabase Storage
      const fileName = `${crypto.randomUUID()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('user-images')
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload image. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // 2. Get the public URL
      const { data, error: urlError } = supabase
        .storage
        .from('user-images')
        .getPublicUrl(fileName);

      if (urlError) {
        console.error('Get URL error:', urlError);
        alert('Failed to get image URL.');
        setIsSubmitting(false);
        return;
      }

      const imageUrl = data.publicUrl;

      // 3. Insert the complaint into Supabase
      const { data: complaintData, error: insertError } = await supabase
        .from('complaints')
        .insert([
          {
            user_id: user.id,
            description: formData.description,
            status: 'reported',
            complaint_lat: formData.location?.lat || 0,
            complaint_long: formData.location?.lng || 0,
            image_url: imageUrl,
          },
        ])
        .select();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        alert('Failed to submit report. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // 4. Update local state
      setUserReports(prev => [complaintData[0], ...prev]); // add new complaint locally too
      addReport(complaintData[0]);

      // 5. Reset form
      setFormData({ description: '', location: null, address: '' });
      setSelectedFile(null);
      setImagePreview('');
      setActiveTab('submissions');

      alert('Report submitted successfully!');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

 const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {   // normalize to lowercase
    case 'reported':
      return <span className="badge bg-warning text-dark"><AlertCircle size={14} className="me-1" />Reported</span>;
    case 'in-progress':
      return <span className="badge bg-info text-white"><Clock size={14} className="me-1" />Active</span>;
    case 'resolved':
      return <span className="badge bg-success"><CheckCircle size={14} className="me-1" />Completed</span>;
    case 'accepted':
      return <span className="badge bg-success"><CheckCircle size={14} className="me-1" />Accepted</span>;
    default:
      return <span className="badge bg-secondary"><XCircle size={14} className="me-1" />Unknown</span>;
  }
};

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  return (
    <ErrorBoundary>
      <div>
        <Navbar />

        <div className="container py-4">
          <ul className="nav nav-pills mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'report' ? 'active' : ''}`}
                onClick={() => setActiveTab('report')}
              >
                <FileText size={18} className="me-2" /> Report Issue
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'submissions' ? 'active' : ''}`}
                onClick={() => setActiveTab('submissions')}
              >
                <Clock size={18} className="me-2" /> My Submissions ({userReports.length})
              </button>
            </li>
          </ul>

          {activeTab === 'report' && (
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">File a New Report</div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {/* Image upload */}
                  <div className="mb-3">
                    <label className="form-label">Upload Image *</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                    {errors.image && <div className="text-danger">{errors.image}</div>}
                    {imagePreview && <img src={imagePreview} alt="preview" className="img-fluid mt-2" />}
                    <div className="mb-2">
                      <small className="text-muted">
                        Accepted formats: JPG, PNG, WebP • Max size: 5MB • Min dimensions: 200×200px
                      </small>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label className="form-label">Description *</label>
                    <textarea
                      className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                  </div>

                  {/* Map */}
                  <div className="mb-3" style={{ height: '400px' }}>
                    {typeof window !== 'undefined' && (
                      <MapContainer center={[19.2183, 72.9781]} zoom={12} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; OpenStreetMap contributors'
                        />
                        <MapClickHandler />
                        {formData.location && <Marker position={[formData.location.lat, formData.location.lng]} />}
                      </MapContainer>
                    )}
                    {errors.location && <div className="text-danger mt-1">{errors.location}</div>}
                        disabled={isValidatingImage}
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              </div>
            </div>
          )}

                            {imageInfo && (
                              <div className="mt-2">
                                <small className="text-success">
                                  ✓ {imageInfo.width}×{imageInfo.height}px • {imageInfo.size}
                                </small>
                              </div>
                            )}
          {activeTab === 'submissions' && (
            <div>
              {userReports.length === 0 ? (
                <p>No submissions yet.</p>
                        ) : isValidatingImage ? (
                          <div>
                            <div className="spinner-border text-primary mb-2" role="status">
                              <span className="visually-hidden">Validating image...</span>
                            </div>
                            <div>
                              <Upload size={24} className="text-muted mb-2" />
                              <p className="mb-0 text-muted">Validating image...</p>
                            </div>
                          </div>
              ) : (
                <div className="row">
                  {userReports.map((report: any) => (
                    <div className="col-md-6 mb-3" key={report.complaint_id}>
                      <div className="card shadow-sm">
                        <img src={report.image_url} className="card-img-top" alt="report" />
                        <div className="card-body">
                              Max 5MB • JPG, PNG, WebP • Min 200×200px
                          <p>{getStatusBadge(report.status)}</p>
                          <small className="text-muted">{formatDate(report.complaint_time)}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CitizenDashboard;
