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
      exp_backoff_restart_delay: 100,
      wait_ready: true,
      kill_timeout: 3000,
      restart_delay: 4000,
      max_restarts: 10
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
      exp_backoff_restart_delay: 100,
      wait_ready: true,
      kill_timeout: 3000,
      restart_delay: 4000,
      max_restarts: 10
    }
  ]
}; 