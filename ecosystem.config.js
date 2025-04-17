module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './backend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_OPTIONS: '--max-old-space-size=128'
      },
      watch: false,
      max_memory_restart: '150M',
      exp_backoff_restart_delay: 100
    },
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_OPTIONS: '--max-old-space-size=128'
      },
      watch: false,
      max_memory_restart: '150M',
      exp_backoff_restart_delay: 100
    }
  ]
}; 