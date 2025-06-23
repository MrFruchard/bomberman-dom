// Lobby/Waiting room component with player counter and timers
import { Component } from '../../mini-framework/core/Component.js';

export default class LobbyComponent extends Component {
    constructor(props = {}) {
        super(props);
        
        this.state = {
            playerName: '',
            selectedRoom: null,
            showCreateRoom: false,
            newRoomName: '',
            maxPlayers: 4,
            error: null,
            loading: false
        };
        
        this.wsClient = props.wsClient;
        this.stateManager = props.stateManager;
        
        this.setupSubscriptions();
    }

    setupSubscriptions() {
        // Subscribe to state changes
        this.stateManager.subscribe('availableRooms', (rooms) => {
            this.update();
        });
        
        this.stateManager.subscribe('currentRoom', (room) => {
            this.update();
        });
        
        this.stateManager.subscribe('gameState', (state) => {
            this.update();
        });
        
        this.stateManager.subscribe('connectionState', (state) => {
            this.update();
        });
        
        this.stateManager.subscribe('countdownTimer', (timer) => {
            this.update();
        });
    }

    afterMount() {
        // Load available rooms on mount
        this.loadAvailableRooms();
        
        // Set up event listeners
        this.addEventListener('.join-room-btn', 'click', this.handleJoinRoom);
        this.addEventListener('.create-room-btn', 'click', this.toggleCreateRoom);
        this.addEventListener('.confirm-create-btn', 'click', this.handleCreateRoom);
        this.addEventListener('.cancel-create-btn', 'click', this.toggleCreateRoom);
        this.addEventListener('.leave-room-btn', 'click', this.handleLeaveRoom);
        this.addEventListener('.refresh-rooms-btn', 'click', this.loadAvailableRooms);
        
        this.addEventListener('.player-name-input', 'input', (e) => {
            this.setState({ playerName: e.target.value });
        });
        
        this.addEventListener('.room-name-input', 'input', (e) => {
            this.setState({ newRoomName: e.target.value });
        });
        
        this.addEventListener('.max-players-select', 'change', (e) => {
            this.setState({ maxPlayers: parseInt(e.target.value) });
        });
    }

    async loadAvailableRooms() {
        try {
            const response = await fetch('http://localhost:8080/rooms');
            const rooms = await response.json();
            this.stateManager.dispatch({
                type: 'SET_AVAILABLE_ROOMS',
                payload: rooms
            });
        } catch (error) {
            console.error('Failed to load rooms:', error);
            this.setState({ error: 'Failed to load rooms' });
        }
    }

    toggleCreateRoom = () => {
        this.setState({ 
            showCreateRoom: !this.state.showCreateRoom,
            newRoomName: '',
            error: null
        });
    }

    handleJoinRoom = async (e) => {
        const roomId = e.target.dataset.roomId;
        const playerName = this.state.playerName.trim();
        
        if (!playerName) {
            this.setState({ error: 'Please enter your name' });
            return;
        }
        
        this.setState({ loading: true, error: null });
        
        try {
            await this.wsClient.connect(playerName, roomId);
        } catch (error) {
            console.error('Failed to join room:', error);
            this.setState({ error: 'Failed to join room: ' + error.message });
        } finally {
            this.setState({ loading: false });
        }
    }

    handleCreateRoom = async () => {
        const roomName = this.state.newRoomName.trim();
        const playerName = this.state.playerName.trim();
        
        if (!roomName) {
            this.setState({ error: 'Please enter a room name' });
            return;
        }
        
        if (!playerName) {
            this.setState({ error: 'Please enter your name' });
            return;
        }
        
        this.setState({ loading: true, error: null });
        
        try {
            // Create room via API
            const response = await fetch('http://localhost:8080/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: roomName,
                    maxPlayers: this.state.maxPlayers
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create room');
            }
            
            const room = await response.json();
            
            // Join the created room
            await this.wsClient.connect(playerName, room.id);
            
            this.setState({ showCreateRoom: false });
            
        } catch (error) {
            console.error('Failed to create room:', error);
            this.setState({ error: 'Failed to create room: ' + error.message });
        } finally {
            this.setState({ loading: false });
        }
    }

    handleLeaveRoom = () => {
        this.wsClient.disconnect();
        this.stateManager.dispatch({ type: 'LEAVE_ROOM' });
    }

    formatTimeRemaining(seconds) {
        return `${Math.ceil(seconds)}s`;
    }

    formatPlayerList(players) {
        return Object.values(players || {}).map(player => player.name).join(', ');
    }

    render() {
        const gameState = this.stateManager.getState('gameState');
        const currentRoom = this.stateManager.getState('currentRoom');
        const availableRooms = this.stateManager.getState('availableRooms') || [];
        const connectionState = this.stateManager.getState('connectionState');
        const countdownTimer = this.stateManager.getState('countdownTimer');
        const players = this.stateManager.getState('players') || {};
        
        // Show waiting room if in a room
        if (currentRoom && (gameState === 'lobby' || gameState === 'countdown')) {
            return this.renderWaitingRoom(currentRoom, players, countdownTimer);
        }
        
        // Show room browser
        return this.renderRoomBrowser(availableRooms, connectionState);
    }

