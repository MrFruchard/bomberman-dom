// Main game component with movement, bombs, and lives system
import { Component } from '../../mini-framework/core/Component.js';

export default class GameComponent extends Component {
    constructor(props = {}) {
        super(props);
        
        this.state = {
            gameMap: this.generateInitialMap(),
            localPlayerId: null,
            keysPressed: {},
            bombs: {},
            explosions: {},
            powerUps: {},
            lastUpdateTime: 0,
            gameStartTime: Date.now()
        };
        
        this.players = props.players || {};
        this.gameState = props.gameState || 'playing';
        this.onPlayerInput = props.onPlayerInput || (() => {});
        this.onToggleChat = props.onToggleChat || (() => {});
        
        this.TILE_SIZE = 32;
        this.MAP_WIDTH = 15;
        this.MAP_HEIGHT = 13;
        this.MOVE_SPEED = 4;
        this.BOMB_TIMER = 3000; // 3 seconds
        this.EXPLOSION_DURATION = 1000; // 1 second
        
        this.setupKeyboardHandlers();
        this.startGameLoop();
    }
    
    generateInitialMap() {
        const map = [];
        
        // Create empty map
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            map[y] = [];
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                map[y][x] = 0; // 0 = empty, 1 = wall, 2 = destructible block
            }
        }
        
        // Place walls (indestructible)
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                // Border walls
                if (x === 0 || x === this.MAP_WIDTH - 1 || y === 0 || y === this.MAP_HEIGHT - 1) {
                    map[y][x] = 1;
                }
                // Inner walls (grid pattern)
                else if (x % 2 === 0 && y % 2 === 0) {
                    map[y][x] = 1;
                }
            }
        }
        
        // Place destructible blocks randomly
        for (let y = 1; y < this.MAP_HEIGHT - 1; y++) {
            for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                if (map[y][x] === 0) {
                    // Don't place blocks in starting positions (corners)
                    const isStartingArea = this.isStartingArea(x, y);
                    
                    if (!isStartingArea && Math.random() < 0.7) {
                        map[y][x] = 2; // Destructible block
                    }
                }
            }
        }
        
        return map;
    }
    
    isStartingArea(x, y) {
        // 3x3 area around each corner
        const corners = [
            { x: 1, y: 1 }, // Top-left
            { x: this.MAP_WIDTH - 2, y: 1 }, // Top-right
            { x: 1, y: this.MAP_HEIGHT - 2 }, // Bottom-left
            { x: this.MAP_WIDTH - 2, y: this.MAP_HEIGHT - 2 } // Bottom-right
        ];
        
        return corners.some(corner => 
            Math.abs(x - corner.x) <= 1 && Math.abs(y - corner.y) <= 1
        );
    }
    
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            this.state.keysPressed[e.key] = true;
            
            // Handle bomb placement
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                this.placeBomb();
            }
            
            // Handle chat toggle
            if (e.key === 'Enter') {
                this.onToggleChat();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.state.keysPressed[e.key] = false;
        });
    }
    
    startGameLoop() {
        const gameLoop = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - this.state.lastUpdateTime;
            
            if (deltaTime >= 16) { // Target 60 FPS
                this.updateGame(deltaTime);
                this.state.lastUpdateTime = currentTime;
                this.update();
            }
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    updateGame(deltaTime) {
        this.handleMovement();
        this.updateBombs();
        this.updateExplosions();
        this.checkCollisions();
    }
    
    handleMovement() {
        if (!this.state.localPlayerId) return;
        
        const player = this.players[this.state.localPlayerId];
        if (!player || player.lives <= 0) return;
        
        let newX = player.x;
        let newY = player.y;
        let moved = false;
        
        const speed = this.MOVE_SPEED + (player.powerUps?.speed || 0);
        
        // Handle movement
        if (this.state.keysPressed['ArrowLeft'] || this.state.keysPressed['a']) {
            newX = Math.max(0, newX - speed);
            moved = true;
        }
        if (this.state.keysPressed['ArrowRight'] || this.state.keysPressed['d']) {
            newX = Math.min((this.MAP_WIDTH - 1) * this.TILE_SIZE, newX + speed);
            moved = true;
        }
        if (this.state.keysPressed['ArrowUp'] || this.state.keysPressed['w']) {
            newY = Math.max(0, newY - speed);
            moved = true;
        }
        if (this.state.keysPressed['ArrowDown'] || this.state.keysPressed['s']) {
            newY = Math.min((this.MAP_HEIGHT - 1) * this.TILE_SIZE, newY + speed);
            moved = true;
        }
        
        // Check collision with walls and blocks
        if (moved && this.canMoveTo(newX, newY)) {
            this.onPlayerInput({
                type: 'move',
                x: newX,
                y: newY
            });
        }
    }
    
    canMoveTo(x, y) {
        const tileX = Math.floor(x / this.TILE_SIZE);
        const tileY = Math.floor(y / this.TILE_SIZE);
        
        // Check bounds
        if (tileX < 0 || tileX >= this.MAP_WIDTH || tileY < 0 || tileY >= this.MAP_HEIGHT) {
            return false;
        }
        
        // Check walls and blocks
        if (this.state.gameMap[tileY] && this.state.gameMap[tileY][tileX] > 0) {
            return false;
        }
        
        // Check bombs (unless player has bomb pass power-up)
        const player = this.players[this.state.localPlayerId];
        if (!player?.powerUps?.bombPass) {
            for (const bombId in this.state.bombs) {
                const bomb = this.state.bombs[bombId];
                const bombTileX = Math.floor(bomb.x / this.TILE_SIZE);
                const bombTileY = Math.floor(bomb.y / this.TILE_SIZE);
                
                if (tileX === bombTileX && tileY === bombTileY) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    placeBomb() {
        if (!this.state.localPlayerId) return;
        
        const player = this.players[this.state.localPlayerId];
        if (!player || player.lives <= 0) return;
        
        const tileX = Math.floor(player.x / this.TILE_SIZE);
        const tileY = Math.floor(player.y / this.TILE_SIZE);
        
        // Check if there's already a bomb at this position
        for (const bombId in this.state.bombs) {
            const bomb = this.state.bombs[bombId];
            const bombTileX = Math.floor(bomb.x / this.TILE_SIZE);
            const bombTileY = Math.floor(bomb.y / this.TILE_SIZE);
            
            if (tileX === bombTileX && tileY === bombTileY) {
                return; // Can't place bomb here
            }
        }
        
        // Check bomb limit
        const playerBombs = Object.values(this.state.bombs).filter(bomb => bomb.playerId === this.state.localPlayerId);
        const maxBombs = 1 + (player.powerUps?.bombs || 0);
        
        if (playerBombs.length >= maxBombs) {
            return; // Too many bombs
        }
        
        this.onPlayerInput({
            type: 'bomb',
            x: tileX * this.TILE_SIZE,
            y: tileY * this.TILE_SIZE
        });
    }
    
    updateBombs() {
        const currentTime = Date.now();
        
        for (const bombId in this.state.bombs) {
            const bomb = this.state.bombs[bombId];
            
            if (currentTime - bomb.placedTime >= this.BOMB_TIMER) {
                this.explodeBomb(bombId);
            }
        }
    }
    
    explodeBomb(bombId) {
        const bomb = this.state.bombs[bombId];
        if (!bomb) return;
        
        const tileX = Math.floor(bomb.x / this.TILE_SIZE);
        const tileY = Math.floor(bomb.y / this.TILE_SIZE);
        
        const player = this.players[bomb.playerId];
        const explosionRange = 1 + (player?.powerUps?.flames || 0);
        
        const explosionTiles = [];
        
        // Center explosion
        explosionTiles.push({ x: tileX, y: tileY });
        
        // Four directions
        const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }, // Left
            { dx: 1, dy: 0 }   // Right
        ];
        
        directions.forEach(dir => {
            for (let i = 1; i <= explosionRange; i++) {
                const newX = tileX + dir.dx * i;
                const newY = tileY + dir.dy * i;
                
                // Check bounds
                if (newX < 0 || newX >= this.MAP_WIDTH || newY < 0 || newY >= this.MAP_HEIGHT) {
                    break;
                }
                
                // Check for walls
                if (this.state.gameMap[newY][newX] === 1) {
                    break; // Wall blocks explosion
                }
                
                explosionTiles.push({ x: newX, y: newY });
                
                // Check for destructible blocks
                if (this.state.gameMap[newY][newX] === 2) {
                    this.destroyBlock(newX, newY);
                    break; // Block stops explosion
                }
            }
        });
        
        // Create explosion
        this.state.explosions[bombId] = {
            tiles: explosionTiles,
            startTime: Date.now(),
            duration: this.EXPLOSION_DURATION
        };
        
        // Remove bomb
        delete this.state.bombs[bombId];
        
        // Check for player damage
        this.checkExplosionDamage(explosionTiles);
    }
    
    destroyBlock(x, y) {
        // Remove block from map
        this.state.gameMap[y][x] = 0;
        
        // Maybe spawn power-up
        if (Math.random() < 0.3) {
            const powerUpTypes = ['bombs', 'flames', 'speed'];
            const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            this.state.powerUps[`${x}_${y}`] = {
                type: powerUpType,
                x: x * this.TILE_SIZE,
                y: y * this.TILE_SIZE
            };
        }
    }
    
    checkExplosionDamage(explosionTiles) {
        // Check if any players are in the explosion
        for (const playerId in this.players) {
            const player = this.players[playerId];
            if (player.lives <= 0) continue;
            
            const playerTileX = Math.floor(player.x / this.TILE_SIZE);
            const playerTileY = Math.floor(player.y / this.TILE_SIZE);
            
            if (explosionTiles.some(tile => tile.x === playerTileX && tile.y === playerTileY)) {
                this.onPlayerInput({
                    type: 'damage',
                    playerId: playerId,
                    damage: 1
                });
            }
        }
    }
    
    updateExplosions() {
        const currentTime = Date.now();
        
        for (const explosionId in this.state.explosions) {
            const explosion = this.state.explosions[explosionId];
            
            if (currentTime - explosion.startTime >= explosion.duration) {
                delete this.state.explosions[explosionId];
            }
        }
    }
    
    checkCollisions() {
        if (!this.state.localPlayerId) return;
        
        const player = this.players[this.state.localPlayerId];
        if (!player || player.lives <= 0) return;
        
        const playerTileX = Math.floor(player.x / this.TILE_SIZE);
        const playerTileY = Math.floor(player.y / this.TILE_SIZE);
        
        // Check power-up collision
        for (const powerUpId in this.state.powerUps) {
            const powerUp = this.state.powerUps[powerUpId];
            const powerUpTileX = Math.floor(powerUp.x / this.TILE_SIZE);
            const powerUpTileY = Math.floor(powerUp.y / this.TILE_SIZE);
            
            if (playerTileX === powerUpTileX && playerTileY === powerUpTileY) {
                this.onPlayerInput({
                    type: 'powerUp',
                    powerUpType: powerUp.type,
                    powerUpId: powerUpId
                });
                
                delete this.state.powerUps[powerUpId];
            }
        }
    }
    
    render() {
        return this.h('div', { class: 'game-container' },
            this.h('div', { class: 'game-area' },
                this.renderMap(),
                this.renderPlayers(),
                this.renderBombs(),
                this.renderExplosions(),
                this.renderPowerUps()
            ),
            this.renderUI()
        );
    }
    
    renderMap() {
        const mapElements = [];
        
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const tileType = this.state.gameMap[y][x];
                let tileClass = 'tile';
                
                switch (tileType) {
                    case 1:
                        tileClass += ' wall';
                        break;
                    case 2:
                        tileClass += ' block';
                        break;
                    default:
                        tileClass += ' empty';
                }
                
                mapElements.push(
                    this.h('div', {
                        class: tileClass,
                        key: `tile-${x}-${y}`,
                        style: `
                            left: ${x * this.TILE_SIZE}px;
                            top: ${y * this.TILE_SIZE}px;
                            width: ${this.TILE_SIZE}px;
                            height: ${this.TILE_SIZE}px;
                        `
                    })
                );
            }
        }
        
        return this.h('div', { class: 'game-map' }, ...mapElements);
    }
    
    renderPlayers() {
        const playerElements = [];
        
        for (const playerId in this.players) {
            const player = this.players[playerId];
            if (player.lives <= 0) continue;
            
            const isLocal = playerId === this.state.localPlayerId;
            
            playerElements.push(
                this.h('div', {
                    class: `player ${isLocal ? 'local' : 'remote'}`,
                    key: `player-${playerId}`,
                    style: `
                        left: ${player.x}px;
                        top: ${player.y}px;
                        width: ${this.TILE_SIZE}px;
                        height: ${this.TILE_SIZE}px;
                    `
                },
                    this.h('div', { class: 'player-name' }, player.name),
                    this.h('div', { class: 'player-lives' }, `❤️ ${player.lives}`)
                )
            );
        }
        
        return playerElements;
    }
    
    renderBombs() {
        const bombElements = [];
        
        for (const bombId in this.state.bombs) {
            const bomb = this.state.bombs[bombId];
            const timeLeft = this.BOMB_TIMER - (Date.now() - bomb.placedTime);
            const flashClass = timeLeft < 1000 ? 'flashing' : '';
            
            bombElements.push(
                this.h('div', {
                    class: `bomb ${flashClass}`,
                    key: `bomb-${bombId}`,
                    style: `
                        left: ${bomb.x}px;
                        top: ${bomb.y}px;
                        width: ${this.TILE_SIZE}px;
                        height: ${this.TILE_SIZE}px;
                    `
                }, '💣')
            );
        }
        
        return bombElements;
    }
    
    renderExplosions() {
        const explosionElements = [];
        
        for (const explosionId in this.state.explosions) {
            const explosion = this.state.explosions[explosionId];
            
            explosion.tiles.forEach((tile, index) => {
                explosionElements.push(
                    this.h('div', {
                        class: 'explosion',
                        key: `explosion-${explosionId}-${index}`,
                        style: `
                            left: ${tile.x * this.TILE_SIZE}px;
                            top: ${tile.y * this.TILE_SIZE}px;
                            width: ${this.TILE_SIZE}px;
                            height: ${this.TILE_SIZE}px;
                        `
                    }, '💥')
                );
            });
        }
        
        return explosionElements;
    }
    
    renderPowerUps() {
        const powerUpElements = [];
        
        for (const powerUpId in this.state.powerUps) {
            const powerUp = this.state.powerUps[powerUpId];
            let icon = '⚡';
            
            switch (powerUp.type) {
                case 'bombs':
                    icon = '💣';
                    break;
                case 'flames':
                    icon = '🔥';
                    break;
                case 'speed':
                    icon = '⚡';
                    break;
            }
            
            powerUpElements.push(
                this.h('div', {
                    class: 'power-up',
                    key: `powerup-${powerUpId}`,
                    style: `
                        left: ${powerUp.x}px;
                        top: ${powerUp.y}px;
                        width: ${this.TILE_SIZE}px;
                        height: ${this.TILE_SIZE}px;
                    `
                }, icon)
            );
        }
        
        return powerUpElements;
    }
    
    renderUI() {
        const localPlayer = this.players[this.state.localPlayerId];
        
        return this.h('div', { class: 'game-ui' },
            this.h('div', { class: 'player-stats' },
                localPlayer ? this.h('div', { class: 'local-player-stats' },
                    this.h('span', { class: 'player-name' }, localPlayer.name),
                    this.h('span', { class: 'lives' }, `❤️ ${localPlayer.lives}`),
                    this.h('div', { class: 'power-ups' },
                        this.h('span', {}, `💣 ${1 + (localPlayer.powerUps?.bombs || 0)}`),
                        this.h('span', {}, `🔥 ${1 + (localPlayer.powerUps?.flames || 0)}`),
                        this.h('span', {}, `⚡ ${1 + (localPlayer.powerUps?.speed || 0)}`)
                    )
                ) : null
            ),
            
            this.h('div', { class: 'game-controls' },
                this.h('div', { class: 'controls-info' },
                    this.h('span', {}, 'Arrow keys: Move'),
                    this.h('span', {}, 'Space: Bomb'),
                    this.h('span', {}, 'Enter: Chat')
                )
            ),
            
            this.h('div', { class: 'players-list' },
                this.h('h3', {}, 'Players'),
                ...Object.values(this.players).map(player => 
                    this.h('div', { 
                        class: `player-item ${player.lives <= 0 ? 'dead' : ''}`,
                        key: player.id 
                    },
                        this.h('span', { class: 'name' }, player.name),
                        this.h('span', { class: 'lives' }, `❤️ ${player.lives}`)
                    )
                )
            )
        );
    }
}