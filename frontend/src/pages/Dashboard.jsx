import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Card, CardContent, Typography, Grid, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, CircularProgress, Paper, Container } from '@mui/material';
import { Person, Event, Storage, Timer } from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import './Dashboard.css';
import { useNavigate, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import socketService from '../services/socket';
import { withRetry, handleApiError, safeLocalStorage } from '../utils/apiUtils';
import { 
  SOCKET_EVENTS, 
  SOCKET_TIMEOUTS, 
  handleSocketError, 
  setupSocketEventListeners,
  waitForSocketConnection,
  emitWithRetry
} from '../utils/socketUtils';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
    const [serverInfo, setServerInfo] = useState(null);
    const [playerCount, setPlayerCount] = useState(0);
    const [onlinePlayers, setOnlinePlayers] = useState([]);
    const [recentEvents, setRecentEvents] = useState([]);
    const [commandStats, setCommandStats] = useState({});
    const [loading, setLoading] = useState(true);
    const { socket, isConnected } = useSocket();
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const mountedRef = useRef(true);
    const retryTimeoutRef = useRef(null);

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;
    const SOCKET_CONNECTION_TIMEOUT = 10000;

    const handleError = useCallback((error) => {
        if (!mountedRef.current) return;
        
        console.error('Dashboard error:', error);
        setError(error.message || 'An unexpected error occurred');
        setLoading(false);
        
        if (error.message.includes('authentication')) {
            navigate('/login');
        } else if (retryCount < MAX_RETRIES) {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            retryTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current) {
                    setRetryCount(prev => prev + 1);
                    setLoading(true);
                    setError(null);
                }
            }, RETRY_DELAY);
        }
    }, [navigate, retryCount]);

    const initializeSocket = useCallback(async () => {
        if (isInitialized || !mountedRef.current) return;

        try {
            const token = safeLocalStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const connectionPromise = waitForSocketConnection(SOCKET_CONNECTION_TIMEOUT);
            socketService.connect();

            await withRetry(
                async () => {
                    await connectionPromise;
                },
                {
                    maxRetries: MAX_RETRIES,
                    retryDelay: RETRY_DELAY,
                    shouldRetry: (error) => !error.message.includes('authentication'),
                    onError: (error) => {
                        if (mountedRef.current) {
                            setRetryCount(prev => prev + 1);
                            toast.warning(`Connection attempt ${retryCount + 1} failed. Retrying...`);
                        }
                    }
                }
            );

            if (mountedRef.current) {
                setIsInitialized(true);
            }
        } catch (error) {
            if (mountedRef.current) {
                handleError(error);
            }
        }
    }, [isInitialized, handleError]);

    const setupEventHandlers = useCallback(() => {
        if (!mountedRef.current) return null;

        const handlers = {
            [SOCKET_EVENTS.SERVER_INFO]: (data) => {
                if (!mountedRef.current) return;
                try {
                    setServerInfo(data);
                } catch (error) {
                    handleError(error);
                }
            },
            [SOCKET_EVENTS.PLAYER_COUNT]: (data) => {
                if (!mountedRef.current) return;
                try {
                    setPlayerCount(data.count);
                } catch (error) {
                    handleError(error);
                }
            },
            [SOCKET_EVENTS.ONLINE_PLAYERS]: (data) => {
                if (!mountedRef.current) return;
                try {
                    setOnlinePlayers(data.players);
                } catch (error) {
                    handleError(error);
                }
            },
            [SOCKET_EVENTS.RECENT_EVENTS]: (data) => {
                if (!mountedRef.current) return;
                try {
                    setRecentEvents(data.events);
                } catch (error) {
                    handleError(error);
                }
            },
            [SOCKET_EVENTS.COMMAND_STATS]: (data) => {
                if (!mountedRef.current) return;
                try {
                    setCommandStats(data.stats);
                } catch (error) {
                    handleError(error);
                }
            },
            [SOCKET_EVENTS.ERROR]: handleError,
            [SOCKET_EVENTS.DISCONNECT]: () => {
                if (!mountedRef.current) return;
                toast.warning('Disconnected from server. Attempting to reconnect...');
                setLoading(true);
                setIsInitialized(false);
            }
        };

        return setupSocketEventListeners(handlers);
    }, [handleError]);

    const fetchInitialData = useCallback(async () => {
        if (!mountedRef.current) return;

        try {
            await Promise.all([
                emitWithRetry(SOCKET_EVENTS.SERVER_INFO),
                emitWithRetry(SOCKET_EVENTS.PLAYER_COUNT),
                emitWithRetry(SOCKET_EVENTS.ONLINE_PLAYERS),
                emitWithRetry(SOCKET_EVENTS.RECENT_EVENTS),
                emitWithRetry(SOCKET_EVENTS.COMMAND_STATS)
            ]);
            if (mountedRef.current) {
                setLoading(false);
            }
        } catch (error) {
            if (mountedRef.current) {
                handleError(error);
            }
        }
    }, [handleError]);

    useEffect(() => {
        mountedRef.current = true;
        let cleanup;

        const setupDashboard = async () => {
            try {
                setLoading(true);
                await initializeSocket();
                
                if (mountedRef.current) {
                    cleanup = setupEventHandlers();
                    await fetchInitialData();
                }
            } catch (error) {
                if (mountedRef.current) {
                    handleError(error);
                }
            }
        };

        setupDashboard();

        return () => {
            mountedRef.current = false;
            if (cleanup) {
                cleanup();
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            socketService.disconnect();
        };
    }, [initializeSocket, setupEventHandlers, fetchInitialData, handleError]);

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingSpinner message="Connecting to server..." />
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="error-container">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button 
                        className="retry-button"
                        onClick={() => {
                            setError(null);
                            setLoading(true);
                            setRetryCount(0);
                            setIsInitialized(false);
                        }}
                    >
                        Retry Connection
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Header user={user} socketStatus={isConnected} />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
};

export default Dashboard; 