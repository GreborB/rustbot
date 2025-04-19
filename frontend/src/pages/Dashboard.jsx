import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Grid, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, CircularProgress, Paper } from '@mui/material';
import { Person, Event, Storage, Timer } from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
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

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    const handleError = useCallback((error) => {
        console.error('Dashboard error:', error);
        setError(error.message || 'An unexpected error occurred');
        setLoading(false);
        
        if (error.message.includes('authentication')) {
            navigate('/login');
        } else if (retryCount < MAX_RETRIES) {
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setLoading(true);
                setError(null);
            }, RETRY_DELAY);
        }
    }, [navigate, retryCount]);

    const initializeSocket = useCallback(async () => {
        if (isInitialized) return;

        try {
            await withRetry(
                async () => {
                    const token = safeLocalStorage.getItem('token');
                    if (!token) {
                        throw new Error('No authentication token found');
                    }
                    await waitForSocketConnection();
                    socketService.connect();
                },
                {
                    maxRetries: MAX_RETRIES,
                    retryDelay: RETRY_DELAY,
                    shouldRetry: (error) => !error.message.includes('authentication'),
                    onError: (error) => {
                        setRetryCount(prev => prev + 1);
                        toast.warning(`Connection attempt ${retryCount + 1} failed. Retrying...`);
                    }
                }
            );
            setIsInitialized(true);
        } catch (error) {
            handleError(error);
        }
    }, [isInitialized, handleError]);

    const setupEventHandlers = useCallback(() => {
        const handlers = {
            [SOCKET_EVENTS.SERVER_INFO]: (data) => {
                try {
                    setServerInfo(data);
                } catch (error) {
                    handleError(error);
                }
            },
            [SOCKET_EVENTS.PLAYER_COUNT]: (data) => {
                try {
                    setPlayerCount(data.count);
                } catch (error) {
                    handleError(error);
                }
            },
            [SOCKET_EVENTS.ONLINE_PLAYERS]: (data) => {
                try {
                    setOnlinePlayers(data.players);
                } catch (error) {
                    handleError(error);
                }
            },
            [SOCKET_EVENTS.RECENT_EVENTS]: (data) => {
                try {
                    setRecentEvents(data.events);
                } catch (error) {
                    handleError(error);
                }
            },
            [SOCKET_EVENTS.COMMAND_STATS]: (data) => {
                try {
                    setCommandStats(data.stats);
                } catch (error) {
                    handleError(error);
                }
            },
            [SOCKET_EVENTS.ERROR]: handleError,
            [SOCKET_EVENTS.DISCONNECT]: () => {
                toast.warning('Disconnected from server. Attempting to reconnect...');
                setLoading(true);
                setIsInitialized(false);
            }
        };

        return setupSocketEventListeners(handlers);
    }, [handleError]);

    const fetchInitialData = useCallback(async () => {
        try {
            await Promise.all([
                emitWithRetry(SOCKET_EVENTS.SERVER_INFO),
                emitWithRetry(SOCKET_EVENTS.PLAYER_COUNT),
                emitWithRetry(SOCKET_EVENTS.ONLINE_PLAYERS),
                emitWithRetry(SOCKET_EVENTS.RECENT_EVENTS),
                emitWithRetry(SOCKET_EVENTS.COMMAND_STATS)
            ]);
            setLoading(false);
        } catch (error) {
            handleError(error);
        }
    }, [handleError]);

    useEffect(() => {
        let mounted = true;
        let cleanup;

        const setupDashboard = async () => {
            try {
                setLoading(true);
                await initializeSocket();
                
                if (mounted) {
                    cleanup = setupEventHandlers();
                    await fetchInitialData();
                }
            } catch (error) {
                if (mounted) {
                    handleError(error);
                }
            }
        };

        setupDashboard();

        return () => {
            mounted = false;
            if (cleanup) {
                cleanup();
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
        <DashboardLayout>
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6} lg={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Player Count
                                </Typography>
                                <Typography variant="h4">
                                    {playerCount}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6} lg={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Server Status
                                </Typography>
                                <Typography variant="h4" color={isConnected ? 'success.main' : 'error.main'}>
                                    {isConnected ? 'Online' : 'Offline'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6} lg={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Server Uptime
                                </Typography>
                                <Typography variant="h4">
                                    {serverInfo?.uptime || 'N/A'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6} lg={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Recent Events
                                </Typography>
                                <Typography variant="h4">
                                    {recentEvents.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Online Players
                            </Typography>
                            <List>
                                {onlinePlayers.length > 0 ? (
                                    onlinePlayers.map((player) => (
                                        <ListItem key={player.id}>
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <Person />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={player.name}
                                                secondary={`ID: ${player.id}`}
                                            />
                                        </ListItem>
                                    ))
                                ) : (
                                    <ListItem>
                                        <ListItemText primary="No players online" />
                                    </ListItem>
                                )}
                            </List>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Recent Events
                            </Typography>
                            <List>
                                {recentEvents.length > 0 ? (
                                    recentEvents.map((event, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <Event />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={event.type}
                                                    secondary={event.message}
                                                />
                                            </ListItem>
                                            {index < recentEvents.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <ListItem>
                                        <ListItemText primary="No recent events" />
                                    </ListItem>
                                )}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </DashboardLayout>
    );
};

export default Dashboard; 