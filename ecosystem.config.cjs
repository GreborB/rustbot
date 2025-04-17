module.exports = {
  apps: [
    {
      name: 'rustbot',
      script: 'backend/src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        CORS_ORIGIN: 'http://localhost:3001'
      },
      watch: false,
      max_memory_restart: '1G',
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}; 