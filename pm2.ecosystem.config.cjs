module.exports = {
  apps: [
    {
      name: 'adf247-dev',
      cwd: '.',
      script: 'npm',
      args: 'run start:dev',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'adf247-pro',
      cwd: '.',
      script: 'npm',
      args: 'run start:pro --prefix api',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
      autorestart: true,
      max_memory_restart: '700M',
      time: true,
    },
  ],
}
