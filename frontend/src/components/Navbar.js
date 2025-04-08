import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Map as MapIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <DashboardIcon sx={{ mr: 1 }} />
          Bus Routing System
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<DashboardIcon />}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/route-planner"
            startIcon={<MapIcon />}
          >
            Route Planner
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/driver-schedule"
            startIcon={<ScheduleIcon />}
          >
            Driver Schedule
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/crowd-simulator"
            startIcon={<PeopleIcon />}
          >
            Crowd Simulator
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/test-map"
            startIcon={<LocationIcon />}
          >
            Test Map
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/map-test"
            startIcon={<LocationIcon />}
            sx={{ backgroundColor: 'secondary.main', color: 'white' }}
          >
            MAP TEST
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 