import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const RoutePlanner = () => {
  const [stops, setStops] = useState([]);
  const [selectedFrom, setSelectedFrom] = useState('');
  const [selectedTo, setSelectedTo] = useState('');
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStops = async () => {
      try {
        const response = await axios.get('http://localhost:8000/stops');
        setStops(response.data);
      } catch (error) {
        console.error('Error fetching stops:', error);
      }
    };

    fetchStops();
  }, []);

  const findRoute = async () => {
    if (!selectedFrom || !selectedTo) return;

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/route', {
        from_stop: selectedFrom,
        to_stop: selectedTo,
      });
      setRoute(response.data);
    } catch (error) {
      console.error('Error finding route:', error);
    }
    setLoading(false);
  };

  const getDensityColor = (density) => {
    if (density > 150) return 'red';
    if (density > 100) return 'orange';
    return 'green';
  };

  return (
    <Grid container spacing={3}>
      {/* Controls */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Route Planner
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>From Stop</InputLabel>
                <Select
                  value={selectedFrom}
                  onChange={(e) => setSelectedFrom(e.target.value)}
                  label="From Stop"
                >
                  {stops.map((stop) => (
                    <MenuItem key={stop.id} value={stop.id}>
                      {stop.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>To Stop</InputLabel>
                <Select
                  value={selectedTo}
                  onChange={(e) => setSelectedTo(e.target.value)}
                  label="To Stop"
                >
                  {stops.map((stop) => (
                    <MenuItem key={stop.id} value={stop.id}>
                      {stop.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                onClick={findRoute}
                disabled={!selectedFrom || !selectedTo || loading}
              >
                {loading ? 'Finding Route...' : 'Find Route'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Route Details */}
        {route && (
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Route Details
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Total Distance"
                  secondary={`${route.total_distance.toFixed(2)} km`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Estimated Time"
                  secondary={`${route.estimated_time.toFixed(0)} minutes`}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Stops"
                  secondary={`${route.stops.length} stops`}
                />
              </ListItem>
            </List>
          </Paper>
        )}
      </Grid>

      {/* Map */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2, height: '600px' }}>
          <MapContainer
            center={[18.5204, 73.8567]} // Pune coordinates
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {stops.map((stop) => (
              <Marker
                key={stop.id}
                position={[stop.latitude, stop.longitude]}
              >
                <Popup>
                  <Typography variant="subtitle2">{stop.name}</Typography>
                  <Box
                    sx={{
                      height: 10,
                      bgcolor: getDensityColor(stop.current_density),
                      borderRadius: 1,
                      mt: 1,
                    }}
                  />
                  <Typography variant="body2">
                    Density: {stop.current_density.toFixed(0)}
                  </Typography>
                </Popup>
              </Marker>
            ))}
            {route && (
              <Polyline
                positions={route.stops.map((stop) => [
                  stop.latitude,
                  stop.longitude,
                ])}
                color="blue"
                weight={3}
              />
            )}
          </MapContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default RoutePlanner; 