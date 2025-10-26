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

  // Fetch all complaints
  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('complaint_time', { ascending: false });

      if (error) {
        console.error('Error fetching complaints:', error);
      } else {
        setReports(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading complaints...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-8">
        NGO Dashboard - {user?.full_name}
      </h1>

      {/* Map section */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Complaints Map</h2>
        <div style={{ height: '500px', borderRadius: '10px', overflow: 'hidden' }}>
          <StableMap
            reports={reports}
            user={user}
            height="500px"
          />
        </div>
      </div>
    </div>
  );
};

export default NGODashboard;
