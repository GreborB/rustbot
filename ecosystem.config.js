module.exports = {
  apps: [
    {
      name: 'rustbot-backend',
      cwd: './backend',
      script: 'src/index.js',
      watch: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
      time: true
    },
    {
      name: 'rustbot-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      watch: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log',
      time: true
    }
  ]
}; 