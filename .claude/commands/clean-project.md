---
description: Clean up project files and reset development environment
---

# Clean Project

Clean up temporary files and reset the development environment.

## Clean Backend
```bash
cd back
rm -f bomberman-server
rm -f json_directory/scores.json.bak
go clean
go mod tidy
```

## Clean Frontend
```bash
# No build artifacts to clean for frontend
echo "Frontend uses direct HTML/JS - no build artifacts"
```

## Reset Game Data
```bash
# Backup current scores
cp back/json_directory/scores.json back/json_directory/scores.json.bak 2>/dev/null || true

# Reset scores (optional)
# echo "[]" > back/json_directory/scores.json
```

## Clean Development Files
```bash
# Remove any temporary files
find . -name "*.tmp" -delete
find . -name "*.log" -delete
find . -name ".DS_Store" -delete
```

## Reset Git State (if needed)
```bash
# Check git status
git status

# Clean untracked files (be careful!)
# git clean -fd
```

## Process Cleanup
```bash
# Kill any running servers
pkill -f "go run"
pkill -f "python -m http.server"
pkill -f "http-server"

echo "Project cleaned successfully"
```