---
description: Commit changes with a descriptive message
---

# Git Commit

Commit current changes with a descriptive message.

## Usage
```bash
# Add all changes
git add .

# Commit with message (replace with your message)
git commit -m "$ARGUMENTS"
```

## Common Commit Types
```bash
# Feature commits
git commit -m "feat: add multiplayer lobby system"
git commit -m "feat: implement bomb explosion mechanics"

# Bug fixes
git commit -m "fix: resolve WebSocket connection issues"
git commit -m "fix: correct player collision detection"

# Performance improvements
git commit -m "perf: optimize game loop for 60 FPS"
git commit -m "perf: reduce DOM manipulation overhead"

# Documentation
git commit -m "docs: update CLAUDE.md with game mechanics"
git commit -m "docs: add setup instructions"

# Framework changes
git commit -m "framework: enhance mini-framework state management"
git commit -m "framework: add router functionality"
```

## Pre-commit Check
```bash
echo "=== PRE-COMMIT CHECK ==="
echo "Files to be committed:"
git diff --cached --name-only

echo -e "\n=== COMMIT MESSAGE ==="
echo "Message: $ARGUMENTS"

echo -e "\n=== PROCEED WITH COMMIT? (y/n) ==="
```