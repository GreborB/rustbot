module.exports = {
  apps: [{
    name: 'rustbot',
    script: 'npm',
    args: 'run dev',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=256'
    }
  }]
}; 