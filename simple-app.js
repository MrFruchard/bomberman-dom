// Version simple sans mini-framework
class SimpleBombermanApp {
    constructor() {
        this.wsClient = null;
        this.gameState = 'menu'; // menu, lobby, playing
        this.playerName = '';
        this.currentRoom = null;
        this.availableRooms = [];
        this.players = {};
        this.connectionState = 'disconnected';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.render();
        this.loadAvailableRooms();
    }
    
    setupEventListeners() {
        // Délégation d'événements sur le document
        document.addEventListener('click', (e) => {
            if (e.target.matches('.create-room-btn')) {
                this.toggleCreateRoom();
            } else if (e.target.matches('.refresh-rooms-btn')) {
                this.loadAvailableRooms();
            } else if (e.target.matches('.confirm-create-btn')) {
                this.handleCreateRoom();
            } else if (e.target.matches('.cancel-create-btn')) {
                this.toggleCreateRoom();
            } else if (e.target.matches('.join-room-btn')) {
                this.handleJoinRoom(e.target);
            } else if (e.target.matches('.leave-room-btn')) {
                this.handleLeaveRoom();
            } else if (e.target.matches('.chat-toggle-button')) {
                this.toggleChat();
            }
        });
        
        // Événements input
        document.addEventListener('input', (e) => {
            if (e.target.matches('.player-name-input')) {
                this.playerName = e.target.value;
            } else if (e.target.matches('.room-name-input')) {
                this.newRoomName = e.target.value;
            }
        });
        
        // Événements change
        document.addEventListener('change', (e) => {
            if (e.target.matches('.max-players-select')) {
                this.maxPlayers = parseInt(e.target.value);
            }
        });
    }
    
    async loadAvailableRooms() {
        try {
            console.log('Loading available rooms...');
            const response = await fetch('http://localhost:8080/rooms');
            this.availableRooms = await response.json();
            console.log('Rooms loaded:', this.availableRooms);
            this.render();
        } catch (error) {
            console.error('Failed to load rooms:', error);
            this.showError('Failed to load rooms');
        }
    }
    
