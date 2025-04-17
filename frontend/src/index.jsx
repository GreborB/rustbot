import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import './style.css';

// Error handling for React 18
const handleError = (error) => {
  console.error('Global error handler:', error);
};

// Enable better error reporting in development
if (process.env.NODE_ENV === 'development') {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error:', { message, source, lineno, colno, error });
    return false;
  };
}

// Set version in window for debugging
window.APP_VERSION = process.env.VITE_APP_VERSION || '1.0.0';
window.BUILD_DATE = new Date().toISOString();

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <Router>
            <App />
        </Router>
    </React.StrictMode>
);
