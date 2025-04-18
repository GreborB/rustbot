module.exports = {
  apps: [
    {
      name: 'kinabot-backend',
      cwd: './backend',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log',
      merge_logs: true
    },
    {
      name: 'kinabot-frontend',
      cwd: './frontend',
      script: 'node_modules/vite/bin/vite.js',
      args: 'preview --port 3000 --host',
      env: {
        NODE_ENV: 'production'
      },
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log',
      merge_logs: true
    }
  ]
}; 