import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import './Players.css';

export default function Players() {
  const { socket } = useSocket();
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    if (socket) {
      socket.emit('getAllPlayers');
      socket.on('allPlayers', (data) => setPlayers(data));
    }

    return () => {
      if (socket) {
        socket.off('allPlayers');
      }
    };
  }, [socket]);

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
  };

  const handleKick = (playerId) => {
    if (window.confirm('Are you sure you want to kick this player?')) {
      socket.emit('kickPlayer', { playerId });
    }
  };

  const handleBan = (playerId) => {
    if (window.confirm('Are you sure you want to ban this player?')) {
      socket.emit('banPlayer', { playerId });
    }
  };

  return (
    <div className="players-page">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="players-grid">
        <div className="players-list">
          <h2>Players</h2>
          <div className="players-table">
            <div className="table-header">
              <span>Name</span>
              <span>Status</span>
              <span>Last Seen</span>
              <span>Actions</span>
            </div>
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                className={`player-row ${selectedPlayer?.id === player.id ? 'selected' : ''}`}
                onClick={() => handlePlayerSelect(player)}
              >
                <span>{player.name}</span>
                <span className={`status ${player.status}`}>{player.status}</span>
                <span>{player.lastSeen}</span>
                <div className="actions">
                  <button
                    className="kick-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleKick(player.id);
                    }}
                  >
                    Kick
                  </button>
                  <button
                    className="ban-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBan(player.id);
                    }}
                  >
                    Ban
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPlayer && (
          <div className="player-details">
            <h2>Player Details</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Name:</span>
                <span className="value">{selectedPlayer.name}</span>
              </div>
              <div className="detail-item">
                <span className="label">Steam ID:</span>
                <span className="value">{selectedPlayer.steamId}</span>
              </div>
              <div className="detail-item">
                <span className="label">Status:</span>
                <span className={`value status ${selectedPlayer.status}`}>
                  {selectedPlayer.status}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Last Seen:</span>
                <span className="value">{selectedPlayer.lastSeen}</span>
              </div>
              <div className="detail-item">
                <span className="label">Playtime:</span>
                <span className="value">{selectedPlayer.playtime}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 