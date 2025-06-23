// WebSocket client manager for real-time multiplayer communication
export default class WebSocketClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.messageHandlers = new Map();
        this.pingInterval = null;
        this.lastPong = Date.now();
        
        // Bind methods
        this.onOpen = this.onOpen.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);
        
        console.log('WebSocketClient initialized');
    }

    // Connect to WebSocket server
    connect(playerName, roomId = '') {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                const wsUrl = `ws://localhost:8080/ws?name=${encodeURIComponent(playerName)}&room=${encodeURIComponent(roomId)}`;
                console.log('Connecting to:', wsUrl);
                
                this.ws = new WebSocket(wsUrl);
                this.ws.addEventListener('open', this.onOpen);
                this.ws.addEventListener('message', this.onMessage);
                this.ws.addEventListener('close', this.onClose);
                this.ws.addEventListener('error', this.onError);
                
                // Store resolve/reject for connection result
                this._connectResolve = resolve;
                this._connectReject = reject;
                
                // Timeout after 10 seconds
                this._connectTimeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                    this.disconnect();
                }, 10000);
                
            } catch (error) {
                console.error('Error creating WebSocket:', error);
                reject(error);
            }
        });
    }

    // Disconnect from WebSocket server
    disconnect() {
        console.log('Disconnecting WebSocket');
        
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        
        if (this._connectTimeout) {
            clearTimeout(this._connectTimeout);
            this._connectTimeout = null;
        }
        
        if (this.ws) {
            this.ws.removeEventListener('open', this.onOpen);
            this.ws.removeEventListener('message', this.onMessage);
            this.ws.removeEventListener('close', this.onClose);
            this.ws.removeEventListener('error', this.onError);
            
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close();
            }
            this.ws = null;
        }
        
        this.connected = false;
        this.reconnectAttempts = 0;
    }

    // WebSocket event handlers
    onOpen(event) {
        console.log('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.lastPong = Date.now();
        
        if (this._connectTimeout) {
            clearTimeout(this._connectTimeout);
            this._connectTimeout = null;
        }
        
        if (this._connectResolve) {
            this._connectResolve();
            this._connectResolve = null;
            this._connectReject = null;
        }
        
        // Start ping/pong for connection monitoring
        this.startPingPong();
        
        // Notify handlers
        this.emit('connected', { event });
    }

    onMessage(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('WebSocket message received:', message);
            
            // Handle pong messages
            if (message.type === 'pong') {
                this.lastPong = Date.now();
                return;
            }
            
            // Emit to specific handlers
            this.emit(message.type, message);
            
            // Also emit generic message event
            this.emit('message', message);
            
        } catch (error) {
            console.error('Error parsing WebSocket message:', error, event.data);
        }
    }

    onClose(event) {
        console.log('WebSocket closed:', event.code, event.reason);
        this.connected = false;
        
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        
        if (this._connectReject && event.code !== 1000) {
            this._connectReject(new Error(`Connection failed: ${event.reason}`));
            this._connectReject = null;
            this._connectResolve = null;
        }
        
        // Emit disconnected event
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        // Auto-reconnect if not intentional disconnect
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
        }
    }

    onError(event) {
        console.error('WebSocket error:', event);
        
        if (this._connectReject) {
            this._connectReject(new Error('WebSocket connection error'));
            this._connectReject = null;
            this._connectResolve = null;
        }
        
        this.emit('error', { event });
    }

    // Attempt to reconnect with exponential backoff
    attemptReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
        
        setTimeout(() => {
            if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                // Note: We'd need to store original connection params for reconnection
                this.emit('reconnecting', { attempt: this.reconnectAttempts });
                // For now, just emit event - app should handle reconnection
            }
        }, delay);
    }

    // Start ping/pong for connection monitoring
    startPingPong() {
        this.pingInterval = setInterval(() => {
            if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
                // Check if we received pong recently
                if (Date.now() - this.lastPong > 30000) { // 30 seconds
                    console.warn('No pong received, connection may be dead');
                    this.ws.close();
                    return;
                }
                
                // Send ping
                this.send({ type: 'ping' });
            }
        }, 15000); // Ping every 15 seconds
    }

    // Send message to server
    send(message) {
        if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected, cannot send message:', message);
            return false;
        }

        try {
            const data = JSON.stringify(message);
            this.ws.send(data);
            console.log('WebSocket message sent:', message);
            return true;
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
            return false;
        }
    }

    // Event handler management
    on(eventType, handler) {
        if (!this.messageHandlers.has(eventType)) {
            this.messageHandlers.set(eventType, []);
        }
        this.messageHandlers.get(eventType).push(handler);
        
        // Return unsubscribe function
        return () => {
            const handlers = this.messageHandlers.get(eventType);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        };
    }

    off(eventType, handler) {
        const handlers = this.messageHandlers.get(eventType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emit(eventType, data) {
        const handlers = this.messageHandlers.get(eventType) || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in ${eventType} handler:`, error);
            }
        });
    }

    // Game-specific message methods
    sendPlayerInput(inputData) {
        return this.send({
            type: 'playerInput',
            data: inputData
        });
    }

    sendChatMessage(message) {
        return this.send({
            type: 'chat',
            data: { message }
        });
    }

    // Connection status
    isConnected() {
        return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    getConnectionState() {
        if (!this.ws) return 'disconnected';
        
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING:
                return 'connecting';
            case WebSocket.OPEN:
                return 'connected';
            case WebSocket.CLOSING:
                return 'closing';
            case WebSocket.CLOSED:
                return 'disconnected';
            default:
                return 'unknown';
        }
    }

    // Get connection info
    getConnectionInfo() {
        return {
            connected: this.connected,
            state: this.getConnectionState(),
            reconnectAttempts: this.reconnectAttempts,
            lastPong: this.lastPong
        };
    }
}