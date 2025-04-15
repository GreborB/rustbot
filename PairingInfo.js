import React from 'react';

function PairingInfo({ serverInfo }) {
    return (
        <div>
            <p>Server ID: {serverInfo.id}</p>
            <p>Player Token: {serverInfo.token}</p>
        </div>
    );
}

export default PairingInfo;
