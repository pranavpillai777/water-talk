import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Clock, CheckCircle, Upload } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom green marker for accepted reports
const greenIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface StableMapProps {
  reports: any[];
  user: any;
  onAcceptReport: (reportId: string) => void;
  onUploadCompletion: (report: any) => void;
  height?: string;
}

const StableMap: React.FC<StableMapProps> = ({ 
  reports, 
  user, 
  onAcceptReport, 
  onUploadCompletion,
  height = '400px'
}) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Ensure map is ready before rendering
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Reported':
        return <span className="badge bg-warning text-dark">Reported</span>;
      case 'Active':
        return <span className="badge bg-info text-white">Active</span>;
      case 'Completed':
        return <span className="badge bg-success">Completed</span>;
      default:
        return <span className="badge bg-secondary">Unknown</span>;
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

  if (!isMapReady) {
    return (
      <div 
        style={{ height, width: '100%' }} 
        className="d-flex align-items-center justify-content-center bg-light"
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        ref={mapRef}
        center={[19.2183, 72.9781]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        key="ngo-map" // Stable key to prevent remounting
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => (
          <Marker
            key={`marker-${report.reportId}`}
            position={[report.location.lat, report.location.lng]}
            icon={report.ngoList && report.ngoList.length > 0 ? greenIcon : undefined}
          >
            <Popup minWidth={300}>
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="mb-0">{report.username}</h6>
                  {getStatusBadge(report.status)}
                </div>
                <p className="mb-2">{report.description}</p>
                {report.photo && (
                  <img
                    src={report.photo}
                    alt="Report"
                    className="img-fluid mb-2 rounded"
                    style={{ maxHeight: '150px' }}
                  />
                )}
                <div className="mb-2">
                  <small className="text-muted">
                    <Clock size={12} className="me-1" />
                    {formatDate(report.timestamp)}
                  </small>
                </div>
                {report.ngoList && report.ngoList.length > 0 && (
                  <div className="mb-2">
                    <small className="text-success">
                      <strong>Accepted by:</strong> {report.ngoList.join(', ')}
                    </small>
                  </div>
                )}
                {report.status === 'Reported' && (
                  <button
                    className="btn btn-success btn-sm w-100"
                    onClick={() => onAcceptReport(report.reportId)}
                  >
                    <CheckCircle size={14} className="me-1" />
                    Accept Report
                  </button>
                )}
                {report.status === 'Active' && 
                 report.ngoList && 
                 report.ngoList.includes(user?.name || '') && 
                 !report.completionImage && (
                  <button
                    className="btn btn-primary btn-sm w-100"
                    onClick={() => onUploadCompletion(report)}
                  >
                    <Upload size={14} className="me-1" />
                    Upload Completion
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default StableMap;