---
description: Check git status and repository state
---

# Git Status

Check the current git repository status and pending changes.

## Repository Status
```bash
echo "=== GIT STATUS ==="
git status

echo -e "\n=== RECENT COMMITS ==="
git log --oneline -10

echo -e "\n=== CURRENT BRANCH ==="
git branch -v

echo -e "\n=== REMOTE STATUS ==="
git remote -v
```

## Change Summary
```bash
echo "=== CHANGES SUMMARY ==="
echo "Modified files:"
git diff --name-only

echo -e "\nUntracked files:"
git ls-files --others --exclude-standard

echo -e "\nStaged files:"
git diff --cached --name-only
```

## Repository Info
```bash
echo "=== REPOSITORY INFO ==="
echo "Current branch: $(git branch --show-current)"
echo "Last commit: $(git log -1 --pretty=format:'%h - %s (%an, %ar)')"
echo "Remote URL: $(git config --get remote.origin.url)"
```