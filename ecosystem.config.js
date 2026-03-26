const fs = require('fs');
const path = require('path');

// Parse .env file into object
function loadEnv(filePath) {
  const env = {};
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx > 0) {
          env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
        }
      }
    }
  }
  return env;
}

module.exports = {
  apps: [
    {
      name: 'venn-api',
      script: 'python3',
      args: '-m uvicorn main:app --host 127.0.0.1 --port 8000',
      cwd: '/root/venn/backend',
      env: loadEnv('/root/venn/backend/.env'),
    },
    {
      name: 'venn-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: '/root/venn/frontend',
    },
  ],
};
