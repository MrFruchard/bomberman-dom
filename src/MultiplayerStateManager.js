// Centralized state management for multiplayer Bomberman using the mini-framework
import { StateManager } from '../mini-framework/core/StateManager.js';

export default class MultiplayerStateManager extends StateManager {
    constructor() {
        super();
        
        // Initialize multiplayer-specific state
        this.initializeMultiplayerState();
        
        // Track local predictions for lag compensation
        this.localPredictions = new Map();
        this.serverReconciliation = true;
        this.inputSequence = 0;
        
        console.log('MultiplayerStateManager initialized');
    }

    // Initialize all multiplayer game state
    initializeMultiplayerState() {
        // Connection state
        this.setState('connectionState', 'disconnected');
        this.setState('connectionInfo', {});
        this.setState('reconnecting', false);

        // Room/Lobby state
        this.setState('currentRoom', null);
        this.setState('availableRooms', []);
        this.setState('roomPlayers', {});
        this.setState('gameState', 'menu'); // 'menu', 'lobby', 'countdown', 'playing', 'finished'

        // Player management
        this.setState('localPlayerId', null);
        this.setState('localPlayerName', '');
        this.setState('players', {});
        this.setState('playerPositions', {});
        this.setState('playerStats', {});

        // Game world state
        this.setState('gameMap', []);
        this.setState('bombs', {});
        this.setState('explosions', []);
        this.setState('powerUps', {});

        // UI state
        this.setState('chatMessages', []);
        this.setState('showChat', false);
        this.setState('gameTimer', 0);
        this.setState('countdownTimer', 0);

        // Performance tracking
        this.setState('latency', 0);
        this.setState('lastServerUpdate', 0);
        this.setState('frameRate', 60);
    }

    // Enhanced dispatch for multiplayer actions
    dispatch(action) {
        console.log('Multiplayer action dispatched:', action);

        switch (action.type) {
            // Connection actions
            case 'CONNECTION_STATE_CHANGE':
                this.handleConnectionStateChange(action.payload);
                break;

            case 'SET_CONNECTION_INFO':
                this.setState('connectionInfo', action.payload);
                break;

            // Room/Lobby actions
            case 'SET_AVAILABLE_ROOMS':
                this.setState('availableRooms', action.payload);
                break;

            case 'JOIN_ROOM':
                this.handleJoinRoom(action.payload);
                break;

            case 'LEAVE_ROOM':
                this.handleLeaveRoom();
                break;

            case 'ROOM_STATE_UPDATE':
                this.handleRoomStateUpdate(action.payload);
                break;

            // Player actions
            case 'SET_LOCAL_PLAYER':
                this.handleSetLocalPlayer(action.payload);
                break;

            case 'PLAYER_JOINED':
                this.handlePlayerJoined(action.payload);
                break;

            case 'PLAYER_LEFT':
                this.handlePlayerLeft(action.payload);
                break;

            case 'PLAYER_MOVED':
                this.handlePlayerMoved(action.payload);
                break;

            case 'PLAYER_INPUT_PREDICTION':
                this.handlePlayerInputPrediction(action.payload);
                break;

            // Game world actions
            case 'GAME_STATE_UPDATE':
                this.handleGameStateUpdate(action.payload);
                break;

            case 'BOMB_PLACED':
                this.handleBombPlaced(action.payload);
                break;

            case 'BOMB_EXPLODED':
                this.handleBombExploded(action.payload);
                break;

            case 'MAP_UPDATE':
                this.setState('gameMap', action.payload);
                break;

            // Chat actions
            case 'CHAT_MESSAGE_RECEIVED':
                this.handleChatMessage(action.payload);
                break;

            case 'TOGGLE_CHAT':
                this.setState('showChat', !this.getState('showChat'));
                break;

            // Timer actions
            case 'UPDATE_COUNTDOWN':
                this.setState('countdownTimer', action.payload);
                break;

            case 'UPDATE_GAME_TIMER':
                this.setState('gameTimer', action.payload);
                break;

            // Performance actions
            case 'UPDATE_LATENCY':
                this.setState('latency', action.payload);
                break;

            case 'UPDATE_FRAME_RATE':
                this.setState('frameRate', action.payload);
                break;

            // Game state transitions
            case 'GAME_STARTED':
                this.handleGameStarted(action.payload);
                break;

            case 'GAME_ENDED':
                this.handleGameEnded(action.payload);
                break;

            default:
                // Fall back to parent implementation for basic actions
                super.dispatch(action);
        }
    }

