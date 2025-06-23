// Main application entry point for Multiplayer Bomberman
import { Component } from '../mini-framework/core/Component.js';
import Mini from '../mini-framework/index.js';

import WebSocketClient from './WebSocketClient.js';
import MultiplayerStateManager from './MultiplayerStateManager.js';
import MultiplayerGameLoop from './MultiplayerGameLoop.js';
import LobbyComponent from './components/LobbyComponent.js';
import ChatComponent from './components/ChatComponent.js';
import MultiplayerGameComponent from './components/MultiplayerGameComponent.js';

export default class MultiplayerBombermanApp extends Component {
    constructor() {
        super();
        
        this.state = {
            currentView: 'lobby', // 'lobby', 'game'
            initialized: false,
            error: null
        };
        
        // Initialize core systems
        this.initializeSystems();
        
        console.log('Multiplayer Bomberman App initialized');
    }

    initializeSystems() {
        try {
            // Initialize state manager
            this.stateManager = new MultiplayerStateManager();
            
            // Initialize WebSocket client
            this.wsClient = new WebSocketClient();
            
            // Initialize game loop
            this.gameLoop = new MultiplayerGameLoop(this.stateManager, this.wsClient);
            
            // Setup WebSocket event handlers
            this.setupWebSocketHandlers();
            
            // Setup state subscriptions
            this.setupStateSubscriptions();
            
            this.setState({ initialized: true });
            
        } catch (error) {
            console.error('Failed to initialize systems:', error);
            this.setState({ error: error.message });
        }
    }

    setupWebSocketHandlers() {
        // Connection events
        this.wsClient.on('connected', (data) => {
            console.log('Connected to server');
            this.stateManager.dispatch({
                type: 'CONNECTION_STATE_CHANGE',
                payload: 'connected'
            });
        });

        this.wsClient.on('disconnected', (data) => {
            console.log('Disconnected from server:', data.reason);
            this.stateManager.dispatch({
                type: 'CONNECTION_STATE_CHANGE',
                payload: 'disconnected'
            });
        });

        this.wsClient.on('error', (data) => {
            console.error('WebSocket error:', data);
            this.stateManager.dispatch({
                type: 'CONNECTION_STATE_CHANGE',
                payload: 'error'
            });
        });

        this.wsClient.on('reconnecting', (data) => {
            console.log('Reconnecting to server, attempt:', data.attempt);
            this.stateManager.dispatch({
                type: 'CONNECTION_STATE_CHANGE',
                payload: 'reconnecting'
            });
        });

        // Game events
        this.wsClient.on('welcome', (message) => {
            console.log('Welcome message received:', message.data);
            this.stateManager.dispatch({
                type: 'JOIN_ROOM',
                payload: message.data
            });
        });

        this.wsClient.on('gameState', (message) => {
            this.stateManager.dispatch({
                type: 'GAME_STATE_UPDATE',
                payload: message.data
            });
        });

        this.wsClient.on('playerJoined', (message) => {
            this.stateManager.dispatch({
                type: 'PLAYER_JOINED',
                payload: message.data
            });
        });

        this.wsClient.on('playerLeft', (message) => {
            this.stateManager.dispatch({
                type: 'PLAYER_LEFT',
                payload: message.data
            });
        });

        this.wsClient.on('playerMoved', (message) => {
            this.stateManager.dispatch({
                type: 'PLAYER_MOVED',
                payload: message.data
            });
        });

        this.wsClient.on('bombPlaced', (message) => {
            this.stateManager.dispatch({
                type: 'BOMB_PLACED',
                payload: message.data
            });
        });

        this.wsClient.on('bombExploded', (message) => {
            this.stateManager.dispatch({
                type: 'BOMB_EXPLODED',
                payload: message.data
            });
        });

        this.wsClient.on('countdown', (message) => {
            this.stateManager.dispatch({
                type: 'UPDATE_COUNTDOWN',
                payload: message.data.duration
            });
        });

        this.wsClient.on('gameStarted', (message) => {
            this.stateManager.dispatch({
                type: 'GAME_STARTED',
                payload: message.data
            });
        });

        this.wsClient.on('gameEnded', (message) => {
            this.stateManager.dispatch({
                type: 'GAME_ENDED',
                payload: message.data
            });
        });

        // Chat events
        this.wsClient.on('chat', (message) => {
            this.stateManager.dispatch({
                type: 'CHAT_MESSAGE_RECEIVED',
                payload: message.data
            });
        });
    }

    setupStateSubscriptions() {
        // Subscribe to game state changes to update view
        this.stateManager.subscribe('gameState', (gameState) => {
            console.log('Game state changed to:', gameState);
            
            if (gameState === 'lobby' || gameState === 'countdown') {
                this.setState({ currentView: 'lobby' });
            } else if (gameState === 'playing' || gameState === 'finished') {
                this.setState({ currentView: 'game' });
            } else if (gameState === 'menu') {
                this.setState({ currentView: 'lobby' });
            }
            
            this.update();
        });

        // Subscribe to connection state changes
        this.stateManager.subscribe('connectionState', (state) => {
            console.log('Connection state changed to:', state);
            this.update();
        });

        // Subscribe to room changes
        this.stateManager.subscribe('currentRoom', (room) => {
            if (room) {
                console.log('Joined room:', room.id);
            } else {
                console.log('Left room');
                this.setState({ currentView: 'lobby' });
            }
            this.update();
        });
    }

    afterMount() {
        // Set up global keyboard shortcuts
        this.addEventListener(document, 'keydown', this.handleGlobalKeyDown);
        
        // Set up window events
        this.addEventListener(window, 'beforeunload', this.handleBeforeUnload);
        
        // Set up error handling
        this.addEventListener(window, 'error', this.handleGlobalError);
        this.addEventListener(window, 'unhandledrejection', this.handleUnhandledRejection);
        
        console.log('Multiplayer Bomberman App mounted');
    }

