import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  DirectionsBus,
  AccessTime,
  LocationOn,
  Person,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import axios from 'axios';

const DriverSchedule = () => {
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [driversRes, routesRes] = await Promise.all([
        axios.get('http://localhost:8000/drivers'),
        axios.get('http://localhost:8000/routes')
      ]);
      setDrivers(driversRes.data);
      setRoutes(routesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAssignDrivers = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/assign-drivers');
      setDrivers(response.data);
    } catch (error) {
      console.error('Error assigning drivers:', error);
    }
    setLoading(false);
  };

  const getRouteName = (routeId) => {
    const route = routes.find(r => r.id === routeId);
    return route ? route.name : 'Unknown Route';
  };

  const getDriverStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'off_duty':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Driver Schedule</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAssignDrivers}
                  disabled={loading}
                >
                  {loading ? 'Assigning...' : 'Assign Drivers'}
                </Button>
              </Box>

              <List>
                {drivers.map((driver, index) => (
                  <React.Fragment key={driver.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Person />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="subtitle1">{driver.name}</Typography>
                            <Chip
                              label={driver.status}
                              color={getDriverStatusColor(driver.status)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            {driver.current_route_id ? (
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <DirectionsBus fontSize="small" />
                                  <Typography variant="body2">
                                    Current Route: {getRouteName(driver.current_route_id)}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <AccessTime fontSize="small" />
                                  <Typography variant="body2">
                                    Hours Today: {driver.hours_today.toFixed(1)}
                                  </Typography>
                                </Box>
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No route assigned
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < drivers.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Active Routes</Typography>
              <List>
                {routes.filter(route => route.is_active).map((route, index) => {
                  const assignedDriver = drivers.find(d => d.current_route_id === route.id);
                  return (
                    <React.Fragment key={route.id}>
                      <ListItem>
                        <ListItemIcon>
                          <DirectionsBus />
                        </ListItemIcon>
                        <ListItemText
                          primary={route.name}
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <LocationOn fontSize="small" />
                                <Typography variant="body2">
                                  {route.stops.length} stops
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTime fontSize="small" />
                                <Typography variant="body2">
                                  {route.estimated_time} minutes
                                </Typography>
                              </Box>
                              {assignedDriver && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                  <Person fontSize="small" />
                                  <Typography variant="body2">
                                    Driver: {assignedDriver.name}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <Chip
                          icon={assignedDriver ? <CheckCircle /> : <Cancel />}
                          label={assignedDriver ? 'Assigned' : 'Unassigned'}
                          color={assignedDriver ? 'success' : 'error'}
                        />
                      </ListItem>
                      {index < routes.filter(r => r.is_active).length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DriverSchedule; 