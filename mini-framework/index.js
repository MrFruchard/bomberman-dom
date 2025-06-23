import { VirtualDOM } from './core/VirtualDOM.js';
import { StateManager } from './core/StateManager.js';
import { Router } from './core/Router.js';
import { EventHandler } from './core/EventHandler.js';
import { Component } from './core/Component.js';

// Classe principale du framework
class MiniFramework {
    constructor() {
        this.vdom = new VirtualDOM();
        this.state = new StateManager();
        this.router = new Router();
        this.events = new EventHandler();

        this.components = new Map(); // Registry des composants
        this.app = null; // Composant racine

        console.log('MiniFramework initialisé');
    }

    // Créer une application
    createApp(rootComponent, container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (!container) {
            throw new Error('Container non trouvé');
        }

        this.app = new rootComponent();
        this.app.mount(container);

        // Démarrer le routeur
        this.router.start();

        console.log('Application démarrée');
        return this.app;
    }

    // Enregistrer un composant
    component(name, componentClass) {
        this.components.set(name, componentClass);
        console.log(`Composant enregistré: ${name}`);
    }

    // Obtenir un composant enregistré
    getComponent(name) {
        return this.components.get(name);
    }

    // Fonction helper pour créer des éléments (comme React.createElement)
    createElement(tag, attrs = {}, ...children) {
        return this.vdom.createElement(tag, attrs, ...children);
    }

    // Alias court pour createElement
    h(tag, attrs = {}, ...children) {
        return this.createElement(tag, attrs, ...children);
    }

    // Render directement dans le DOM
    render(vnode, container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        return this.vdom.render(vnode, container);
    }

    // Créer une action pour le state manager
    createAction(type, payload = null) {
        return StateManager.createAction(type, payload);
    }

    // Méthodes de convenance pour l'état global
    getState(key) {
        return this.state.getState(key);
    }

    setState(key, value) {
        return this.state.setState(key, value);
    }

    subscribe(key, callback) {
        return this.state.subscribe(key, callback);
    }

    dispatch(action) {
        return this.state.dispatch(action);
    }

    // Méthodes de convenance pour le routage
    navigate(path) {
        return this.router.navigate(path);
    }

    addRoute(path, handler) {
        return this.router.addRoute(path, handler);
    }

    onRouteChange(callback) {
        return this.router.onRouteChange(callback);
    }

    // Méthodes de convenance pour les événements
    on(element, eventType, callback) {
        return this.events.on(element, eventType, callback);
    }

    off(element, eventType, callback) {
        return this.events.off(element, eventType, callback);
    }

    emit(element, eventType, detail) {
        return this.events.emit(element, eventType, detail);
    }
}

// Créer l'instance globale
const Mini = new MiniFramework();

// Exposer globalement
window.MiniFramework = Mini;
window.Mini = Mini; // Alias court

// Export pour les modules ES6
export default Mini;
export { Component };

// Export des classes individuelles si nécessaire
export { VirtualDOM, StateManager, Router, EventHandler };