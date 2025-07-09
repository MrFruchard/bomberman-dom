---
description: Start a local server for the frontend game
---

# Start Frontend Server

Starts a local HTTP server to serve the Bomberman game files.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

Alternative with Node.js:
```bash
npx http-server -p 8000
```

**Note**: Make sure the backend server is running on port 8080 for multiplayer functionality.