module.exports = {
  apps: [
    {
      name: 'rustbot-backend',
      script: 'backend/src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}; 