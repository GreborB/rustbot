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
        DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/kinabot',
        JWT_SECRET: 'your-secret-key',
      },
    },
  ],
}; 