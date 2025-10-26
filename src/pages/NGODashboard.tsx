import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import StableMap from '../components/MapContainer'; // ✅ Import your existing map component

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

  // ✅ Fetch all complaints directly from Supabase
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

      {/* ✅ Map section */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Complaints Map</h2>
        <div style={{ height: '400px', borderRadius: '10px', overflow: 'hidden' }}>
          <StableMap
            reports={reports}
            user={user}
            height="400px"
            onAcceptReport={() => {}}
            onUploadCompletion={() => {}}
          />
        </div>
      </div>

      {/* ✅ Complaints List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">
          All Complaints ({reports.length})
        </h2>

        {reports.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No complaints found</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div
                key={report.complaint_id}
                className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-lg transition"
              >
                <p className="text-gray-800 mb-2">
                  <strong>Description:</strong> {report.description}
                </p>
                <p className="text-gray-600">
                  <strong>Status:</strong> {report.status}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  <strong>Submitted:</strong>{' '}
                  {new Date(report.complaint_time).toLocaleString()}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  <strong>Location:</strong> {report.complaint_lat}, {report.complaint_long}
                </p>
                {report.image_url && (
                  <img
                    src={report.image_url}
                    alt="Complaint"
                    className="mt-3 rounded-md max-h-48 object-cover w-full"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NGODashboard;
