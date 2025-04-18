import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [status, setStatus] = useState('Please login with Steam to continue');
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Handle Steam OpenID callback
    useEffect(() => {
        const handleSteamCallback = async () => {
            const openidParams = new URLSearchParams(window.location.search);
            if (openidParams.has('openid.identity')) {
                setLoading(true);
                setStatus('Verifying Steam authentication...');
                try {
                    // Verify the OpenID response
                    const verifyResponse = await fetch('https://steamcommunity.com/openid/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: openidParams.toString()
                    });

                    if (!verifyResponse.ok) {
                        throw new Error('Failed to verify Steam authentication');
                    }

                    const steamId = openidParams.get('openid.identity').split('/').pop();
                    setStatus('Registering with Rust Companion API...');
                    
                    // Register with Rust Companion API
                    const registerResponse = await fetch('https://companion-rust.facepunch.com/api/push/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            steamId: steamId,
                            pushToken: 'web-' + Math.random().toString(36).substring(2),
                            deviceName: 'RustBot Dashboard'
                        })
                    });

                    if (!registerResponse.ok) {
                        throw new Error('Failed to register with Rust Companion API');
                    }

                    const data = await registerResponse.json();
                    
                    // Store credentials
                    localStorage.setItem('steamToken', data.token);
                    localStorage.setItem('fcmToken', data.fcmToken);
                    localStorage.setItem('rustplusToken', data.rustplusToken);
                    
                    setIsAuthenticated(true);
                    setUser({
                        steamId: steamId,
                        name: openidParams.get('openid.claimed_id').split('/').pop()
                    });
                    setStatus('Authentication successful!');
                    navigate('/');
                } catch (error) {
                    console.error('Authentication error:', error);
                    setStatus(`Error: ${error.message}`);
                    setLoading(false);
                }
            }
        };

        handleSteamCallback();
    }, [navigate]);

    // Check existing authentication
    useEffect(() => {
        const checkAuth = async () => {
            const steamToken = localStorage.getItem('steamToken');
            const fcmToken = localStorage.getItem('fcmToken');
            const rustplusToken = localStorage.getItem('rustplusToken');
            
            if (steamToken && fcmToken && rustplusToken) {
                try {
                    const response = await fetch('https://companion-rust.facepunch.com/api/push/status', {
                        headers: {
                            'Authorization': `Bearer ${steamToken}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setIsAuthenticated(true);
                        setUser({
                            steamId: data.steamId,
                            displayName: data.displayName,
                            photos: [{ value: data.avatar }]
                        });
                        initializeSocket();
                    } else {
                        localStorage.removeItem('steamToken');
                        localStorage.removeItem('fcmToken');
                        localStorage.removeItem('rustplusToken');
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('steamToken');
                    localStorage.removeItem('fcmToken');
                    localStorage.removeItem('rustplusToken');
                }
            }
        };

        checkAuth();
    }, []);

    const initializeSocket = () => {
        const steamToken = localStorage.getItem('steamToken');
        const fcmToken = localStorage.getItem('fcmToken');
        const rustplusToken = localStorage.getItem('rustplusToken');
        
        if (!steamToken || !fcmToken || !rustplusToken) return;

        const newSocket = new WebSocket('wss://companion-rust.facepunch.com/ws');
        setSocket(newSocket);

        newSocket.onopen = () => {
            // Authenticate WebSocket connection
            newSocket.send(JSON.stringify({
                type: 'auth',
                token: steamToken,
                fcmToken: fcmToken,
                rustplusToken: rustplusToken
            }));
            setStatus('Waiting for server pairing request...');
        };

        newSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'pairingRequest':
                        setStatus('New pairing request received! Click "Accept" to pair with the server.');
                        break;
                    case 'rustConnected':
                        setStatus('Successfully paired with Rust server!');
                        navigate('/');
                        break;
                    case 'pairingError':
                        setStatus(`Error: ${data.error}`);
                        setLoading(false);
                        break;
                    case 'authSuccess':
                        setStatus('Connected to Rust Companion. Waiting for pairing request...');
                        break;
                    case 'authError':
                        setStatus('Authentication failed. Please login again.');
                        localStorage.removeItem('steamToken');
                        localStorage.removeItem('fcmToken');
                        localStorage.removeItem('rustplusToken');
                        setIsAuthenticated(false);
                        break;
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        newSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setStatus('Connection error. Please try again.');
            setLoading(false);
        };

        newSocket.onclose = () => {
            setStatus('Connection closed. Reconnecting...');
            setTimeout(initializeSocket, 5000);
        };

        return () => {
            if (newSocket.readyState === WebSocket.OPEN) {
                newSocket.close();
            }
        };
    };

    const handleSteamLogin = () => {
        setLoading(true);
        setStatus('Redirecting to Steam...');
        const returnTo = encodeURIComponent(window.location.origin + '/login');
        window.location.href = `https://steamcommunity.com/openid/login?openid.ns=http://specs.openid.net/auth/2.0&openid.mode=checkid_setup&openid.return_to=${returnTo}&openid.realm=${window.location.origin}&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select`;
    };

    const handleAcceptPairing = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ 
                type: 'acceptPairing',
                token: localStorage.getItem('steamToken'),
                fcmToken: localStorage.getItem('fcmToken'),
                rustplusToken: localStorage.getItem('rustplusToken')
            }));
            setStatus('Accepting pairing request...');
            setLoading(true);
        } else {
            setStatus('Socket not connected. Please try again.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('steamToken');
        localStorage.removeItem('fcmToken');
        localStorage.removeItem('rustplusToken');
        setIsAuthenticated(false);
        setUser(null);
        setStatus('Logged out successfully');
        navigate('/login');
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
                            <button 
                                className="logout-button"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
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