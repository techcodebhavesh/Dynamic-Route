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
} from '@mui/material';
import {
  DirectionsBus as BusIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import axios from 'axios';

const DriverSchedule = () => {
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driversResponse, routesResponse] = await Promise.all([
          axios.get('http://localhost:8000/drivers'),
          axios.get('http://localhost:8000/routes'),
        ]);
        setDrivers(driversResponse.data);
        setRoutes(routesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const assignDrivers = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/assign-drivers');
      setDrivers(response.data);
    } catch (error) {
      console.error('Error assigning drivers:', error);
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'on break':
        return 'warning';
      case 'off duty':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Overview Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BusIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Drivers</Typography>
                </Box>
                <Typography variant="h4">{drivers.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimeIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Routes</Typography>
                </Box>
                <Typography variant="h4">
                  {drivers.filter((d) => d.status === 'active').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Routes</Typography>
                </Box>
                <Typography variant="h4">{routes.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Driver Schedule Table */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Driver Schedule</Typography>
            <Button
              variant="contained"
              onClick={assignDrivers}
              disabled={loading}
            >
              {loading ? 'Assigning...' : 'Auto-Assign Drivers'}
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Driver ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Current Route</TableCell>
                  <TableCell>Next Break</TableCell>
                  <TableCell>Total Hours Today</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>{driver.id}</TableCell>
                    <TableCell>{driver.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={driver.status}
                        color={getStatusColor(driver.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {driver.current_route ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusIcon sx={{ mr: 1, fontSize: 16 }} />
                          {driver.current_route}
                        </Box>
                      ) : (
                        'Not Assigned'
                      )}
                    </TableCell>
                    <TableCell>
                      {driver.next_break
                        ? new Date(driver.next_break).toLocaleTimeString()
                        : 'No break scheduled'}
                    </TableCell>
                    <TableCell>{driver.hours_today.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* Break Schedule */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Break Schedule
          </Typography>
          <Grid container spacing={2}>
            {drivers.map((driver) => (
              <Grid item xs={12} sm={6} md={4} key={driver.id}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1">{driver.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {driver.id}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    {driver.break_slots?.map((slot, index) => (
                      <Chip
                        key={index}
                        label={`${new Date(slot.start).toLocaleTimeString()} - ${new Date(
                          slot.end
                        ).toLocaleTimeString()}`}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                    ))}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default DriverSchedule; 