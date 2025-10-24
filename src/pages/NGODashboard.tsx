import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import Navbar from '../components/Navbar';
import { supabase } from '../supabase';
import { Clock, MapPin } from 'lucide-react';

interface Report {
  complaint_id: string;
  user_id: string;
  description: string;
  image_url: string;
  complaint_lat: number;
  complaint_long: number;
  complaint_time: string;
  status: string;
}

const NGODashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [ngoLocation, setNgoLocation] = useState<{ lat: number; lng: number }>({ lat: 19.2183, lng: 72.9781 });
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [acceptedCount, setAcceptedCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('User not authenticated');
        setCurrentUserId(authUser.id);

        // NGO location
        const { data: ngoData } = await supabase
          .from('users')
          .select('latitude, longitude')
          .eq('user_id', authUser.id)
          .single();
        if (ngoData) setNgoLocation({ lat: ngoData.latitude || 19.2183, lng: ngoData.longitude || 72.9781 });

        // Complaints
        const { data: complaintsData } = await supabase
          .from('complaints')
          .select('*')
          .order('complaint_time', { ascending: false });
        setReports(complaintsData || []);

        // Accepted complaints count
        const { data: acceptedData } = await supabase
          .from('ngo_responses')
          .select('*')
          .eq('ngo_id', authUser.id)
          .eq('status', 'accepted');
        setAcceptedCount(acceptedData?.length || 0);

      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  delete (Icon.Default.prototype as any)._getIconUrl;
  Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  const ngoIcon = new Icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', iconSize: [32, 32] });
  const complaintIcon = new Icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', iconSize: [32, 32] });

  const handleAccept = async (complaintId: string) => {
    try {
      const { error } = await supabase.from('ngo_responses').insert([{
        ngo_id: currentUserId,
        complaint_id: complaintId,
        status: 'accepted'
      }]);
      if (error) throw error;
      setAcceptedCount(prev => prev + 1);
      alert('Complaint accepted!');
    } catch (err) {
      console.error(err);
      alert('Failed to accept complaint');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container py-4">
        <h3 className="mb-4">NGO Dashboard</h3>

        {/* Info Tabs */}
        <div className="d-flex justify-content-between mb-3">
          <div className="bg-primary text-white p-3 rounded" style={{ minWidth: '150px' }}>
            <h5>Accepted Cases</h5>
            <p>{acceptedCount}</p>
          </div>
          <div className="bg-secondary text-white p-3 rounded" style={{ minWidth: '150px' }}>
            <h5>Total Complaints</h5>
            <p>{reports.length}</p>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute',
          top: 80,
          right: 30,
          background: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          <div><img src="https://maps.google.com/mapfiles/ms/icons/blue-dot.png" /> NGO Location</div>
          <div><img src="https://maps.google.com/mapfiles/ms/icons/red-dot.png" /> Complaints</div>
        </div>

        {/* Map */}
        <div className="row mb-4">
          <div className="col-12">
            <MapContainer
              center={[ngoLocation.lat, ngoLocation.lng]}
              zoom={12}
              style={{ height: '500px', width: '100%' }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker position={[ngoLocation.lat, ngoLocation.lng]} icon={ngoIcon} />

              {reports.map((report) => (
                <Marker
                  key={report.complaint_id}
                  position={[report.complaint_lat, report.complaint_long]}
                  icon={complaintIcon}
                >
                  <Popup minWidth={300}>
                    <p>{report.description}</p>
                    {report.image_url && <img src={report.image_url} style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }} />}
                    <br />
                    <small><Clock size={14} /> {formatDate(report.complaint_time)}</small>
                    <br />
                    <button className="btn btn-success mt-2" onClick={() => handleAccept(report.complaint_id)}>Accept</button>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;
