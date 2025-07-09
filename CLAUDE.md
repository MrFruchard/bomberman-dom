# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multiplayer Bomberman game built with a custom JavaScript mini-framework. The objective is to create a battle royale-style Bomberman where multiple players fight until only one remains standing.

**Core Concept**: 
- Multiplayer Bomberman battle royale (2-4 players)
- Last player standing wins
- Built using custom mini-framework (no external frameworks, Canvas, or WebGL allowed)
- Real-time multiplayer with WebSocket communication
- Includes chat system for player interaction

**Project Structure**:
- **Frontend**: HTML5 game using custom mini-framework
- **Backend**: Go server with WebSocket support for real-time multiplayer
- **Architecture**: Component-based frontend with state management and routing

## Development Commands

### Backend (Go)
```bash
# Start the Go server (from /back directory)
cd back
go run .
# Server runs on localhost:8080
```

### Frontend
```bash
# No build system - direct HTML/JS serving
# Open index.html in browser or serve with any static server
python -m http.server 8000  # Example static server
```

## Key Architecture

### Custom Mini-Framework
- **Location**: `/mini-framework/`
- **Entry point**: `mini-framework/index.js`
- **Core components**:
  - `VirtualDOM`: Virtual DOM implementation
  - `StateManager`: Global state management
  - `Router`: Client-side routing
  - `EventHandler`: Event management
  - `Component`: Base component class

### Game Structure
- **Main game**: `src/game.js` - Single player game logic
- **Multiplayer**: `src/MultiplayerBombermanApp.js` - Multiplayer entry point
- **Components**: `src/components/` - Game UI components
- **Core systems**: `src/` - Game mechanics (player, bomb, collision, etc.)

### Backend Architecture
- **WebSocket server**: `back/websocket.go` - Real-time communication
- **Game rooms**: `back/rooms.go` - Multiplayer room management
- **Main server**: `back/main.go` - HTTP and WebSocket handlers
- **Data structures**: Player, GameRoom, Bomb, PowerUps defined in main.go

### WebSocket Communication
- **Client**: `src/WebSocketClient.js` - WebSocket client with reconnection
- **Server**: Go WebSocket handler with room-based messaging
- **Message types**: playerInput, chat, gameState, roomUpdate, etc.

## Performance Requirements

**Critical Performance Standards** (Must be strictly followed):
- **60 FPS minimum** at all times - no exceptions
- **Zero frame drops** during gameplay
- **Proper use of `requestAnimationFrame`** - no setInterval/setTimeout for game loops
- **Performance monitoring** - measure and optimize code performance
- **No Canvas or WebGL** - use DOM manipulation only
- **No external frameworks** - use only the custom mini-framework

**Performance Monitoring**:
- Use browser developer tools to measure FPS
- Monitor frame timing and identify bottlenecks
- Profile JavaScript execution during gameplay

## Game Mechanics

### Core Game Rules
- **Objective**: Last player standing wins
- **Players**: 2-4 players per game
- **Lives**: Each player starts with 3 lives, then they're eliminated
- **Starting positions**: Players spawn in the four corners of the map
- **Victory condition**: Be the last player alive

### Multiplayer System
- **Room-based gameplay** with player lobbies
- **Nickname system** - players enter nickname before joining
- **Lobby mechanics**:
  - Player counter displays current players (max 4)
  - If 2+ players and no new players join within 20 seconds → 10-second countdown begins
  - If 4 players join before 20 seconds → 10-second countdown begins immediately
- **Real-time synchronization** via WebSocket
- **Chat system** for player communication during gameplay

### Map System
- **Fixed map size** - all players see the entire map
- **Two block types**:
  - **Walls**: Indestructible, always in same positions
  - **Blocks**: Destructible, randomly generated each game
- **Safe starting zones**: Players can survive if they place bombs immediately
- **Strategic layout**: Corners provide safe starting positions

### Power-ups (Random drops from destroyed blocks)
- **Bombs**: Increases simultaneous bomb count by 1
- **Flames**: Increases explosion range by 1 block in all four directions
- **Speed**: Increases player movement speed

### Bonus Features (Optional implementations)
- **Solo + Co-Op mode**: AI opponents for single/cooperative play
- **Extended Power-ups**:
  - Bomb Push: Throw bombs after placement
  - Bomb Pass: Walk through bombs
  - Block Pass: Walk through blocks (not walls)
  - Detonator: Manual bomb detonation
  - 1 Up: Extra life
  - Power-up drops on death
- **Team mode**: 2v2 battles
- **Ghost mode**: Dead players return as ghosts with revival mechanics

## Key Files to Understand

- `mini-framework/index.js`: Framework entry point and API
- `src/MultiplayerBombermanApp.js`: Main multiplayer app
- `src/WebSocketClient.js`: WebSocket communication
- `back/main.go`: Server structures and handlers
- `src/game.js`: Core game logic and mechanics
- `src/components/`: UI components for multiplayer features

## Testing

No automated test framework is configured. Testing is manual via:
- Single player mode: Open `index.html`
- Multiplayer mode: Start Go server, then open multiplayer interface

## Data Storage

- **Scores**: Persisted in `back/json_directory/scores.json`
- **Game state**: In-memory during gameplay
- **Room state**: Server-side in Go maps with mutex protection

## Learning Objectives

This project focuses on mastering:
- **requestAnimationFrame** for smooth 60 FPS gameplay
- **Event loop** understanding and optimization
- **FPS monitoring** and performance measurement
- **Animation performance** and frame rate optimization
- **WebSockets** for real-time multiplayer communication
- **Synchronization** between multiple clients
- **Developer Tools** profiling (Firefox & Chrome)
- **DOM manipulation** performance without Canvas/WebGL