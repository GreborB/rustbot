#!/bin/bash

# Get the server's IP address
SERVER_IP=$(hostname -I | awk '{print $1}')

# Create the environment file
cat > ../.env.development.local << EOF
VITE_SERVER_HOST=$SERVER_IP
VITE_SERVER_PORT=3001
VITE_DEV_PORT=3000
EOF

echo "Environment file created with IP: $SERVER_IP" 