module.exports = {
  apps: [
    {
      name: 'kinabot',
      cwd: './backend',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        CORS_ORIGIN: 'http://34.75.5.243:3000'
      }
    }
  ]
}; 