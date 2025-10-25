import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { Clock, MapPin, Upload, FileText, Camera, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

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
  const { user, reports: globalReports, addReport, approveCompletion } = useAuth();
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
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showNgoSelectionPanel, setShowNgoSelectionPanel] = useState(false);
  const [selectedNgoInfo, setSelectedNgoInfo] = useState<any>(null);

  const userReports = globalReports.filter(report => report.userId === user?._id);

  // Map click handler component
  const MapClickHandler: React.FC = () => {
    useMapEvents({
      click(e) {
        const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
        setFormData(prev => ({ ...prev, location: newLocation }));
        if (errors.location) {
          setErrors(prev => ({ ...prev, location: undefined }));
        }
      },
    });
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!selectedFile) {
      newErrors.image = 'Image is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.location) {
      newErrors.location = 'Please select a location on the map';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: undefined }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      addReport({
        userId: user?._id || '',
        username: user?.name || '',
        photo: imagePreview,
        description: formData.description,
        location: formData.location || { lat: 0, lng: 0 },
        address: formData.address || `${formData.location?.lat.toFixed(4)}, ${formData.location?.lng.toFixed(4)}`,
      });

      // Reset form
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
    switch (status) {
      case 'Reported':
        return <span className="badge bg-warning text-dark"><AlertCircle size={14} className="me-1" />Reported</span>;
      case 'Active':
        return <span className="badge bg-info text-white"><Clock size={14} className="me-1" />Active</span>;
      case 'Completed':
        return <span className="badge bg-success"><CheckCircle size={14} className="me-1" />Completed</span>;
      default:
        return <span className="badge bg-secondary"><XCircle size={14} className="me-1" />Unknown</span>;
    }
  };

  const handleReviewCompletion = (report: any) => {
    setSelectedReport(report);
    setShowCompletionModal(true);
  };

  const handleApproveCompletion = () => {
    if (selectedReport) {
      approveCompletion(selectedReport.reportId);
      setShowCompletionModal(false);
      setSelectedReport(null);
    }
  };

  // Simulate NGO selection notification
  useEffect(() => {
    const checkForNgoSelections = () => {
      const recentlyAcceptedReports = globalReports.filter(
        report => report.status === 'Active' && report.ngoList.length > 0 && report.userId === user?._id
      );
      
      if (recentlyAcceptedReports.length > 0) {
        const latestReport = recentlyAcceptedReports[0];
        const latestNgo = latestReport.ngoList[latestReport.ngoList.length - 1];
        setSelectedNgoInfo({
          ngoName: latestNgo,
          reportId: latestReport.reportId,
          timestamp: new Date().toISOString(),
          location: latestReport.location
        });
        setShowNgoSelectionPanel(true);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowNgoSelectionPanel(false);
        }, 5000);
      }
    };

    checkForNgoSelections();
  }, [globalReports, user?._id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <Navbar />
      
      {/* User Header */}
      <div className="bg-light border-bottom">
        <div className="container py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Citizen Dashboard</h4>
            <div className="d-flex align-items-center">
              <div className="me-3">
                <span className="text-muted">Welcome back,</span>
                <strong className="ms-1">{user?.name}</strong>
              </div>
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                   style={{ width: '40px', height: '40px' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {/* Tab Navigation */}
        <ul className="nav nav-pills mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              <FileText size={18} className="me-2" />
              Report Issue
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >
              <Clock size={18} className="me-2" />
              My Submissions ({userReports.length})
            </button>
          </li>
        </ul>

        {/* Report Issue Tab */}
        {activeTab === 'report' && (
          <div className="row">
            <div className="col-lg-7">
              <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <FileText size={20} className="me-2" />
                    File a New Report
                  </h5>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={handleSubmit}>
                    {/* Step 1: Image Upload (Required) */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        <Camera size={18} className="me-2" />
                        Upload Image <span className="text-danger">*</span>
                      </label>
                      <div className="border-2 border-dashed border-primary rounded p-4 text-center">
                        {imagePreview ? (
                          <div>
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="img-fluid mb-3"
                              style={{ maxHeight: '200px', borderRadius: '8px' }}
                            />
                            <div>
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => document.getElementById('imageInput')?.click()}
                              >
                                Change Image
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Upload size={48} className="text-primary mb-3" />
                            <p className="mb-2">Click to upload an image of the water pollution</p>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => document.getElementById('imageInput')?.click()}
                            >
                              Select Image
                            </button>
                          </div>
                        )}
                        <input
                          id="imageInput"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="d-none"
                          aria-label="Upload image"
                        />
                      </div>
                      {errors.image && (
                        <div className="text-danger small mt-1">{errors.image}</div>
                      )}
                    </div>

                    {/* Step 2: Description */}
                    <div className="mb-4">
                      <label htmlFor="description" className="form-label fw-semibold">
                        <FileText size={18} className="me-2" />
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                        rows={4}
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe the water pollution issue in detail..."
                      />
                      {errors.description && (
                        <div className="invalid-feedback">{errors.description}</div>
                      )}
                    </div>

                    {/* Step 3: Location Selection */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        <MapPin size={18} className="me-2" />
                        Select Location <span className="text-danger">*</span>
                      </label>
                      <div className="border rounded" style={{ height: '500px' }}>
                        <MapContainer
                          center={[19.2183, 72.9781]}
                          zoom={12}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <MapClickHandler />
                          {formData.location && (
                            <Marker position={[formData.location.lat, formData.location.lng]} />
                          )}
                          {/* Show existing reports */}
                          {globalReports.map((report) => (
                            <Marker
                              key={report.reportId}
                              position={[report.location.lat, report.location.lng]}
                            />
                          ))}
                        </MapContainer>
                      </div>
                      {formData.location && (
                        <small className="text-muted">
                          Selected: {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                        </small>
                      )}
                      {errors.location && (
                        <div className="text-danger small mt-1">{errors.location}</div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100 py-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                          Submitting Report...
                        </>
                      ) : (
                        <>
                          <Upload size={20} className="me-2" />
                          Submit Report
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Submissions Tab */}
        {activeTab === 'submissions' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5>Your Submissions</h5>
              <span className="badge bg-primary fs-6">{userReports.length} Reports</span>
            </div>

            {userReports.length === 0 ? (
              <div className="text-center py-5">
                <FileText size={64} className="text-muted mb-3" />
                <h5 className="text-muted">No reports submitted yet</h5>
                <p className="text-muted">Click on "Report Issue" to submit your first report</p>
              </div>
            ) : (
              <div className="row">
                {userReports.map((report) => (
                  <div key={report.reportId} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100 shadow-sm report-card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <Clock size={14} className="me-1" />
                          {formatDate(report.timestamp)}
                        </small>
                        {getStatusBadge(report.status)}
                      </div>
                      
                      {report.photo && (
                        <img
                          src={report.photo}
                          className="card-img-top"
                          alt="Report"
                          style={{ height: '200px', objectFit: 'cover' }}
                        />
                      )}
                      
                      <div className="card-body">
                        <p className="card-text">{report.description}</p>
                        <small className="text-muted">
                          <MapPin size={14} className="me-1" />
                          {report.address}
                        </small>
                        
                        {report.ngoList.length > 0 && (
                          <div className="mt-2">
                            <small className="text-success fw-semibold">
                              Accepted by: {report.ngoList.join(', ')}
                            </small>
                          </div>
                        )}
                      </div>
                      
                      {report.completionImage && !report.citizenApproval && (
                        <div className="card-footer">
                          <button
                            className="btn btn-success btn-sm w-100"
                            onClick={() => handleReviewCompletion(report)}
                          >
                            <CheckCircle size={16} className="me-1" />
                            Review Completion
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* NGO Selection Slide-in Panel */}
      {showNgoSelectionPanel && selectedNgoInfo && (
        <div
          className="position-fixed bg-success text-white p-4 shadow-lg"
          style={{
            top: '50%',
            right: showNgoSelectionPanel ? '20px' : '-400px',
            transform: 'translateY(-50%)',
            width: '350px',
            borderRadius: '12px',
            zIndex: 1050,
            transition: 'right 0.3s ease-in-out',
          }}
        >
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h6 className="mb-0">
              <CheckCircle size={20} className="me-2" />
              Report Accepted!
            </h6>
            <button
              className="btn-close btn-close-white"
              onClick={() => setShowNgoSelectionPanel(false)}
            ></button>
          </div>
          <div>
            <p className="mb-2">
              <strong>NGO:</strong> {selectedNgoInfo.ngoName}
            </p>
            <p className="mb-2">
              <strong>When:</strong> {formatDate(selectedNgoInfo.timestamp)}
            </p>
            <p className="mb-0">
              <strong>Location:</strong> {selectedNgoInfo.location.lat.toFixed(4)}, {selectedNgoInfo.location.lng.toFixed(4)}
            </p>
          </div>
        </div>
      )}

      {/* Completion Review Modal */}
      {showCompletionModal && selectedReport && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Review Completion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCompletionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Original Report</h6>
                    <img
                      src={selectedReport.photo}
                      alt="Original"
                      className="img-fluid rounded"
                    />
                  </div>
                  <div className="col-md-6">
                    <h6>After Cleanup</h6>
                    <img
                      src={selectedReport.completionImage}
                      alt="Completion"
                      className="img-fluid rounded"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <p><strong>Description:</strong> {selectedReport.description}</p>
                  <p><strong>Cleaned by:</strong> {selectedReport.ngoList.join(', ')}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCompletionModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleApproveCompletion}
                >
                  <CheckCircle size={16} className="me-1" />
                  Approve Completion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;