import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, TextField, Button, List, ListItem, ListItemText, Alert } from '@mui/material';
import { io } from 'socket.io-client';

function Storage() {
    const [storageId, setStorageId] = useState('');
    const [contents, setContents] = useState([]);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);

        newSocket.on('storageContents', (data) => {
            setContents(data);
            setError(null);
        });

        newSocket.on('storageError', (data) => {
            setError(data.error);
            setContents([]);
        });

        return () => newSocket.close();
    }, []);

    const getStorageContents = () => {
        if (!socket || !storageId) return;
        socket.emit('getStorageContents', { storageId });
    };

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