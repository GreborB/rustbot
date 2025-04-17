import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [status, setStatus] = useState('Please login with Steam to continue');
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Check authentication status
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/status');
                const data = await response.json();
                if (data.authenticated) {
                    setIsAuthenticated(true);
                    setUser(data.user);
                    initializeSocket();
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            }
        };

        checkAuth();
    }, []);

    const initializeSocket = () => {
        const newSocket = new WebSocket(`ws://${window.location.hostname}:3001`);
        setSocket(newSocket);

        newSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'pairingRequest':
                    setStatus('New pairing request received! Click "Accept" to pair with the server.');
                    break;
                case 'rustConnected':
                    setStatus('Successfully paired with Rust server!');
                    navigate('/dashboard');
                    break;
                case 'pairingError':
                    setStatus(`Error: ${data.error}`);
                    break;
            }
        };

        newSocket.onopen = () => {
            setStatus('Waiting for server pairing request...');
        };

        return () => {
            newSocket.close();
        };
    };

    const handleSteamLogin = () => {
        window.location.href = '/api/auth/steam';
    };

    const handleAcceptPairing = () => {
        if (socket) {
            socket.send(JSON.stringify({ type: 'acceptPairing' }));
            setStatus('Accepting pairing request...');
            setLoading(true);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>RustBot Dashboard</h1>
                
                {!isAuthenticated ? (
                    <>
                        <p>{status}</p>
                        <button 
                            className="steam-login-button"
                            onClick={handleSteamLogin}
                        >
                            <img 
                                src="/steam_login.png" 
                                alt="Login with Steam" 
                                width="180"
                            />
                        </button>
                    </>
                ) : (
                    <>
                        <div className="user-info">
                            <img 
                                src={user.photos[0].value} 
                                alt="Steam Avatar" 
                                className="avatar"
                            />
                            <p>Logged in as {user.displayName}</p>
                        </div>
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
                                <li>Launch Rust and log in to your Steam account</li>
                                <li>Join the server you want to connect the bot to</li>
                                <li>In game, press ESC and click "Pair server with Rust+"</li>
                                <li>Wait for the pairing request to appear here</li>
                                <li>Click "Accept" to complete the pairing</li>
                            </ol>
                            <p className="note">Note: You must be logged into Steam in Rust to pair with the bot.</p>
                        </div>

                        {status.includes('pairing request') && (
                            <button 
                                className="accept-button"
                                onClick={handleAcceptPairing}
                            >
                                Accept Pairing
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Login; 