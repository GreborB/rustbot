import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Button, TextField, Typography, Box, Paper } from '@mui/material';

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const { socket } = useSocket();
  const [pairingCode, setPairingCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handlePairing = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Send pairing request to server
      socket.emit('pair', { code: pairingCode }, (response) => {
        if (response.success) {
          login(response.user);
          navigate('/dashboard');
        } else {
          setError(response.error || 'Failed to pair with server');
        }
      });
    } catch (err) {
      setError('An error occurred while trying to pair');
      console.error('Pairing error:', err);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          RustBot Login
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Enter your pairing code to connect to the server
        </Typography>
        <form onSubmit={handlePairing}>
          <TextField
            fullWidth
            label="Pairing Code"
            variant="outlined"
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value)}
            margin="normal"
            required
          />
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
          >
            Connect
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login; 