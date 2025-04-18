import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, TextField, Button, List, ListItem, ListItemText, Alert, Chip } from '@mui/material';
import io from 'socket.io-client';

function Timers() {
    const [timerName, setTimerName] = useState('');
    const [duration, setDuration] = useState('');
    const [message, setMessage] = useState('');
    const [isRepeating, setIsRepeating] = useState(false);
    const [timers, setTimers] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_URL;
        const newSocket = io(API_URL);

        newSocket.on('timerList', (data) => {
            setTimers(data);
            setError(null);
        });

        newSocket.on('timerError', (data) => {
            setError(data.error);
        });

        return () => newSocket.close();
    }, []);

    const addTimer = () => {
        if (!timerName || !duration) return;
        const API_URL = import.meta.env.VITE_API_URL;
        const socket = io(API_URL);
        socket.emit('addTimer', {
            name: timerName,
            duration: parseInt(duration),
            message,
            isRepeating
        });
        setTimerName('');
        setDuration('');
        setMessage('');
        setIsRepeating(false);
    };

    const removeTimer = (timerId) => {
        const API_URL = import.meta.env.VITE_API_URL;
        const socket = io(API_URL);
        socket.emit('removeTimer', { timerId });
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Timers
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Timer Name"
                            value={timerName}
                            onChange={(e) => setTimerName(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Duration (seconds)"
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Message (optional)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                            <Typography>Repeat Timer</Typography>
                            <Chip
                                label={isRepeating ? 'Yes' : 'No'}
                                color={isRepeating ? 'primary' : 'default'}
                                onClick={() => setIsRepeating(!isRepeating)}
                                sx={{ ml: 2 }}
                            />
                        </Box>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={addTimer}
                            sx={{ mt: 2 }}
                        >
                            Add Timer
                        </Button>
                    </Box>

                    <List>
                        {timers.map((timer) => (
                            <ListItem key={timer.id}>
                                <ListItemText
                                    primary={timer.name}
                                    secondary={
                                        <Box sx={{ mt: 1 }}>
                                            <Chip
                                                label={formatTime(timer.remaining)}
                                                color="info"
                                                size="small"
                                                sx={{ mr: 1 }}
                                            />
                                            {timer.message && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Message: {timer.message}
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                />
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => removeTimer(timer.id)}
                                >
                                    Remove
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Box>
        </Container>
    );
}

export default Timers; 