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
  TextField
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
  CircularProgress
} from '@mui/icons-material';

function Dashboard({ socket }) {
  const navigate = useNavigate();
  const [serverInfo, setServerInfo] = useState({
    connected: false,
    name: '',
    players: 0,
    maxPlayers: 0
  });
  const [pairingCode, setPairingCode] = useState('');
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    socket.on('connectionStatus', (data) => {
      setConnectionStatus(data.status);
      if (data.error) {
        setError(data.error);
      }
    });

    socket.on('serverPaired', (data) => {
      if (data.success) {
        setServerInfo({
          connected: true,
          name: data.serverInfo.name,
          players: data.serverInfo.players,
          maxPlayers: data.serverInfo.maxPlayers
        });
        setError('');
      }
    });

    socket.on('pairingError', (data) => {
      setError(data.error);
    });

    socket.on('rustConnected', () => {
      setServerInfo(prev => ({ ...prev, connected: true }));
    });

    socket.on('rustDisconnected', () => {
      setServerInfo(prev => ({ ...prev, connected: false }));
    });

    socket.on('rustError', (data) => {
      setError(data.error);
    });

    return () => {
      socket.off('connectionStatus');
      socket.off('serverPaired');
      socket.off('pairingError');
      socket.off('rustConnected');
      socket.off('rustDisconnected');
      socket.off('rustError');
    };
  }, [socket]);

  const handlePair = () => {
    if (!pairingCode) {
      setError('Please enter a pairing code');
      return;
    }
    socket.emit('pairServer', { pairingCode });
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircleIcon />;
      case 'connecting':
        return <CircularProgress size={20} />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'info';
      case 'error':
        return 'error';
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Server Status Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Server Status
              </Typography>
              {!serverInfo.connected && (
                <Button
                  variant="contained"
                  onClick={handlePair}
                  disabled={connectionStatus === 'connecting'}
                >
                  {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip
                icon={getConnectionStatusIcon()}
                label={connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                color={getConnectionStatusColor()}
                sx={{ mr: 2 }}
              />
              <Typography variant="body1">
                {serverInfo.name || 'Not connected to server'}
              </Typography>
            </Box>
            {!serverInfo.connected && (
              <TextField
                fullWidth
                label="Pairing Code"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value)}
                sx={{ mb: 2 }}
                disabled={connectionStatus === 'connecting'}
              />
            )}
            <LinearProgress
              variant="determinate"
              value={serverInfo.connected ? 100 : 0}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Players Online
                </Typography>
                <Typography variant="h4">
                  {serverInfo.players}/{serverInfo.maxPlayers}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Feature Cards */}
        {menuItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {item.icon}
                  <Typography variant="h6" component="div" sx={{ ml: 2 }}>
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
                  disabled={!serverInfo.connected || connectionStatus !== 'connected'}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default Dashboard; 