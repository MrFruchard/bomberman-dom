---
description: Test multiplayer functionality and WebSocket connections
---

# Test Multiplayer

Test the multiplayer Bomberman functionality and WebSocket connections.

## Start Full Environment
```bash
# Terminal 1: Start backend
cd back && go run .

# Terminal 2: Start frontend
python -m http.server 8000
```

## Test WebSocket Connection
Open browser console and test:
```javascript
// Test WebSocket connection
const ws = new WebSocket('ws://localhost:8080/ws?name=TestPlayer&room=test');
ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Message:', JSON.parse(event.data));
ws.onerror = (error) => console.error('Error:', error);
```

## Multiplayer Test Checklist
- [ ] Players can join lobby
- [ ] Nickname system works
- [ ] Player counter updates
- [ ] Chat system functions
- [ ] Game synchronization works
- [ ] Multiple browsers connect
- [ ] Room management works
- [ ] WebSocket reconnection works

## Test Multiple Players
1. Open multiple browser windows
2. Navigate to `http://localhost:8000`
3. Enter different nicknames
4. Test lobby mechanics
5. Start game with 2-4 players