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
  CircularProgress,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  Power as PowerIcon,
  People as PeopleIcon,
  Timer as TimerIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { socketService } from './services/socket';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './style.css';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (error) => {
      console.error('Error caught by boundary:', error);
      setError(error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
        <Typography variant="h5" color="error" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {error?.message || 'An unexpected error occurred'}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Reload Page
        </Button>
      </Box>
    );
  }

  return children;
};

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

const PrivateRoute = ({ children }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('steamToken');
        if (!token) {
          navigate('/login');
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [socketConnected, setSocketConnected] = React.useState(false);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const navigate = useNavigate();
  const location = useLocation();

  // Handle unhandled promise rejections
  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      // Prevent the default browser handling
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

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

    // Setup socket event listeners
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('error', handleError);
    socketService.on('connect_error', handleError);

    // Only connect if we have a token and we're not on the login page
    const token = localStorage.getItem('steamToken');
    if (token && location.pathname !== '/login') {
      console.log('Token found, connecting to socket');
      socketService.connect();
    } else {
      console.log('No token found or on login page, not connecting');
    }

    // Cleanup
    return () => {
      console.log('App component unmounting, cleaning up socket listeners');
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('error', handleError);
      socketService.off('connect_error', handleError);
    };
  }, [navigate, location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Storage', icon: <StorageIcon />, path: '/storage' },
    { text: 'Smart Switches', icon: <PowerIcon />, path: '/switches' },
    { text: 'Players', icon: <PeopleIcon />, path: '/players' },
    { text: 'Timers', icon: <TimerIcon />, path: '/timers' },
    { text: 'Vending', icon: <ShoppingCartIcon />, path: '/vending' }
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          RustBot
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            to={item.path}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
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
                  RustBot Dashboard
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
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/storage"
                    element={
                      <PrivateRoute>
                        <div>Storage Page</div>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/switches"
                    element={
                      <PrivateRoute>
                        <div>Switches Page</div>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/players"
                    element={
                      <PrivateRoute>
                        <div>Players Page</div>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/timers"
                    element={
                      <PrivateRoute>
                        <div>Timers Page</div>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/vending"
                    element={
                      <PrivateRoute>
                        <div>Vending Page</div>
                      </PrivateRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Box>
          </Box>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
