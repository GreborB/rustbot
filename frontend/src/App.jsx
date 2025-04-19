import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Commands from './pages/Commands';
import Settings from './pages/Settings';
import { useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import socketService from './services/socket';
import { SOCKET_EVENTS } from './utils/socketUtils';
import { safeLocalStorage } from './utils/apiUtils';
import './style.css';
import LoadingSpinner from './components/LoadingSpinner';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return isAuthenticated ? children : null;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleSocketDisconnect = () => {
      const token = safeLocalStorage.getItem('token');
      if (!token) {
        console.log('No token found after disconnect, redirecting to login');
        navigate('/login', { state: { from: location.pathname } });
      }
    };

    const handleSocketError = (error) => {
      console.error('Socket error in App:', error);
      if (error.message.includes('authentication')) {
        navigate('/login', { state: { from: location.pathname } });
      }
    };

    socketService.on(SOCKET_EVENTS.DISCONNECT, handleSocketDisconnect);
    socketService.on(SOCKET_EVENTS.ERROR, handleSocketError);

    return () => {
      socketService.off(SOCKET_EVENTS.DISCONNECT, handleSocketDisconnect);
      socketService.off(SOCKET_EVENTS.ERROR, handleSocketError);
    };
  }, [navigate, location.pathname]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Outlet />
                </DashboardLayout>
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="players" element={<Players />} />
            <Route path="commands" element={<Commands />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
