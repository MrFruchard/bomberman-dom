---
description: Check game performance and FPS monitoring
---

# Performance Check

Monitor and analyze game performance to ensure 60 FPS requirement.

## Browser Performance Tools
1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Play the game for 30 seconds
5. Stop recording and analyze

## FPS Monitoring Script
Add this to browser console during gameplay:
```javascript
// FPS Monitor
let fps = 0;
let lastTime = performance.now();
let frameCount = 0;

function measureFPS() {
  frameCount++;
  const currentTime = performance.now();
  
  if (currentTime - lastTime >= 1000) {
    fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    console.log(`FPS: ${fps}`);
    frameCount = 0;
    lastTime = currentTime;
  }
  
  requestAnimationFrame(measureFPS);
}

measureFPS();
```

## Performance Checklist
- [ ] Game maintains 60 FPS
- [ ] No frame drops during gameplay
- [ ] requestAnimationFrame used correctly
- [ ] No memory leaks
- [ ] DOM updates optimized