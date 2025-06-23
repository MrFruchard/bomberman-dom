// Main multiplayer game component supporting 2-4 players with 3 lives each
import { Component } from '../../mini-framework/core/Component.js';

export default class MultiplayerGameComponent extends Component {
    constructor(props = {}) {
        super(props);
        
        this.state = {
            renderScale: 1,
            debugMode: false,
            showHUD: true,
            gameStarted: false,
            gameEnded: false,
            winner: null
        };
        
        this.stateManager = props.stateManager;
        this.wsClient = props.wsClient;
        this.gameLoop = props.gameLoop;
        
        // Game rendering constants
        this.TILE_SIZE = 32;
        this.MAP_WIDTH = 15;
        this.MAP_HEIGHT = 13;
        
        this.setupSubscriptions();
    }

    setupSubscriptions() {
        // Subscribe to game state changes
        this.stateManager.subscribe('gameState', (gameState) => {
            if (gameState === 'playing' && !this.state.gameStarted) {
                this.setState({ gameStarted: true, gameEnded: false, winner: null });
                this.startGame();
            } else if (gameState === 'finished' && !this.state.gameEnded) {
                this.setState({ gameEnded: true });
                this.endGame();
            }
            this.update();
        });
        
        // Subscribe to player changes
        this.stateManager.subscribe('players', () => {
            this.update();
        });
        
        // Subscribe to game world changes
        this.stateManager.subscribe('gameMap', () => {
            this.update();
        });
        
        this.stateManager.subscribe('bombs', () => {
            this.update();
        });
        
        this.stateManager.subscribe('explosions', () => {
            this.update();
        });
        
        // Subscribe to game end event
        this.stateManager.subscribe('gameEnded', (data) => {
            this.setState({ winner: data.winner });
        });
    }

    afterMount() {
        // Set up debug toggle
        this.addEventListener(document, 'keydown', this.handleDebugKeys);
        
        // Handle window resize
        this.addEventListener(window, 'resize', this.handleResize);
        
        // Initial resize
        this.handleResize();
    }

    beforeUnmount() {
        this.stopGame();
    }

    startGame() {
        console.log('Starting multiplayer game');
        
        // Start the game loop if not already running
        if (this.gameLoop && !this.gameLoop.isRunning) {
            this.gameLoop.start();
        }
        
        // Add game start message
        this.stateManager.addSystemChatMessage('Game started! Use WASD or arrow keys to move, SPACE to place bombs');
    }

    endGame() {
        console.log('Ending multiplayer game');
        
        // Stop the game loop
        if (this.gameLoop && this.gameLoop.isRunning) {
            this.gameLoop.stop();
        }
    }

    stopGame() {
        if (this.gameLoop && this.gameLoop.isRunning) {
            this.gameLoop.stop();
        }
    }

    handleDebugKeys = (e) => {
        if (e.key === 'F1') {
            e.preventDefault();
            this.setState({ debugMode: !this.state.debugMode });
        } else if (e.key === 'F2') {
            e.preventDefault();
            this.setState({ showHUD: !this.state.showHUD });
        }
    }

    handleResize = () => {
        // Calculate scale based on window size
        const gameContainer = this.find('.game-container');
        if (gameContainer) {
            const containerWidth = gameContainer.clientWidth;
            const containerHeight = gameContainer.clientHeight;
            
            const gameWidth = this.MAP_WIDTH * this.TILE_SIZE;
            const gameHeight = this.MAP_HEIGHT * this.TILE_SIZE;
            
            const scaleX = containerWidth / gameWidth;
            const scaleY = containerHeight / gameHeight;
            
            this.setState({ renderScale: Math.min(scaleX, scaleY, 2) });
        }
    }

