const { dirname, join } = require('path')

module.exports = {
  apps: [
    {
      name: 'huang-server',
      script: join(__dirname, 'server', 'index.js'),
      node_args: '--no-deprecation',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      restart_delay: 1000,
      exp_backoff_restart_delay: 100
    },
    {
      name: 'huang-frontend',
      script: join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js'),
      args: '--host',
      env: {
        NODE_ENV: 'development'
      },
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 2000,
      exp_backoff_restart_delay: 100
    }
  ]
}
