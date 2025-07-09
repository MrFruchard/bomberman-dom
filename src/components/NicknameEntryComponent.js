// Nickname entry component - First screen of the game
import { Component } from '../../mini-framework/core/Component.js';

export default class NicknameEntryComponent extends Component {
    constructor(props = {}) {
        super(props);
        
        this.state = {
            nickname: '',
            error: null,
            loading: false
        };
        
        this.onConnect = props.onConnect || (() => {});
        this.connectionState = props.connectionState || 'disconnected';
        this.error = props.error || null;
    }
    
    afterMount() {
        // Auto-focus the nickname input
        const input = this.container.querySelector('.nickname-input');
        if (input) {
            input.focus();
        }
        
        // Set up event listeners
        this.addEventListener('.nickname-input', 'input', (e) => {
            this.setState({ nickname: e.target.value.trim() });
        });
        
        this.addEventListener('.nickname-input', 'keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleConnect();
            }
        });
        
        this.addEventListener('.connect-button', 'click', () => {
            this.handleConnect();
        });
    }
    
    handleConnect() {
        const nickname = this.state.nickname.trim();
        
        if (!nickname) {
            this.setState({ error: 'Please enter a nickname' });
            return;
        }
        
        if (nickname.length < 2) {
            this.setState({ error: 'Nickname must be at least 2 characters' });
            return;
        }
        
        if (nickname.length > 20) {
            this.setState({ error: 'Nickname must be less than 20 characters' });
            return;
        }
        
        // Check for valid characters
        if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
            this.setState({ error: 'Nickname can only contain letters, numbers, underscore and dash' });
            return;
        }
        
        this.setState({ error: null, loading: true });
        this.onConnect(nickname);
    }
    
    render() {
        return this.h('div', { class: 'nickname-entry-screen' },
            this.h('div', { class: 'nickname-container' },
                this.h('div', { class: 'game-logo' },
                    this.h('h1', {}, '💣 Bomberman'),
                    this.h('p', { class: 'game-subtitle' }, 'Multiplayer Battle Royale')
                ),
                
                this.h('div', { class: 'nickname-form' },
                    this.h('h2', {}, 'Enter Your Nickname'),
                    this.h('p', { class: 'form-description' }, 
                        'Choose a unique nickname to identify yourself in the game'
                    ),
                    
                    this.h('div', { class: 'input-group' },
                        this.h('input', {
                            type: 'text',
                            class: 'nickname-input',
                            placeholder: 'Enter your nickname...',
                            value: this.state.nickname,
                            maxlength: 20,
                            disabled: this.state.loading
                        }),
                        this.h('button', {
                            class: 'connect-button',
                            disabled: this.state.loading || !this.state.nickname
                        }, this.state.loading ? 'Connecting...' : 'Join Game')
                    )
                ),
                
                // Error message
                (this.state.error || this.error) ? this.h('div', { class: 'error-message' },
                    this.h('span', { class: 'error-icon' }, '⚠️'),
                    this.h('span', { class: 'error-text' }, this.state.error || this.error)
                ) : null,
                
                // Connection status
                this.connectionState !== 'disconnected' ? this.h('div', { class: 'connection-status' },
                    this.h('div', { class: `status-indicator ${this.connectionState}` }),
                    this.h('span', {}, this.getConnectionStatusText())
                ) : null,
                
                // Game rules
                this.h('div', { class: 'game-rules' },
                    this.h('h3', {}, 'Game Rules'),
                    this.h('ul', {},
                        this.h('li', {}, '2-4 players battle in an arena'),
                        this.h('li', {}, 'Each player starts with 3 lives'),
                        this.h('li', {}, 'Use bombs to destroy blocks and other players'),
                        this.h('li', {}, 'Collect power-ups to become stronger'),
                        this.h('li', {}, 'Last player standing wins!')
                    )
                )
            )
        );
    }
    
    getConnectionStatusText() {
        switch (this.connectionState) {
            case 'connecting':
                return 'Connecting to server...';
            case 'connected':
                return 'Connected! Joining game...';
            case 'reconnecting':
                return 'Reconnecting...';
            case 'error':
                return 'Connection failed';
            default:
                return '';
        }
    }
}