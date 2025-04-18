import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';

function Vending() {
  const [vendingMachines, setVendingMachines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newMachine, setNewMachine] = useState({
    name: '',
    location: '',
    entityId: ''
  });
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleVendingData = (data) => {
      setVendingMachines(data);
      setLoading(false);
    };

    const handleVendingError = (error) => {
      setError(error.message);
      setLoading(false);
    };

    const handleSearchResults = (data) => {
      setResults(data);
      setError(null);
    };

    socket.on('vendingData', handleVendingData);
    socket.on('vendingError', handleVendingError);
    socket.on('vendingSearchResults', handleSearchResults);
    socket.emit('getVendingMachines');

    return () => {
      socket.off('vendingData', handleVendingData);
      socket.off('vendingError', handleVendingError);
      socket.off('vendingSearchResults', handleSearchResults);
    };
  }, [socket]);

  const searchVending = () => {
    if (!socket || !searchTerm) return;
    socket.emit('searchVending', { searchTerm });
  };

  const handleAddMachine = () => {
    if (!socket || !newMachine.name.trim() || !newMachine.entityId.trim()) return;
    socket.emit('addVendingMachine', newMachine);
    setNewMachine({ name: '', location: '', entityId: '' });
    setOpenDialog(false);
  };

  const handleRemoveMachine = (machineId) => {
    if (!socket) return;
    socket.emit('removeVendingMachine', { id: machineId });
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
          <Typography>Loading vending machines...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Vending Machine Search
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <TextField
              label="Search Items"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={searchVending}
              sx={{ mt: 2 }}
            >
              Search
            </Button>
          </Box>

          {results.length > 0 && (
            <List>
              {results.map((result, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={result.item}
                    secondary={`Price: ${result.price} | Quantity: ${result.quantity}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>

      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Vending Machines
        </Typography>

        <List>
          {vendingMachines.map((machine) => (
            <ListItem key={machine.id}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">{machine.name}</Typography>
                    <Chip
                      size="small"
                      icon={<LocationIcon />}
                      label={machine.location}
                      color="primary"
                    />
                  </Box>
                }
                secondary={`Entity ID: ${machine.entityId}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveMachine(machine.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Add Vending Machine</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  fullWidth
                  label="Machine Name"
                  value={newMachine.name}
                  onChange={(e) => setNewMachine(prev => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={newMachine.location}
                  onChange={(e) => setNewMachine(prev => ({ ...prev, location: e.target.value }))}
                  helperText="e.g., HQM Shop, Main Base"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Entity ID"
                  value={newMachine.entityId}
                  onChange={(e) => setNewMachine(prev => ({ ...prev, entityId: e.target.value }))}
                  helperText="The entity ID of the vending machine"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleAddMachine} variant="contained">
              Add Machine
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}

export default Vending; 