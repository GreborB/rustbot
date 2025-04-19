import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, CircularProgress, Paper } from '@mui/material';
import { Person, Event, Storage, Timer } from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import './Dashboard.css';

function Dashboard() {
    const [serverInfo, setServerInfo] = useState(null);
    const [playerCount, setPlayerCount] = useState(0);
    const [onlinePlayers, setOnlinePlayers] = useState([]);
    const [recentEvents, setRecentEvents] = useState([]);
    const [commandStats, setCommandStats] = useState({});
    const [loading, setLoading] = useState(true);
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleServerInfo = (data) => {
            setServerInfo(data);
            setLoading(false);
        };

        const handlePlayerCount = (data) => {
            setPlayerCount(data.count);
        };

        const handleOnlinePlayers = (data) => {
            setOnlinePlayers(data.players);
        };

        const handleRecentEvents = (data) => {
            setRecentEvents(data.events);
        };

        const handleCommandStats = (data) => {
            setCommandStats(data.stats);
        };

        socket.on('serverInfo', handleServerInfo);
        socket.on('playerCount', handlePlayerCount);
        socket.on('onlinePlayers', handleOnlinePlayers);
        socket.on('recentEvents', handleRecentEvents);
        socket.on('commandStats', handleCommandStats);

        socket.emit('getServerInfo');
        socket.emit('getPlayerCount');
        socket.emit('getOnlinePlayers');
        socket.emit('getRecentEvents');
        socket.emit('getCommandStats');

        return () => {
            socket.off('serverInfo', handleServerInfo);
            socket.off('playerCount', handlePlayerCount);
            socket.off('onlinePlayers', handleOnlinePlayers);
            socket.off('recentEvents', handleRecentEvents);
            socket.off('commandStats', handleCommandStats);
        };
    }, [socket]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
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
    );
}

export default Dashboard; 