// Waiting room component with player counter and timers
import { Component } from '../../mini-framework/core/Component.js';

export default class WaitingRoomComponent extends Component {
    constructor(props = {}) {
        super(props);
        
        this.currentRoom = props.currentRoom || {};
        this.players = props.players || {};
        this.gameState = props.gameState || 'lobby';
        this.countdownTimer = props.countdownTimer || 0;
        this.waitTimer = props.waitTimer || 0;
        this.onLeaveRoom = props.onLeaveRoom || (() => {});
        this.onToggleChat = props.onToggleChat || (() => {});
        
        this.state = {
            showRules: false
        };
    }
    
    afterMount() {
        // Set up event listeners
        this.addEventListener('.leave-room-btn', 'click', () => {
            this.onLeaveRoom();
        });
        
        this.addEventListener('.toggle-chat-btn', 'click', () => {
            this.onToggleChat();
        });
        
        this.addEventListener('.toggle-rules-btn', 'click', () => {
            this.setState({ showRules: !this.state.showRules });
        });
        
        // Set up keyboard shortcuts
        this.addEventListener(document, 'keydown', (e) => {
            if (e.key === 'Enter') {
                this.onToggleChat();
            }
        });
    }
    
    beforeUnmount() {
        // Clean up any intervals if we had them
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
    
    formatTime(seconds) {
        return Math.ceil(seconds / 1000);
    }
    
    getPlayerCount() {
        return Object.keys(this.players).length;
    }
    
    getMaxPlayers() {
        return this.currentRoom.maxPlayers || 4;
    }
    
    getGameStatusText() {
        const playerCount = this.getPlayerCount();
        const maxPlayers = this.getMaxPlayers();
        
        if (this.gameState === 'countdown') {
            return `Game starting in ${this.formatTime(this.countdownTimer)} seconds!`;
        }
        
        if (playerCount < 2) {
            return 'Waiting for more players to join...';
        }
        
        if (playerCount >= maxPlayers) {
            return 'Room is full! Game will start soon...';
        }
        
        if (this.waitTimer > 0) {
            return `Game will start in ${this.formatTime(this.waitTimer)} seconds if no one else joins`;
        }
        
        return `Waiting for ${maxPlayers - playerCount} more players or 20 seconds...`;
    }
    
    render() {
        const playerCount = this.getPlayerCount();
        const maxPlayers = this.getMaxPlayers();
        const playerList = Object.values(this.players);
        
        return this.h('div', { class: 'waiting-room' },
            // Header
            this.h('div', { class: 'waiting-header' },
                this.h('h1', {}, '🎮 Waiting Room'),
                this.h('p', { class: 'room-info' }, `Room: ${this.currentRoom.id || 'Unknown'}`)
            ),
            
            // Player counter with visual progress
            this.h('div', { class: 'player-counter-section' },
                this.h('h2', { class: 'player-counter-title' }, 'Players'),
                this.h('div', { class: 'player-counter-display' },
                    this.h('div', { class: 'counter-number' }, `${playerCount}/${maxPlayers}`),
                    this.h('div', { class: 'counter-progress' },
                        this.h('div', { 
                            class: 'progress-bar',
                            style: `width: ${(playerCount / maxPlayers) * 100}%`
                        })
                    )
                )
            ),
            
            // Game status and timers
            this.h('div', { class: 'game-status-section' },
                this.h('div', { class: `status-message ${this.gameState}` },
                    this.h('span', { class: 'status-icon' }, 
                        this.gameState === 'countdown' ? '⏰' : '⏳'
                    ),
                    this.h('span', { class: 'status-text' }, this.getGameStatusText())
                ),
                
                // Countdown timer display
                this.gameState === 'countdown' ? this.h('div', { class: 'countdown-display' },
                    this.h('div', { class: 'countdown-circle' },
                        this.h('div', { class: 'countdown-number' }, this.formatTime(this.countdownTimer))
                    ),
                    this.h('div', { class: 'countdown-text' }, 'Get Ready!')
                ) : null,
                
                // Wait timer display
                this.waitTimer > 0 && this.gameState !== 'countdown' ? this.h('div', { class: 'wait-timer' },
                    this.h('div', { class: 'timer-icon' }, '⏱️'),
                    this.h('div', { class: 'timer-text' }, `${this.formatTime(this.waitTimer)}s`)
                ) : null
            ),
            
            // Players list
            this.h('div', { class: 'players-section' },
                this.h('h3', { class: 'players-title' }, 'Players in Room'),
                this.h('div', { class: 'players-grid' },
                    ...playerList.map((player, index) => 
                        this.h('div', { 
                            class: 'player-card',
                            key: player.id || index 
                        },
                            this.h('div', { class: 'player-avatar' }, 
                                this.getPlayerAvatar(index)
                            ),
                            this.h('div', { class: 'player-info' },
                                this.h('div', { class: 'player-name' }, player.name || 'Unknown'),
                                this.h('div', { class: 'player-lives' }, 
                                    `${player.lives || 3} ❤️`
                                ),
                                this.h('div', { class: 'player-status' }, 
                                    player.ready ? '✅ Ready' : '⏳ Waiting'
                                )
                            )
                        )
                    ),
                    
                    // Empty slots
                    ...Array(maxPlayers - playerCount).fill(null).map((_, index) => 
                        this.h('div', { 
                            class: 'player-card empty-slot',
                            key: `empty-${index}`
                        },
                            this.h('div', { class: 'player-avatar' }, '👤'),
                            this.h('div', { class: 'player-info' },
                                this.h('div', { class: 'player-name' }, 'Waiting for player...'),
                                this.h('div', { class: 'player-status' }, '⏳ Empty')
                            )
                        )
                    )
                )
            ),
            
            // Chat indicator
            this.h('div', { class: 'chat-section' },
                this.h('div', { class: 'chat-info' },
                    this.h('span', { class: 'chat-icon' }, '💬'),
                    this.h('span', { class: 'chat-text' }, 'Press Enter to chat with other players')
                ),
                this.h('button', {
                    class: 'toggle-chat-btn',
                    title: 'Open chat (Enter)'
                }, 'Open Chat')
            ),
            
            // Game rules toggle
            this.h('div', { class: 'rules-section' },
                this.h('button', {
                    class: 'toggle-rules-btn'
                }, this.state.showRules ? 'Hide Rules' : 'Show Rules'),
                
                this.state.showRules ? this.h('div', { class: 'rules-content' },
                    this.h('h4', {}, 'Game Rules'),
                    this.h('ul', { class: 'rules-list' },
                        this.h('li', {}, '🎯 Objective: Be the last player standing'),
                        this.h('li', {}, '❤️ Each player starts with 3 lives'),
                        this.h('li', {}, '💣 Use bombs to destroy blocks and other players'),
                        this.h('li', {}, '⚡ Collect power-ups to become stronger'),
                        this.h('li', {}, '🏆 Win by eliminating all other players')
                    ),
                    this.h('h4', {}, 'Controls'),
                    this.h('ul', { class: 'controls-list' },
                        this.h('li', {}, '⌨️ Arrow keys: Move'),
                        this.h('li', {}, '🔴 Spacebar: Place bomb'),
                        this.h('li', {}, '💬 Enter: Toggle chat'),
                        this.h('li', {}, '🚪 Escape: Leave room')
                    )
                ) : null
            ),
            
            // Action buttons
            this.h('div', { class: 'action-buttons' },
                this.h('button', {
                    class: 'leave-room-btn danger'
                }, 'Leave Room'),
                
                this.h('div', { class: 'connection-info' },
                    this.h('div', { class: 'connection-dot connected' }),
                    this.h('span', {}, 'Connected to server')
                )
            )
        );
    }
    
    getPlayerAvatar(index) {
        const avatars = ['👤', '👨', '👩', '🧑'];
        return avatars[index % avatars.length];
    }
}