import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, TextField, Switch, Alert } from '@mui/material';
import io from 'socket.io-client';

function SmartSwitches() {
    const [switchId, setSwitchId] = useState('');
    const [switchState, setSwitchState] = useState(false);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);
    const [switches, setSwitches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_URL;
        const newSocket = io(API_URL);
        setSocket(newSocket);

        newSocket.on('switchState', (data) => {
            setSwitchState(data.state);
            setError(null);
        });

        newSocket.on('switchError', (data) => {
            setError(data.error);
        });

        return () => newSocket.close();
    }, []);

    const toggleSwitch = () => {
        if (!socket || !switchId) return;
        socket.emit('controlSwitch', { id: switchId, state: !switchState });
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Smart Switches
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Switch ID"
                            value={switchId}
                            onChange={(e) => setSwitchId(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                            <Typography>Switch State:</Typography>
                            <Switch
                                checked={switchState}
                                onChange={toggleSwitch}
                                disabled={!switchId}
                            />
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default SmartSwitches; 