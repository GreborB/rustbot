import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Box, Avatar } from '@mui/material';
import { Notifications as NotificationsIcon, Wifi, WifiOff } from '@mui/icons-material';

const Header = ({ user, socketStatus }) => {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Dashboard
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton color="inherit">
                        <Badge badgeContent={4} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {socketStatus === 'connected' ? (
                            <Wifi color="success" />
                        ) : (
                            <WifiOff color="error" />
                        )}
                        <Typography variant="body2">
                            {socketStatus}
                        </Typography>
                    </Box>

                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar alt={user.username} src={user.avatar} />
                            <Typography variant="body2">
                                {user.username}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header; 