import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, Typography, Switch, IconButton, Dialog, 
         DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const Automation = () => {
    const [automations, setAutomations] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingAutomation, setEditingAutomation] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        triggers: [],
        actions: [],
        enabled: true
    });

    const { socket } = useSocket();
    const { token } = useAuth();

    useEffect(() => {
        fetchAutomations();

        // Socket event listeners
        socket.on('automation:created', handleAutomationCreated);
        socket.on('automation:updated', handleAutomationUpdated);
        socket.on('automation:deleted', handleAutomationDeleted);

        return () => {
            socket.off('automation:created');
            socket.off('automation:updated');
            socket.off('automation:deleted');
        };
    }, [socket]);

    const fetchAutomations = async () => {
        try {
            const data = await api.getAutomations();
            setAutomations(data);
        } catch (error) {
            toast.error('Failed to fetch automations');
        }
    };

    const handleOpen = (automation = null) => {
        if (automation) {
            setEditingAutomation(automation);
            setFormData({
                name: automation.name,
                description: automation.description,
                triggers: automation.triggers,
                actions: automation.actions,
                enabled: automation.enabled
            });
        } else {
            setEditingAutomation(null);
            setFormData({
                name: '',
                description: '',
                triggers: [],
                actions: [],
                enabled: true
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingAutomation(null);
        setFormData({
            name: '',
            description: '',
            triggers: [],
            actions: [],
            enabled: true
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAutomation) {
                await api.updateAutomation(editingAutomation._id, formData);
                toast.success('Automation updated successfully');
            } else {
                await api.createAutomation(formData);
                toast.success('Automation created successfully');
            }
            handleClose();
            fetchAutomations();
        } catch (error) {
            toast.error(error.message || 'Failed to save automation');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.deleteAutomation(id);
            toast.success('Automation deleted successfully');
            fetchAutomations();
        } catch (error) {
            toast.error('Failed to delete automation');
        }
    };

    const handleToggle = async (id, enabled) => {
        try {
            await api.updateAutomation(id, { enabled: !enabled });
            toast.success(`Automation ${enabled ? 'disabled' : 'enabled'} successfully`);
            fetchAutomations();
        } catch (error) {
            toast.error('Failed to toggle automation');
        }
    };

    // Socket event handlers
    const handleAutomationCreated = (automation) => {
        setAutomations(prev => [...prev, automation]);
    };

    const handleAutomationUpdated = (automation) => {
        setAutomations(prev => prev.map(a => a._id === automation._id ? automation : a));
    };

    const handleAutomationDeleted = ({ id }) => {
        setAutomations(prev => prev.filter(a => a._id !== id));
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Automations</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Add Automation
                </Button>
            </Box>

            <Grid container spacing={2}>
                {automations.map((automation) => (
                    <Grid item xs={12} sm={6} md={4} key={automation._id}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">{automation.name}</Typography>
                                    <Switch
                                        checked={automation.enabled}
                                        onChange={() => handleToggle(automation._id, automation.enabled)}
                                    />
                                </Box>
                                <Typography color="textSecondary" gutterBottom>
                                    {automation.description}
                                </Typography>
                                <Box display="flex" justifyContent="flex-end" mt={1}>
                                    <IconButton onClick={() => handleOpen(automation)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(automation._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingAutomation ? 'Edit Automation' : 'Create Automation'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            multiline
                            rows={2}
                        />
                        {/* Add trigger and action configuration fields here */}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editingAutomation ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Automation; 