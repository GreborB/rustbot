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
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Storage as StorageIcon,
  Power as PowerIcon,
  People as PeopleIcon,
  Timer as TimerIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Recycle as RecycleIcon,
  AccessTime as AccessTimeIcon,
  Build as BuildIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { socketService } from '../services/socket';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [serverInfo, setServerInfo] = useState({
    connected: false,
    name: '',
    players: 0,
    maxPlayers: 0,
    time: '',
    upkeep: 0,
    wipeTime: ''
  });
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    let isMounted = true;
    let retryTimeout = null;

    const handleConnectionStatus = (data) => {
      if (!isMounted) return;
      console.log('Connection status update:', data);
      setConnectionStatus(data.status);
      if (data.error) {
        setError(data.error);
        setIsLoading(false);
      }
    };

    const handleServerPaired = (data) => {
      if (!isMounted) return;
      console.log('Server paired:', data);
      if (data.success) {
        setServerInfo({
          connected: true,
          name: data.serverInfo?.name || 'Unknown Server',
          players: data.serverInfo?.players || 0,
          maxPlayers: data.serverInfo?.maxPlayers || 0,
          time: data.serverInfo?.time || '',
          upkeep: data.serverInfo?.upkeep || 0,
          wipeTime: data.serverInfo?.wipeTime || ''
        });
        setError('');
        setIsLoading(false);
        setRetryCount(0);
      }
    };

    const handlePairingError = (data) => {
      if (!isMounted) return;
      console.error('Pairing error:', data);
      setError(data.error || 'Unknown pairing error');
      setIsLoading(false);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying pairing (${retryCount + 1}/${maxRetries})...`);
        setRetryCount(prev => prev + 1);
        retryTimeout = setTimeout(() => {
          if (isMounted) {
            setIsLoading(true);
            socketService.emit('startPairing');
          }
        }, 3000);
      }
    };

    const handleRustConnected = () => {
      if (!isMounted) return;
      console.log('Rust connected');
      setServerInfo(prev => ({ ...prev, connected: true }));
      setIsLoading(false);
      setRetryCount(0);
    };

    const handleRustDisconnected = () => {
      if (!isMounted) return;
      console.log('Rust disconnected');
      setServerInfo(prev => ({ ...prev, connected: false }));
    };

    const handleRustError = (data) => {
      if (!isMounted) return;
      console.error('Rust error:', data);
      setError(data.error || 'Unknown Rust error');
      setIsLoading(false);
    };

    const handleServerUpdate = (data) => {
      if (!isMounted) return;
      setServerInfo(prev => ({
        ...prev,
        time: data.time || prev.time,
        upkeep: data.upkeep || prev.upkeep,
        players: data.players || prev.players,
        wipeTime: data.wipeTime || prev.wipeTime
      }));
    };

    if (!socketService.isConnected()) {
      console.log('Socket not connected, connecting...');
      socketService.connect();
    }

    socketService.on('connectionStatus', handleConnectionStatus);
    socketService.on('serverPaired', handleServerPaired);
    socketService.on('pairingError', handlePairingError);
    socketService.on('rustConnected', handleRustConnected);
    socketService.on('rustDisconnected', handleRustDisconnected);
    socketService.on('rustError', handleRustError);
    socketService.on('serverUpdate', handleServerUpdate);

    console.log('Starting pairing process...');
    setIsLoading(true);
    socketService.emit('startPairing');

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      
      socketService.off('connectionStatus', handleConnectionStatus);
      socketService.off('serverPaired', handleServerPaired);
      socketService.off('pairingError', handlePairingError);
      socketService.off('rustConnected', handleRustConnected);
      socketService.off('rustDisconnected', handleRustDisconnected);
      socketService.off('rustError', handleRustError);
      socketService.off('serverUpdate', handleServerUpdate);
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
    },
    {
      title: 'Recycle',
      icon: <RecycleIcon />,
      path: '/recycle',
      description: 'Monitor and manage recyclers'
    },
    {
      title: 'Time',
      icon: <AccessTimeIcon />,
      path: '/time',
      description: 'View server time and wipe information'
    },
    {
      title: 'Upkeep',
      icon: <BuildIcon />,
      path: '/upkeep',
      description: 'Monitor base upkeep and decay'
    },
    {
      title: 'Box Search',
      icon: <SearchIcon />,
      path: '/boxsearch',
      description: 'Search for items across all storage'
    },
    {
      title: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      description: 'Configure bot settings'
    },
    {
      title: 'Security',
      icon: <SecurityIcon />,
      path: '/security',
      description: 'Monitor security systems'
    },
    {
      title: 'Notifications',
      icon: <NotificationsIcon />,
      path: '/notifications',
      description: 'Configure alerts and notifications'
    },
    {
      title: 'Map',
      icon: <MapIcon />,
      path: '/map',
      description: 'View server map and markers'
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
                      <Typography color="text.secondary">
                        Time: {serverInfo.time}
                      </Typography>
                      <Typography color="text.secondary">
                        Upkeep: {serverInfo.upkeep}%
                      </Typography>
                      <Typography color="text.secondary">
                        Wipe Time: {serverInfo.wipeTime}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" component="div" sx={{ mb: 2 }}>
              Features
            </Typography>
            <List>
              {menuItems.map((item) => (
                <React.Fragment key={item.path}>
                  <ListItem button onClick={() => navigate(item.path)}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText 
                      primary={item.title}
                      secondary={item.description}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard; 