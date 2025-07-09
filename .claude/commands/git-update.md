---
description: Update local repository with remote changes
---

# Git Update

Update the local repository with the latest changes from remote.

## Pull Latest Changes
```bash
echo "=== UPDATING FROM REMOTE ==="
git fetch origin
git pull origin $(git branch --show-current)
```

## Safe Update with Stash
```bash
echo "=== SAFE UPDATE (with stash) ==="
# Stash any local changes
git stash push -m "Auto-stash before update"

# Pull latest changes
git pull origin $(git branch --show-current)

# Pop stashed changes back
git stash pop
```

## Update Status
```bash
echo "=== UPDATE STATUS ==="
echo "Current branch: $(git branch --show-current)"
echo "Latest commit: $(git log -1 --pretty=format:'%h - %s (%an, %ar)')"

echo -e "\n=== BRANCH STATUS ==="
git status
```

## Check for Conflicts
```bash
echo "=== CONFLICT CHECK ==="
if git diff --name-only --diff-filter=U | grep -q .; then
    echo "⚠️  CONFLICTS DETECTED:"
    git diff --name-only --diff-filter=U
    echo "Resolve conflicts before continuing"
else
    echo "✅ No conflicts detected"
fi
```

## Sync All Branches
```bash
echo "=== SYNC ALL BRANCHES ==="
git fetch --all
git branch -r | grep -v '\->' | while read remote; do
    git branch --track "${remote#origin/}" "$remote" 2>/dev/null || true
done
```