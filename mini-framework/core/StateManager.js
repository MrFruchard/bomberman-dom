export class StateManager {
    constructor() {
        this.state = {}; // L'état global de l'application
        this.listeners = new Map(); // Map des écouteurs par clé d'état
        this.history = []; // Historique des états (pour debug)
    }

    // Définit une valeur dans l'état
    setState(key, value) {
        const oldValue = this.state[key];

        // Sauvegarder l'ancien état
        this.history.push({ ...this.state });

        // Mettre à jour l'état
        this.state[key] = value;

        // Notifier les écouteurs
        this.notifyListeners(key, value, oldValue);

        console.log(`État mis à jour: ${key}`, { old: oldValue, new: value });
    }

    // Récupère une valeur de l'état
    getState(key) {
        return key ? this.state[key] : this.state;
    }

    // Subscribe à des changements d'état
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }

        this.listeners.get(key).push(callback);

        // Retourner une fonction pour se désabonner
        return () => {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    // Notifie tous les écouteurs d'une clé
    notifyListeners(key, newValue, oldValue) {
        const callbacks = this.listeners.get(key) || [];
        callbacks.forEach(callback => {
            try {
                callback(newValue, oldValue);
            } catch (error) {
                console.error(`Erreur dans le listener pour ${key}:`, error);
            }
        });
    }

    // Actions pour modifier l'état (comme Redux)
    dispatch(action) {
        console.log('Action dispatchée:', action);

        switch (action.type) {
            case 'ADD_TODO':
                const todos = this.getState('todos') || [];
                this.setState('todos', [...todos, action.payload]);
                break;

            case 'TOGGLE_TODO':
                const currentTodos = this.getState('todos') || [];
                const updatedTodos = currentTodos.map(todo =>
                    todo.id === action.payload.id
                        ? { ...todo, completed: !todo.completed }
                        : todo
                );
                this.setState('todos', updatedTodos);
                break;

            case 'DELETE_TODO':
                const remainingTodos = (this.getState('todos') || [])
                    .filter(todo => todo.id !== action.payload.id);
                this.setState('todos', remainingTodos);
                break;

            case 'SET_FILTER':
                this.setState('filter', action.payload);
                break;

            case 'CLEAR_COMPLETED':
                const activeTodos = (this.getState('todos') || [])
                    .filter(todo => !todo.completed);
                this.setState('todos', activeTodos);
                break;

            default:
                console.warn('Action non reconnue:', action.type);
        }
    }

    // Reset l'état
    reset() {
        this.state = {};
        this.listeners.clear();
        this.history = [];
    }

    // Fonction utilitaire pour créer des actions
    static createAction(type, payload = null) {
        return { type, payload };
    }
}