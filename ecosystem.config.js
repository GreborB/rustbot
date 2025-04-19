module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'node_modules/.bin/vite',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    },
    {
      name: 'backend',
      cwd: './backend',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        DB_PATH: './database.sqlite',
        DB_LOGGING: false,
        JWT_SECRET: 'your-secure-auth-secret',
        JWT_EXPIRES_IN: '24h'
      }
    }
  ]
}; 