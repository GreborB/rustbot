import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import App from './App';
import './style.css';

// Theme configuration
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9',
            light: '#e3f2fd',
            dark: '#42a5f5',
        },
        secondary: {
            main: '#f48fb1',
            light: '#f8bbd0',
            dark: '#f06292',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
    },
});

// Global error handling
const setupErrorHandling = () => {
    const handleError = (error, errorInfo) => {
        console.error('Application error:', {
            error,
            errorInfo,
            timestamp: new Date().toISOString(),
            version: window.APP_VERSION,
        });
    };

    // React error boundary
    window.addEventListener('error', (event) => {
        handleError(event.error);
        event.preventDefault();
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        handleError(event.reason);
        event.preventDefault();
    });

    // Development mode error reporting
    if (process.env.NODE_ENV === 'development') {
        window.onerror = (message, source, lineno, colno, error) => {
            handleError(error || message);
            return false;
        };
    }
};

// Application version and build info
const setupVersionInfo = () => {
    window.APP_VERSION = process.env.VITE_APP_VERSION || '1.0.0';
    window.BUILD_DATE = new Date().toISOString();
    window.ENVIRONMENT = process.env.NODE_ENV || 'development';
};

// Initialize application
const initializeApp = () => {
    setupErrorHandling();
    setupVersionInfo();

    const container = document.getElementById('root');
    if (!container) {
        throw new Error('Root element not found');
    }

    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthProvider>
                    <SocketProvider>
                        <Router>
                            <App />
                        </Router>
                    </SocketProvider>
                </AuthProvider>
            </ThemeProvider>
        </React.StrictMode>
    );
};

// Start the application
initializeApp(); 