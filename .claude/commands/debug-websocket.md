---
description: Debug WebSocket connections and multiplayer issues
---

# Debug WebSocket

Debug WebSocket connections and multiplayer communication issues.

## Check WebSocket Status
```bash
# Check if backend is running
curl -I http://localhost:8080/rooms
```

## Browser WebSocket Debugging
Open DevTools → Network → WS tab to monitor WebSocket traffic.

## Backend Logging
Add debug logging to Go server:
```go
log.Printf("WebSocket connection from: %s", r.RemoteAddr)
log.Printf("Message received: %s", string(message))
```

## Common Issues & Solutions

### Connection Refused
```bash
# Check if backend is running
ps aux | grep "go run"
netstat -an | grep 8080
```

### Message Not Received
Test message flow:
```javascript
// Send test message
ws.send(JSON.stringify({
  type: 'test',
  data: { message: 'Hello server' }
}));
```

### Room Management Issues
```bash
# Check room state
curl http://localhost:8080/rooms
```

## Debug Checklist
- [ ] Backend server running on port 8080
- [ ] WebSocket upgrade successful
- [ ] Messages sent and received
- [ ] Room state synchronized
- [ ] Player state consistent
- [ ] Error handling works