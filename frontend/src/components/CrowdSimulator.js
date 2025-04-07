import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Slider,
  Button,
  Card,
  CardContent,
  Box,
} from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import axios from 'axios';

const CrowdSimulator = () => {
  const [stops, setStops] = useState([]);
  const [simulationActive, setSimulationActive] = useState(false);
  const [baseDensity, setBaseDensity] = useState(100);
  const [timeMultiplier, setTimeMultiplier] = useState(1);

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

  useEffect(() => {
    let interval;
    if (simulationActive) {
      interval = setInterval(async () => {
        try {
          // Update density for each stop
          for (const stop of stops) {
            const newDensity = calculateNewDensity(stop.current_density);
            await axios.post('http://localhost:8000/update-density', {
              stop_id: stop.id,
              new_density: newDensity,
            });
          }
          // Refresh stops data
          const response = await axios.get('http://localhost:8000/stops');
          setStops(response.data);
        } catch (error) {
          console.error('Error updating densities:', error);
        }
      }, 5000); // Update every 5 seconds
    }
    return () => clearInterval(interval);
  }, [simulationActive, stops, baseDensity, timeMultiplier]);

  const calculateNewDensity = (currentDensity) => {
    const hour = new Date().getHours();
    const timeFactor = getTimeFactor(hour);
    const randomFactor = 0.8 + Math.random() * 0.4; // Random factor between 0.8 and 1.2
    return baseDensity * timeFactor * randomFactor * timeMultiplier;
  };

  const getTimeFactor = (hour) => {
    const timeFactors = {
      0: 0.3, // 12 AM
      1: 0.2,
      2: 0.1,
      3: 0.1,
      4: 0.2,
      5: 0.4,
      6: 0.6,
      7: 0.8,
      8: 1.0, // Peak morning
      9: 0.9,
      10: 0.7,
      11: 0.8,
      12: 0.9, // Peak afternoon
      13: 0.8,
      14: 0.7,
      15: 0.8,
      16: 0.9,
      17: 1.0, // Peak evening
      18: 0.9,
      19: 0.8,
      20: 0.6,
      21: 0.5,
      22: 0.4,
      23: 0.3,
    };
    return timeFactors[hour] || 0.5;
  };

  const getDensityColor = (density) => {
    if (density > 150) return 'red';
    if (density > 100) return 'orange';
    return 'green';
  };

  return (
    <Grid container spacing={3}>
      {/* Controls */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Crowd Simulation Controls
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Base Density</Typography>
              <Slider
                value={baseDensity}
                onChange={(e, newValue) => setBaseDensity(newValue)}
                min={0}
                max={300}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Time Multiplier</Typography>
              <Slider
                value={timeMultiplier}
                onChange={(e, newValue) => setTimeMultiplier(newValue)}
                min={0.1}
                max={3}
                step={0.1}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color={simulationActive ? 'secondary' : 'primary'}
                onClick={() => setSimulationActive(!simulationActive)}
                startIcon={<PeopleIcon />}
              >
                {simulationActive ? 'Stop Simulation' : 'Start Simulation'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Current Time and Factors */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Current Simulation State
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">Current Time</Typography>
                  <Typography variant="h4">
                    {new Date().toLocaleTimeString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">Time Factor</Typography>
                  <Typography variant="h4">
                    {getTimeFactor(new Date().getHours()).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">Base Density</Typography>
                  <Typography variant="h4">{baseDensity}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Bus Stop Densities */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Bus Stop Crowd Densities
          </Typography>
          <Grid container spacing={2}>
            {stops.map((stop) => (
              <Grid item xs={12} sm={6} md={4} key={stop.id}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1">{stop.name}</Typography>
                    <Box
                      sx={{
                        height: 20,
                        bgcolor: getDensityColor(stop.current_density),
                        borderRadius: 1,
                        mt: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Density: {stop.current_density.toFixed(0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default CrowdSimulator; 