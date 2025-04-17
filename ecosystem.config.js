module.exports = {
  apps: [{
    name: 'rustbot',
    script: 'npm',
    args: 'run dev',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
    exp_backoff_restart_delay: 100,
    wait_ready: true,
    kill_timeout: 3000,
    restart_delay: 4000,
    max_restarts: 10,
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=256'
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}; 