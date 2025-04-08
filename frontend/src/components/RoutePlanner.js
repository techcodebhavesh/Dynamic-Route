import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Container,
  Tabs,
  Tab
} from '@mui/material';
import { DirectionsBus, AccessTime, People } from '@mui/icons-material';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const mapContainerStyle = {
  height: '700px',
  width: '100%',
  position: 'relative',
  zIndex: 9999,
  overflow: 'hidden'
};

const RoutePlanner = () => {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [map, setMap] = useState(null);
  const [mapCenter] = useState([18.5204, 73.8567]); // Pune center coordinates

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data...');
        const [stopsRes, routesRes] = await Promise.all([
          fetch('http://localhost:8000/stops'),
          fetch('http://localhost:8000/routes')
        ]);

        const stopsData = await stopsRes.json();
        const routesData = await routesRes.json();

        console.log('Stops data:', stopsData);
        console.log('Routes data:', routesData);

        // Validate stops data
        const validStops = stopsData.filter(stop => 
          stop && 
          typeof stop.latitude === 'number' && 
          typeof stop.longitude === 'number' &&
          !isNaN(stop.latitude) && 
          !isNaN(stop.longitude)
        );

        // Validate routes data
        const validRoutes = routesData.filter(route => 
          route && 
          Array.isArray(route.stops) && 
          route.stops.length >= 2
        );

        console.log('Valid stops:', validStops);
        console.log('Valid routes:', validRoutes);

        setStops(validStops);
        setRoutes(validRoutes);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Add a log whenever selected route changes
  useEffect(() => {
    if (selectedRoute) {
      console.log('Selected route updated:', JSON.stringify(selectedRoute, null, 2));
    }
  }, [selectedRoute]);

  // Add debug code to check map container
  useEffect(() => {
    // Check if map container exists
    const mapContainer = document.getElementById('map-container');
    console.log('Map container:', mapContainer);
    
    // Check if Leaflet is loaded
    console.log('Leaflet loaded:', typeof L !== 'undefined');
    
    // Check if map is initialized
    const checkMapInterval = setInterval(() => {
      const mapElement = document.querySelector('.leaflet-container');
      if (mapElement) {
        console.log('Map element found:', mapElement);
        console.log('Map element style:', window.getComputedStyle(mapElement));
        clearInterval(checkMapInterval);
      }
    }, 1000);
    
    return () => clearInterval(checkMapInterval);
  }, []);

  const handleFindRoute = async () => {
    if (!fromStop || !toStop) {
      alert('Please select both source and destination stops');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_stop: fromStop,
          to_stop: toStop,
        }),
      });

      const data = await response.json();
      if (!data) {
        throw new Error('No route found');
      }

      // If the backend returns stop IDs instead of full stop objects
      if (data.stops && data.stops.length > 0) {
        if (typeof data.stops[0] === 'string' || typeof data.stops[0] === 'number') {
          data.stops = data.stops.map(stopId => {
            const stop = stops.find(s => s.id === stopId);
            return stop || { id: stopId, latitude: 0, longitude: 0 };
          });
        }
      }

      setSelectedRoute(data);
    } catch (error) {
      console.error('Error finding route:', error);
      alert('Could not find a route between the selected stops');
    } finally {
      setLoading(false);
    }
  };

  // Function to safely get positions for a route
  const getRoutePositions = (route) => {
    if (!route || !route.stops) return [];
    
    return route.stops
      .filter(stop => stop && typeof stop.latitude === 'number' && typeof stop.longitude === 'number')
      .map(stop => [stop.latitude, stop.longitude]);
  };

  // Function to get marker icon based on density
  const getMarkerIcon = (density) => {
    let color = '#3388ff'; // Default blue
    
    if (density > 80) {
      color = '#d73027'; // Red for high density
    } else if (density > 50) {
      color = '#fc8d59'; // Orange for medium-high density
    } else if (density > 30) {
      color = '#fee08b'; // Yellow for medium density
    } else if (density > 10) {
      color = '#d9ef8b'; // Light green for low-medium density
    } else {
      color = '#91cf60'; // Green for low density
    }
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff;"></div>`,
      iconSize: [15, 15],
      iconAnchor: [7, 7]
    });
  };

  // Function to get route color based on route ID
  const getRouteColor = (routeId) => {
    // Generate a consistent color based on route ID
    const colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ];
    return colors[routeId % colors.length];
  };

  // Function to get color based on density
  const getDensityColor = (density) => {
    if (density > 80) return '#d73027'; // Red
    if (density > 50) return '#fc8d59'; // Orange
    if (density > 30) return '#fee08b'; // Yellow
    if (density > 10) return '#d9ef8b'; // Light green
    return '#91cf60'; // Green
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Add effect to handle map resize when tab changes
  useEffect(() => {
    if (activeTab === 1 && map) {
      // Wait for the tab transition to complete
      const timer = setTimeout(() => {
        try {
          map.invalidateSize();
          console.log('Map size updated:', map.getSize());
        } catch (error) {
          console.error('Error updating map size:', error);
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activeTab, map]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Bus Route Planner
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Route Planning" />
          <Tab label="Route Visualization" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Plan Your Journey
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>From Stop</InputLabel>
                  <Select
                    value={fromStop}
                    onChange={(e) => setFromStop(e.target.value)}
                    label="From Stop"
                  >
                    {stops.map((stop) => (
                      <MenuItem key={stop.id} value={stop.id}>
                        {stop.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>To Stop</InputLabel>
                  <Select
                    value={toStop}
                    onChange={(e) => setToStop(e.target.value)}
                    label="To Stop"
                  >
                    {stops.map((stop) => (
                      <MenuItem key={stop.id} value={stop.id}>
                        {stop.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleFindRoute}
                  disabled={loading || !fromStop || !toStop}
                >
                  {loading ? 'Finding Route...' : 'Find Route'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Routes
                </Typography>
                <List>
                  {routes.map((route) => (
                    <React.Fragment key={route.id}>
                      <ListItem>
                        <ListItemText
                          primary={`Route ${route.id}`}
                          secondary={`${route.stops?.length || 0} stops • ${route.estimated_time || 'N/A'} min • Avg. Density: ${route.average_density || 'N/A'}`}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ 
              height: '700px', 
              position: 'relative', 
              overflow: 'hidden',
              width: '100%'
            }}>
              <CardContent sx={{ 
                p: 0, 
                height: '100%', 
                position: 'relative',
                width: '100%'
              }}>
                <div 
                  id="map-container"
                  className="map-container"
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100vh',
                    zIndex: 1,
                    display: 'block'
                  }}
                >
                  <MapContainer
                    center={[18.5204, 73.8567]}
                    zoom={13}
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      display: 'block'
                    }}
                    scrollWheelZoom={true}
                    whenCreated={(mapInstance) => {
                      console.log('Map created:', mapInstance);
                      setMap(mapInstance);
                    }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* Render stops */}
                    {stops.map((stop) => {
                      if (!stop || !stop.latitude || !stop.longitude) {
                        console.log('Invalid stop:', stop);
                        return null;
                      }
                      return (
                        <Marker
                          key={stop.id}
                          position={[stop.latitude, stop.longitude]}
                          icon={getMarkerIcon(stop.density)}
                        >
                          <Popup>
                            <Typography variant="subtitle1">{stop.name || `Stop ${stop.id}`}</Typography>
                            <Typography variant="body2">
                              Density: {stop.density || 'N/A'}
                            </Typography>
                          </Popup>
                        </Marker>
                      );
                    })}

                    {/* Render active routes */}
                    {routes.map((route) => {
                      const positions = route.stops
                        ?.filter(stop => 
                          stop && 
                          typeof stop.latitude === 'number' && 
                          typeof stop.longitude === 'number' &&
                          !isNaN(stop.latitude) && 
                          !isNaN(stop.longitude)
                        )
                        .map(stop => [stop.latitude, stop.longitude]);

                      if (!positions || positions.length < 2) {
                        console.log('Invalid route positions:', route);
                        return null;
                      }

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

                    {/* Render selected route */}
                    {selectedRoute && selectedRoute.stops && (
                      <Polyline
                        positions={selectedRoute.stops
                          .filter(stop => 
                            stop && 
                            typeof stop.latitude === 'number' && 
                            typeof stop.longitude === 'number' &&
                            !isNaN(stop.latitude) && 
                            !isNaN(stop.longitude)
                          )
                          .map(stop => [stop.latitude, stop.longitude])}
                        color="red"
                        weight={5}
                        opacity={1}
                      />
                    )}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default RoutePlanner; 