    toggleCreateRoom() {
        console.log('Toggle create room');
        const form = document.querySelector('.create-room-form');
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        } else {
            this.showCreateRoom = !this.showCreateRoom;
            this.render();
        }
    }
    
    async handleCreateRoom() {
        const roomName = document.querySelector('.room-name-input')?.value?.trim();
        const playerName = this.playerName.trim();
        const maxPlayers = parseInt(document.querySelector('.max-players-select')?.value) || 4;
        
        if (!roomName) {
            this.showError('Please enter a room name');
            return;
        }
        
        if (!playerName) {
            this.showError('Please enter your name');
            return;
        }
        
        try {
            console.log('Creating room:', { roomName, maxPlayers });
            const response = await fetch('http://localhost:8080/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: roomName,
                    maxPlayers: maxPlayers
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create room');
            }
            
            const room = await response.json();
            console.log('Room created:', room);
            
            // Fermer le formulaire
            this.showCreateRoom = false;
            document.querySelector('.create-room-form').style.display = 'none';
            
            // Vider le formulaire
            document.querySelector('.room-name-input').value = '';
            
            // Connecter au WebSocket pour rejoindre la room
            await this.connectToRoom(playerName, room.id);
            
        } catch (error) {
            console.error('Failed to create room:', error);
            this.showError('Failed to create room: ' + error.message);
        }
    }
    
    async handleJoinRoom(button) {
        const roomId = button.dataset.roomId;
        const playerName = this.playerName.trim();
        
        if (!playerName) {
            this.showError('Please enter your name');
            return;
        }
        
        await this.connectToRoom(playerName, roomId);
    }
    
    async connectToRoom(playerName, roomId) {
        try {
            console.log('Connecting to room:', { playerName, roomId });
            
            // Vraie connexion WebSocket
            this.wsClient = new WebSocket(`ws://localhost:8080/ws?room=${roomId}&player=${playerName}`);
            
            this.wsClient.onopen = () => {
                console.log('WebSocket connected!');
                this.connectionState = 'connected';
                
                // Passer en mode lobby
                this.currentRoom = { id: roomId, maxPlayers: 4 };
                this.gameState = 'lobby';
                this.players = {
                    [playerName]: { id: playerName, name: playerName, lives: 3 }
                };
                
                this.render();
                this.showMessage('Connected to room: ' + roomId);
            };
            
            this.wsClient.onmessage = (event) => {
                console.log('WebSocket message:', event.data);
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };
            
            this.wsClient.onclose = () => {
                console.log('WebSocket disconnected');
                this.connectionState = 'disconnected';
                this.currentRoom = null;
                this.gameState = 'menu';
                this.players = {};
                this.render();
            };
            
            this.wsClient.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.showError('Connection failed');
                this.connectionState = 'disconnected';
            };
            
        } catch (error) {
            console.error('Failed to connect:', error);
            this.showError('Failed to connect: ' + error.message);
        }
    }
    
    handleLeaveRoom() {
        console.log('Leaving room');
        
        // Fermer la connexion WebSocket
        if (this.wsClient) {
            this.wsClient.close();
            this.wsClient = null;
        }
        
        this.currentRoom = null;
        this.gameState = 'menu';
        this.players = {};
        this.connectionState = 'disconnected';
        this.render();
    }
    
    handleWebSocketMessage(message) {
        console.log('Handling WebSocket message:', message);
        
        switch (message.type) {
            case 'player_joined':
                this.players[message.playerId] = {
                    id: message.playerId,
                    name: message.playerName,
                    lives: 3
                };
                this.render();
                break;
                
            case 'player_left':
                delete this.players[message.playerId];
                this.render();
                break;
                
            case 'room_state':
                this.players = message.players || {};
                this.currentRoom = message.room || this.currentRoom;
                this.render();
                break;
                
            case 'game_start':
                this.gameState = 'playing';
                this.render();
                break;
                
            default:
                console.log('Unknown message type:', message.type);
        }
    }
    
    toggleChat() {
        console.log('Toggle chat');
        const chat = document.querySelector('.chat-container');
        if (chat) {
            chat.style.display = chat.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    showError(message) {
        console.error(message);
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
    
    showMessage(message) {
        console.log(message);
        // Afficher dans une zone de message ou console
    }
    
    render() {
        const app = document.getElementById('app');
        
        if (this.gameState === 'lobby' && this.currentRoom) {
            app.innerHTML = this.renderWaitingRoom();
        } else {
            app.innerHTML = this.renderLobby();
        }
    }
    
    renderLobby() {
        return `
            <div class="lobby-container">
                <div class="lobby-header">
                    <h1>Bomberman Multiplayer</h1>
                    <p>Join or create a game room</p>
                </div>
                
                <div class="player-setup">
                    <label>Your Name:</label>
                    <input type="text" class="player-name-input" placeholder="Enter your name..." 
                           value="${this.playerName}" maxlength="20">
                </div>
                
                <div class="error-message" style="display: none; color: red; margin: 10px 0;"></div>
                
                <div class="room-creation">
                    <button class="create-room-btn">Create New Room</button>
                    
                    <div class="create-room-form" style="display: ${this.showCreateRoom ? 'block' : 'none'}; margin-top: 10px;">
                        <input type="text" class="room-name-input" placeholder="Room name..." maxlength="30">
                        <select class="max-players-select">
                            <option value="2">2 Players</option>
                            <option value="3">3 Players</option>
                            <option value="4" selected>4 Players</option>
                        </select>
                        <div class="form-buttons">
                            <button class="confirm-create-btn">Create</button>
                            <button class="cancel-create-btn">Cancel</button>
                        </div>
                    </div>
                </div>
                
                <div class="available-rooms">
                    <div class="rooms-header">
                        <h2>Available Rooms</h2>
                        <button class="refresh-rooms-btn">Refresh</button>
                    </div>
                    
                    <div class="rooms-list">
                        ${this.availableRooms.length > 0 ? 
                            this.availableRooms.map(room => this.renderRoomItem(room)).join('') :
                            '<div class="no-rooms">No rooms available</div>'
                        }
                    </div>
                </div>
                
                <div class="connection-status">
                    Status: ${this.connectionState}
                </div>
                
                <button class="chat-toggle-button" style="position: fixed; bottom: 20px; right: 20px;">💬</button>
            </div>
        `;
    }
    
    renderRoomItem(room) {
        const canJoin = room.playerCount < room.maxPlayers && room.state === 'waiting';
        
        return `
            <div class="room-item ${canJoin ? 'joinable' : 'full'}">
                <div class="room-info">
                    <div class="room-name">${room.id}</div>
                    <div class="room-players">${room.playerCount}/${room.maxPlayers} players</div>
                    <div class="room-state">${room.state}</div>
                </div>
                <button class="join-room-btn" data-room-id="${room.id}" 
                        ${!canJoin || !this.playerName.trim() ? 'disabled' : ''}>
                    ${canJoin ? 'Join' : 'Full'}
                </button>
            </div>
        `;
    }
    
    renderWaitingRoom() {
        const playerList = Object.values(this.players);
        const playerCount = playerList.length;
        const maxPlayers = this.currentRoom.maxPlayers || 4;
        
        return `
            <div class="waiting-room">
                <div class="waiting-header">
                    <h1>Waiting Room</h1>
                    <p>Room: ${this.currentRoom.id}</p>
                </div>
                
                <div class="player-counter">
                    <h2>Players: ${playerCount}/${maxPlayers}</h2>
                    <div class="player-progress">
                        <div class="progress-bar" style="width: ${(playerCount / maxPlayers) * 100}%"></div>
                    </div>
                </div>
                
                <div class="players-list">
                    <h3>Players in room:</h3>
                    <ul>
                        ${playerList.map(player => 
                            `<li>${player.name} (${player.lives} lives)</li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="game-status">
                    <p>Waiting for more players to join...</p>
                </div>
                
                <div class="room-actions">
                    <button class="leave-room-btn">Leave Room</button>
                </div>
                
                <button class="chat-toggle-button" style="position: fixed; bottom: 20px; right: 20px;">💬</button>
            </div>
        `;
    }
}

// Initialiser l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    console.log('Starting Simple Bomberman App...');
    window.app = new SimpleBombermanApp();
});