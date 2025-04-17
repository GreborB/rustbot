import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [status, setStatus] = useState('Waiting for server connection...');
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const newSocket = new WebSocket(`ws://${window.location.hostname}:3001`);
        setSocket(newSocket);

        newSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'connectionStatus':
                    setStatus(data.status === 'waiting_for_pairing' 
                        ? 'Ready to pair! Open Rust+ app in game and click "Pair".' 
                        : data.status);
                    break;
                case 'rustConnected':
                    setStatus('Successfully connected to Rust server!');
                    navigate('/dashboard');
                    break;
                case 'pairingError':
                    setStatus(`Error: ${data.error}`);
                    break;
            }
        };

        newSocket.onopen = () => {
            newSocket.send(JSON.stringify({ type: 'startPairing' }));
        };

        return () => {
            newSocket.close();
        };
    }, [navigate]);

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>RustBot Dashboard</h1>
                <p>{status}</p>
                
                {loading && (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Connecting...</p>
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