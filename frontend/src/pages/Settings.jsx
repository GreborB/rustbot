import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import './Settings.css';

export default function Settings() {
  const { socket } = useSocket();
  const [settings, setSettings] = useState({
    serverName: '',
    welcomeMessage: '',
    autoRestart: false,
    restartInterval: 24,
    backupEnabled: false,
    backupInterval: 6,
    maxPlayers: 100,
    whitelistEnabled: false
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.emit('getSettings');
      socket.on('settings', (data) => setSettings(data));
    }

    return () => {
      if (socket) {
        socket.off('settings');
      }
    };
  }, [socket]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      socket.emit('updateSettings', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <h1>Server Settings</h1>
      <form onSubmit={handleSubmit}>
        <div className="settings-section">
          <h2>General Settings</h2>
          <div className="form-group">
            <label htmlFor="serverName">Server Name</label>
            <input
              type="text"
              id="serverName"
              name="serverName"
              value={settings.serverName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="welcomeMessage">Welcome Message</label>
            <textarea
              id="welcomeMessage"
              name="welcomeMessage"
              value={settings.welcomeMessage}
              onChange={handleChange}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label htmlFor="maxPlayers">Maximum Players</label>
            <input
              type="number"
              id="maxPlayers"
              name="maxPlayers"
              value={settings.maxPlayers}
              onChange={handleChange}
              min="1"
              max="500"
              required
            />
          </div>
        </div>

        <div className="settings-section">
          <h2>Server Management</h2>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="autoRestart"
                checked={settings.autoRestart}
                onChange={handleChange}
              />
              Enable Automatic Restart
            </label>
          </div>
          {settings.autoRestart && (
            <div className="form-group">
              <label htmlFor="restartInterval">Restart Interval (hours)</label>
              <input
                type="number"
                id="restartInterval"
                name="restartInterval"
                value={settings.restartInterval}
                onChange={handleChange}
                min="1"
                max="24"
                required
              />
            </div>
          )}
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="backupEnabled"
                checked={settings.backupEnabled}
                onChange={handleChange}
              />
              Enable Automatic Backups
            </label>
          </div>
          {settings.backupEnabled && (
            <div className="form-group">
              <label htmlFor="backupInterval">Backup Interval (hours)</label>
              <input
                type="number"
                id="backupInterval"
                name="backupInterval"
                value={settings.backupInterval}
                onChange={handleChange}
                min="1"
                max="24"
                required
              />
            </div>
          )}
        </div>

        <div className="settings-section">
          <h2>Security</h2>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="whitelistEnabled"
                checked={settings.whitelistEnabled}
                onChange={handleChange}
              />
              Enable Whitelist
            </label>
          </div>
        </div>

        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
} 