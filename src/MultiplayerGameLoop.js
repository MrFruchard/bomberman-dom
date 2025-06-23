
// Multiplayer game loop with client prediction and 60fps performance
export default class MultiplayerGameLoop {
    constructor(stateManager, wsClient) {
        this.stateManager = stateManager;
        this.wsClient = wsClient;
        
        // Performance tracking
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        this.fpsStartTime = 0;
        this.currentFPS = 60;
        
        // Game loop state
        this.isRunning = false;
        this.animationFrameId = null;
        
        // Input handling
        this.keys = {};
        this.lastInputSent = 0;
        this.inputBuffer = [];
        this.inputThrottle = 16; // ~60fps input rate
        
        // Client prediction
        this.serverUpdateRate = 20; // Server sends updates 20 times per second
        this.lastServerUpdate = 0;
        this.interpolationBuffer = [];
        this.maxBufferSize = 3; // Keep last 3 server states for interpolation
        
        // Performance monitoring
        this.performanceHistory = [];
        this.maxPerformanceHistory = 100;
        
        this.setupEventListeners();
        console.log('MultiplayerGameLoop initialized');
    }

    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Window focus/blur for performance optimization
        window.addEventListener('blur', this.handleWindowBlur.bind(this));
        window.addEventListener('focus', this.handleWindowFocus.bind(this));
        
