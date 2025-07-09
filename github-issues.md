# GitHub Issues for Bomberman-DOM Project

## 🚨 CRITICAL AUDIT ISSUES

### Issue #1: Framework Compliance - Ensure Only Mini-Framework Used
**Labels:** `audit`, `critical`, `framework`
**Priority:** CRITICAL

**Description:**
Verify that the mini-framework is the ONLY technology/framework used to develop the project. No Canvas, WebGL, or other frameworks are allowed.

**Acceptance Criteria:**
- [ ] Code review shows only mini-framework imports/usage
- [ ] No Canvas elements in HTML/JS
- [ ] No WebGL usage  
- [ ] No external frameworks (React, Vue, etc.)
- [ ] All game rendering uses DOM manipulation only

**Priority:** This is a mandatory audit requirement.

---

### Issue #2: Nickname Entry Flow Implementation
**Labels:** `audit`, `critical`, `ui`
**Priority:** CRITICAL

**Description:**
When users open the game, they should be asked for a nickname before accessing any other features.

**Acceptance Criteria:**
- [ ] First screen shows nickname input form
- [ ] Nickname validation (2-20 characters, alphanumeric + underscore/dash)
- [ ] Error handling for invalid nicknames
- [ ] Cannot proceed without valid nickname
- [ ] Nickname is stored and used throughout game session

**Test Steps:**
1. Open game in browser
2. Verify nickname entry screen appears first
3. Test invalid inputs (empty, too short, too long, special chars)
4. Test valid nickname progression

---

### Issue #3: Waiting Room with Player Counter
**Labels:** `audit`, `critical`, `multiplayer`
**Priority:** CRITICAL

**Description:**
After entering nickname, users should be redirected to a waiting page with a player counter.

**Acceptance Criteria:**
- [ ] Waiting room displays after nickname entry
- [ ] Player counter shows current/max players (X/4)
- [ ] Visual progress bar or indicator
- [ ] Counter increments when new players join
- [ ] Counter decrements when players leave
- [ ] List of current players displayed

**Test Steps:**
1. Enter valid nickname
2. Verify redirect to waiting room
3. Open multiple browser windows to test counter
4. Check counter updates in real-time

---

### Issue #4: Real-time Chat System
**Labels:** `audit`, `critical`, `websocket`, `chat`
**Priority:** CRITICAL

**Description:**
Players should have access to a chat system during waiting and gameplay phases.

**Acceptance Criteria:**
- [ ] Chat accessible in waiting room
- [ ] Chat accessible during gameplay
- [ ] Real-time message delivery via WebSocket
- [ ] All users can see all messages
- [ ] Message history preserved during session
- [ ] Input validation (character limits, no empty messages)
- [ ] Player names displayed with messages
- [ ] Timestamps on messages

**Test Steps:**
1. Join waiting room with multiple users
2. Send messages from different browsers
3. Verify all users see messages in real-time
4. Test during gameplay phase

---

### Issue #5: Timer System - 20s Wait + 10s Countdown
**Labels:** `audit`, `critical`, `timer`, `multiplayer`
**Priority:** CRITICAL

**Description:**
Implement the specified timer logic for game start.

**Acceptance Criteria:**
- [ ] With 2+ players: 20-second wait timer starts
- [ ] If no new players join within 20s: 10-second countdown begins
- [ ] With 4 players: 10-second countdown starts immediately
- [ ] Timers displayed to all players
- [ ] Real-time timer updates
- [ ] Game starts automatically after countdown

**Test Scenarios:**
1. Join with 2 players, wait 20 seconds → countdown starts
2. Join with 4 players → countdown starts immediately
3. Join 3rd player during 20s wait → continues waiting
4. Join 4th player during 20s wait → countdown starts

---

### Issue #6: Game Mechanics - Movement and Controls
**Labels:** `audit`, `critical`, `gameplay`
**Priority:** CRITICAL

**Description:**
Players must be able to move and place bombs during gameplay.

**Acceptance Criteria:**
- [ ] Arrow key movement (or WASD)
- [ ] Smooth movement without frame drops
- [ ] Collision detection with walls/blocks
- [ ] Spacebar to place bombs
- [ ] Movement visible to all players in real-time
- [ ] Movement bounds checking
- [ ] No clipping through obstacles

**Test Steps:**
1. Start game with multiple players
2. Test movement in all directions
3. Test collision with walls and blocks
4. Verify movement synchronizes across clients

---

### Issue #7: Bomb System and Explosions
**Labels:** `audit`, `critical`, `gameplay`
**Priority:** CRITICAL

**Description:**
Implement bomb placement, timer, and explosion mechanics.

**Acceptance Criteria:**
- [ ] Bombs placed at player position
- [ ] 3-second bomb timer before explosion
- [ ] Visual bomb countdown/flashing
- [ ] Explosion destroys destructible blocks
- [ ] Explosion damages players in range
- [ ] Explosion range configurable by power-ups
- [ ] Multiple bombs per player (with power-ups)

