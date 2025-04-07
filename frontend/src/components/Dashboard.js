import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  DirectionsBus as BusIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const Dashboard = () => {
  const [stops, setStops] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [totalDensity, setTotalDensity] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stopsResponse, driversResponse, routesResponse] = await Promise.all([
          axios.get('http://localhost:8000/stops'),
          axios.get('http://localhost:8000/drivers'),
          axios.get('http://localhost:8000/routes'),
        ]);
        setStops(stopsResponse.data);
        setDrivers(driversResponse.data);
        setRoutes(routesResponse.data);
        
        // Calculate total density
        const total = stopsResponse.data.reduce(
          (sum, stop) => sum + stop.current_density,
          0
        );
        setTotalDensity(total);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getDensityColor = (density) => {
    if (density > 150) return 'red';
    if (density > 100) return 'orange';
    return 'green';
  };

  return (
    <Grid container spacing={3}>
      {/* Overview Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BusIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Buses</Typography>
                </Box>
                <Typography variant="h4">
                  {drivers.filter((d) => d.status === 'active').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Crowd</Typography>
                </Box>
                <Typography variant="h4">{totalDensity.toFixed(0)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimelineIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Routes</Typography>
                </Box>
                <Typography variant="h4">{routes.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Bus Stops</Typography>
                </Box>
                <Typography variant="h4">{stops.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Map and Crowd Density */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2, height: '500px' }}>
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
          </MapContainer>
        </Paper>
      </Grid>

      {/* Crowd Density List */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: '500px', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Bus Stop Crowd Density
          </Typography>
          <List>
            {stops.map((stop) => (
              <React.Fragment key={stop.id}>
                <ListItem>
                  <ListItemText
                    primary={stop.name}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Box
                          sx={{
                            width: 100,
                            height: 8,
                            bgcolor: getDensityColor(stop.current_density),
                            borderRadius: 1,
                            mr: 1,
                          }}
                        />
                        <Typography variant="body2">
                          {stop.current_density.toFixed(0)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard; 