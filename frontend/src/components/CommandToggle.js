import React from 'react';

function CommandToggle({ command, toggleCommand, isToggled }) {
    return (
        <div className="command-toggle">
            <span>!{command}</span>
            <label className="toggle-switch">
                <input
                    type="checkbox"
                    checked={isToggled}
                    onChange={() => toggleCommand(command)}
                />
                <span className="slider" />
            </label>
        </div>
    );
}

export default CommandToggle;
