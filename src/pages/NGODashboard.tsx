import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, Calendar, MapPin, User, BarChart3, CheckCircle, Clock, AlertCircle, Upload, Eye } from 'lucide-react';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const NGODashboard: React.FC = () => {
  const { user, reports, acceptReport, uploadCompletionImage } = useAuth();
  const mapRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'reported' | 'active' | 'completed'>('reported');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingReport, setUploadingReport] = useState<any>(null);
  const [completionImage, setCompletionImage] = useState<File | null>(null);
  const [completionPreview, setCompletionPreview] = useState<string | null>(null);

  const allReports = reports;
  const [filteredReports, setFilteredReports] = useState(allReports);

  const handleFilter = () => {
    let filtered = allReports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (cityFilter) {
      filtered = filtered.filter(report =>
        report.address.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.timestamp);
        return reportDate >= filterDate;
      });
    }

    setFilteredReports(filtered);
  };

  React.useEffect(() => {
    handleFilter();
  }, [searchTerm, dateFilter, cityFilter, allReports]);

  const handleAcceptReport = (reportId: string) => {
    if (user?.name) {
      acceptReport(reportId, user.name);
    }
  };

  const handleUploadCompletion = (report: any) => {
    setUploadingReport(report);
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
    if (uploadingReport && completionPreview && user?.name) {
      uploadCompletionImage(uploadingReport.reportId, completionPreview, user.name);
      setShowUploadModal(false);
      setUploadingReport(null);
      setCompletionImage(null);
      setCompletionPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const getThisWeekReports = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return allReports.filter(report => new Date(report.timestamp) >= oneWeekAgo).length;
  };

  const getMostReportedArea = () => {
    const areaCounts: Record<string, number> = {};
    allReports.forEach(report => {
      const city = report.address.split(',').pop()?.trim() || 'Unknown';
      areaCounts[city] = (areaCounts[city] || 0) + 1;
    });
    
    return Object.entries(areaCounts).reduce((a, b) => areaCounts[a[0]] > areaCounts[b[0]] ? a : b)[0];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Reported':
        return <span className="badge bg-warning text-dark"><AlertCircle size={14} className="me-1" />Reported</span>;
      case 'Active':
        return <span className="badge bg-info"><Clock size={14} className="me-1" />Active</span>;
      case 'Completed':
        return <span className="badge bg-success"><CheckCircle size={14} className="me-1" />Completed</span>;
      default:
        return <span className="badge bg-secondary">Unknown</span>;
    }
  };

  const reportedReports = filteredReports.filter(report => report.status === 'Reported');
  const activeReports = filteredReports.filter(report => report.status === 'Active');
  const completedReports = filteredReports.filter(report => report.status === 'Completed');

  return (
    <div className="ngo-dashboard">
      <Navbar />
      
      <div className="container-fluid" style={{ paddingTop: '80px' }}>
        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <BarChart3 size={32} className="me-3" />
                  <div>
                    <h5 className="card-title mb-0">Total Reports</h5>
                    <h3 className="mb-0">{allReports.length}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-success text-white">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <Calendar size={32} className="me-3" />
                  <div>
                    <h5 className="card-title mb-0">This Week</h5>
                    <h3 className="mb-0">{getThisWeekReports()}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-info text-white">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <MapPin size={32} className="me-3" />
                  <div>
                    <h5 className="card-title mb-0">Most Reported</h5>
                    <h3 className="mb-0">{getMostReportedArea()}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Navigation */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <ul className="nav nav-pills justify-content-center">
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
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Sidebar Filters */}
          <div className="col-lg-3">
            <div className="card shadow">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <Filter className="me-2" size={20} />
                  Filters
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="search" className="form-label fw-semibold">
                    <Search className="me-2" size={16} />
                    Search
                  </label>
                  <input
                    type="text"
                    id="search"
                    className="form-control"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="city" className="form-label fw-semibold">
                    <MapPin className="me-2" size={16} />
                    City
                  </label>
                  <select
                    id="city"
                    className="form-select"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  >
                    <option value="">All Cities</option>
                    <option value="thane">Thane</option>
                    <option value="mumbai">Mumbai</option>
                    <option value="delhi">Delhi</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="date" className="form-label fw-semibold">
                    <Calendar className="me-2" size={16} />
                    From Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    className="form-control"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>

                <div className="d-grid">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setDateFilter('');
                      setCityFilter('');
                    }}
                  >
                    Clear Filters
                  </button>
                </div>

                <div className="mt-4">
                  <h6 className="fw-bold">Report Summary</h6>
                  <p className="text-muted small mb-1">
                    Showing {filteredReports.length} of {allReports.length} reports
                  </p>
                  <div className="mt-2">
                    <small className="text-muted d-block">Reported: {reportedReports.length}</small>
                    <small className="text-muted d-block">Active: {activeReports.length}</small>
                    <small className="text-muted d-block">Completed: {completedReports.length}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="col-lg-9">
            <div className="card shadow">
              <div className="card-header">
                <h5 className="card-title mb-0">Reports Map</h5>
              </div>
              <div className="card-body p-0">
                <MapContainer
                  center={[19.2183, 72.9781]}
                  zoom={11}
                  style={{ height: '600px', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredReports.map((report) => (
                    <Marker
                      key={report.reportId}
                      position={[report.location.lat, report.location.lng]}
                      eventHandlers={{
                        click: () => setSelectedReport(report),
                      }}
                    >
                      <Popup>
                        <div style={{ minWidth: '250px' }}>
                          <img
                            src={report.photo}
                            alt="Report"
                            style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <div className="mt-2">
                            <div className="mb-2">{getStatusBadge(report.status)}</div>
                            <p className="mb-2 fw-semibold">{report.description}</p>
                            <div className="d-flex align-items-center text-muted small mb-1">
                              <MapPin size={14} className="me-1" />
                              {report.address}
                            </div>
                            <div className="d-flex align-items-center text-muted small mb-1">
                              <User size={14} className="me-1" />
                              {report.username}
                            </div>
                            {report.ngoList.length > 0 && (
                              <div className="d-flex align-items-center text-muted small mb-1">
                                <User size={14} className="me-1" />
                                NGOs: {report.ngoList.join(', ')}
                              </div>
                            )}
                            <div className="d-flex align-items-center text-muted small">
                              <Calendar size={14} className="me-1" />
                              {formatDate(report.timestamp)}
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  {activeSection === 'reported' && 'Reported Issues'}
                  {activeSection === 'active' && 'Active Reports'}
                  {activeSection === 'completed' && 'Completed Reports'}
                </h5>
              </div>
              <div className="card-body">
                {activeSection === 'reported' && (
                  <div className="row">
                    {reportedReports.map((report) => (
                      <div key={report.reportId} className="col-md-6 col-lg-4 mb-4">
                        <div className="card report-card h-100">
                          <img
                            src={report.photo}
                            className="card-img-top"
                            alt="Report"
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              {getStatusBadge(report.status)}
                            </div>
                            <p className="card-text">{report.description}</p>
                            <div className="d-flex align-items-center text-muted small mb-2">
                              <MapPin size={14} className="me-1" />
                              {report.address}
                            </div>
                            <div className="d-flex align-items-center text-muted small mb-2">
                              <User size={14} className="me-1" />
                              {report.username}
                            </div>
                            <div className="d-flex align-items-center text-muted small mb-3">
                              <Calendar size={14} className="me-1" />
                              {formatDate(report.timestamp)}
                            </div>
                            <button
                              className="btn btn-primary btn-sm w-100"
                              onClick={() => handleAcceptReport(report.reportId)}
                            >
                              <CheckCircle size={14} className="me-1" />
                              Accept Report
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'active' && (
                  <div className="row">
                    {activeReports.map((report) => (
                      <div key={report.reportId} className="col-md-6 col-lg-4 mb-4">
                        <div className="card report-card h-100">
                          <img
                            src={report.photo}
                            className="card-img-top"
                            alt="Report"
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              {getStatusBadge(report.status)}
                            </div>
                            <p className="card-text">{report.description}</p>
                            <div className="d-flex align-items-center text-muted small mb-2">
                              <MapPin size={14} className="me-1" />
                              {report.address}
                            </div>
                            <div className="d-flex align-items-center text-muted small mb-2">
                              <User size={14} className="me-1" />
                              {report.username}
                            </div>
                            <div className="d-flex align-items-center text-muted small mb-2">
                              <User size={14} className="me-1" />
                              NGOs: {report.ngoList.join(', ')}
                            </div>
                            <div className="d-flex align-items-center text-muted small mb-3">
                              <Calendar size={14} className="me-1" />
                              {formatDate(report.timestamp)}
                            </div>
                            {!report.completionImage ? (
                              <button
                                className="btn btn-success btn-sm w-100"
                                onClick={() => handleUploadCompletion(report)}
                              >
                                <Upload size={14} className="me-1" />
                                Upload Completion
                              </button>
                            ) : (
                              <div className="text-center">
                                <small className="text-muted">Completion uploaded - awaiting citizen approval</small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'completed' && (
                  <div className="row">
                    {completedReports.map((report) => (
                      <div key={report.reportId} className="col-md-6 col-lg-4 mb-4">
                        <div className="card report-card h-100">
                          <img
                            src={report.photo}
                            className="card-img-top"
                            alt="Report"
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              {getStatusBadge(report.status)}
                            </div>
                            <p className="card-text">{report.description}</p>
                            <div className="d-flex align-items-center text-muted small mb-2">
                              <MapPin size={14} className="me-1" />
                              {report.address}
                            </div>
                            <div className="d-flex align-items-center text-muted small mb-2">
                              <User size={14} className="me-1" />
                              {report.username}
                            </div>
                            <div className="d-flex align-items-center text-muted small mb-2">
                              <User size={14} className="me-1" />
                              NGOs: {report.ngoList.join(', ')}
                            </div>
                            <div className="d-flex align-items-center text-muted small mb-3">
                              <Calendar size={14} className="me-1" />
                              {formatDate(report.timestamp)}
                            </div>
                            {report.completionImage && (
                              <div className="text-center">
                                <img
                                  src={report.completionImage}
                                  alt="Completion"
                                  className="img-thumbnail"
                                  style={{ maxHeight: '100px', maxWidth: '100%' }}
                                />
                                <div className="mt-2">
                                  <small className="text-success">✓ Citizen Approved</small>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {((activeSection === 'reported' && reportedReports.length === 0) ||
                  (activeSection === 'active' && activeReports.length === 0) ||
                  (activeSection === 'completed' && completedReports.length === 0)) && (
                  <div className="text-center py-5">
                    <div className="text-muted">
                      {activeSection === 'reported' && 'No new reports to review'}
                      {activeSection === 'active' && 'No active reports'}
                      {activeSection === 'completed' && 'No completed reports yet'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Completion Modal */}
      <div className={`modal fade ${showUploadModal ? 'show' : ''}`} style={{ display: showUploadModal ? 'block' : 'none' }} tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Upload Completion Proof</h5>
              <button type="button" className="btn-close" onClick={() => setShowUploadModal(false)}></button>
            </div>
            <div className="modal-body">
              {uploadingReport && (
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Original Report</h6>
                    <img src={uploadingReport.photo} alt="Original" className="img-fluid rounded mb-2" />
                    <p>{uploadingReport.description}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Upload Completion Photo</h6>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="form-control mb-3"
                      accept="image/jpeg,image/png"
                      onChange={handleCompletionImageChange}
                    />
                    {completionPreview && (
                      <img src={completionPreview} alt="Completion Preview" className="img-fluid rounded" />
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
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
      {showUploadModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default NGODashboard;