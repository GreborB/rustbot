module.exports = {
  apps: [
    {
      name: 'rustbot-backend',
      cwd: './backend',
      script: 'src/index.js',
      watch: ['src'],
      ignore_watch: ['node_modules', 'logs'],
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/home/ubuntu/.pm2/logs/rustbot-backend-error.log',
      out_file: '/home/ubuntu/.pm2/logs/rustbot-backend-out.log',
      time: true
    },
    {
      name: 'rustbot-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      watch: ['src'],
      ignore_watch: ['node_modules', 'logs'],
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/ubuntu/.pm2/logs/rustbot-frontend-error.log',
      out_file: '/home/ubuntu/.pm2/logs/rustbot-frontend-out.log',
      time: true
    }
  ]
}; 