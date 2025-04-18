import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, TextField, Button, List, ListItem, ListItemText, Alert, Chip } from '@mui/material';
import { useSocket } from '../contexts/SocketContext';

function Players() {
    const [steamId, setSteamId] = useState('');
    const [playerInfo, setPlayerInfo] = useState(null);
    const [error, setError] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handlePlayerList = (data) => {
            setPlayers(data);
            setLoading(false);
        };

        const handlePlayerInfo = (data) => {
            setPlayerInfo(data);
            setError(null);
        };

        const handlePlayerError = (data) => {
            setError(data.error);
            setPlayerInfo(null);
        };

        socket.on('playerList', handlePlayerList);
        socket.on('playerInfo', handlePlayerInfo);
        socket.on('playerError', handlePlayerError);
        socket.emit('getPlayers');

        return () => {
            socket.off('playerList', handlePlayerList);
            socket.off('playerInfo', handlePlayerInfo);
            socket.off('playerError', handlePlayerError);
        };
    }, [socket]);

    const getPlayerInfo = () => {
        if (!socket || !steamId) return;
        socket.emit('getPlayerInfo', { steamId });
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
                    <Typography>Loading players...</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Player Info
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Steam ID"
                            value={steamId}
                            onChange={(e) => setSteamId(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={getPlayerInfo}
                            sx={{ mt: 2 }}
                        >
                            Get Player Info
                        </Button>
                    </Box>

                    {playerInfo && (
                        <List>
                            <ListItem>
                                <ListItemText
                                    primary={playerInfo.name}
                                    secondary={
                                        <Box sx={{ mt: 1 }}>
                                            <Chip
                                                label={playerInfo.isOnline ? 'Online' : 'Offline'}
                                                color={playerInfo.isOnline ? 'success' : 'default'}
                                                size="small"
                                                sx={{ mr: 1 }}
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                Last seen: {new Date(playerInfo.lastSeen).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        </List>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}

export default Players; 