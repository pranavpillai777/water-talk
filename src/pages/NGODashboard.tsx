import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import Navbar from '../components/Navbar';
import { Search, Filter, Calendar, MapPin, User, BarChart3 } from 'lucide-react';

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
  reporterName: string;
  description: string;
  imageUrl: string;
  location: { lat: number; lng: number };
  address: string;
  date: string;
}

const NGODashboard: React.FC = () => {
  const mapRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Mock reports data
  const allReports: Report[] = [
    {
      _id: '1',
      userId: '1',
      reporterName: 'John Citizen',
      description: 'Stagnant water with algae growth near the park entrance',
      imageUrl: 'https://images.pexels.com/photos/3560167/pexels-photo-3560167.jpeg',
      location: { lat: 18.5204, lng: 73.8567 },
      address: 'Park Road, Pune',
      date: '2025-01-15T10:30:00Z',
    },
    {
      _id: '2',
      userId: '1',
      reporterName: 'Jane Smith',
      description: 'Chemical contamination in the river, unusual foam and discoloration',
      imageUrl: 'https://images.pexels.com/photos/3560168/pexels-photo-3560168.jpeg',
      location: { lat: 18.5104, lng: 73.8467 },
      address: 'River Bank, Pune',
      date: '2025-01-14T15:45:00Z',
    },
    {
      _id: '3',
      userId: '1',
      reporterName: 'Mike Johnson',
      description: 'Plastic waste accumulation blocking water flow',
      imageUrl: 'https://images.pexels.com/photos/2827392/pexels-photo-2827392.jpeg',
      location: { lat: 18.5304, lng: 73.8667 },
      address: 'Canal Street, Pune',
      date: '2025-01-13T09:15:00Z',
    },
    {
      _id: '4',
      userId: '1',
      reporterName: 'Sarah Wilson',
      description: 'Oil spill in the lake affecting local wildlife',
      imageUrl: 'https://images.pexels.com/photos/3560169/pexels-photo-3560169.jpeg',
      location: { lat: 18.5404, lng: 73.8367 },
      address: 'Lake View, Pune',
      date: '2025-01-12T14:20:00Z',
    },
  ];

  const [filteredReports, setFilteredReports] = useState<Report[]>(allReports);

  const handleFilter = () => {
    let filtered = allReports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporterName.toLowerCase().includes(searchTerm.toLowerCase())
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
        const reportDate = new Date(report.date);
        return reportDate >= filterDate;
      });
    }

    setFilteredReports(filtered);
  };

  React.useEffect(() => {
    handleFilter();
  }, [searchTerm, dateFilter, cityFilter]);

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
    return allReports.filter(report => new Date(report.date) >= oneWeekAgo).length;
  };

  const getMostReportedArea = () => {
    const areaCounts: Record<string, number> = {};
    allReports.forEach(report => {
      const city = report.address.split(',').pop()?.trim() || 'Unknown';
      areaCounts[city] = (areaCounts[city] || 0) + 1;
    });
    
    return Object.entries(areaCounts).reduce((a, b) => areaCounts[a[0]] > areaCounts[b[0]] ? a : b)[0];
  };

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
                    <option value="pune">Pune</option>
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
                  center={[18.5204, 73.8567]}
                  zoom={12}
                  style={{ height: '600px', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredReports.map((report) => (
                    <Marker
                      key={report._id}
                      position={[report.location.lat, report.location.lng]}
                      eventHandlers={{
                        click: () => setSelectedReport(report),
                      }}
                    >
                      <Popup>
                        <div style={{ minWidth: '250px' }}>
                          <img
                            src={report.imageUrl}
                            alt="Report"
                            style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <div className="mt-2">
                            <p className="mb-2 fw-semibold">{report.description}</p>
                            <div className="d-flex align-items-center text-muted small mb-1">
                              <MapPin size={14} className="me-1" />
                              {report.address}
                            </div>
                            <div className="d-flex align-items-center text-muted small mb-1">
                              <User size={14} className="me-1" />
                              {report.reporterName}
                            </div>
                            <div className="d-flex align-items-center text-muted small">
                              <Calendar size={14} className="me-1" />
                              {formatDate(report.date)}
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
                <h5 className="card-title mb-0">Recent Reports</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {filteredReports.map((report) => (
                    <div key={report._id} className="col-md-6 col-lg-4 mb-4">
                      <div 
                        className="card report-card h-100"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedReport(report)}
                      >
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
                          <div className="d-flex align-items-center text-muted small mb-2">
                            <User size={14} className="me-1" />
                            {report.reporterName}
                          </div>
                          <div className="d-flex align-items-center text-muted small">
                            <Calendar size={14} className="me-1" />
                            {formatDate(report.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;