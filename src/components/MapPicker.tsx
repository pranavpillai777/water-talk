import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
}

const MapPicker: React.FC<MapPickerProps> = ({ 
  lat, 
  lng, 
  onLocationChange, 
  height = '300px',
  className = ''
}) => {
  const [position, setPosition] = useState<[number, number]>([lat || 19.2183, lng || 72.9781]);

  useEffect(() => {
    if (lat && lng) {
      setPosition([lat, lng]);
    }
  }, [lat, lng]);

  const LocationMarker: React.FC = () => {
    useMapEvents({
      click(e) {
        const newLat = e.latlng.lat;
        const newLng = e.latlng.lng;
        setPosition([newLat, newLng]);
        onLocationChange(newLat, newLng);
      },
    });

    return position ? (
      <Marker 
        position={position}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const newPos = marker.getLatLng();
            setPosition([newPos.lat, newPos.lng]);
            onLocationChange(newPos.lat, newPos.lng);
          },
        }}
      />
    ) : null;
  };

  return (
    <div className={`map-picker ${className}`} style={{ height, borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
      </MapContainer>
    </div>
  );
};

export default MapPicker;