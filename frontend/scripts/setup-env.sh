#!/bin/bash

# Get the server's IP address (Linux version)
SERVER_IP=$(hostname -I | awk '{print $1}')

# Create the environment file
cat > ../.env.production.local << EOL
VITE_SERVER_HOST=$SERVER_IP
VITE_SERVER_PORT=3001
EOL

echo "Environment file created with IP: $SERVER_IP" 