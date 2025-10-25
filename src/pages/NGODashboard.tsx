import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ErrorBoundary from '../components/ErrorBoundary';
import StableMap from '../components/MapContainer';
import { useAuth } from '../contexts/AuthContext';
import { Clock, MapPin, Upload, CheckCircle, AlertCircle, Search, Calendar, Map as MapIcon, Users, FileText, Camera } from 'lucide-react';

const NGODashboard: React.FC = () => {
  const { user, reports: globalReports, acceptReport, uploadCompletionImage } = useAuth();
  const [activeSection, setActiveSection] = useState<'reported' | 'active' | 'completed'>('reported');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [completionImage, setCompletionImage] = useState<File | null>(null);
  const [completionPreview, setCompletionPreview] = useState<string>('');
  const [filters, setFilters] = useState({
    search: '',
    date: '',
    city: 'all'
  });

  // Filter reports based on status and NGO involvement
  const reportedReports = globalReports.filter(report => report.status === 'Reported');
  const activeReports = globalReports.filter(report => 
    report.status === 'Active' && report.ngoList.includes(user?.name || '')
  );
  const completedReports = globalReports.filter(report => 
    report.status === 'Completed' && report.ngoList.includes(user?.name || '')
  );

  // Get current section reports
  const getCurrentSectionReports = () => {
    let reports = [];
    switch (activeSection) {
      case 'reported':
        reports = reportedReports;
        break;
      case 'active':
        reports = activeReports;
        break;
      case 'completed':
        reports = completedReports;
        break;
    }

    // Apply filters
    return reports.filter(report => {
      const matchesSearch = report.description.toLowerCase().includes(filters.search.toLowerCase()) ||
                           report.username.toLowerCase().includes(filters.search.toLowerCase());
      const matchesDate = !filters.date || report.timestamp.startsWith(filters.date);
      const matchesCity = filters.city === 'all' || report.address.toLowerCase().includes(filters.city.toLowerCase());
      
      return matchesSearch && matchesDate && matchesCity;
    });
  };

  const handleAcceptReport = (reportId: string) => {
    if (user?.name) {
      acceptReport(reportId, user.name);
    }
  };

  const handleUploadCompletion = (report: any) => {
    setSelectedReport(report);
    setShowUploadModal(true);
  };

  const handleCompletionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompletionImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompletionPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitCompletion = () => {
    if (selectedReport && completionPreview && user?.name) {
      uploadCompletionImage(selectedReport.reportId, completionPreview, user.name);
      setShowUploadModal(false);
      setSelectedReport(null);
      setCompletionImage(null);
      setCompletionPreview('');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        return <span className="badge bg-secondary">Unknown</span>;
    }
  };

  return (
    <ErrorBoundary>
      <div>
      <Navbar />
      
      {/* Top Statistics Bar */}
      <div className="bg-primary text-white">
        <div className="container py-3">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h4 className="mb-0">
                <Users size={24} className="me-2" />
                NGO Dashboard - {user?.name}
              </h4>
            </div>
            <div className="col-md-6">
              <div className="d-flex justify-content-end">
                <div className="bg-white bg-opacity-20 rounded px-3 py-2">
                  <strong>All Complaints: {globalReports.length}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid py-4">
        <div className="row">
          {/* Left Sidebar - Selected Complaints */}
          <div className="col-md-3">
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white">
                <h6 className="mb-0">
                  <CheckCircle size={18} className="me-2" />
                  My Selected Complaints
                </h6>
              </div>
              <div className="card-body p-0">
                {activeReports.length === 0 ? (
                  <div className="p-3 text-center text-muted">
                    <FileText size={32} className="mb-2" />
                    <p className="mb-0">No complaints accepted yet</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {activeReports.map((report) => (
                      <div key={report.reportId} className="list-group-item list-group-item-action">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{report.username}</h6>
                            <p className="mb-1 small text-truncate" style={{ maxWidth: '200px' }}>
                              {report.description}
                            </p>
                            <small className="text-muted">
                              <Clock size={12} className="me-1" />
                              {formatDate(report.timestamp)}
                            </small>
                          </div>
                          {getStatusBadge(report.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="card-footer bg-light">
                  <small className="text-muted">
                    <strong>{activeReports.length}</strong> complaints accepted
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-md-9">
            {/* Section Navigation */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <ul className="nav nav-pills">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeSection === 'reported' ? 'active' : ''}`}
                    onClick={() => setActiveSection('reported')}
                  >
                    <AlertCircle size={18} className="me-2" />
                    Reported ({reportedReports.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeSection === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveSection('active')}
                  >
                    <Clock size={18} className="me-2" />
                    Active ({activeReports.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeSection === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveSection('completed')}
                  >
                    <CheckCircle size={18} className="me-2" />
                    Completed ({completedReports.length})
                  </button>
                </li>
              </ul>

              {/* Filters */}
              <div className="d-flex gap-2">
                <div className="input-group" style={{ width: '200px' }}>
                  <span className="input-group-text">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <select
                  className="form-select form-select-sm"
                  style={{ width: '120px' }}
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                >
                  <option value="all">All Cities</option>
                  <option value="thane">Thane</option>
                  <option value="mumbai">Mumbai</option>
                </select>
              </div>
            </div>

            {/* Map */}
            <div className="card shadow-sm mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <MapIcon size={18} className="me-2" />
                  Reports Map
                </h6>
                {/* Legend */}
                <div className="d-flex gap-3 small">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary rounded-circle me-1" style={{ width: '12px', height: '12px' }}></div>
                    <span>Reported</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="bg-success rounded-circle me-1" style={{ width: '12px', height: '12px' }}></div>
                    <span>Accepted by NGO</span>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div style={{ height: '400px' }}>
                  <StableMap
                    reports={globalReports}
                    user={user}
                    onAcceptReport={handleAcceptReport}
                    onUploadCompletion={handleUploadCompletion}
                    height="400px"
                  />
                </div>
              </div>
            </div>

            {/* Reports Cards */}
            <div className="row">
              {getCurrentSectionReports().map((report) => (
                <div key={report.reportId} className="col-lg-6 mb-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">{report.username}</h6>
                        <small className="text-muted">
                          <Clock size={12} className="me-1" />
                          {formatDate(report.timestamp)}
                        </small>
                      </div>
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
                      <div className="mb-2">
                        <small className="text-muted">
                          <MapPin size={12} className="me-1" />
                          {report.address}
                        </small>
                      </div>
                      
                      {report.ngoList.length > 0 && (
                        <div className="mb-2">
                          <small className="text-success">
                            <strong>Accepted by:</strong> {report.ngoList.join(', ')}
                          </small>
                        </div>
                      )}
                    </div>
                    
                    <div className="card-footer">
                      {activeSection === 'reported' && (
                        <button
                          className="btn btn-success w-100"
                          onClick={() => handleAcceptReport(report.reportId)}
                        >
                          <CheckCircle size={16} className="me-1" />
                          Accept Report
                        </button>
                      )}
                      
                      {activeSection === 'active' && !report.completionImage && (
                        <button
                          className="btn btn-primary w-100"
                          onClick={() => handleUploadCompletion(report)}
                        >
                          <Upload size={16} className="me-1" />
                          Upload Completion Proof
                        </button>
                      )}
                      
                      {activeSection === 'active' && report.completionImage && (
                        <div className="text-center">
                          <span className="badge bg-info">
                            <Camera size={14} className="me-1" />
                            Completion Uploaded - Awaiting Approval
                          </span>
                        </div>
                      )}
                      
                      {activeSection === 'completed' && (
                        <div className="d-flex gap-2">
                          <img
                            src={report.photo}
                            alt="Before"
                            className="img-thumbnail"
                            style={{ width: '80px', height: '60px', objectFit: 'cover' }}
                          />
                          <img
                            src={report.completionImage}
                            alt="After"
                            className="img-thumbnail"
                            style={{ width: '80px', height: '60px', objectFit: 'cover' }}
                          />
                          <div className="flex-grow-1 d-flex align-items-center">
                            <span className="badge bg-success w-100">
                              <CheckCircle size={14} className="me-1" />
                              Completed & Approved
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getCurrentSectionReports().length === 0 && (
              <div className="text-center py-5">
                <FileText size={64} className="text-muted mb-3" />
                <h5 className="text-muted">No reports in this section</h5>
                <p className="text-muted">
                  {activeSection === 'reported' && 'No new reports to review'}
                  {activeSection === 'active' && 'No active reports assigned to you'}
                  {activeSection === 'completed' && 'No completed reports yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Completion Modal */}
      {showUploadModal && selectedReport && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Upload Completion Proof</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUploadModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6>Original Report</h6>
                    <img
                      src={selectedReport.photo}
                      alt="Original"
                      className="img-fluid rounded"
                    />
                    <p className="mt-2 small">{selectedReport.description}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Upload Completion Photo</h6>
                    <div className="border-2 border-dashed border-primary rounded p-3 text-center">
                      {completionPreview ? (
                        <div>
                          <img
                            src={completionPreview}
                            alt="Completion Preview"
                            className="img-fluid mb-2 rounded"
                            style={{ maxHeight: '200px' }}
                          />
                          <div>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => document.getElementById('completionInput')?.click()}
                            >
                              Change Photo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Camera size={48} className="text-primary mb-2" />
                          <p>Upload a photo showing the cleaned area</p>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => document.getElementById('completionInput')?.click()}
                          >
                            Select Photo
                          </button>
                        </div>
                      )}
                      <input
                        id="completionInput"
                        type="file"
                        accept="image/*"
                        onChange={handleCompletionImageChange}
                        className="d-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSubmitCompletion}
                  disabled={!completionPreview}
                >
                  <Upload size={16} className="me-1" />
                  Submit Completion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default NGODashboard;