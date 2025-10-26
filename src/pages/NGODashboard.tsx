import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import StableMap from '../components/MapContainer';

interface Report {
  complaint_id: string;
  user_id: string;
  description: string;
  status: string;
  complaint_lat: number;
  complaint_long: number;
  complaint_time: string;
  image_url?: string;
}

const NGODashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [radiusFilter, setRadiusFilter] = useState<{ enabled: boolean, km: number }>({ enabled: false, km: 0 });

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('complaint_time', { ascending: false });
    if (!error) setReports(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const handleAcceptReport = async (complaintId: string) => {
    const { error } = await supabase
      .from('complaints')
      .update({ status: 'accepted' })
      .eq('complaint_id', complaintId);
    if (!error) setReports(prev => prev.map(r => r.complaint_id === complaintId ? { ...r, status: 'accepted' } : r));
  };

  // Analytics
  const filteredReports = radiusFilter.enabled
    ? reports.filter(r => {
        if (!user?.latitude || !user?.longitude) return true;
        const toRad = (x: number) => (x * Math.PI) / 180;
        const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371;
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };
        return distance(user.latitude, user.longitude, r.complaint_lat, r.complaint_long) <= radiusFilter.km;
      })
    : reports;

  const accepted = filteredReports.filter(r => r.status === 'accepted').length;
  const completed = filteredReports.filter(r => r.status === 'resolved').length;

  if (loading) return <div>Loading complaints...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">
        NGO Dashboard - {user?.full_name}
      </h1>

      {/* Total Analytics */}
      <div className="text-center mb-6">
        <span className="text-lg font-semibold">Total Complaints: {filteredReports.length}</span>
      </div>

      {/* Radius Filter */}
      <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10000 }}>
        <label className="d-flex align-items-center gap-2">
          <span>Filter Radius (km)</span>
          <input
            type="checkbox"
            checked={radiusFilter.enabled}
            onChange={() => {
              if (!radiusFilter.enabled) {
                const km = prompt('Enter radius in km:', '4');
                if (km) setRadiusFilter({ enabled: true, km: parseFloat(km) });
              } else {
                setRadiusFilter({ enabled: false, km: 0 });
              }
            }}
          />
        </label>
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Complaints Map</h2>
        <div style={{ height: '500px', borderRadius: '10px', overflow: 'hidden' }}>
          <StableMap
            reports={reports}
            user={user}
            height="500px"
            onAcceptReport={handleAcceptReport}
            radiusFilter={radiusFilter}
          />
        </div>
      </div>

      {/* NGO Analytics */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">NGO Analytics</h2>
        <p>Accepted Complaints: {accepted}</p>
        <p>Completed Complaints: {completed}</p>
      </div>
    </div>
  );
};

export default NGODashboard;
