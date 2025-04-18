#!/bin/bash

# Get the directory where the script is located (rustbot directory)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$SCRIPT_DIR"

# Check if we're in the correct directory
if [ ! -d "$PROJECT_DIR/backend" ] || [ ! -d "$PROJECT_DIR/frontend" ]; then
    echo "Error: Required directories (backend/frontend) not found in $PROJECT_DIR"
    exit 1
fi

# Pull latest changes
echo "Pulling latest changes..."
git pull

# Install dependencies
echo "Installing dependencies..."
cd "$PROJECT_DIR/backend"
npm install
cd "$PROJECT_DIR/frontend"
npm install
cd "$PROJECT_DIR"

# Build frontend
echo "Building frontend..."
cd "$PROJECT_DIR/frontend"
npm run build
cd "$PROJECT_DIR"

# Restart services with PM2
echo "Restarting services..."
pm2 restart all

echo "Update complete!" 