import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Button, Alert, TextField, Grid } from '@mui/material';
import { io } from 'socket.io-client';
import QRCode from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

function Dashboard() {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);
    const [pairingCode, setPairingCode] = useState('');
    const [authUrl, setAuthUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);

        newSocket.on('connectionStatus', (data) => {
            setConnected(data.connected);
            if (!data.connected) setError(data.error);
        });

        newSocket.on('steamAuthUrl', (data) => {
            setAuthUrl(data.url);
        });

        newSocket.on('serverPaired', (data) => {
            if (data.success) {
                setConnected(true);
                setError(null);
            }
        });

        newSocket.on('pairingError', (data) => {
            setError(data.error);
        });

        return () => newSocket.close();
    }, []);

    const handleSteamAuth = () => {
        if (!socket) return;
        socket.emit('steamAuth');
    };

    const handlePairServer = () => {
        if (!socket || !pairingCode) return;
        socket.emit('pairServer', { pairingCode });
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ my: 4 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Dashboard
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {!connected ? (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSteamAuth}
                                    fullWidth
                                >
                                    Login with Steam
                                </Button>
                            </Grid>

                            {authUrl && (
                                <Grid item xs={12}>
                                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                                        <QRCode value={authUrl} size={200} />
                                    </Box>
                                    <CopyToClipboard text={authUrl} onCopy={() => setCopied(true)}>
                                        <Button variant="outlined" fullWidth>
                                            {copied ? 'Copied!' : 'Copy Auth URL'}
                                        </Button>
                                    </CopyToClipboard>
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                <TextField
                                    label="Pairing Code"
                                    value={pairingCode}
                                    onChange={(e) => setPairingCode(e.target.value)}
                                    fullWidth
                                    margin="normal"
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handlePairServer}
                                    fullWidth
                                    sx={{ mt: 2 }}
                                >
                                    Pair Server
                                </Button>
                            </Grid>
                        </Grid>
                    ) : (
                        <Alert severity="success">
                            Connected to Rust server
                        </Alert>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}

export default Dashboard;
