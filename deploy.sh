#!/bin/bash

# Create directory if it doesn't exist
mkdir -p ~/bots
cd ~/bots

# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Clone or pull the repository
if [ -d "rustbot" ]; then
    cd rustbot
    git pull
else
    git clone https://github.com/GreborB/rustbot.git rustbot
    cd rustbot
fi

# Install dependencies
cd backend
npm install
cd ../frontend
npm install

# Create .env file from example
cd ../backend
cp .env.example .env

# Start the application
cd ..
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Set PM2 to start on system boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# Check application status
pm2 status

echo "Deployment completed! Please check the logs and configure your .env file." 