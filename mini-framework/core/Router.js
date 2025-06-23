export class Router {
    constructor() {
        this.routes = new Map(); // Map des routes
        this.currentRoute = null; // Route actuelle
        this.listeners = []; // Écouteurs de changement de route

        // Écouter les changements d'URL
        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });
        
        // Écouter les changements de hash pour TodoMVC
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        // Écouter les clics sur les liens
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]')) {
                e.preventDefault();
                const route = e.target.getAttribute('data-route');
                this.navigate(route);
            }
        });
    }

    // Définir une route
    addRoute(path, handler) {
        // Convertir le path en regex pour gérer les paramètres
        const paramNames = [];
        const regexPath = path.replace(/:([^/]+)/g, (match, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        });

        this.routes.set(path, {
            handler,
            regex: new RegExp(`^${regexPath}$`),
            paramNames
        });

        console.log(`Route ajoutée: ${path}`);
    }

    // Naviguer vers une route
    navigate(path) {
        if (this.currentRoute !== path) {
            this.currentRoute = path;

            // Mettre à jour l'URL avec hash pour TodoMVC
            window.location.hash = path;

            // Ne pas appeler handleRouteChange car hashchange va se déclencher
        }
    }

    // Gérer le changement de route
    handleRouteChange() {
        // Utiliser le hash pour TodoMVC (#/active) ou par défaut '/'
        const path = window.location.hash ? window.location.hash.slice(1) : '/';
        this.currentRoute = path;

        // Trouver la route correspondante
        const matchedRoute = this.findMatchingRoute(path);

        if (matchedRoute) {
            const { handler, params } = matchedRoute;

            // Exécuter le handler de la route
            try {
                handler(params);
            } catch (error) {
                console.error('Erreur dans le handler de route:', error);
            }
        } else {
            console.warn('Route non trouvée:', path);
            // Gérer la route 404
            this.handle404();
        }

        // Notifier les écouteurs
        this.notifyListeners(path);
    }

    // Trouver la route qui correspond au path
    findMatchingRoute(path) {
        for (const [routePath, routeConfig] of this.routes) {
            const match = path.match(routeConfig.regex);

            if (match) {
                // Extraire les paramètres
                const params = {};
                routeConfig.paramNames.forEach((paramName, index) => {
                    params[paramName] = match[index + 1];
                });

                return {
                    handler: routeConfig.handler,
                    params
                };
            }
        }

        return null;
    }

    // Gérer les routes 404
    handle404() {
        console.log('Page non trouvée - 404');
        // Tu peux ajouter ici la logique pour afficher une page 404
    }

    // S'abonner aux changements de route
    onRouteChange(callback) {
        this.listeners.push(callback);

        // Retourner une fonction pour se désabonner
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // Notifier les écouteurs
    notifyListeners(path) {
        this.listeners.forEach(callback => {
            try {
                callback(path);
            } catch (error) {
                console.error('Erreur dans le listener de route:', error);
            }
        });
    }

    // Démarrer le routeur
    start() {
        // Gérer la route initiale
        this.handleRouteChange();
    }

    // Obtenir la route actuelle
    getCurrentRoute() {
        return this.currentRoute || window.location.pathname;
    }

    // Obtenir les paramètres de query string
    getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};

        for (const [key, value] of params) {
            result[key] = value;
        }

        return result;
    }
}