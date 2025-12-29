---
description: Start and manage the development server
---

# Development Server Workflow

## Steps

1. **Check for existing processes on port 3000**

```bash
lsof -i :3000
```

1. **If port is in use, kill the existing process**

```bash
kill -9 $(lsof -ti :3000)
```

// turbo
3. **Start the development server**

```bash
npm run dev
```

1. **Verify the server is running**
The development server should be accessible at <http://localhost:3000>

## Notes

- The dev server will auto-reload on file changes
- To stop the server, use Ctrl+C in the terminal
