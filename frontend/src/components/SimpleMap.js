import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const SimpleMap = () => {
  const position = [18.5204, 73.8567]; // Pune center coordinates

  return (
    <div style={{ 
      height: '100vh', 
      width: '100%', 
      position: 'relative',
      border: '2px solid red' 
    }}>
      <h2 style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000, background: 'white', padding: '5px' }}>
        Test Map
      </h2>
      <MapContainer 
        center={position} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>
            Pune City Center
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default SimpleMap; 