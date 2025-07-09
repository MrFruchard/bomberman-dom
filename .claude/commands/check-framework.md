---
description: Check and test the custom mini-framework
---

# Check Mini-Framework

Validates the custom mini-framework components and functionality.

## Check Framework Structure
```bash
find mini-framework -name "*.js" -type f | head -10
```

## Test Framework Loading
Open browser console and run:
```javascript
// Test framework initialization
console.log('Mini-framework loaded:', typeof window.Mini);
console.log('Components available:', window.Mini.components);
```

## Validate Core Components
```bash
echo "Checking core framework files..."
ls -la mini-framework/core/
```

Key files to verify:
- `Component.js` - Base component class
- `VirtualDOM.js` - Virtual DOM implementation  
- `StateManager.js` - State management
- `Router.js` - Client-side routing
- `EventHandler.js` - Event management