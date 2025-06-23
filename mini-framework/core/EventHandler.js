export class EventHandler {
    constructor() {
        this.listeners = new Map(); // Map des écouteurs
        this.delegatedEvents = new Set(); // Événements délégués
        this.setupDelegation();
    }

    // Configuration de la délégation d'événements
    setupDelegation() {
        const commonEvents = ['click', 'change', 'input', 'submit', 'keydown', 'keyup'];

        commonEvents.forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                this.handleDelegatedEvent(e, eventType);
            }, true); // Capture phase pour une meilleure performance

            this.delegatedEvents.add(eventType);
        });
    }

    // Gérer les événements délégués
    handleDelegatedEvent(event, eventType) {
        let target = event.target;

        // Remonter dans le DOM pour trouver des éléments avec des listeners
        while (target && target !== document) {
            const key = this.getElementKey(target, eventType);

            if (this.listeners.has(key)) {
                const callbacks = this.listeners.get(key);

                callbacks.forEach(callback => {
                    try {
                        // Créer un objet événement enrichi
                        const enhancedEvent = this.createEnhancedEvent(event, target);
                        callback(enhancedEvent);
                    } catch (error) {
                        console.error('Erreur dans le handler d\'événement:', error);
                    }
                });

                // Empêcher la propagation si demandé
                if (event.defaultPrevented) {
                    break;
                }
            }

            target = target.parentElement;
        }
    }

    // Créer un événement enrichi avec des méthodes utiles
    createEnhancedEvent(originalEvent, target) {
        return {
            ...originalEvent,
            target,
            originalTarget: originalEvent.target,

            // Méthodes utiles
            stop() {
                originalEvent.stopPropagation();
                originalEvent.preventDefault();
            },

            prevent() {
                originalEvent.preventDefault();
            },

            stopPropagation() {
                originalEvent.stopPropagation();
            },

            // Getter pour les valeurs communes
            get value() {
                return target.value;
            },

            get checked() {
                return target.checked;
            },

            get key() {
                return originalEvent.key;
            },

            get keyCode() {
                return originalEvent.keyCode;
            }
        };
    }

    // Obtenir la clé unique pour un élément et un type d'événement
    getElementKey(element, eventType) {
        // Check if element is valid and has dataset
        if (!element || typeof element.getAttribute !== 'function') {
            return `invalid-${Date.now()}-${eventType}`;
        }

        // Utiliser un ID unique ou créer une clé basée sur les attributs
        const id = (element.dataset && element.dataset.eventId) ||
            element.id ||
            this.generateElementId(element);

        return `${id}-${eventType}`;
    }

    // Générer un ID unique pour un élément
    generateElementId(element) {
        if (!element._miniFrameworkId) {
            element._miniFrameworkId = `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return element._miniFrameworkId;
    }

    // Ajouter un écouteur d'événement
    on(element, eventType, callback) {
        const key = this.getElementKey(element, eventType);

        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }

        this.listeners.get(key).push(callback);

        // Ajouter un attribut pour identifier l'élément
        if (element && element.dataset && !element.dataset.eventId) {
            element.dataset.eventId = this.generateElementId(element);
        }

        console.log(`Écouteur ajouté: ${eventType} sur`, element);

        // Retourner une fonction pour supprimer l'écouteur
        return () => this.off(element, eventType, callback);
    }

    // Supprimer un écouteur d'événement
    off(element, eventType, callback) {
        const key = this.getElementKey(element, eventType);

        if (this.listeners.has(key)) {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);

            if (index > -1) {
                callbacks.splice(index, 1);

                // Supprimer la clé si plus de callbacks
                if (callbacks.length === 0) {
                    this.listeners.delete(key);
                }

                console.log(`Écouteur supprimé: ${eventType} sur`, element);
            }
        }
    }

    // Déclencher un événement personnalisé
    emit(element, eventType, detail = null) {
        const customEvent = new CustomEvent(eventType, {
            detail,
            bubbles: true,
            cancelable: true
        });

        element.dispatchEvent(customEvent);
    }

    // Ajouter des méthodes de convenance pour les événements courants
    onClick(element, callback) {
        return this.on(element, 'click', callback);
    }

    onChange(element, callback) {
        return this.on(element, 'change', callback);
    }

    onInput(element, callback) {
        return this.on(element, 'input', callback);
    }

    onSubmit(element, callback) {
        return this.on(element, 'submit', callback);
    }

    onKeyDown(element, callback) {
        return this.on(element, 'keydown', callback);
    }

    onKeyUp(element, callback) {
        return this.on(element, 'keyup', callback);
    }

    // Débounce pour les événements fréquents
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle pour les événements de scroll/resize
    throttle(func, limit = 100) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}