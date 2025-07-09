---
description: Quick deployment - add, commit, and push changes
---

# Deploy Quick

Quick deployment workflow: add all changes, commit, and push to remote.

## Quick Deploy
```bash
echo "=== QUICK DEPLOY ==="
echo "Message: $ARGUMENTS"

# Check status
echo "Current status:"
git status --porcelain

# Add all changes
echo "Adding all changes..."
git add .

# Commit with message
echo "Committing with message: $ARGUMENTS"
git commit -m "$ARGUMENTS"

# Push to remote
echo "Pushing to remote..."
git push origin $(git branch --show-current)

echo "✅ Deploy complete!"
```

## Deploy with Checks
```bash
echo "=== DEPLOY WITH CHECKS ==="

# Pre-deploy checks
echo "1. Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
    echo "✅ Changes detected"
else
    echo "❌ No changes to deploy"
    exit 1
fi

# Show what will be committed
echo "2. Files to be committed:"
git diff --cached --name-only || git diff --name-only

# Commit and push
echo "3. Committing and pushing..."
git add .
git commit -m "$ARGUMENTS"
git push origin $(git branch --show-current)

echo "✅ Deploy with checks complete!"
```

## Deploy Examples
```bash
# Feature deployment
# /deploy-quick "feat: add player movement controls"

# Bug fix deployment  
# /deploy-quick "fix: resolve WebSocket connection timeout"

# Performance improvement
# /deploy-quick "perf: optimize game loop for consistent 60 FPS"

# Documentation update
# /deploy-quick "docs: update CLAUDE.md with new commands"
```