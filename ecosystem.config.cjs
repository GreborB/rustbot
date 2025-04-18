module.exports = {
  apps: [
    {
      name: 'rustbot-backend',
      cwd: './backend',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'rustbot-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}; 