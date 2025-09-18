module.exports = {
  apps: [
    {
      name: 'coffee-backend',
      script: 'src/app.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: './logs/coffee-backend.log',
      error_file: './logs/coffee-backend-error.log',
      out_file: './logs/coffee-backend-out.log',
      time: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log', 'coffee_machine.db'],
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M'
    }
  ],

  deploy: {
    production: {
      user: 'coffee-admin',
      host: 'YOUR_SERVER_IP',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/coffee-machine-backend.git',
      path: '/home/coffee-admin/coffee-machine-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && npm run frontend:install && npm run frontend:build && npm run init-db && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
