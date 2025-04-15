import React, { useEffect, useState } from 'react';
import PairingInfo from '../components/PairingInfo';
import CommandToggle from '../components/CommandToggle';
import './style.css';
import axios from 'axios';

function Dashboard() {
    const [commands, setCommands] = useState([]);
    const [toggles, setToggles] = useState({});

    useEffect(() => {
        // Load list of commands and their toggle states from the backend
        axios.get('/api/settings/commands')
            .then(response => {
                setCommands(response.data.commands);
                setToggles(response.data.toggles);
            })
            .catch(error => {
                console.error('Failed to load commands', error);
            });
    }, []);

    const toggleCommand = (command) => {
        const newState = !toggles[command];
        setToggles(prev => ({ ...prev, [command]: newState }));

        axios.post('/api/settings/toggle', {
            command,
            enabled: newState
        }).catch(err => {
            console.error(`Failed to update toggle for ${command}`, err);
        });
    };

    return (
        <div className="container">
            <img src="/logo.png" alt="KinaBot Logo" className="logo" />
            <h1>KinaBot Dashboard</h1>
            <PairingInfo />
            {commands.map((cmd, idx) => (
                <CommandToggle
                    key={idx}
                    command={cmd}
                    toggleCommand={toggleCommand}
                    isToggled={toggles[cmd]}
                />
            ))}
        </div>
    );
}

export default Dashboard;
