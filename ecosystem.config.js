module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run preview -- --port 3001 --host',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}; 