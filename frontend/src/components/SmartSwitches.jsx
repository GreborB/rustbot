import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, TextField, Switch, Alert, CircularProgress, List, ListItem, ListItemText } from '@mui/material';
import { useSocket } from '../contexts/SocketContext';

function SmartSwitches() {
    const [switchId, setSwitchId] = useState('');
    const [switchState, setSwitchState] = useState(false);
    const [error, setError] = useState(null);
    const [switches, setSwitches] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleSwitchState = (data) => {
            setSwitchState(data.state);
            setError(null);
        };

        const handleSwitchError = (data) => {
            setError(data.error);
        };

        const handleSwitchesList = (data) => {
            setSwitches(data.switches);
            setLoading(false);
        };

        socket.on('switchState', handleSwitchState);
        socket.on('switchError', handleSwitchError);
        socket.on('switchesList', handleSwitchesList);
        socket.emit('getSwitches');

        return () => {
            socket.off('switchState', handleSwitchState);
            socket.off('switchError', handleSwitchError);
            socket.off('switchesList', handleSwitchesList);
        };
    }, [socket]);

    const toggleSwitch = () => {
        if (!socket || !switchId) return;
        socket.emit('controlSwitch', { id: switchId, state: !switchState });
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

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
                        <Switch
                            checked={switchState}
                            onChange={toggleSwitch}
                            disabled={!isConnected}
                        />
                    </Box>

                    <List>
                        {switches.map((switchItem) => (
                            <ListItem key={switchItem.id}>
                                <ListItemText
                                    primary={switchItem.name}
                                    secondary={`ID: ${switchItem.id} | State: ${switchItem.state ? 'On' : 'Off'}`}
                                />
                                <Switch
                                    checked={switchItem.state}
                                    onChange={() => {
                                        setSwitchId(switchItem.id);
                                        setSwitchState(switchItem.state);
                                        toggleSwitch();
                                    }}
                                    disabled={!isConnected}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Box>
        </Container>
    );
}

export default SmartSwitches; 