# Kinabot

A lightweight Rust server management bot with a modern web interface.

## Features

- Real-time server monitoring
- Storage box management
- Smart switch control
- Player tracking
- Timer management
- Vending machine search

## Prerequisites

- Node.js 16.x or later
- Rust server with RCON enabled
- Steam account with Rust

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/kinabot.git
cd kinabot
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Build the frontend:
```bash
cd frontend
npm run build
```

## Configuration

1. Start your Rust server and enable RCON
2. In-game, open the console and type `client.connect` to get your pairing code
3. The bot will use this code to connect to your server

## Running on VM

1. SSH into your VM
2. Clone the repository and install dependencies as shown above
3. Build the frontend
4. Start the backend server:
```bash
cd backend
npm start
```

5. Access the web interface at `http://your-vm-ip:3000`

## Using PM2 for Production

To keep the bot running in production:

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the bot with PM2:
```bash
cd backend
pm2 start npm --name "kinabot" -- start
```

3. To view logs:
```bash
pm2 logs kinabot
```

4. To restart the bot:
```bash
pm2 restart kinabot
```

## Security Notes

- Keep your pairing code secure
- Use a reverse proxy (like Nginx) if exposing to the internet
- Regularly update dependencies
- Monitor server logs for suspicious activity

## License

MIT

## Contributing

Feel free to submit issues and pull requests. 