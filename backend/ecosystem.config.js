module.exports = {
  apps: [{
    name: "nation-market-backend",
    script: "./dist/index.js",
    instances: "1",
    env: {
      NODE_ENV: "production",
    },
    // Prevent server from staying offline:
    // PM2 auto-restart configuration ensures 24/7 uptime
    exp_backoff_restart_delay: 100, // wait 100ms before restarting
    max_memory_restart: "1G", // restart if it uses too much memory
    max_restarts: 100,
    restart_delay: 3000,
    watch: false,
    error_file: "logs/err.log",
    out_file: "logs/out.log",
    merge_logs: true,
    time: true
  }]
}