**Test Steps:**
1. Place bomb next to destructible block → block should be destroyed
2. Place bomb next to player → player should lose life
3. Test bomb timer accuracy
4. Test multiple bomb placement

---

### Issue #8: Lives System - 3 Lives Per Player
**Labels:** `audit`, `critical`, `gameplay`
**Priority:** CRITICAL

**Description:**
Each player starts with 3 lives and is eliminated when all lives are lost.

**Acceptance Criteria:**
- [ ] Players start with 3 lives
- [ ] Lives decrease when hit by explosion
- [ ] Player eliminated at 0 lives
- [ ] Lives displayed in UI
- [ ] Dead players cannot move/place bombs
- [ ] Game ends when only 1 player remains

**Test Steps:**
1. Verify UI shows 3 lives at start
2. Get hit by explosion → lives decrease
3. Lose all lives → player eliminated
4. Verify eliminated player cannot interact

---

### Issue #9: Full Map Visibility
**Labels:** `audit`, `critical`, `ui`
**Priority:** CRITICAL

**Description:**
All players must be able to see the whole map at once.

**Acceptance Criteria:**
- [ ] Entire map visible on screen
- [ ] No scrolling required
- [ ] All players see identical map view
- [ ] Map fits within viewport
- [ ] Clear visibility of all game elements

**Test Steps:**
1. Start game
2. Verify entire map visible without scrolling
3. Check on different screen sizes
4. Verify all players see same view

---

### Issue #10: Power-up System
**Labels:** `audit`, `critical`, `gameplay`
**Priority:** CRITICAL

**Description:**
Power-ups should appear when blocks are destroyed and provide enhancements.

**Acceptance Criteria:**
- [ ] Power-ups spawn from destroyed blocks (random chance)
- [ ] At least 3 types: Bombs, Flames, Speed
- [ ] Bombs: Increases simultaneous bomb count
- [ ] Flames: Increases explosion range
- [ ] Speed: Increases movement speed
- [ ] Visual indication of power-up type
- [ ] Power-ups collected by walking over them
- [ ] Effects applied immediately

**Test Steps:**
1. Destroy multiple blocks → power-ups appear
2. Collect each power-up type
3. Verify effects are applied
4. Test power-up stacking

---

### Issue #11: Performance - 60 FPS Requirement
**Labels:** `audit`, `critical`, `performance`
**Priority:** CRITICAL

**Description:**
Game must run at 60 FPS without frame drops.

**Acceptance Criteria:**
- [ ] Consistent 60 FPS during gameplay
- [ ] No frame drops during animations
- [ ] Proper use of requestAnimationFrame
- [ ] Performance monitoring implemented
- [ ] Optimized DOM updates
- [ ] Memory usage remains stable

**Test Steps:**
1. Open browser dev tools → Performance tab
2. Record during active gameplay
3. Verify 60 FPS maintained
4. Check for frame drops
5. Monitor memory usage over time

---

## 🐛 BUG TRACKING ISSUES

### Issue #12: WebSocket Connection Handling
**Labels:** `bug`, `websocket`, `connection`

**Description:**
Improve WebSocket connection reliability and error handling.

**Tasks:**
- [ ] Handle connection timeouts
- [ ] Implement automatic reconnection
- [ ] Better error messages for connection failures
- [ ] Connection status indicator
- [ ] Graceful degradation when server unavailable

---

### Issue #13: Component State Synchronization
**Labels:** `bug`, `state`, `framework`

**Description:**
Ensure component props update properly when state changes.

**Tasks:**
- [ ] Fix component re-rendering issues
- [ ] Implement proper prop updates
- [ ] Add component lifecycle debugging
- [ ] Memory leak prevention in components

---

### Issue #14: Game State Consistency
**Labels:** `bug`, `multiplayer`, `sync`

**Description:**
Ensure all players see consistent game state.

**Tasks:**
- [ ] Fix player position desync
- [ ] Improve bomb placement synchronization
- [ ] Handle edge cases in explosion timing
- [ ] Add conflict resolution for simultaneous actions

---

## 🚀 ENHANCEMENT ISSUES (BONUS FEATURES)

### Issue #15: Solo + Co-Op Mode with AI
**Labels:** `enhancement`, `ai`, `bonus`
**Priority:** LOW

**Description:**
Implement AI opponents for single-player and cooperative modes.

**Tasks:**
- [ ] Basic AI movement patterns
- [ ] AI bomb placement strategy
- [ ] Difficulty levels
- [ ] Co-op mode where players vs AI

---

### Issue #16: Extended Power-ups System
**Labels:** `enhancement`, `gameplay`, `bonus`
**Priority:** LOW

**Description:**
Add bonus power-ups beyond the basic three.

**Power-ups to implement:**
- [ ] Bomb Push: Throw bombs after placement
- [ ] Bomb Pass: Walk through bombs
- [ ] Block Pass: Walk through blocks (not walls)
- [ ] Detonator: Manual bomb detonation
- [ ] 1 Up: Extra life
- [ ] Power-up drops on death

