import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import './Commands.css';

export default function Commands() {
  const { socket } = useSocket();
  const [commands, setCommands] = useState([]);
  const [newCommand, setNewCommand] = useState({
    name: '',
    description: '',
    usage: '',
    permission: 'user'
  });
  const [editingCommand, setEditingCommand] = useState(null);

  useEffect(() => {
    if (socket) {
      socket.emit('getCommands');
      socket.on('commandsList', (data) => setCommands(data));
    }

    return () => {
      if (socket) {
        socket.off('commandsList');
      }
    };
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCommand) {
      socket.emit('updateCommand', { ...newCommand, id: editingCommand.id });
    } else {
      socket.emit('addCommand', newCommand);
    }
    setNewCommand({
      name: '',
      description: '',
      usage: '',
      permission: 'user'
    });
    setEditingCommand(null);
  };

  const handleEdit = (command) => {
    setNewCommand(command);
    setEditingCommand(command);
  };

  const handleDelete = (commandId) => {
    if (window.confirm('Are you sure you want to delete this command?')) {
      socket.emit('deleteCommand', { commandId });
    }
  };

  return (
    <div className="commands-page">
      <div className="commands-form">
        <h2>{editingCommand ? 'Edit Command' : 'Add New Command'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Command Name</label>
            <input
              type="text"
              id="name"
              value={newCommand.name}
              onChange={(e) => setNewCommand({ ...newCommand, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              value={newCommand.description}
              onChange={(e) => setNewCommand({ ...newCommand, description: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="usage">Usage</label>
            <input
              type="text"
              id="usage"
              value={newCommand.usage}
              onChange={(e) => setNewCommand({ ...newCommand, usage: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="permission">Permission Level</label>
            <select
              id="permission"
              value={newCommand.permission}
              onChange={(e) => setNewCommand({ ...newCommand, permission: e.target.value })}
            >
              <option value="user">User</option>
              <option value="mod">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit">
            {editingCommand ? 'Update Command' : 'Add Command'}
          </button>
        </form>
      </div>

      <div className="commands-list">
        <h2>Available Commands</h2>
        <div className="commands-table">
          <div className="table-header">
            <span>Name</span>
            <span>Description</span>
            <span>Usage</span>
            <span>Permission</span>
            <span>Actions</span>
          </div>
          {commands.map((command) => (
            <div key={command.id} className="command-row">
              <span>{command.name}</span>
              <span>{command.description}</span>
              <span>{command.usage}</span>
              <span className={`permission ${command.permission}`}>
                {command.permission}
              </span>
              <div className="actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEdit(command)}
                >
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(command.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 