    renderRoomBrowser(availableRooms, connectionState) {
        return this.h('div', { class: 'lobby-container' },
            this.h('div', { class: 'lobby-header' },
                this.h('h1', {}, 'Bomberman Multiplayer'),
                this.h('p', {}, 'Join or create a game room')
            ),
            
            // Player name input
            this.h('div', { class: 'player-setup' },
                this.h('label', {}, 'Your Name:'),
                this.h('input', {
                    type: 'text',
                    class: 'player-name-input',
                    placeholder: 'Enter your name...',
                    value: this.state.playerName,
                    maxlength: 20
                })
            ),
            
            // Error message
            this.state.error ? this.h('div', { class: 'error-message' },
                this.state.error
            ) : null,
            
            // Room creation section
            this.h('div', { class: 'room-creation' },
                this.h('button', {
                    class: 'create-room-btn',
                    disabled: this.state.loading
                }, 'Create New Room'),
                
                this.state.showCreateRoom ? this.h('div', { class: 'create-room-form' },
                    this.h('input', {
                        type: 'text',
                        class: 'room-name-input',
                        placeholder: 'Room name...',
                        value: this.state.newRoomName,
                        maxlength: 30
                    }),
                    this.h('select', { class: 'max-players-select' },
                        this.h('option', { value: 2 }, '2 Players'),
                        this.h('option', { value: 3 }, '3 Players'),
                        this.h('option', { value: 4, selected: true }, '4 Players')
                    ),
                    this.h('div', { class: 'form-buttons' },
                        this.h('button', {
                            class: 'confirm-create-btn',
                            disabled: this.state.loading
                        }, 'Create'),
                        this.h('button', {
                            class: 'cancel-create-btn',
                            disabled: this.state.loading
                        }, 'Cancel')
                    )
                ) : null
            ),
            
            // Available rooms section
            this.h('div', { class: 'available-rooms' },
                this.h('div', { class: 'rooms-header' },
                    this.h('h2', {}, 'Available Rooms'),
                    this.h('button', {
                        class: 'refresh-rooms-btn',
                        disabled: this.state.loading
                    }, 'Refresh')
                ),
                
                this.h('div', { class: 'rooms-list' },
                    availableRooms.length > 0 ? 
                        availableRooms.map(room => this.renderRoomItem(room)) :
                        this.h('div', { class: 'no-rooms' }, 'No rooms available')
                )
            ),
            
            // Connection status
            this.h('div', { class: 'connection-status' },
                `Status: ${connectionState}`
            )
        );
    }

    renderRoomItem(room) {
        const canJoin = room.playerCount < room.maxPlayers && room.state === 'waiting';
        const playerNames = Object.values(room.players || {}).join(', ');
        
        return this.h('div', { 
            class: `room-item ${canJoin ? 'joinable' : 'full'}`,
            key: room.id 
        },
            this.h('div', { class: 'room-info' },
                this.h('div', { class: 'room-name' }, room.id),
                this.h('div', { class: 'room-players' }, 
                    `${room.playerCount}/${room.maxPlayers} players`
                ),
                this.h('div', { class: 'room-state' }, room.state),
                playerNames ? this.h('div', { class: 'player-names' }, playerNames) : null
            ),
            this.h('button', {
                class: 'join-room-btn',
                'data-room-id': room.id,
                disabled: !canJoin || this.state.loading || !this.state.playerName.trim()
            }, canJoin ? 'Join' : 'Full')
        );
    }

    renderWaitingRoom(currentRoom, players, countdownTimer) {
        const playerList = Object.values(players);
        const playerCount = playerList.length;
        const maxPlayers = currentRoom.maxPlayers || 4;
        const gameState = this.stateManager.getState('gameState');
        
        return this.h('div', { class: 'waiting-room' },
            this.h('div', { class: 'waiting-header' },
                this.h('h1', {}, 'Waiting Room'),
                this.h('p', {}, `Room: ${currentRoom.id}`)
            ),
            
            // Player counter
            this.h('div', { class: 'player-counter' },
                this.h('h2', {}, `Players: ${playerCount}/${maxPlayers}`),
                this.h('div', { class: 'player-progress' },
                    this.h('div', { 
                        class: 'progress-bar',
                        style: `width: ${(playerCount / maxPlayers) * 100}%`
                    })
                )
            ),
            
            // Player list
            this.h('div', { class: 'players-list' },
                this.h('h3', {}, 'Players in room:'),
                this.h('ul', {},
                    ...playerList.map(player => 
                        this.h('li', { 
                            class: player.id === this.stateManager.getState('localPlayerId') ? 'local-player' : '',
                            key: player.id 
                        },
                            `${player.name} ${player.lives > 0 ? `(${player.lives} lives)` : '(spectating)'}`
                        )
                    )
                )
            ),
            
            // Game state info
            this.h('div', { class: 'game-status' },
                gameState === 'countdown' ? this.h('div', { class: 'countdown' },
                    this.h('h2', {}, 'Game starting in...'),
                    this.h('div', { class: 'countdown-timer' }, 
                        this.formatTimeRemaining(countdownTimer / 1000)
                    )
                ) : this.h('div', { class: 'waiting-info' },
                    playerCount >= 2 ? 
                        this.h('p', {}, playerCount >= maxPlayers ? 
                            'Starting game...' : 
                            `Waiting for ${maxPlayers - playerCount} more players or 20 seconds...`
                        ) :
                        this.h('p', {}, 'Waiting for more players to join...')
                )
            ),
            
            // Leave room button
            this.h('div', { class: 'room-actions' },
                this.h('button', {
                    class: 'leave-room-btn'
                }, 'Leave Room')
            )
        );
    }
}