        // WebSocket message handlers
        this.wsClient.on('gameState', this.handleServerGameState.bind(this));
        this.wsClient.on('playerMoved', this.handlePlayerMoved.bind(this));
        this.wsClient.on('bombPlaced', this.handleBombPlaced.bind(this));
        this.wsClient.on('bombExploded', this.handleBombExploded.bind(this));
    }

    start() {
        if (this.isRunning) {
            console.warn('Game loop already running');
            return;
        }
        
        console.log('Starting multiplayer game loop');
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.fpsStartTime = this.lastFrameTime;
        this.frameCount = 0;
        
        this.gameLoop();
    }

    stop() {
        console.log('Stopping multiplayer game loop');
        this.isRunning = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    gameLoop = (currentTime = performance.now()) => {
        if (!this.isRunning) return;
        
        // Calculate delta time
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Update FPS counter
        this.updateFPS(currentTime);
        
        // Performance tracking
        const frameStart = performance.now();
        
        try {
            // Update game state
            this.update(this.deltaTime);
            
            // Render game
            this.render(this.deltaTime);
            
            // Handle input
            this.processInput(currentTime);
            
            // Send queued network messages
            this.sendQueuedInputs(currentTime);
            
        } catch (error) {
            console.error('Error in game loop:', error);
        }
        
        // Performance monitoring
        const frameEnd = performance.now();
        this.trackPerformance(frameEnd - frameStart);
        
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        const gameState = this.stateManager.getState('gameState');
        
        if (gameState !== 'playing') {
            return;
        }
        
        // Update timers
        this.updateGameTimers(deltaTime);
        
        // Client-side prediction for local player
        this.updateLocalPlayerPrediction(deltaTime);
        
        // Interpolate other players' positions
        this.interpolatePlayerPositions(deltaTime);
        
        // Update bombs
        this.updateBombs(deltaTime);
        
        // Update explosions
        this.updateExplosions(deltaTime);
        
        // Check for collisions (client-side for immediate feedback)
        this.checkCollisions();
    }

    render(deltaTime) {
        // Trigger re-render of game components
        // The mini-framework will handle actual DOM updates
        this.stateManager.dispatch({
            type: 'FRAME_UPDATE',
            payload: { deltaTime, frameTime: this.deltaTime }
        });
    }

    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.fpsStartTime >= 1000) {
            this.currentFPS = Math.round((this.frameCount * 1000) / (currentTime - this.fpsStartTime));
            this.frameCount = 0;
            this.fpsStartTime = currentTime;
            
            // Update state manager
            this.stateManager.dispatch({
                type: 'UPDATE_FRAME_RATE',
                payload: this.currentFPS
            });
        }
    }

    updateGameTimers(deltaTime) {
        const gameTimer = this.stateManager.getState('gameTimer') || 0;
        this.stateManager.dispatch({
            type: 'UPDATE_GAME_TIMER',
            payload: gameTimer + deltaTime
        });
    }

    updateLocalPlayerPrediction(deltaTime) {
        const localPlayer = this.stateManager.getLocalPlayer();
        if (!localPlayer) return;
        
        // Apply any pending movements based on current input
        const movement = this.calculateMovement(deltaTime);
        if (movement.x !== 0 || movement.y !== 0) {
            this.predictLocalMovement(movement);
        }
    }

    calculateMovement(deltaTime) {
        const movement = { x: 0, y: 0 };
        const speed = 0.1; // Base movement speed (tiles per ms)
        const localPlayer = this.stateManager.getLocalPlayer();
        
        if (!localPlayer) return movement;
        
        // Apply speed power-up
        const actualSpeed = speed * (1 + localPlayer.powerUps.speed * 0.3);
        const distance = actualSpeed * deltaTime;
        
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            movement.y = -distance;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            movement.y = distance;
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            movement.x = -distance;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            movement.x = distance;
        }
        
        return movement;
    }

    predictLocalMovement(movement) {
        const localPlayer = this.stateManager.getLocalPlayer();
        if (!localPlayer) return;
        
        const newX = localPlayer.x + movement.x;
        const newY = localPlayer.y + movement.y;
        
        // Validate movement
        if (this.isValidPosition(newX, newY)) {
            // Apply prediction locally
            this.stateManager.dispatch({
                type: 'PLAYER_MOVED',
                payload: {
                    playerId: localPlayer.id,
                    x: newX,
                    y: newY,
                    timestamp: Date.now()
                }
            });
        }
    }

    interpolatePlayerPositions(deltaTime) {
        const players = this.stateManager.getState('players');
        const localPlayerId = this.stateManager.getState('localPlayerId');
        
        Object.values(players).forEach(player => {
            if (player.id === localPlayerId) return; // Skip local player
            
            // Interpolate position based on last known velocity and time
            const playerPositions = this.stateManager.getState('playerPositions');
            const lastPosition = playerPositions[player.id];
            
            if (lastPosition && lastPosition.timestamp) {
                const timeSinceUpdate = Date.now() - lastPosition.timestamp;
                
                // Simple linear interpolation (can be enhanced with velocity prediction)
                if (timeSinceUpdate < 500) { // Only interpolate for recent updates
                    // For now, just smooth transitions - more advanced prediction can be added
                    this.smoothPlayerPosition(player, lastPosition, deltaTime);
                }
            }
        });
    }

    smoothPlayerPosition(player, targetPosition, deltaTime) {
        const smoothingFactor = 0.1; // Adjust for smoother/more responsive movement
        
        const dx = targetPosition.x - player.x;
        const dy = targetPosition.y - player.y;
        
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
            const newX = player.x + dx * smoothingFactor;
            const newY = player.y + dy * smoothingFactor;
            
            this.stateManager.dispatch({
                type: 'PLAYER_MOVED',
                payload: {
                    playerId: player.id,
                    x: newX,
                    y: newY,
                    timestamp: Date.now()
                }
            });
        }
    }

    updateBombs(deltaTime) {
        const bombs = this.stateManager.getState('bombs');
        const now = Date.now();
        
        Object.values(bombs).forEach(bomb => {
            const timeLeft = 3000 - (now - (bomb.created || bomb.timestamp || now));
            if (timeLeft <= 0) {
                // Bomb should explode (server will handle the actual explosion)
                console.log('Bomb should explode:', bomb.id);
            }
        });
    }

    updateExplosions(deltaTime) {
        const explosions = this.stateManager.getState('explosions');
        if (explosions && explosions.length > 0) {
            // Explosions are handled by state manager timeout
            // This is just for any additional animation logic
        }
    }

    checkCollisions() {
        // Client-side collision detection for immediate feedback
        // Server will be authoritative, but this provides responsive feel
        const localPlayer = this.stateManager.getLocalPlayer();
        if (!localPlayer) return;
        
        // Check power-up collisions
        this.checkPowerUpCollisions(localPlayer);
        
        // Check explosion damage (for immediate visual feedback)
        this.checkExplosionCollisions(localPlayer);
    }

    checkPowerUpCollisions(player) {
        const powerUps = this.stateManager.getState('powerUps') || {};
        const playerTileX = Math.round(player.x);
        const playerTileY = Math.round(player.y);
        
        Object.values(powerUps).forEach(powerUp => {
            if (powerUp.x === playerTileX && powerUp.y === playerTileY) {
                // Send power-up collection to server
                this.wsClient.sendPlayerInput({
                    type: 'collectPowerUp',
                    powerUpId: powerUp.id,
                    x: powerUp.x,
                    y: powerUp.y
                });
            }
        });
    }

    checkExplosionCollisions(player) {
        const explosions = this.stateManager.getState('explosions') || [];
        const playerTileX = Math.round(player.x);
        const playerTileY = Math.round(player.y);
        
        explosions.forEach(explosion => {
            if (explosion.x === playerTileX && explosion.y === playerTileY) {
                // Player hit by explosion - visual feedback only
                // Server handles actual damage
                console.log('Player hit by explosion (client prediction)');
            }
        });
    }

    handleKeyDown(event) {
        this.keys[event.code] = true;
        
        // Handle special keys
        if (event.code === 'Space') {
            event.preventDefault();
            this.handleBombInput();
        }
        
        // Handle movement keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
            event.preventDefault();
        }
    }

    handleKeyUp(event) {
        this.keys[event.code] = false;
    }

    handleBombInput() {
        const localPlayer = this.stateManager.getLocalPlayer();
        if (!localPlayer || this.stateManager.getState('gameState') !== 'playing') {
            return;
        }
        
        // Send bomb placement input
        this.queueInput({
            type: 'bomb',
            x: Math.round(localPlayer.x),
            y: Math.round(localPlayer.y),
            timestamp: Date.now()
        });
    }

    processInput(currentTime) {
        // Throttle input processing to avoid spam
        if (currentTime - this.lastInputSent < this.inputThrottle) {
            return;
        }
        
        const movement = this.calculateMovement(this.inputThrottle);
        
        if (movement.x !== 0 || movement.y !== 0) {
            const direction = this.getDirectionFromMovement(movement);
            if (direction) {
                this.queueInput({
                    type: 'move',
                    direction: direction,
                    timestamp: currentTime
                });
            }
        }
    }

    getDirectionFromMovement(movement) {
        if (Math.abs(movement.x) > Math.abs(movement.y)) {
            return movement.x > 0 ? 'right' : 'left';
        } else if (movement.y !== 0) {
            return movement.y > 0 ? 'down' : 'up';
        }
        return null;
    }

    queueInput(input) {
        input.sequenceNumber = this.stateManager.getNextInputSequence();
        this.inputBuffer.push(input);
        
        // Apply prediction locally
        if (input.type === 'move') {
            this.stateManager.dispatch({
                type: 'PLAYER_INPUT_PREDICTION',
                payload: { input, sequenceNumber: input.sequenceNumber }
            });
        }
    }

    sendQueuedInputs(currentTime) {
        if (this.inputBuffer.length === 0) return;
        if (currentTime - this.lastInputSent < this.inputThrottle) return;
        
        // Send all queued inputs
        this.inputBuffer.forEach(input => {
            this.wsClient.sendPlayerInput(input);
        });
        
        this.inputBuffer = [];
        this.lastInputSent = currentTime;
    }

    isValidPosition(x, y) {
        const gameMap = this.stateManager.getState('gameMap');
        if (!gameMap || !gameMap.length) return false;
        
        const tileX = Math.round(x);
        const tileY = Math.round(y);
        
        // Check bounds
        if (tileX < 0 || tileY < 0 || tileY >= gameMap.length || tileX >= gameMap[0].length) {
            return false;
        }
        
        // Check for solid tiles
        return gameMap[tileY][tileX] === 0; // 0 = empty, 1 = wall, 2 = destructible
    }

    // WebSocket event handlers
    handleServerGameState(message) {
        const gameData = message.data;
        
        // Store server state for interpolation
        this.addToInterpolationBuffer({
            timestamp: Date.now(),
            players: gameData.players,
            bombs: gameData.bombs,
            map: gameData.map
        });
        
        // Update state manager
        this.stateManager.dispatch({
            type: 'GAME_STATE_UPDATE',
            payload: gameData
        });
        
        this.lastServerUpdate = Date.now();
        
        // Calculate latency
        if (message.timestamp) {
            const latency = Date.now() - message.timestamp;
            this.stateManager.dispatch({
                type: 'UPDATE_LATENCY',
                payload: latency
            });
        }
    }

    handlePlayerMoved(message) {
        this.stateManager.dispatch({
            type: 'PLAYER_MOVED',
            payload: message.data
        });
    }

    handleBombPlaced(message) {
        this.stateManager.dispatch({
            type: 'BOMB_PLACED',
            payload: message.data
        });
    }

    handleBombExploded(message) {
        this.stateManager.dispatch({
            type: 'BOMB_EXPLODED',
            payload: message.data
        });
    }

    addToInterpolationBuffer(serverState) {
        this.interpolationBuffer.push(serverState);
        
        // Keep only recent states
        if (this.interpolationBuffer.length > this.maxBufferSize) {
            this.interpolationBuffer.shift();
        }
    }

    trackPerformance(frameTime) {
        this.performanceHistory.push({
            frameTime,
            timestamp: Date.now()
        });
        
        if (this.performanceHistory.length > this.maxPerformanceHistory) {
            this.performanceHistory.shift();
        }
        
        // Update state manager with performance metrics
        this.stateManager.updatePerformanceMetrics(frameTime, this.stateManager.getState('latency'));
    }

    handleWindowBlur() {
        // Reduce performance when window is not focused
        console.log('Window blurred, reducing performance');
        this.keys = {}; // Clear all keys to prevent stuck keys
    }

    handleWindowFocus() {
        // Resume full performance when window is focused
        console.log('Window focused, resuming full performance');
    }

    // Debug and monitoring methods
    getPerformanceStats() {
        const recent = this.performanceHistory.slice(-30); // Last 30 frames
        const avgFrameTime = recent.reduce((sum, frame) => sum + frame.frameTime, 0) / recent.length;
        
        return {
            currentFPS: this.currentFPS,
            avgFrameTime: avgFrameTime,
            targetFPS: this.targetFPS,
            isRunning: this.isRunning,
            inputBufferSize: this.inputBuffer.length,
            interpolationBufferSize: this.interpolationBuffer.length,
            lastServerUpdate: Date.now() - this.lastServerUpdate
        };
    }

    getDebugInfo() {
        return {
            ...this.getPerformanceStats(),
            keys: Object.keys(this.keys).filter(key => this.keys[key]),
            stateManagerDebug: this.stateManager.getDebugInfo()
        };
    }
}