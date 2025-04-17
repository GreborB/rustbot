import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Alert,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Storage as StorageIcon,
  Power as PowerIcon,
  People as PeopleIcon,
  Timer as TimerIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { socketService } from '../services/socket';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [serverInfo, setServerInfo] = useState({
    connected: false,
    name: '',
    players: 0,
    maxPlayers: 0
  });
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleConnectionStatus = (data) => {
      setConnectionStatus(data.status);
      if (data.error) {
        setError(data.error);
      }
    };

    const handleServerPaired = (data) => {
      if (data.success) {
        setServerInfo({
          connected: true,
          name: data.serverInfo.name,
          players: data.serverInfo.players,
          maxPlayers: data.serverInfo.maxPlayers
        });
        setError('');
      }
    };

    const handlePairingError = (data) => {
      setError(data.error);
      setIsLoading(false);
    };

    const handleRustConnected = () => {
      setServerInfo(prev => ({ ...prev, connected: true }));
      setIsLoading(false);
    };

    const handleRustDisconnected = () => {
      setServerInfo(prev => ({ ...prev, connected: false }));
    };

    const handleRustError = (data) => {
      setError(data.error);
      setIsLoading(false);
    };

    // Connect to socket if not already connected
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    socketService.on('connectionStatus', handleConnectionStatus);
    socketService.on('serverPaired', handleServerPaired);
    socketService.on('pairingError', handlePairingError);
    socketService.on('rustConnected', handleRustConnected);
    socketService.on('rustDisconnected', handleRustDisconnected);
    socketService.on('rustError', handleRustError);

    // Start pairing process
    setIsLoading(true);
    socketService.emit('startPairing');

    return () => {
      socketService.off('connectionStatus', handleConnectionStatus);
      socketService.off('serverPaired', handleServerPaired);
      socketService.off('pairingError', handlePairingError);
      socketService.off('rustConnected', handleRustConnected);
      socketService.off('rustDisconnected', handleRustDisconnected);
      socketService.off('rustError', handleRustError);
    };
  }, []);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircleIcon color="success" />;
      case 'disconnected':
        return <ErrorIcon color="error" />;
      case 'waiting_for_pairing':
        return <CircularProgress size={24} />;
      default:
        return <ErrorIcon color="error" />;
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'disconnected':
        return 'error';
      case 'waiting_for_pairing':
        return 'warning';
      default:
        return 'error';
    }
  };

  const menuItems = [
    {
      title: 'Storage',
      icon: <StorageIcon />,
      path: '/storage',
      description: 'Monitor storage boxes and search items'
    },
    {
      title: 'Smart Switches',
      icon: <PowerIcon />,
      path: '/switches',
      description: 'Control smart switches and power systems'
    },
    {
      title: 'Players',
      icon: <PeopleIcon />,
      path: '/players',
      description: 'Track player activity and status'
    },
    {
      title: 'Timers',
      icon: <TimerIcon />,
      path: '/timers',
      description: 'Manage in-game timers and alerts'
    },
    {
      title: 'Vending',
      icon: <ShoppingCartIcon />,
      path: '/vending',
      description: 'Search and monitor vending machines'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Server Status
              </Typography>
              <Chip
                icon={getConnectionStatusIcon()}
                label={connectionStatus}
                color={getConnectionStatusColor()}
                sx={{ mr: 1 }}
              />
              <Tooltip title="Refresh">
                <IconButton onClick={() => {
                  setIsLoading(true);
                  socketService.emit('startPairing');
                }} disabled={isLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {isLoading && <LinearProgress />}
            {serverInfo.connected && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {serverInfo.name}
                      </Typography>
                      <Typography color="text.secondary">
                        Players: {serverInfo.players}/{serverInfo.maxPlayers}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {menuItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.title}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {item.icon}
                      <Typography variant="h6" component="div" sx={{ ml: 1 }}>
                        {item.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(item.path)}
                      disabled={!serverInfo.connected}
                    >
                      Open
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard; 