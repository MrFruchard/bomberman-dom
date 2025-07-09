---
description: Start the Go backend server for multiplayer Bomberman
---

# Start Backend Server

Starts the Go WebSocket server for multiplayer functionality.

```bash
cd back && go run .
```

The server will start on `localhost:8080` and handle:
- WebSocket connections for real-time multiplayer
- HTTP endpoints for scores and room management
- Game room management and player synchronization