    render() {
        const gameState = this.stateManager.getState('gameState');
        
        if (gameState !== 'playing' && gameState !== 'finished') {
            return this.h('div', { class: 'game-placeholder' },
                this.h('p', {}, 'Waiting for game to start...')
            );
        }
        
        return this.h('div', { class: 'multiplayer-game' },
            // Main game area
            this.h('div', { 
                class: 'game-container',
                style: `transform: scale(${this.state.renderScale})`
            },
                this.renderGameWorld()
            ),
            
            // HUD overlay
            this.state.showHUD ? this.renderHUD() : null,
            
            // Debug info
            this.state.debugMode ? this.renderDebugInfo() : null,
            
            // Game over overlay
            this.state.gameEnded ? this.renderGameOverlay() : null
        );
    }

    renderGameWorld() {
        const gameMap = this.stateManager.getState('gameMap') || [];
        const players = this.stateManager.getState('players') || {};
        const bombs = this.stateManager.getState('bombs') || {};
        const explosions = this.stateManager.getState('explosions') || [];
        
        return this.h('div', { 
            class: 'game-world',
            style: `width: ${this.MAP_WIDTH * this.TILE_SIZE}px; height: ${this.MAP_HEIGHT * this.TILE_SIZE}px`
        },
            // Render map
            this.renderMap(gameMap),
            
            // Render bombs
            this.renderBombs(bombs),
            
            // Render explosions
            this.renderExplosions(explosions),
            
            // Render players
            this.renderPlayers(players)
        );
    }

    renderMap(gameMap) {
        if (!gameMap.length) return null;
        
        const tiles = [];
        
        for (let y = 0; y < gameMap.length; y++) {
            for (let x = 0; x < gameMap[y].length; x++) {
                const tileType = gameMap[y][x];
                let tileClass = 'tile';
                
                switch (tileType) {
                    case 0: tileClass += ' empty'; break;
                    case 1: tileClass += ' wall'; break;
                    case 2: tileClass += ' destructible'; break;
                    default: tileClass += ' empty';
                }
                
                tiles.push(this.h('div', {
                    class: tileClass,
                    style: `left: ${x * this.TILE_SIZE}px; top: ${y * this.TILE_SIZE}px; width: ${this.TILE_SIZE}px; height: ${this.TILE_SIZE}px`,
                    key: `tile_${x}_${y}`
                }));
            }
        }
        
        return this.h('div', { class: 'game-map' }, ...tiles);
    }

    renderPlayers(players) {
        const localPlayerId = this.stateManager.getState('localPlayerId');
        
        return this.h('div', { class: 'players-layer' },
            ...Object.values(players).map(player => {
                const isLocal = player.id === localPlayerId;
                const isAlive = player.lives > 0;
                
                return this.h('div', {
                    class: `player ${isLocal ? 'local-player' : 'remote-player'} ${!isAlive ? 'dead' : ''}`,
                    style: `left: ${player.x * this.TILE_SIZE}px; top: ${player.y * this.TILE_SIZE}px; width: ${this.TILE_SIZE}px; height: ${this.TILE_SIZE}px`,
                    key: player.id
                },
                    // Player sprite/avatar
                    this.h('div', { class: 'player-sprite' }),
                    
                    // Player name
                    this.h('div', { class: 'player-name' }, player.name),
                    
                    // Lives indicator
                    this.h('div', { class: 'player-lives' },
                        Array.from({ length: player.lives }, (_, i) => 
                            this.h('span', { class: 'life-indicator', key: i }, '♥')
                        )
                    )
                );
            })
        );
    }

    renderBombs(bombs) {
        return this.h('div', { class: 'bombs-layer' },
            ...Object.values(bombs).map(bomb => {
                const timeLeft = 3000 - (Date.now() - (bomb.created || bomb.timestamp || Date.now()));
                const pulseClass = timeLeft < 1000 ? 'pulsing' : '';
                
                return this.h('div', {
                    class: `bomb ${pulseClass}`,
                    style: `left: ${bomb.x * this.TILE_SIZE}px; top: ${bomb.y * this.TILE_SIZE}px; width: ${this.TILE_SIZE}px; height: ${this.TILE_SIZE}px`,
                    key: bomb.id
                },
                    this.h('div', { class: 'bomb-sprite' }, '💣'),
                    this.h('div', { class: 'bomb-timer' }, Math.ceil(timeLeft / 1000))
                );
            })
        );
    }

