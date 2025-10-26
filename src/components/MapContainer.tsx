import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../supabase';

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
}

const StableMap: React.FC<MapProps> = ({ reports, user, height = '600px' }) => {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Report | null>(null);
  const [localReports, setLocalReports] = useState<Report[]>([]);

  const defaultPosition: [number, number] = [19.076, 72.8777];

  useEffect(() => setLocalReports(reports), [reports]);

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

  const blueIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
  });

  const redIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
  });

  const greenIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
  });

  const handleAccept = async (complaint: Report) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: 'accepted' })
        .eq('complaint_id', complaint.complaint_id);

      if (!error) {
        setLocalReports((prev) =>
          prev.map((r) =>
            r.complaint_id === complaint.complaint_id ? { ...r, status: 'accepted' } : r
          )
        );
        setSelectedComplaint(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markers = localReports.filter(
    (r) => !isNaN(r.complaint_lat) && !isNaN(r.complaint_long)
  );

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <MapContainer
        center={
          markers.length > 0
            ? [markers[0].complaint_lat, markers[0].complaint_long]
            : defaultPosition
        }
        zoom={12}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((report) => (
          <Marker
            key={report.complaint_id}
            position={[report.complaint_lat, report.complaint_long]}
            icon={report.status === 'accepted' ? greenIcon : blueIcon}
            eventHandlers={{ click: () => setSelectedComplaint(report) }}
          />
        ))}

        {ngos.map((ngo) => (
          <Marker
            key={ngo.user_id}
            position={[ngo.latitude, ngo.longitude]}
            icon={redIcon}
          />
        ))}
      </MapContainer>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '10px',
          padding: '10px 15px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#333',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{ display: 'inline-block', width: '15px', height: '15px', backgroundColor: '#4285F4', borderRadius: '3px' }}
          ></span>
          Complaint Locations
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{ display: 'inline-block', width: '15px', height: '15px', backgroundColor: '#EA4335', borderRadius: '3px' }}
          ></span>
          NGO Locations
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{ display: 'inline-block', width: '15px', height: '15px', backgroundColor: '#34A853', borderRadius: '3px' }}
          ></span>
          Accepted Complaints
        </div>
      </div>

      {/* Modal */}
      {selectedComplaint && (
        <div
          style={{
            position: 'fixed', // ✅ fixed so it’s always visible
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            zIndex: 1000,
            width: '350px',
            maxHeight: '80vh',
            overflowY: 'auto', // ✅ scroll if content too tall
          }}
        >
          <h3 className="text-lg font-bold">{selectedComplaint.description}</h3>
          <p>Status: {selectedComplaint.status}</p>
          {selectedComplaint.complaint_time && (
            <p>Submitted: {new Date(selectedComplaint.complaint_time).toLocaleString()}</p>
          )}
          <p>Location: {selectedComplaint.complaint_lat}, {selectedComplaint.complaint_long}</p>
          {selectedComplaint.image_url && (
            <img
              src={selectedComplaint.image_url}
              alt="Complaint"
              style={{ width: '100%', marginTop: '10px', borderRadius: '8px' }}
            />
          )}
          {selectedComplaint.status !== 'accepted' && (
            <button
              onClick={() => handleAccept(selectedComplaint)}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '8px',
                backgroundColor: '#34A853',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Accept Complaint
            </button>
          )}
          <button
            onClick={() => setSelectedComplaint(null)}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '6px',
              backgroundColor: '#EA4335',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default StableMap;
