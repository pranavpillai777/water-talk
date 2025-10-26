import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../supabase';

interface Report {
  complaint_id: string;
  description: string;
  status: string;
  complaint_lat: number;
  complaint_long: number;
  complaint_time?: string;
  photo?: string;
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

const StableMap: React.FC<MapProps> = ({ reports, user, height = '400px' }) => {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const defaultPosition: [number, number] = [19.076, 72.8777]; // fallback Mumbai

  // Fetch NGO locations from DB
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

  // Define icons
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

  // Filter valid complaint coordinates
  const markers = reports.filter(
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

        {/* Complaint markers */}
        {markers.map((report) => (
          <Marker
            key={report.complaint_id}
            position={[report.complaint_lat, report.complaint_long]}
            icon={blueIcon}
          >
            <Popup>
              <strong>{report.description}</strong>
              <br />
              Status: {report.status}
              <br />
              {report.complaint_time && (
                <small>{new Date(report.complaint_time).toLocaleString()}</small>
              )}
              {report.photo && (
                <div style={{ marginTop: '5px' }}>
                  <img
                    src={report.photo}
                    alt="Complaint"
                    style={{ width: '100px', borderRadius: '6px' }}
                  />
                </div>
              )}
            </Popup>
          </Marker>
        ))}

        {/* NGO markers */}
        {ngos.map((ngo) => (
          <Marker
            key={ngo.user_id}
            position={[ngo.latitude, ngo.longitude]}
            icon={redIcon}
          >
            <Popup>
              <strong>{ngo.full_name}</strong>
              <br />
              Operation Area: {ngo.operation_area || 'N/A'}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

     {/* ✅ Floating Legend */}
<div
  style={{
    position: 'absolute',
    top: '15px',          // moved from bottom to top
    right: '15px',        // keep it right-aligned
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
      style={{
        display: 'inline-block',
        width: '15px',
        height: '15px',
        backgroundColor: '#4285F4',
        borderRadius: '3px',
      }}
    ></span>
    Complaint Locations
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span
      style={{
        display: 'inline-block',
        width: '15px',
        height: '15px',
        backgroundColor: '#EA4335',
        borderRadius: '3px',
      }}
    ></span>
    NGO Locations
  </div>
</div>

    </div>
  );
};

export default StableMap;
