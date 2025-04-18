import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, TextField, Button, List, ListItem, ListItemText, Alert } from '@mui/material';
import { useSocket } from '../contexts/SocketContext';

function Storage() {
    const [storageId, setStorageId] = useState('');
    const [contents, setContents] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleStorageContents = (data) => {
            setContents(data);
            setError(null);
            setLoading(false);
        };

        const handleStorageError = (data) => {
            setError(data.error);
            setContents([]);
            setLoading(false);
        };

        socket.on('storageContents', handleStorageContents);
        socket.on('storageError', handleStorageError);

        return () => {
            socket.off('storageContents', handleStorageContents);
            socket.off('storageError', handleStorageError);
        };
    }, [socket]);

    const getStorageContents = () => {
        if (!socket || !storageId) return;
        setLoading(true);
        socket.emit('getStorageContents', { storageId });
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
                    <Typography>Loading storage contents...</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Storage Monitor
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <TextField
                            label="Storage ID"
                            value={storageId}
                            onChange={(e) => setStorageId(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={getStorageContents}
                            sx={{ mt: 2 }}
                        >
                            Get Contents
                        </Button>
                    </Box>

                    <List>
                        {contents.map((item, index) => (
                            <ListItem key={index}>
                                <ListItemText
                                    primary={item.name}
                                    secondary={`Quantity: ${item.quantity}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Box>
        </Container>
    );
}

export default Storage; 