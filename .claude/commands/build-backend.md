---
description: Build the Go backend server
---

# Build Backend

Builds the Go backend server for deployment.

```bash
cd back && go build -o bomberman-server .
```

This creates an executable `bomberman-server` in the back directory.

To run the built server:
```bash
cd back && ./bomberman-server
```