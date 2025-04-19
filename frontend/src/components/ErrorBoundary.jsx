import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        
        // Log error to backend
        if (window.APP_VERSION) {
            console.error('Error caught by boundary:', {
                error,
                errorInfo,
                version: window.APP_VERSION,
                timestamp: new Date().toISOString()
            });
        }
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
                        We're sorry, but something went wrong. Please try refreshing the page.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => window.location.reload()}
                    >
                        Refresh Page
                    </Button>
                    {process.env.NODE_ENV === 'development' && (
                        <Box sx={{ mt: 2, textAlign: 'left' }}>
                            <Typography variant="body2" color="text.secondary">
                                Error: {this.state.error?.toString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Component Stack: {this.state.errorInfo?.componentStack}
                            </Typography>
                        </Box>
                    )}
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 