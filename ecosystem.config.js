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
      }
    },
    {
      name: 'rustbot-frontend',
      cwd: './frontend',
      script: 'node_modules/vite/bin/vite.js',
      watch: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      pre_start: 'npm run build'
    }
  ]
}; 