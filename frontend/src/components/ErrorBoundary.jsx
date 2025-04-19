import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Box } from '@mui/material';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        p: 3,
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="h4" gutterBottom>
                        Something went wrong
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                    >
                        Try Again
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 