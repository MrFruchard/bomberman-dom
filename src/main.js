// Main entry point for Multiplayer Bomberman
import Mini from '../mini-framework/index.js';
import MultiplayerBombermanApp from './MultiplayerBombermanApp.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Multiplayer Bomberman...');
    
    try {
        // Create and mount the main application
        const app = Mini.createApp(MultiplayerBombermanApp, '#app');
        
        console.log('Multiplayer Bomberman successfully initialized');
        
        // Expose app instance globally for debugging
        window.BombermanApp = app;
        window.Mini = Mini;
        
        // Global debug helpers
        window.getGameDebugInfo = () => {
            return app.getDebugInfo ? app.getDebugInfo() : 'Debug info not available';
        };
        
        window.getGameState = () => {
            return app.getGameState ? app.getGameState() : 'Game state not available';
        };
        
        window.getPerformanceInfo = () => {
            return app.getPerformanceInfo ? app.getPerformanceInfo() : 'Performance info not available';
        };
        
        // Development helpers
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Development mode detected - debug helpers available:');
            console.log('- window.BombermanApp: Main app instance');
            console.log('- window.Mini: Mini-framework instance');
            console.log('- window.getGameDebugInfo(): Get debug information');
            console.log('- window.getGameState(): Get current game state');
            console.log('- window.getPerformanceInfo(): Get performance metrics');
        }
        
    } catch (error) {
        console.error('Failed to initialize Multiplayer Bomberman:', error);
        
        // Show error message to user
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = `
                <div style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: #1a1a1a;
                    color: #ff4444;
                    font-family: Arial, sans-serif;
                    text-align: center;
                ">
                    <div>
                        <h1>⚠️ Failed to Initialize Game</h1>
                        <p>Error: ${error.message}</p>
                        <button onclick="window.location.reload()" style="
                            padding: 10px 20px;
                            background: #444;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            margin-top: 20px;
                        ">
                            Reload Page
                        </button>
                    </div>
                </div>
            `;
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    console.log('Page unloading, cleaning up...');
    
    // The app will handle its own cleanup in beforeUnmount
    if (window.BombermanApp && window.BombermanApp.forceDisconnect) {
        window.BombermanApp.forceDisconnect();
    }
});

// Handle errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Prevent context menu for a more game-like experience
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Prevent drag and drop
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
});

console.log('Multiplayer Bomberman main.js loaded');