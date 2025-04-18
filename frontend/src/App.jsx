import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { socketService } from './services/socket';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Commands from './pages/Commands';
import Settings from './pages/Settings';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const drawerWidth = 240;

const LoadingSpinner = ({ message }) => (
  <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
    {message && (
      <Typography variant="body1" sx={{ mt: 2 }}>
        {message}
      </Typography>
    )}
  </Box>
);

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

const App = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [socketConnected, setSocketConnected] = React.useState(false);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const navigate = useNavigate();
  const location = useLocation();

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: '#2196f3',
          },
          secondary: {
            main: '#f50057',
          },
        },
        typography: {
          fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
          ].join(','),
        },
      }),
    [prefersDarkMode],
  );

  useEffect(() => {
    const handleConnect = () => {
      setSocketConnected(true);
      console.log('Socket connected in App component');
    };
    
    const handleDisconnect = () => {
      setSocketConnected(false);
      console.log('Socket disconnected in App component');
    };

    const handleError = (error) => {
      console.error('Socket error in App component:', error);
      setSocketConnected(false);
      if (error.message === 'Authentication error') {
        console.log('Authentication error detected, redirecting to login');
        localStorage.removeItem('steamToken');
        navigate('/login');
      }
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('error', handleError);
    socketService.on('connect_error', handleError);

    const token = localStorage.getItem('steamToken');
    if (token && location.pathname !== '/login') {
      console.log('Token found, connecting to socket');
      socketService.connect();
    } else {
      console.log('No token found or on login page, not connecting');
    }

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('error', handleError);
      socketService.off('connect_error', handleError);
    };
  }, [navigate, location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem button component={Link} to="/dashboard">
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button component={Link} to="/players">
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Players" />
        </ListItem>
        <ListItem button component={Link} to="/commands">
          <ListItemIcon><CodeIcon /></ListItemIcon>
          <ListItemText primary="Commands" />
        </ListItem>
        <ListItem button component={Link} to="/settings">
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <AppBar
            position="fixed"
            sx={{
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              ml: { sm: `${drawerWidth}px` },
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div">
                KinaBot Dashboard
              </Typography>
            </Toolbar>
          </AppBar>
          <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          >
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}
            >
              {drawer}
            </Drawer>
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: 'none', sm: 'block' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}
              open
            >
              {drawer}
            </Drawer>
          </Box>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: `calc(100% - ${drawerWidth}px)` },
            }}
          >
            <Toolbar />
            <Suspense fallback={<LoadingSpinner message="Loading..." />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/players"
                  element={
                    <PrivateRoute>
                      <Players />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/commands"
                  element={
                    <PrivateRoute>
                      <Commands />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <Settings />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </Suspense>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
