module.exports = {
  apps: [
    {
      name: 'kinabot',
      cwd: './backend',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        CORS_ORIGIN: '*'
      }
    }
  ]
}; 