import React, { useState, useEffect } from 'react';
import { getServerInfo } from '../services/auth';
import './Login.css';

const Login = () => {
    const [status, setStatus] = useState('Waiting for server connection...');
    const [serverInfo, setServerInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                setLoading(true);
                const info = await getServerInfo();
                setServerInfo(info);
                setStatus('Server is ready for pairing!');
            } catch (err) {
                setStatus('Server is not connected. Please check the backend service.');
                console.error('Server status error:', err);
            } finally {
                setLoading(false);
            }
        };

        checkServerStatus();
        const interval = setInterval(checkServerStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>RustBot Dashboard</h1>
                <p>{status}</p>
                
                {loading && (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Checking server status...</p>
                    </div>
                )}
                
                {serverInfo && (
                    <div className="server-info">
                        <h3>Server Information</h3>
                        <p>Name: {serverInfo.name}</p>
                        <p>IP: {serverInfo.ip}</p>
                        <p>Port: {serverInfo.port}</p>
                    </div>
                )}
                
                <div className="instructions">
                    <h3>How to connect:</h3>
                    <ol>
                        <li>Open Rust and go to the server you want to connect to</li>
                        <li>Open the Rust+ app menu in game</li>
                        <li>Click the "Pair" button</li>
                        <li>The bot will automatically accept the pairing request</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default Login; 