    // Connection state handlers
    handleConnectionStateChange(state) {
        this.setState('connectionState', state);
        
        if (state === 'connected') {
            this.setState('reconnecting', false);
        } else if (state === 'disconnected') {
            // Clear game state on disconnect
            this.setState('currentRoom', null);
            this.setState('players', {});
            this.setState('gameState', 'menu');
        }
    }

    // Room/Lobby handlers
    handleJoinRoom(roomData) {
        this.setState('currentRoom', roomData.room);
        this.setState('localPlayerId', roomData.playerId);
        this.setState('gameState', 'lobby');
        
        if (roomData.room && roomData.room.players) {
            this.setState('players', roomData.room.players);
        }
    }

    handleLeaveRoom() {
        this.setState('currentRoom', null);
        this.setState('players', {});
        this.setState('gameState', 'menu');
        this.setState('chatMessages', []);
    }

    handleRoomStateUpdate(roomData) {
        if (roomData.players) {
            this.setState('players', roomData.players);
        }
        if (roomData.state) {
            this.setState('gameState', roomData.state);
        }
        if (roomData.room) {
            this.setState('currentRoom', roomData.room);
        }
    }

    // Player management handlers
    handleSetLocalPlayer({ playerId, playerName }) {
        this.setState('localPlayerId', playerId);
        this.setState('localPlayerName', playerName);
    }

    handlePlayerJoined(player) {
        const players = { ...this.getState('players') };
        players[player.id] = player;
        this.setState('players', players);
        
        // Add chat notification
        this.addSystemChatMessage(`${player.name} joined the game`);
    }

    handlePlayerLeft({ playerId }) {
        const players = { ...this.getState('players') };
        const playerName = players[playerId]?.name || 'Unknown player';
        delete players[playerId];
        this.setState('players', players);
        
        // Remove from positions
        const positions = { ...this.getState('playerPositions') };
        delete positions[playerId];
        this.setState('playerPositions', positions);
        
        // Add chat notification
        this.addSystemChatMessage(`${playerName} left the game`);
    }

    handlePlayerMoved({ playerId, x, y, timestamp }) {
        const positions = { ...this.getState('playerPositions') };
        positions[playerId] = { x, y, timestamp: timestamp || Date.now() };
        this.setState('playerPositions', positions);
        
        // Update player object
        const players = { ...this.getState('players') };
        if (players[playerId]) {
            players[playerId].x = x;
            players[playerId].y = y;
            this.setState('players', players);
        }
    }

    // Client-side prediction for local player movement
    handlePlayerInputPrediction({ input, sequenceNumber }) {
        const localPlayerId = this.getState('localPlayerId');
        if (!localPlayerId) return;

        // Store prediction for server reconciliation
        this.localPredictions.set(sequenceNumber, {
            input,
            timestamp: Date.now(),
            playerId: localPlayerId
        });

        // Apply movement prediction locally
        const players = { ...this.getState('players') };
        const localPlayer = players[localPlayerId];
        
        if (localPlayer && input.type === 'move') {
            let newX = localPlayer.x;
            let newY = localPlayer.y;

            switch (input.direction) {
                case 'up': newY--; break;
                case 'down': newY++; break;
                case 'left': newX--; break;
                case 'right': newX++; break;
            }

            // Validate move (basic bounds checking)
            const gameMap = this.getState('gameMap');
            if (this.isValidMove(gameMap, newX, newY)) {
                localPlayer.x = newX;
                localPlayer.y = newY;
                this.setState('players', players);
                
                // Update positions
                this.handlePlayerMoved({
                    playerId: localPlayerId,
                    x: newX,
                    y: newY,
                    timestamp: Date.now()
                });
            }
        }

        // Clean up old predictions (keep last 100)
        if (this.localPredictions.size > 100) {
            const oldestKey = Math.min(...this.localPredictions.keys());
            this.localPredictions.delete(oldestKey);
        }
    }

    // Server reconciliation for position corrections
    reconcileServerUpdate(serverData) {
        if (!this.serverReconciliation) return;

        const localPlayerId = this.getState('localPlayerId');
        const serverPlayer = serverData.players && serverData.players[localPlayerId];
        
        if (serverPlayer) {
            const localPlayer = this.getState('players')[localPlayerId];
            
            // Check if server position differs from local prediction
            if (localPlayer && 
                (localPlayer.x !== serverPlayer.x || localPlayer.y !== serverPlayer.y)) {
                
                console.log('Server reconciliation needed', {
                    local: { x: localPlayer.x, y: localPlayer.y },
                    server: { x: serverPlayer.x, y: serverPlayer.y }
                });
                
                // Correct position to match server
                this.handlePlayerMoved({
                    playerId: localPlayerId,
                    x: serverPlayer.x,
                    y: serverPlayer.y
                });
            }
        }
    }

