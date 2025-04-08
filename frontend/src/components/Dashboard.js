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
  Button,
} from '@mui/material';
import {
  DirectionsBus as BusIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stopsRes, driversRes, routesRes] = await Promise.all([
          axios.get('http://localhost:8000/stops'),
          axios.get('http://localhost:8000/drivers'),
          axios.get('http://localhost:8000/routes')
        ]);
        
        setStops(stopsRes.data);
        setDrivers(driversRes.data);
        setRoutes(routesRes.data);
        
        const density = stopsRes.data.reduce((sum, stop) => sum + stop.current_density, 0);
        setTotalDensity(density);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getRouteColor = (routeId) => {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', 
                   '#00FFFF', '#FFA500', '#800080', '#008000', '#800000'];
    return colors[routeId % colors.length];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Overview Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Active Routes</Typography>
              </Box>
              <Typography variant="h4">{routes.filter(r => r.is_active).length}</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/route-planner')}
              >
                View Routes
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Active Drivers</Typography>
              </Box>
              <Typography variant="h4">{drivers.filter(d => d.status === 'active').length}</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/driver-schedule')}
              >
                View Schedule
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimelineIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Crowd Density</Typography>
              </Box>
              <Typography variant="h4">{totalDensity.toFixed(0)}</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/crowd-simulator')}
              >
                Simulate Crowd
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Map */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '500px' }}>
            <MapContainer
              center={[18.5204, 73.8567]} // Pune coordinates
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Display stops */}
              {stops.map(stop => (
                <Marker key={stop.id} position={[stop.latitude, stop.longitude]}>
                  <Popup>
                    <Typography variant="subtitle1">{stop.name}</Typography>
                    <Typography variant="body2">
                      Crowd Density: {stop.current_density.toFixed(0)}
                    </Typography>
                  </Popup>
                </Marker>
              ))}
              
              {/* Display routes */}
              {routes.filter(route => route.is_active).map(route => {
                const routeStops = route.stops.map(stopId => 
                  stops.find(s => s.id === stopId)
                ).filter(Boolean);
                
                const positions = routeStops.map(stop => [stop.latitude, stop.longitude]);
                
                return (
                  <Polyline
                    key={route.id}
                    positions={positions}
                    color={getRouteColor(route.id)}
                    weight={3}
                    opacity={0.7}
                  />
                );
              })}
            </MapContainer>
          </Card>
        </Grid>

        {/* Crowd Density List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Bus Stop Crowd Density</Typography>
              <List>
                {stops.map(stop => (
                  <ListItem key={stop.id}>
                    <ListItemText
                      primary={stop.name}
                      secondary={`Density: ${stop.current_density.toFixed(0)}`}
                    />
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: stop.current_density > 150 ? '#ff4444' :
                                       stop.current_density > 100 ? '#ffbb33' : '#00C851'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 