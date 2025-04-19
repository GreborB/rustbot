import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Storage from './pages/Storage';
import SmartSwitches from './pages/SmartSwitches';
import Scenes from './pages/Scenes';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import { theme } from './theme';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const verifyAuth = async () => {
      try {
        await checkAuth();
        if (mounted) {
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        if (mounted) {
          setIsChecking(false);
        }
      }
    };

    verifyAuth();

    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  if (isLoading || isChecking) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />

                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