    // Game world handlers
    handleGameStateUpdate(gameData) {
        this.setState('lastServerUpdate', Date.now());
        
        if (gameData.players) {
            this.setState('players', gameData.players);
            
            // Update individual positions
            Object.entries(gameData.players).forEach(([playerId, player]) => {
                this.handlePlayerMoved({
                    playerId,
                    x: player.x,
                    y: player.y
                });
            });
        }
        
        if (gameData.bombs) {
            this.setState('bombs', gameData.bombs);
        }
        
        if (gameData.map) {
            this.setState('gameMap', gameData.map);
        }
        
        if (gameData.state) {
            this.setState('gameState', gameData.state);
        }

        // Perform server reconciliation
        this.reconcileServerUpdate(gameData);
    }

    handleBombPlaced(bomb) {
        const bombs = { ...this.getState('bombs') };
        bombs[bomb.id] = bomb;
        this.setState('bombs', bombs);
    }

    handleBombExploded({ bombId, explosions, map, players }) {
        // Remove bomb
        const bombs = { ...this.getState('bombs') };
        delete bombs[bombId];
        this.setState('bombs', bombs);
        
        // Update explosions (temporary visual effect)
        this.setState('explosions', explosions);
        
        // Clear explosions after animation
        setTimeout(() => {
            this.setState('explosions', []);
        }, 1000);
        
        // Update map and players
        if (map) this.setState('gameMap', map);
        if (players) this.setState('players', players);
    }

    // Chat handlers
    handleChatMessage(chatMessage) {
        const messages = [...this.getState('chatMessages')];
        messages.push({
            ...chatMessage,
            id: `msg_${Date.now()}_${Math.random()}`
        });
        
        // Keep only last 50 messages
        if (messages.length > 50) {
            messages.splice(0, messages.length - 50);
        }
        
        this.setState('chatMessages', messages);
    }

    addSystemChatMessage(message) {
        this.handleChatMessage({
            playerName: 'System',
            playerId: 'system',
            message: message,
            timestamp: new Date(),
            isSystem: true
        });
    }

    // Game state transition handlers
    handleGameStarted(data) {
        this.setState('gameState', 'playing');
        this.setState('gameTimer', 0);
        this.addSystemChatMessage('Game started! Good luck!');
    }

    handleGameEnded(data) {
        this.setState('gameState', 'finished');
        
        if (data.winner) {
            this.addSystemChatMessage(`Game over! ${data.winner.name} wins!`);
        } else {
            this.addSystemChatMessage('Game over!');
        }
    }

    // Utility methods
    isValidMove(gameMap, x, y) {
        if (!gameMap || !gameMap.length) return false;
        
        // Check bounds
        if (x < 0 || y < 0 || y >= gameMap.length || x >= gameMap[0].length) {
            return false;
        }
        
        // Check for walls (1 = wall, 2 = destructible block)
        return gameMap[y][x] === 0;
    }

    getLocalPlayer() {
        const localPlayerId = this.getState('localPlayerId');
        const players = this.getState('players');
        return localPlayerId ? players[localPlayerId] : null;
    }

    getOtherPlayers() {
        const localPlayerId = this.getState('localPlayerId');
        const players = this.getState('players');
        
        return Object.values(players).filter(player => player.id !== localPlayerId);
    }

    getAlivePlayers() {
        const players = this.getState('players');
        return Object.values(players).filter(player => player.lives > 0);
    }

    isGameInProgress() {
        const gameState = this.getState('gameState');
        return gameState === 'playing';
    }

    getNextInputSequence() {
        return ++this.inputSequence;
    }

    // Performance monitoring
    updatePerformanceMetrics(frameTime, latency) {
        const frameRate = Math.round(1000 / frameTime);
        this.setState('frameRate', frameRate);
        
        if (latency !== undefined) {
            this.setState('latency', latency);
        }
    }

    // Debug information
    getDebugInfo() {
        return {
            connectionState: this.getState('connectionState'),
            gameState: this.getState('gameState'),
            playersCount: Object.keys(this.getState('players')).length,
            bombsCount: Object.keys(this.getState('bombs')).length,
            latency: this.getState('latency'),
            frameRate: this.getState('frameRate'),
            predictionsCount: this.localPredictions.size,
            lastUpdate: this.getState('lastServerUpdate')
        };
    }
}