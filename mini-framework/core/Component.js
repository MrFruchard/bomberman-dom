export class Component {
    constructor(props = {}) {
        this.props = props;
        this.state = {};
        this.element = null;
        this.vdom = null;
        this.mounted = false;
        this.children = [];

        // Binding automatique des méthodes
        this.bindMethods();
    }

    // Bind automatique des méthodes pour éviter les problèmes de contexte
    bindMethods() {
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        methods.forEach(method => {
            if (typeof this[method] === 'function' && method !== 'constructor') {
                this[method] = this[method].bind(this);
            }
        });
    }

    // Mettre à jour l'état local du composant
    setState(newState) {
        const prevState = { ...this.state };

        // Merger le nouvel état
        this.state = { ...this.state, ...newState };

        console.log(`État du composant mis à jour:`, {
            prev: prevState,
            new: this.state
        });

        // Re-render si le composant est monté
        if (this.mounted) {
            this.update();
        }
    }

    // Méthode de rendu (à override dans les classes filles)
    render() {
        return this.h('div', {}, 'Composant de base');
    }

    // Helper pour créer des éléments virtuels (comme React.createElement)
    h(tag, attrs = {}, ...children) {
        return {
            tag,
            attrs,
            children: children.flat().filter(child => child !== null && child !== undefined)
        };
    }

    // Monter le composant dans le DOM
    mount(container) {
        if (this.mounted) {
            console.warn('Composant déjà monté');
            return;
        }

        // Appeler lifecycle method
        this.beforeMount();

        // Générer le VDOM
        this.vdom = this.render();

        // Créer l'élément DOM
        this.element = window.MiniFramework.vdom.createDOMElement(this.vdom);

        // Ajouter au container
        container.appendChild(this.element);

        this.mounted = true;

        // Appeler lifecycle method
        this.afterMount();

        console.log('Composant monté:', this.constructor.name);
    }

    // Mettre à jour le composant
    update() {
        if (!this.mounted) {
            return;
        }

        // Appeler lifecycle method
        this.beforeUpdate();

        // Générer le nouveau VDOM
        const newVdom = this.render();

        // Calculer les différences
        const patches = window.MiniFramework.vdom.diff(this.vdom, newVdom);

        // Appliquer les patches
        window.MiniFramework.vdom.patch(this.element, patches);

        // Mettre à jour le VDOM courant
        this.vdom = newVdom;

        // Appeler lifecycle method
        this.afterUpdate();
    }

    // Démonter le composant
    unmount() {
        if (!this.mounted) {
            return;
        }

        // Appeler lifecycle method
        this.beforeUnmount();

        // Supprimer du DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        this.mounted = false;
        this.element = null;
        this.vdom = null;

        // Appeler lifecycle method
        this.afterUnmount();

        console.log('Composant démonté:', this.constructor.name);
    }

    // Lifecycle methods (à override si nécessaire)
    beforeMount() {}
    afterMount() {}
    beforeUpdate() {}
    afterUpdate() {}
    beforeUnmount() {}
    afterUnmount() {}

    // Méthodes utilitaires

    // Trouve un enfant par sélecteur
    find(selector) {
        return this.element ? this.element.querySelector(selector) : null;
    }

    // Trouve tous les enfants par sélecteur
    findAll(selector) {
        return this.element ? this.element.querySelectorAll(selector) : [];
    }

    // Ajouter un écouteur d'événement
    addEventListener(selector, eventType, callback) {
        const element = typeof selector === 'string' ? this.find(selector) : selector;
        if (element) {
            return window.MiniFramework.events.on(element, eventType, callback);
        }
        return null;
    }

    // Émettre un événement personnalisé
    emit(eventName, detail = null) {
        if (this.element) {
            window.MiniFramework.events.emit(this.element, eventName, detail);
        }
    }
}