    renderExplosions(explosions) {
        if (!explosions.length) return null;
        
        return this.h('div', { class: 'explosions-layer' },
            ...explosions.map((explosion, index) => 
                this.h('div', {
                    class: 'explosion',
                    style: `left: ${explosion[0] * this.TILE_SIZE}px; top: ${explosion[1] * this.TILE_SIZE}px; width: ${this.TILE_SIZE}px; height: ${this.TILE_SIZE}px`,
                    key: `explosion_${index}`
                },
                    this.h('div', { class: 'explosion-sprite' }, '💥')
                )
            )
        );
    }

    renderHUD() {
        const localPlayer = this.stateManager.getLocalPlayer();
        const players = this.stateManager.getState('players') || {};
        const gameTimer = this.stateManager.getState('gameTimer') || 0;
        const connectionState = this.stateManager.getState('connectionState');
        const latency = this.stateManager.getState('latency') || 0;
        const frameRate = this.stateManager.getState('frameRate') || 0;
        
        return this.h('div', { class: 'game-hud' },
            // Top bar
            this.h('div', { class: 'hud-top' },
                // Local player info
                localPlayer ? this.h('div', { class: 'local-player-info' },
                    this.h('span', { class: 'player-name' }, localPlayer.name),
                    this.h('div', { class: 'player-stats' },
                        this.h('span', { class: 'lives' }, `Lives: ${localPlayer.lives}`),
                        this.h('span', { class: 'score' }, `Score: ${localPlayer.score}`),
                        this.h('span', { class: 'bombs' }, `Bombs: ${1 + localPlayer.powerUps.bombs}`),
                        this.h('span', { class: 'flames' }, `Range: ${2 + localPlayer.powerUps.flames}`),
                        this.h('span', { class: 'speed' }, `Speed: ${localPlayer.powerUps.speed}`)
                    )
                ) : null,
                
                // Game timer
                this.h('div', { class: 'game-timer' },
                    this.formatGameTime(gameTimer)
                ),
                
                // Connection info
                this.h('div', { class: 'connection-info' },
                    this.h('span', { class: `connection-status ${connectionState}` }, 
                        connectionState.toUpperCase()
                    ),
                    this.h('span', { class: 'latency' }, `${latency}ms`),
                    this.h('span', { class: 'fps' }, `${frameRate}fps`)
                )
            ),
            
            // Player list (side)
            this.h('div', { class: 'hud-players' },
                this.h('h3', {}, 'Players'),
                this.h('div', { class: 'players-list' },
                    ...Object.values(players).map(player => 
                        this.h('div', { 
                            class: `player-item ${player.lives <= 0 ? 'eliminated' : ''}`,
                            key: player.id 
                        },
                            this.h('span', { class: 'player-name' }, player.name),
                            this.h('span', { class: 'player-lives' }, 
                                player.lives > 0 ? `${player.lives}♥` : 'OUT'
                            ),
                            this.h('span', { class: 'player-score' }, player.score)
                        )
                    )
                )
            ),
            
            // Controls help
            this.h('div', { class: 'hud-controls' },
                this.h('div', { class: 'controls-help' },
                    this.h('span', {}, 'WASD/Arrows: Move'),
                    this.h('span', {}, 'SPACE: Bomb'),
                    this.h('span', {}, 'F1: Debug'),
                    this.h('span', {}, 'Enter: Chat')
                )
            )
        );
    }

