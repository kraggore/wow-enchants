module.exports = {
  apps: [
    {
      name: 'wow-enchants-backend',
      cwd: './backend',
      script: 'uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000',
      interpreter: 'python3',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'wow-enchants-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};