    beforeUnmount() {
        // Clean up connections
        if (this.wsClient) {
            this.wsClient.disconnect();
        }
        
        // Stop game loop
        if (this.gameLoop) {
            this.gameLoop.stop();
        }
        
        console.log('Multiplayer Bomberman App unmounted');
    }

    handleGlobalKeyDown = (e) => {
        // Global shortcuts
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
            // Check if not already in an input field
            if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                this.stateManager.dispatch({ type: 'TOGGLE_CHAT' });
            }
        }
        
        if (e.key === 'Escape') {
            // Close chat or other modals
            this.stateManager.dispatch({ type: 'TOGGLE_CHAT' });
        }
    }

    handleBeforeUnload = (e) => {
        // Clean disconnect when user closes tab
        if (this.wsClient && this.wsClient.isConnected()) {
            this.wsClient.disconnect();
        }
    }

    handleGlobalError = (e) => {
        console.error('Global error:', e.error);
        this.stateManager.addSystemChatMessage(`Error: ${e.error.message}`, 'error');
    }

    handleUnhandledRejection = (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        this.stateManager.addSystemChatMessage(`Promise error: ${e.reason}`, 'error');
    }

    render() {
        if (!this.state.initialized) {
            return this.renderInitializingScreen();
        }
        
        if (this.state.error) {
            return this.renderErrorScreen();
        }
        
        return this.h('div', { class: 'bomberman-app' },
            // Main content area
            this.h('div', { class: 'main-content' },
                this.renderCurrentView()
            ),
            
            // Chat component (overlay)
            this.renderChatComponent(),
            
            // Connection status indicator
            this.renderConnectionStatus()
        );
    }

    renderInitializingScreen() {
        return this.h('div', { class: 'loading-screen' },
            this.h('div', { class: 'loading-content' },
                this.h('h1', {}, 'Bomberman Multiplayer'),
                this.h('div', { class: 'loading-spinner' }),
                this.h('p', {}, 'Initializing game systems...')
            )
        );
    }

    renderErrorScreen() {
        return this.h('div', { class: 'error-screen' },
            this.h('div', { class: 'error-content' },
                this.h('h1', {}, 'Error'),
                this.h('p', { class: 'error-message' }, this.state.error),
                this.h('button', {
                    onclick: () => window.location.reload()
                }, 'Reload Page')
            )
        );
    }

    renderCurrentView() {
        switch (this.state.currentView) {
            case 'lobby':
                return this.renderLobbyComponent();
            case 'game':
                return this.renderGameComponent();
            default:
                return this.renderLobbyComponent();
        }
    }

    renderLobbyComponent() {
        // Create and mount lobby component
        if (!this.lobbyComponent) {
            this.lobbyComponent = new LobbyComponent({
                wsClient: this.wsClient,
                stateManager: this.stateManager
            });
        }
        
        return this.h('div', { class: 'lobby-view' },
            // The lobby component will render its own content
            this.lobbyComponent.render()
        );
    }

    renderGameComponent() {
        // Create and mount game component
        if (!this.gameComponent) {
            this.gameComponent = new MultiplayerGameComponent({
                stateManager: this.stateManager,
                wsClient: this.wsClient,
                gameLoop: this.gameLoop
            });
        }
        
        return this.h('div', { class: 'game-view' },
            this.gameComponent.render()
        );
    }

    renderChatComponent() {
        // Create and mount chat component
        if (!this.chatComponent) {
            this.chatComponent = new ChatComponent({
                wsClient: this.wsClient,
                stateManager: this.stateManager
            });
        }
        
        return this.chatComponent.render();
    }

    renderConnectionStatus() {
        const connectionState = this.stateManager.getState('connectionState');
        const latency = this.stateManager.getState('latency') || 0;
        
        if (connectionState === 'connected') {
            return null; // Don't show when connected
        }
        
        let statusText = connectionState;
        let statusClass = connectionState;
        
        switch (connectionState) {
            case 'connecting':
                statusText = 'Connecting to server...';
                break;
            case 'reconnecting':
                statusText = 'Reconnecting...';
                break;
            case 'disconnected':
                statusText = 'Disconnected from server';
                break;
            case 'error':
                statusText = 'Connection error';
                break;
        }
        
        return this.h('div', { class: `connection-indicator ${statusClass}` },
            this.h('div', { class: 'status-dot' }),
            this.h('span', { class: 'status-text' }, statusText),
            latency > 0 ? this.h('span', { class: 'latency' }, `${latency}ms`) : null
        );
    }

    // Public methods for external control
    
    // Get current game state for debugging
    getGameState() {
        return {
            currentView: this.state.currentView,
            connectionState: this.stateManager.getState('connectionState'),
            gameState: this.stateManager.getState('gameState'),
            currentRoom: this.stateManager.getState('currentRoom'),
            playersCount: Object.keys(this.stateManager.getState('players') || {}).length,
            isGameLoopRunning: this.gameLoop ? this.gameLoop.isRunning : false
        };
    }

    // Force disconnect (for debugging)
    forceDisconnect() {
        if (this.wsClient) {
            this.wsClient.disconnect();
        }
    }

    // Get performance info
    getPerformanceInfo() {
        return this.gameLoop ? this.gameLoop.getPerformanceStats() : null;
    }

    // Get debug information
    getDebugInfo() {
        return {
            app: this.getGameState(),
            performance: this.getPerformanceInfo(),
            stateManager: this.stateManager.getDebugInfo(),
            webSocket: this.wsClient.getConnectionInfo()
        };
    }
}