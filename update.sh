#!/bin/bash

# Pull latest changes
echo "Pulling latest changes..."
git pull

# Install dependencies
echo "Installing dependencies..."
cd backend
npm install
cd ../frontend
npm install
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Restart services with PM2
echo "Restarting services..."
pm2 restart all

echo "Update complete!" 