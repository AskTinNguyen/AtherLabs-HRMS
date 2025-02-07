# Port Conflict Resolution Guide

## Problem
When running the development servers, you might encounter the error:
```
Something is already running on port 3001
```

This happens because both the React development server and Express backend are trying to use the same port (3001).

## Solution

### 1. Kill Existing Processes
First, stop any existing Node.js processes that might be using the ports:
```bash
# Kill all Node processes
pkill -f "node"

# Alternatively, find and kill specific port processes
lsof -i :3000,3001    # To see what's using the ports
kill -9 <PID>         # Replace <PID> with the process ID
```

### 2. Configure Port Settings
Create/update two configuration files:

1. `.env.development` file in project root:
```
# React Development Server Port
PORT=3000

# Proxy Configuration
REACT_APP_API_URL=http://localhost:3001
```

2. Update `package.json`:
```json
{
  "proxy": "http://localhost:3001",
  "scripts": {
    "start": "PORT=3000 react-scripts start",
    "server": "NODE_OPTIONS='--loader ts-node/esm' ts-node --esm src/server/index.ts",
    "dev": "concurrently \"npm run start\" \"npm run server\""
  }
}
```

### 3. Start the Application
After applying these changes:
```bash
npm run dev
```

This will start:
- Frontend on `http://localhost:3000`
- Backend on `http://localhost:3001`

### Common Issues
- If the error persists after killing processes, try closing and reopening your terminal
- Make sure no other applications are using ports 3000 or 3001
- Check if the `.env.development` file is in the correct location (project root)
- Ensure the `proxy` field in `package.json` matches your backend port

### Port Configuration Summary
- Frontend (React): Port 3000
- Backend (Express): Port 3001
- API Proxy: Frontend automatically proxies API requests to backend 