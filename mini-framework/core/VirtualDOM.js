// src/core/VirtualDOM.js

export class VirtualDOM {
    constructor() {
        this.currentVDOM = null; // Le VDOM actuel
        this.rootElement = null; // L'élément racine du DOM réel
    }

    // Crée un élément virtuel (VNode)
    createElement(tag, attrs = {}, ...children) {
        return {
            tag,           // nom de la balise (div, p, button...)
            attrs,         // attributs (class, id, onclick...)
            children: children.flat() // enfants (autres éléments ou texte)
        };
    }

    // Convertit un VNode en élément DOM réel
    createDOMElement(vnode) {
        // Si c'est du texte simple
        if (typeof vnode === 'string' || typeof vnode === 'number') {
            return document.createTextNode(vnode);
        }

        // Si c'est null ou undefined
        if (!vnode) {
            return document.createTextNode('');
        }

        // Créer l'élément HTML
        const element = document.createElement(vnode.tag);

        // Ajouter les attributs
        if (vnode.attrs) {
            Object.keys(vnode.attrs).forEach(key => {
                if (key.startsWith('on')) {
                    // Gestion des événements (onclick, onchange...)
                    const eventName = key.slice(2).toLowerCase();
                    element.addEventListener(eventName, vnode.attrs[key]);
                } else {
                    // Attributs normaux (class, id, value...)
                    element.setAttribute(key, vnode.attrs[key]);
                }
            });
        }

        // Ajouter les enfants récursivement
        if (vnode.children) {
            vnode.children.forEach(child => {
                const childElement = this.createDOMElement(child);
                element.appendChild(childElement);
            });
        }

        return element;
    }

    // Compare deux VNodes et retourne les différences
    diff(oldVNode, newVNode) {
        const patches = [];

        // Si c'est du texte simple
        if (typeof oldVNode === 'string' || typeof oldVNode === 'number' ||
            typeof newVNode === 'string' || typeof newVNode === 'number') {
            if (oldVNode !== newVNode) {
                patches.push({
                    type: 'REPLACE',
                    oldVNode,
                    newVNode
                });
            }
            return patches;
        }

        // Si les nodes sont différents types ou null/undefined
        if (!oldVNode || !newVNode || oldVNode.tag !== newVNode.tag) {
            patches.push({
                type: 'REPLACE',
                oldVNode,
                newVNode
            });
            return patches;
        }

        // Comparer les attributs
        const attrPatches = this.diffAttributes(oldVNode.attrs || {}, newVNode.attrs || {});
        if (attrPatches.length > 0) {
            // Vérifier s'il y a des changements d'événements
            const hasEventChanges = attrPatches.some(patch => 
                patch.key && patch.key.startsWith('on')
            );
            
            if (hasEventChanges) {
                // Force un remplacement complet pour les changements d'événements
                patches.push({
                    type: 'REPLACE',
                    oldVNode,
                    newVNode
                });
                return patches;
            }
            
            patches.push({
                type: 'ATTRIBUTES',
                patches: attrPatches,
                newVNode: newVNode
            });
        }

        // Comparer les enfants
        const childPatches = this.diffChildren(oldVNode.children || [], newVNode.children || []);
        if (childPatches.length > 0) {
            patches.push({
                type: 'CHILDREN',
                patches: childPatches
            });
        }

        return patches;
    }

    // Compare les attributs de deux VNodes
    diffAttributes(oldAttrs, newAttrs) {
        const patches = [];

        // Vérifier les nouveaux attributs ou ceux modifiés
        Object.keys(newAttrs).forEach(key => {
            if (oldAttrs[key] !== newAttrs[key]) {
                patches.push({
                    type: 'SET_ATTR',
                    key,
                    value: newAttrs[key]
                });
            }
        });

        // Vérifier les attributs supprimés
        Object.keys(oldAttrs).forEach(key => {
            if (!(key in newAttrs)) {
                patches.push({
                    type: 'REMOVE_ATTR',
                    key
                });
            }
        });

        return patches;
    }

    // Compare les enfants de deux VNodes
    diffChildren(oldChildren, newChildren) {
        const patches = [];
        const maxLength = Math.max(oldChildren.length, newChildren.length);

        for (let i = 0; i < maxLength; i++) {
            const oldChild = oldChildren[i];
            const newChild = newChildren[i];

            if (!oldChild && newChild) {
                // Nouvel enfant ajouté
                patches.push({
                    type: 'ADD_CHILD',
                    index: i,
                    vnode: newChild
                });
            } else if (oldChild && !newChild) {
                // Enfant supprimé
                patches.push({
                    type: 'REMOVE_CHILD',
                    index: i
                });
            } else if (oldChild && newChild) {
                // Enfant modifié
                const childPatches = this.diff(oldChild, newChild);
                if (childPatches.length > 0) {
                    patches.push({
                        type: 'UPDATE_CHILD',
                        index: i,
                        patches: childPatches
                    });
                }
            }
        }

        return patches;
    }

    // Applique les patches au DOM réel
    patch(element, patches) {
        if (!patches || !Array.isArray(patches)) return;
        
        patches.forEach(patch => {
            switch (patch.type) {
                case 'REPLACE':
                    const newElement = this.createDOMElement(patch.newVNode);
                    if (element.parentNode) {
                        element.parentNode.replaceChild(newElement, element);
                    }
                    break;

                case 'ATTRIBUTES':
                    if (patch.patches) {
                        const success = this.patchAttributes(element, patch.patches);
                        if (!success) {
                            // Recréer l'élément si les événements ont changé
                            const newElement = this.createDOMElement(patch.newVNode || this.currentVDOM);
                            if (element.parentNode) {
                                element.parentNode.replaceChild(newElement, element);
                            }
                        }
                    }
                    break;

                case 'CHILDREN':
                    if (patch.patches) {
                        this.patchChildren(element, patch.patches);
                    }
                    break;
            }
        });
    }

    // Applique les patches d'attributs
    patchAttributes(element, patches) {
        // Vérifier s'il y a des changements d'événements
        const hasEventChanges = patches.some(patch => 
            patch.key && patch.key.startsWith('on')
        );
        
        // Si il y a des changements d'événements, recréer l'élément est plus sûr
        if (hasEventChanges) {
            return false; // Indique qu'il faut recréer l'élément
        }
        
        patches.forEach(patch => {
            switch (patch.type) {
                case 'SET_ATTR':
                    element.setAttribute(patch.key, patch.value);
                    break;

                case 'REMOVE_ATTR':
                    element.removeAttribute(patch.key);
                    break;
            }
        });
        
        return true; // Patch réussi
    }

    // Applique les patches d'enfants
    patchChildren(element, patches) {
        patches.forEach(patch => {
            switch (patch.type) {
                case 'ADD_CHILD':
                    const newChild = this.createDOMElement(patch.vnode);
                    element.appendChild(newChild);
                    break;

                case 'REMOVE_CHILD':
                    element.removeChild(element.children[patch.index]);
                    break;

                case 'UPDATE_CHILD':
                    if (element.children[patch.index] && patch.patches) {
                        this.patch(element.children[patch.index], patch.patches);
                    }
                    break;
            }
        });
    }

    // Fonction principale pour render
    render(vnode, container) {
        if (!this.currentVDOM) {
            // Premier render
            this.rootElement = this.createDOMElement(vnode);
            container.appendChild(this.rootElement);
            this.currentVDOM = vnode;
        } else {
            // Re-render avec diff
            const patches = this.diff(this.currentVDOM, vnode);
            this.patch(this.rootElement, patches);
            this.currentVDOM = vnode;
        }
    }
}