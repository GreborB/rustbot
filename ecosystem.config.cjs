module.exports = {
  apps: [
    {
      name: 'rustbot-backend',
      cwd: './backend',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      max_memory_restart: '150M',
      node_args: '--max-old-space-size=128'
    },
    {
      name: 'rustbot-frontend',
      cwd: './frontend',
      script: './node_modules/.bin/serve',
      args: '-s dist -l 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '150M',
      node_args: '--max-old-space-size=128'
    }
  ]
}; 