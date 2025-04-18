import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Person as PersonIcon,
  Event as EventIcon,
  Storage as StorageIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import './Dashboard.css';

export default function Dashboard() {
  const { socket } = useSocket();
  const [serverInfo, setServerInfo] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [commandStats, setCommandStats] = useState({
    box: { uses: 0, lastUsed: null },
    recycle: { uses: 0, lastUsed: null },
    uptime: { uses: 0, lastUsed: null }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (socket) {
      setLoading(true);
      socket.emit('getServerInfo');
      socket.emit('getPlayerCount');
      socket.emit('getOnlinePlayers');
      socket.emit('getRecentEvents');
      socket.emit('getCommandStats');

      socket.on('serverInfo', (info) => {
        setServerInfo(info);
        setLoading(false);
      });
      socket.on('playerCount', (count) => setPlayerCount(count));
      socket.on('onlinePlayers', (players) => setOnlinePlayers(players));
      socket.on('recentEvents', (events) => setRecentEvents(events));
      socket.on('commandStats', (stats) => setCommandStats(stats));
    }

    return () => {
      if (socket) {
        socket.off('serverInfo');
        socket.off('playerCount');
        socket.off('onlinePlayers');
        socket.off('recentEvents');
        socket.off('commandStats');
      }
    };
  }, [socket]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Players Online</Typography>
              </Box>
              <Typography variant="h4">{playerCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Server Status</Typography>
              </Box>
              <Typography variant="h4" color={serverInfo?.status === 'Online' ? 'success.main' : 'error.main'}>
                {serverInfo?.status || 'Offline'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TimerIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Server Uptime</Typography>
              </Box>
              <Typography variant="h4">{serverInfo?.uptime || '0h 0m'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <EventIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Recent Events</Typography>
              </Box>
              <Typography variant="h4">{recentEvents.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Command Stats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Command Statistics
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="!box"
                  secondary={`Used ${commandStats.box.uses} times | Last used: ${commandStats.box.lastUsed || 'Never'}`}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="!recycle"
                  secondary={`Used ${commandStats.recycle.uses} times | Last used: ${commandStats.recycle.lastUsed || 'Never'}`}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="!uptime"
                  secondary={`Used ${commandStats.uptime.uses} times | Last used: ${commandStats.uptime.lastUsed || 'Never'}`}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Online Players - Simplified */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Online Players
            </Typography>
            <List>
              {onlinePlayers.map((player) => (
                <React.Fragment key={player.id}>
                  <ListItem>
                    <ListItemText
                      primary={player.name}
                      secondary={`Online for ${player.onlineTime}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
              {onlinePlayers.length === 0 && (
                <ListItem>
                  <ListItemText primary="No players online" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Events */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Events
            </Typography>
            <List>
              {recentEvents.map((event, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={event.message}
                      secondary={event.time}
                    />
                  </ListItem>
                  {index < recentEvents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {recentEvents.length === 0 && (
                <ListItem>
                  <ListItemText primary="No recent events" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 