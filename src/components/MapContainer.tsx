import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../supabase';
import 'leaflet/dist/leaflet.css';

interface Report {
  complaint_id: string;
  description: string;
  status: string;
  complaint_lat: number;
  complaint_long: number;
  complaint_time?: string;
  image_url?: string;
}

interface NGO {
  user_id: string;
  full_name: string;
  latitude: number;
  longitude: number;
  operation_area?: string;
}

interface MapProps {
  reports: Report[];
  user: any;
  height?: string;
  onAcceptReport: (complaintId: string) => void;
  radiusFilter: { enabled: boolean; km: number };
}

const StableMap: React.FC<MapProps> = ({ reports, user, height = '400px', onAcceptReport, radiusFilter }) => {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const defaultPosition: [number, number] = [19.076, 72.8777];

  useEffect(() => {
    const fetchNgos = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, full_name, latitude, longitude, operation_area')
        .eq('role', 'ngo')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      if (!error && data) setNgos(data);
    };
    fetchNgos();
  }, []);

  // Icons
  const blueIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
  });
  const greenIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
  });
  const redIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
  });

  // Filter complaints based on radius
  const filterByRadius = (report: Report) => {
    if (!radiusFilter.enabled) return true;
    if (!user?.latitude || !user?.longitude) return true;

    const toRad = (x: number) => (x * Math.PI) / 180;

    const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const dist = distance(user.latitude, user.longitude, report.complaint_lat, report.complaint_long);
    return dist <= radiusFilter.km;
  };

  const markers = reports.filter(r => !isNaN(r.complaint_lat) && !isNaN(r.complaint_long) && filterByRadius(r));

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <MapContainer
        center={markers.length > 0 ? [markers[0].complaint_lat, markers[0].complaint_long] : defaultPosition}
        zoom={12}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Complaint markers */}
        {markers.map(report => (
          <Marker
            key={report.complaint_id}
            position={[report.complaint_lat, report.complaint_long]}
            icon={report.status === 'accepted' ? greenIcon : blueIcon}
            eventHandlers={{
              click: () => setSelectedReport(report)
            }}
          />
        ))}

        {/* NGO markers */}
        {ngos.map(ngo => (
          <Marker
            key={ngo.user_id}
            position={[ngo.latitude, ngo.longitude]}
            icon={redIcon}
          />
        ))}
      </MapContainer>

      {/* Permanent Legend */}
      <div style={{
        position: 'absolute',
        top: '15px',
        right: '15px',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '10px',
        padding: '10px 15px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
        fontSize: '14px',
        color: '#333',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '15px', height: '15px', backgroundColor: '#4285F4', borderRadius: '3px' }}></span>
          Complaint (Filed)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '15px', height: '15px', backgroundColor: '#34A853', borderRadius: '3px' }}></span>
          Complaint (Accepted)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '15px', height: '15px', backgroundColor: '#EA4335', borderRadius: '3px' }}></span>
          NGO Location
        </div>
      </div>

      {/* Complaint Modal */}
      {selectedReport && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 9999, background: 'white', padding: '20px', borderRadius: '12px', width: '350px',
          maxHeight: '90%', overflowY: 'auto', boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
        }}>
          <h3>{selectedReport.description}</h3>
          <p>Status: {selectedReport.status}</p>
          <p>Submitted: {selectedReport.complaint_time && new Date(selectedReport.complaint_time).toLocaleString()}</p>
          <p>Location: {selectedReport.complaint_lat}, {selectedReport.complaint_long}</p>
          {selectedReport.image_url && <img src={selectedReport.image_url} alt="complaint" style={{ width: '100%', marginTop: '10px', borderRadius: '6px' }} />}
          <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
            {selectedReport.status !== 'accepted' && (
              <button
                className="btn btn-success"
                onClick={() => {
                  onAcceptReport(selectedReport.complaint_id);
                  setSelectedReport(null);
                }}
              >
                Accept
              </button>
            )}
            <button
              className="btn btn-danger"
              onClick={() => setSelectedReport(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StableMap;
