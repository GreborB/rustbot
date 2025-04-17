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
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { io } from 'socket.io-client';

function Vending() {
  const [vendingMachines, setVendingMachines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newMachine, setNewMachine] = useState({
    name: '',
    location: '',
    entityId: ''
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('vendingData', (data) => {
      setVendingMachines(data);
    });

    newSocket.on('vendingError', (error) => {
      setStatus(error.message);
      setTimeout(() => setStatus(''), 3000);
    });

    newSocket.on('vendingSearchResults', (data) => {
      setResults(data);
      setError(null);
    });

    newSocket.emit('getVendingMachines');

    return () => {
      newSocket.close();
      socket.off('vendingData');
      socket.off('vendingError');
    };
  }, []);

  const searchVending = () => {
    if (!socket || !searchTerm) return;
    socket.emit('searchVending', { searchTerm });
  };

  const handleAddMachine = () => {
    if (newMachine.name.trim() && newMachine.entityId.trim()) {
      socket.emit('addVendingMachine', newMachine);
      setNewMachine({ name: '', location: '', entityId: '' });
      setOpenDialog(false);
    }
  };

  const handleRemoveMachine = (machineId) => {
    socket.emit('removeVendingMachine', { id: machineId });
  };

  const formatPrice = (price) => {
    return `${price} scrap`;
  };

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
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.item}</TableCell>
                      <TableCell>{result.price}</TableCell>
                      <TableCell>{result.quantity}</TableCell>
                      <TableCell>{result.location}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Vending Machines
        </Typography>

        {status && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {status}
          </Alert>
        )}

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
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    Entity ID: {machine.entityId}
                  </Typography>
                }
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