---
description: Branch management - create, switch, and manage branches
---

# Git Branch

Manage git branches for feature development and organization.

## Create and Switch to New Branch
```bash
# Create new branch from current
git checkout -b $ARGUMENTS

# Or create from specific branch
# git checkout -b new-feature main
```

## Branch Operations
```bash
echo "=== BRANCH OPERATIONS ==="

# List all branches
echo "All branches:"
git branch -a

# Show current branch
echo -e "\nCurrent branch: $(git branch --show-current)"

# Show branch tracking info
echo -e "\nBranch tracking:"
git branch -vv
```

## Switch Branch
```bash
# Switch to existing branch
git checkout $ARGUMENTS

# Switch with stash (if you have uncommitted changes)
git stash push -m "Auto-stash before branch switch"
git checkout $ARGUMENTS
```

## Branch Management
```bash
echo "=== BRANCH MANAGEMENT ==="

# Delete merged branch
# git branch -d branch-name

# Delete unmerged branch (force)
# git branch -D branch-name

# Delete remote branch
# git push origin --delete branch-name

# Rename current branch
# git branch -m new-name
```

## Common Branch Patterns
```bash
# Feature branches
git checkout -b feature/multiplayer-lobby
git checkout -b feature/bomb-mechanics
git checkout -b feature/power-ups

# Bug fix branches
git checkout -b fix/websocket-connection
git checkout -b fix/collision-detection

# Performance branches
git checkout -b perf/optimize-game-loop
git checkout -b perf/reduce-dom-updates

# Documentation branches
git checkout -b docs/update-readme
git checkout -b docs/add-api-docs
```