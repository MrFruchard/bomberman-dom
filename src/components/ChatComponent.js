// Chat component for WebSocket-based communication between players
import { Component } from '../../mini-framework/core/Component.js';

export default class ChatComponent extends Component {
    constructor(props = {}) {
        super(props);
        
        this.state = {
            message: '',
            isVisible: false,
            isMinimized: true,
            hasNewMessages: false,
            lastMessageCount: 0
        };
        
        this.wsClient = props.wsClient;
        this.stateManager = props.stateManager;
        this.maxMessageLength = 200;
        
        this.setupSubscriptions();
    }

    setupSubscriptions() {
        // Subscribe to chat messages
        this.stateManager.subscribe('chatMessages', (messages) => {
            const newMessageCount = messages.length;
            
            // Check if there are new messages
            if (newMessageCount > this.state.lastMessageCount) {
                this.setState({ 
                    hasNewMessages: this.state.isMinimized,
                    lastMessageCount: newMessageCount
                });
            }
            
            this.update();
            
            // Auto-scroll to bottom after update
            setTimeout(() => {
                this.scrollToBottom();
            }, 0);
        });
        
        // Subscribe to show/hide chat
        this.stateManager.subscribe('showChat', (show) => {
            this.setState({ isVisible: show });
        });
        
        // Subscribe to game state changes
        this.stateManager.subscribe('gameState', (gameState) => {
            // Show chat automatically when in lobby or game
            if (gameState === 'lobby' || gameState === 'playing') {
                this.setState({ isVisible: true });
            } else if (gameState === 'menu') {
                this.setState({ isVisible: false });
            }
        });
    }

    afterMount() {
        // Set up event listeners
        this.addEventListener('.chat-input', 'keydown', this.handleKeyDown);
        this.addEventListener('.chat-input', 'input', this.handleInputChange);
        this.addEventListener('.send-button', 'click', this.sendMessage);
        this.addEventListener('.chat-toggle', 'click', this.toggleChat);
        this.addEventListener('.chat-minimize', 'click', this.toggleMinimize);
        this.addEventListener('.chat-clear', 'click', this.clearChat);
        
        // Focus chat input when component becomes visible
        this.setupFocusHandling();
    }

    setupFocusHandling() {
        // Auto-focus chat input when opening
        this.stateManager.subscribe('showChat', (show) => {
            if (show && !this.state.isMinimized) {
                setTimeout(() => {
                    const input = this.find('.chat-input');
                    if (input) {
                        input.focus();
                    }
                }, 100);
            }
        });
    }

    handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        } else if (e.key === 'Escape') {
            this.toggleMinimize();
        }
    }

    handleInputChange = (e) => {
        let message = e.target.value;
        
        // Limit message length
        if (message.length > this.maxMessageLength) {
            message = message.substring(0, this.maxMessageLength);
            e.target.value = message;
        }
        
        this.setState({ message });
    }

    sendMessage = () => {
        const message = this.state.message.trim();
        
        if (!message) return;
        
        // Check if connected
        if (!this.wsClient.isConnected()) {
            this.addLocalMessage('Error: Not connected to server', 'error');
            return;
        }
        
        // Send message via WebSocket
        const success = this.wsClient.sendChatMessage(message);
        
        if (success) {
            // Clear input
            this.setState({ message: '' });
            const input = this.find('.chat-input');
            if (input) {
                input.value = '';
                input.focus();
            }
        } else {
            this.addLocalMessage('Error: Failed to send message', 'error');
        }
    }

    toggleChat = () => {
        const newVisibility = !this.state.isVisible;
        this.setState({ isVisible: newVisibility });
        this.stateManager.dispatch({
            type: 'TOGGLE_CHAT'
        });
    }

    toggleMinimize = () => {
        const newMinimized = !this.state.isMinimized;
        this.setState({ 
            isMinimized: newMinimized,
            hasNewMessages: false // Clear notification when expanding
        });
        
        // Focus input when expanding
        if (!newMinimized) {
            setTimeout(() => {
                const input = this.find('.chat-input');
                if (input) {
                    input.focus();
                }
            }, 100);
        }
    }

    clearChat = () => {
        this.stateManager.dispatch({
            type: 'CLEAR_CHAT'
        });
    }

    addLocalMessage(message, type = 'info') {
        this.stateManager.dispatch({
            type: 'CHAT_MESSAGE_RECEIVED',
            payload: {
                playerName: 'System',
                playerId: 'system',
                message: message,
                timestamp: new Date(),
                isSystem: true,
                messageType: type
            }
        });
    }

    scrollToBottom() {
        const messagesContainer = this.find('.chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }

    formatPlayerName(playerName, isSystem = false) {
        if (isSystem) {
            return 'System';
        }
        
        // Truncate long names
        if (playerName.length > 15) {
            return playerName.substring(0, 12) + '...';
        }
        
        return playerName;
    }

    getMessageClass(message) {
        const classes = ['chat-message'];
        
        if (message.isSystem) {
            classes.push('system-message');
            if (message.messageType === 'error') {
                classes.push('error-message');
            }
        } else {
            // Check if it's from local player
            const localPlayerId = this.stateManager.getState('localPlayerId');
            if (message.playerId === localPlayerId) {
                classes.push('own-message');
            } else {
                classes.push('other-message');
            }
        }
        
        return classes.join(' ');
    }

    render() {
        if (!this.state.isVisible) {
            return this.renderToggleButton();
        }
        
        const messages = this.stateManager.getState('chatMessages') || [];
        const connectionState = this.stateManager.getState('connectionState');
        const isConnected = connectionState === 'connected';
        
        return this.h('div', { 
            class: `chat-container ${this.state.isMinimized ? 'minimized' : 'expanded'}`
        },
            // Chat header
            this.h('div', { class: 'chat-header' },
                this.h('span', { class: 'chat-title' }, 
                    `Chat ${this.state.hasNewMessages ? '●' : ''}`
                ),
                this.h('div', { class: 'chat-controls' },
                    this.h('button', {
                        class: 'chat-clear',
                        title: 'Clear chat'
                    }, '🗑'),
                    this.h('button', {
                        class: 'chat-minimize',
                        title: this.state.isMinimized ? 'Expand' : 'Minimize'
                    }, this.state.isMinimized ? '⬆' : '⬇'),
                    this.h('button', {
                        class: 'chat-toggle',
                        title: 'Close chat'
                    }, '✕')
                )
            ),
            
            // Chat content (only when expanded)
            !this.state.isMinimized ? this.h('div', { class: 'chat-content' },
                // Messages area
                this.h('div', { class: 'chat-messages' },
                    messages.length > 0 ? 
                        messages.map(message => this.renderMessage(message)) :
                        this.h('div', { class: 'no-messages' }, 'No messages yet...')
                ),
                
                // Connection status (if not connected)
                !isConnected ? this.h('div', { class: 'connection-warning' },
                    `Not connected (${connectionState})`
                ) : null,
                
                // Input area
                this.h('div', { class: 'chat-input-area' },
                    this.h('input', {
                        type: 'text',
                        class: 'chat-input',
                        placeholder: isConnected ? 'Type a message...' : 'Connecting...',
                        value: this.state.message,
                        maxlength: this.maxMessageLength,
                        disabled: !isConnected
                    }),
                    this.h('button', {
                        class: 'send-button',
                        disabled: !isConnected || !this.state.message.trim(),
                        title: 'Send message (Enter)'
                    }, 'Send'),
                    this.h('div', { class: 'message-counter' },
                        `${this.state.message.length}/${this.maxMessageLength}`
                    )
                )
            ) : null
        );
    }

    renderToggleButton() {
        const hasNewMessages = this.state.hasNewMessages;
        
        return this.h('button', {
            class: `chat-toggle-button ${hasNewMessages ? 'has-notifications' : ''}`,
            title: 'Open chat',
            onclick: this.toggleChat
        },
            hasNewMessages ? '💬●' : '💬'
        );
    }

    renderMessage(message) {
        return this.h('div', {
            class: this.getMessageClass(message),
            key: message.id || `${message.playerId}_${message.timestamp}`
        },
            this.h('div', { class: 'message-header' },
                this.h('span', { class: 'message-author' },
                    this.formatPlayerName(message.playerName, message.isSystem)
                ),
                this.h('span', { class: 'message-time' },
                    this.formatTimestamp(message.timestamp)
                )
            ),
            this.h('div', { class: 'message-content' },
                message.message
            )
        );
    }
}