    renderGameOverlay() {
        const winner = this.state.winner;
        const localPlayer = this.stateManager.getLocalPlayer();
        const isWinner = winner && localPlayer && winner.id === localPlayer.id;
        
        return this.h('div', { class: 'game-overlay' },
            this.h('div', { class: 'overlay-content' },
                this.h('h1', { class: isWinner ? 'victory' : 'defeat' },
                    isWinner ? 'VICTORY!' : 'GAME OVER'
                ),
                
                winner ? this.h('p', { class: 'winner-info' },
                    `${winner.name} wins!`
                ) : this.h('p', {}, 'No winner'),
                
                // Final scores
                this.renderFinalScores(),
                
                // Actions
                this.h('div', { class: 'overlay-actions' },
                    this.h('button', {
                        onclick: this.handlePlayAgain
                    }, 'Play Again'),
                    this.h('button', {
                        onclick: this.handleReturnToLobby
                    }, 'Return to Lobby')
                )
            )
        );
    }

    renderFinalScores() {
        const players = Object.values(this.stateManager.getState('players') || {});
        const sortedPlayers = players.sort((a, b) => b.score - a.score);
        
        return this.h('div', { class: 'final-scores' },
            this.h('h3', {}, 'Final Scores'),
            this.h('table', { class: 'scores-table' },
                this.h('thead', {},
                    this.h('tr', {},
                        this.h('th', {}, 'Rank'),
                        this.h('th', {}, 'Player'),
                        this.h('th', {}, 'Score'),
                        this.h('th', {}, 'Status')
                    )
                ),
                this.h('tbody', {},
                    ...sortedPlayers.map((player, index) =>
                        this.h('tr', { 
                            class: player.id === this.stateManager.getState('localPlayerId') ? 'local-player' : '',
                            key: player.id 
                        },
                            this.h('td', {}, `#${index + 1}`),
                            this.h('td', {}, player.name),
                            this.h('td', {}, player.score),
                            this.h('td', {}, player.lives > 0 ? 'Survived' : 'Eliminated')
                        )
                    )
                )
            )
        );
    }

    renderDebugInfo() {
        const debugInfo = this.gameLoop ? this.gameLoop.getDebugInfo() : {};
        const stateDebug = this.stateManager.getDebugInfo();
        
        return this.h('div', { class: 'debug-overlay' },
            this.h('div', { class: 'debug-section' },
                this.h('h4', {}, 'Performance'),
                this.h('div', {}, `FPS: ${debugInfo.currentFPS || 0}`),
                this.h('div', {}, `Frame Time: ${debugInfo.avgFrameTime?.toFixed(2) || 0}ms`),
                this.h('div', {}, `Input Buffer: ${debugInfo.inputBufferSize || 0}`),
                this.h('div', {}, `Interpolation Buffer: ${debugInfo.interpolationBufferSize || 0}`)
            ),
            
            this.h('div', { class: 'debug-section' },
                this.h('h4', {}, 'Network'),
                this.h('div', {}, `Latency: ${stateDebug.latency || 0}ms`),
                this.h('div', {}, `Connection: ${stateDebug.connectionState}`),
                this.h('div', {}, `Last Update: ${debugInfo.lastServerUpdate || 0}ms ago`),
                this.h('div', {}, `Predictions: ${stateDebug.predictionsCount || 0}`)
            ),
            
            this.h('div', { class: 'debug-section' },
                this.h('h4', {}, 'Game State'),
                this.h('div', {}, `State: ${stateDebug.gameState}`),
                this.h('div', {}, `Players: ${stateDebug.playersCount || 0}`),
                this.h('div', {}, `Bombs: ${stateDebug.bombsCount || 0}`),
                this.h('div', {}, `Active Keys: ${debugInfo.keys?.join(', ') || 'none'}`)
            )
        );
    }

    handlePlayAgain = () => {
        // Request new game (implementation depends on game flow)
        console.log('Play again requested');
        this.stateManager.addSystemChatMessage('Play again functionality not yet implemented');
    }

    handleReturnToLobby = () => {
        // Disconnect and return to lobby
        this.wsClient.disconnect();
        this.stateManager.dispatch({ type: 'LEAVE_ROOM' });
    }

    formatGameTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}