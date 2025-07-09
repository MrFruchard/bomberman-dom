---
description: Analyze codebase structure and identify areas for improvement
---

# Analyze Code

Analyze the current codebase implementation and identify areas for improvement.

## Framework Analysis
```bash
echo "=== MINI-FRAMEWORK ANALYSIS ==="
find mini-framework -name "*.js" -exec echo "=== {} ===" \; -exec head -20 {} \;
```

## Game Logic Analysis
```bash
echo "=== GAME LOGIC ANALYSIS ==="
find src -name "*.js" -exec echo "=== {} ===" \; -exec grep -n "class\|function\|export" {} \;
```

## Backend Analysis
```bash
echo "=== BACKEND ANALYSIS ==="
cd back && find . -name "*.go" -exec echo "=== {} ===" \; -exec grep -n "func\|type\|struct" {} \;
```

## Code Quality Check
```bash
echo "=== CODE QUALITY CHECK ==="
echo "JavaScript files:"
find . -name "*.js" -not -path "./node_modules/*" | wc -l
echo "Go files:"
find . -name "*.go" | wc -l
echo "Total lines of code:"
find . -name "*.js" -o -name "*.go" | grep -v node_modules | xargs wc -l | tail -1
```

## Performance Analysis
Areas to check:
- DOM manipulation frequency
- Event handler efficiency
- Memory usage patterns
- requestAnimationFrame implementation
- WebSocket message handling

## Architecture Review
- Component separation
- State management
- Event flow
- Error handling
- Code organization