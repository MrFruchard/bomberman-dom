---
description: Push committed changes to remote repository
---

# Git Push

Push committed changes to the remote repository.

## Standard Push
```bash
echo "=== PUSHING TO REMOTE ==="
git push origin $(git branch --show-current)
```

## Push with Upstream
```bash
# Set upstream and push (for new branches)
git push -u origin $(git branch --show-current)
```

## Force Push (use with caution)
```bash
# Only use if you're sure about overwriting remote history
echo "WARNING: Force push will overwrite remote history"
echo "Are you sure? (type 'yes' to confirm)"
read -r confirmation
if [ "$confirmation" = "yes" ]; then
    git push --force-with-lease origin $(git branch --show-current)
else
    echo "Force push cancelled"
fi
```

## Pre-push Status
```bash
echo "=== PRE-PUSH STATUS ==="
echo "Current branch: $(git branch --show-current)"
echo "Commits to push:"
git log --oneline origin/$(git branch --show-current)..HEAD 2>/dev/null || git log --oneline -5

echo -e "\n=== REMOTE STATUS ==="
git remote -v
```

## Post-push Verification
```bash
echo "=== POST-PUSH VERIFICATION ==="
git status
echo "Latest commit: $(git log -1 --pretty=format:'%h - %s')"
```