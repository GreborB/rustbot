import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Storage from './pages/Storage';
import SmartSwitches from './pages/SmartSwitches';
import Scenes from './pages/Scenes';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { useState, useEffect } from 'react';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
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

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              >
                <Route index element={<Storage />} />
                <Route path="storage" element={<Storage />} />
                <Route path="smart-switches" element={<SmartSwitches />} />
                <Route path="scenes" element={<Scenes />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ToastContainer position="bottom-right" />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
