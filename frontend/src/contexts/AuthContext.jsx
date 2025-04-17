import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFCMCredentials, connectToServer, disconnectFromServer } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initConnection = async () => {
            try {
                // Check if we have stored credentials
                const serverId = localStorage.getItem('serverId');
                const playerToken = localStorage.getItem('playerToken');

                if (serverId && playerToken) {
                    // Try to reconnect
                    await connectToServer(serverId, playerToken);
                    setIsConnected(true);
                }
            } catch (err) {
                console.error('Connection init error:', err);
                disconnectFromServer();
            } finally {
                setLoading(false);
            }
        };

        initConnection();
    }, []);

    const connect = async (serverInfo) => {
        try {
            setLoading(true);
            setError(null);

            // Get FCM credentials
            await getFCMCredentials();

            // Connect to server
            const result = await connectToServer(serverInfo.serverId, serverInfo.playerToken);
            
            // Store credentials
            localStorage.setItem('serverId', serverInfo.serverId);
            localStorage.setItem('playerToken', serverInfo.playerToken);
            
            setIsConnected(true);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const disconnect = () => {
        disconnectFromServer();
        setIsConnected(false);
    };

    return (
        <AuthContext.Provider value={{ 
            isConnected, 
            loading, 
            error, 
            connect, 
            disconnect 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 