---

### Issue #17: Team Mode (2v2)
**Labels:** `enhancement`, `multiplayer`, `bonus`
**Priority:** LOW

**Description:**
Implement team-based gameplay with 2v2 matches.

**Tasks:**
- [ ] Team selection UI
- [ ] Team-based spawn positions
- [ ] Friendly fire toggle
- [ ] Team victory conditions
- [ ] Team chat channels

---

### Issue #18: Ghost Mode After Death
**Labels:** `enhancement`, `gameplay`, `bonus`
**Priority:** LOW

**Description:**
Allow dead players to continue as ghosts with revival mechanics.

**Tasks:**
- [ ] Ghost movement (pass through walls)
- [ ] Revival by touching living player
- [ ] Permanent death if caught in explosion
- [ ] Visual distinction for ghosts
- [ ] Ghost interaction limitations

---

## 📚 DOCUMENTATION ISSUES

### Issue #19: Setup and Installation Guide
**Labels:** `documentation`

**Description:**
Create comprehensive setup instructions.

**Tasks:**
- [ ] Prerequisites (Go, Node.js, etc.)
- [ ] Installation steps
- [ ] Running the application
- [ ] Troubleshooting common issues
- [ ] Development environment setup

---

### Issue #20: API Documentation
**Labels:** `documentation`, `api`

**Description:**
Document the WebSocket API and HTTP endpoints.

**Tasks:**
- [ ] WebSocket message types
- [ ] HTTP API endpoints
- [ ] Message payload schemas
- [ ] Error codes and handling
- [ ] Rate limiting information

---

### Issue #21: Game Mechanics Documentation
**Labels:** `documentation`, `gameplay`

**Description:**
Document all game rules and mechanics.

**Tasks:**
- [ ] Complete game rules
- [ ] Power-up effects
- [ ] Timer mechanics
- [ ] Victory conditions
- [ ] Control scheme

---

### Issue #22: Architecture Documentation
**Labels:** `documentation`, `technical`

**Description:**
Document the technical architecture and design decisions.

**Tasks:**
- [ ] Mini-framework architecture
- [ ] Component structure
- [ ] State management patterns
- [ ] WebSocket communication flow
- [ ] Performance optimization strategies

---

## 🧪 TESTING ISSUES

### Issue #23: Automated Testing Suite
**Labels:** `testing`, `quality`

**Description:**
Implement comprehensive testing for the project.

**Tasks:**
- [ ] Unit tests for mini-framework
- [ ] Integration tests for game mechanics
- [ ] WebSocket communication tests
- [ ] Performance benchmarks
- [ ] Cross-browser compatibility tests

---

### Issue #24: Load Testing
**Labels:** `testing`, `performance`

**Description:**
Test the application under various load conditions.

**Tasks:**
- [ ] Multiple concurrent players
- [ ] Network latency simulation
- [ ] Memory usage under load
- [ ] Server capacity testing
- [ ] Stress test WebSocket connections

---

## 🔧 TECHNICAL DEBT ISSUES

### Issue #25: Code Refactoring and Cleanup
**Labels:** `refactor`, `cleanup`

**Description:**
Improve code quality and maintainability.

**Tasks:**
- [ ] Remove unused code
- [ ] Consistent naming conventions
- [ ] Add JSDoc comments
- [ ] Improve error handling
- [ ] Code splitting for better organization

---

### Issue #26: Security Improvements
**Labels:** `security`

**Description:**
Implement security best practices.

**Tasks:**
- [ ] Input validation and sanitization
- [ ] Rate limiting for WebSocket messages
- [ ] CORS configuration review
- [ ] XSS prevention
- [ ] WebSocket authentication

---

## Usage Instructions

### Creating Issues Manually:
1. Go to your GitHub repository
2. Click "Issues" → "New Issue"
3. Copy the title and description from above
4. Add the specified labels
5. Set priority if your repo supports it

### Using GitHub CLI:
If you have `gh` CLI installed, you can create issues programmatically:

```bash
gh issue create --title "🚨 AUDIT: Framework Compliance" --body "..." --label "audit,critical,framework"
```

### Issue Labels to Create:
- `audit` - Issues related to audit requirements
- `critical` - Must be completed for audit passing
- `bug` - Bug fixes needed
- `enhancement` - New features and improvements
- `bonus` - Bonus features from the assignment
- `documentation` - Documentation tasks
- `testing` - Testing related tasks
- `framework` - Mini-framework related
- `websocket` - WebSocket functionality
- `gameplay` - Game mechanics
- `performance` - Performance optimizations
- `multiplayer` - Multiplayer features
- `ui` - User interface
- `security` - Security improvements
- `refactor` - Code refactoring

### Milestones to Create:
1. **Audit Compliance** - All critical audit issues
2. **Basic Functionality** - Core game features
3. **Performance & Polish** - Optimization and refinement
4. **Bonus Features** - Additional enhancements
5. **Documentation** - Complete documentation