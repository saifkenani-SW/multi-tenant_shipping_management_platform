module.exports = {
  apps: [
    {
      name: 'logistics-api',
      script: './dist/src/main.js',
      instances: 4, // 4 Cluster workers
      exec_mode: 'cluster',
      node_args:
        '--require dotenv/config --require ./dist/src/packages/observability/instrumentation.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_POOL_MAX: 20,
      },
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
    },
  ],
};
