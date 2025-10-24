// src/pages/CitizenDashboard.tsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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
  address?: string;
}

const CitizenDashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLat, setSelectedLat] = useState(0);
  const [selectedLng, setSelectedLng] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Fetch all complaints
  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('complaint_time', { ascending: false });

    if (error) console.error(error);
    else setReports(data as Report[]);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Listen for NGO responses to this user's complaints
  useEffect(() => {
    const setupRealtime = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      const subscription = supabase
        .from(`ngo_responses:complaint_id=eq.${authUser.id}`)
        .on('UPDATE', (payload) => {
          if (payload.new.status === 'accepted') {
            setNotifications((prev) => [
              ...prev,
              `Your complaint (${payload.new.complaint_id}) has been accepted by the NGO!`,
            ]);
          }
        })
        .subscribe();

      return () => supabase.removeSubscription(subscription);
    };

    setupRealtime();
  }, []);

  // Leaflet default marker fix
  delete (Icon.Default.prototype as any)._getIconUrl;
  Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

  // Upload image to Supabase storage
  const uploadImage = async (file: File, userId: string) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('user-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData, error: urlError } = supabase.storage
      .from('user-images')
      .getPublicUrl(filePath);

    if (urlError) {
      console.error('URL error:', urlError);
      return null;
    }

    return urlData.publicUrl;
  };

  // Map click component to select lat/lng
  const LocationMarker: React.FC = () => {
    useMapEvents({
      click(e) {
        setSelectedLat(e.latlng.lat);
        setSelectedLng(e.latlng.lng);
      },
    });
    return selectedLat && selectedLng ? (
      <Marker position={[selectedLat, selectedLng]} />
    ) : null;
  };

  // Format date
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Handle complaint submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Get current authenticated user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) throw new Error('User not found');

      // 2. Fetch user_id from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', authUser.email)
        .single();

      if (userError || !userData) throw new Error('User not found in users table');

      const userId = userData.user_id;

      // 3. Upload image
      const imageUrl = selectedFile ? await uploadImage(selectedFile, userId) : null;
      if (selectedFile && !imageUrl) throw new Error('Image upload failed');

      // 4. Insert complaint
      const { error } = await supabase.from('complaints').insert([
        {
          user_id: userId,
          description,
          status: "Filed",
          complaint_lat: selectedLat,
          complaint_long: selectedLng,
          image_url: imageUrl,
        },
      ]);

      if (error) throw error;

      alert('Complaint submitted successfully!');
      setDescription('');
      setSelectedFile(null);
      setSelectedLat(0);
      setSelectedLng(0);
      fetchReports();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container py-4">
        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="alert alert-success">
            {notifications.map((note, idx) => (
              <div key={idx}>{note}</div>
            ))}
          </div>
        )}

        <h3 className="mb-4">File a Complaint</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Image (optional)</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Select Location on Map</label>
            <MapContainer
              center={[19.2183, 72.9781]}
              zoom={12}
              style={{ height: '300px', width: '100%' }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker />
            </MapContainer>
            <small className="text-muted">
              Lat: {selectedLat.toFixed(4)}, Lng: {selectedLng.toFixed(4)}
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>

        <hr className="my-4" />
        <h3>All Complaints</h3>
        <div className="row mt-3">
          {reports.map((report) => (
            <div key={report.complaint_id} className="col-md-4 mb-3">
              <div className="card shadow">
                {report.image_url && (
                  <img
                    src={report.image_url}
                    className="card-img-top"
                    alt="Complaint"
                  />
                )}
                <div className="card-body">
                  <p>{report.description}</p>
                  <small>
                    <MapPin size={14} /> Lat: {report.complaint_lat.toFixed(4)}, Lng:{' '}
                    {report.complaint_long.toFixed(4)}
                  </small>
                  <br />
                  <small>
                    <Clock size={14} /> {formatDate(report.complaint_time)}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
