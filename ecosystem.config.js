module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'node_modules/.bin/vite',
      args: 'preview --port 3000 --host',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'backend',
      cwd: './backend',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        DATABASE_URL: 'sqlite://./database.sqlite',
        JWT_SECRET: 'your-secret-key',
        CORS_ORIGIN: 'http://localhost:3000',
      },
    },
  ],
}; 