package main

import (
	"fmt"
	"log"
	"math/rand"
	"time"
)

// Game constants
const (
	GAME_TICK_RATE     = 60 // 60 FPS
	ROOM_CLEANUP_INTERVAL = 30 * time.Second
	PLAYER_TIMEOUT     = 60 * time.Second
	COUNTDOWN_DURATION = 10 * time.Second
	WAITING_DURATION   = 20 * time.Second
	MAP_WIDTH         = 15
	MAP_HEIGHT        = 13
)

// Create or get existing room
func getOrCreateRoom(roomID string) *GameRoom {
	roomsMutex.Lock()
	defer roomsMutex.Unlock()

	// If no specific room requested, find available room
	if roomID == "" {
		for _, room := range gameRooms {
			if len(room.Players) < room.MaxPlayers && room.State == "waiting" {
				return room
			}
		}
		// Create new room if none available
		roomID = fmt.Sprintf("room_%d", time.Now().UnixNano())
	}

	// Get existing room or create new one
	room, exists := gameRooms[roomID]
	if !exists {
		room = &GameRoom{
			ID:         roomID,
			Players:    make(map[string]*Player),
			Bombs:      make(map[string]*Bomb),
			Map:        generateMap(),
			State:      "waiting",
			MaxPlayers: 4,
			Clients:    make(map[string]*Client),
		}
		gameRooms[roomID] = room
		log.Printf("Created new room: %s", roomID)
	}

	// Check if room is full
	if len(room.Players) >= room.MaxPlayers {
		return nil
	}

	return room
}

// Add player to room
func addPlayerToRoom(room *GameRoom, client *Client, playerName string) *Player {
	room.mutex.Lock()
	defer room.mutex.Unlock()

	if len(room.Players) >= room.MaxPlayers {
		return nil
	}

	// Generate unique player ID
	playerID := fmt.Sprintf("player_%d", time.Now().UnixNano())

	// Get spawn position
	spawnX, spawnY := getSpawnPosition(room, len(room.Players))

	// Create player
	player := &Player{
		ID:    playerID,
		Name:  playerName,
		X:     spawnX,
		Y:     spawnY,
		Lives: 3,
		Score: 0,
		PowerUps: PowerUps{
			Bombs:  0,
			Flames: 0,
			Speed:  0,
		},
		LastSeen: time.Now(),
	}

	room.Players[playerID] = player

	// Check if we should start countdown
	playerCount := len(room.Players)
	if room.State == "waiting" {
		if playerCount >= 4 {
			// Start countdown immediately with 4 players
			startCountdown(room)
		} else if playerCount >= 2 && room.StartTime.IsZero() {
			// Start waiting timer with 2+ players
			room.StartTime = time.Now()
		}
	}

	return player
}

// Remove player from room
func removePlayerFromRoom(room *GameRoom, playerID string) {
	room.mutex.Lock()
	defer room.mutex.Unlock()

	// Remove player
	delete(room.Players, playerID)
	delete(room.Clients, playerID)

	log.Printf("Player %s left room %s", playerID, room.ID)

	// Notify other players
	broadcastToRoom(room, Message{
		Type: "playerLeft",
		Data: map[string]string{"playerId": playerID},
	}, "")

	// Check if room should be cleaned up
	if len(room.Players) == 0 {
		roomsMutex.Lock()
		delete(gameRooms, room.ID)
		roomsMutex.Unlock()
		log.Printf("Room %s deleted - no players", room.ID)
		return
	}

	// Check if game should end
	if room.State == "playing" {
		alivePlayers := 0
		for _, player := range room.Players {
			if player.Lives > 0 {
				alivePlayers++
			}
		}
		if alivePlayers <= 1 {
			endGame(room)
		}
	}
}

// Start countdown before game begins
func startCountdown(room *GameRoom) {
	room.State = "countdown"
	room.CountdownStart = time.Now()

	// Notify players
	broadcastToRoom(room, Message{
		Type: "countdown",
		Data: map[string]interface{}{
			"duration": COUNTDOWN_DURATION.Milliseconds(),
		},
	}, "")

	log.Printf("Starting countdown for room %s", room.ID)
}

// Start the actual game
func startGame(room *GameRoom) {
	room.mutex.Lock()
	room.State = "playing"
	room.StartTime = time.Now()
	room.mutex.Unlock()

	// Notify players
	broadcastToRoom(room, Message{
		Type: "gameStarted",
		Data: map[string]interface{}{
			"state": "playing",
		},
	}, "")

	log.Printf("Game started in room %s with %d players", room.ID, len(room.Players))
}

// End the game
func endGame(room *GameRoom) {
	room.mutex.Lock()
	room.State = "finished"
	room.mutex.Unlock()

	// Find winner
	var winner *Player
	for _, player := range room.Players {
		if player.Lives > 0 {
			winner = player
			break
		}
	}

	// Notify players
	winnerData := map[string]interface{}{
		"state": "finished",
	}
	if winner != nil {
		winnerData["winner"] = winner
	}

	broadcastToRoom(room, Message{
		Type: "gameEnded",
		Data: winnerData,
	}, "")

	log.Printf("Game ended in room %s", room.ID)

	// Schedule room cleanup
	go func() {
		time.Sleep(30 * time.Second)
		roomsMutex.Lock()
		delete(gameRooms, room.ID)
		roomsMutex.Unlock()
		log.Printf("Room %s cleaned up", room.ID)
	}()
}

// Get spawn position for player based on player index
func getSpawnPosition(room *GameRoom, playerIndex int) (int, int) {
	// Spawn positions in corners
	spawns := [][]int{
		{1, 1},                           // Top-left
		{MAP_WIDTH - 2, 1},               // Top-right  
		{1, MAP_HEIGHT - 2},              // Bottom-left
		{MAP_WIDTH - 2, MAP_HEIGHT - 2},  // Bottom-right
	}

	if playerIndex < len(spawns) {
		return spawns[playerIndex][0], spawns[playerIndex][1]
	}

	// Fallback to center if more than 4 players
	return MAP_WIDTH / 2, MAP_HEIGHT / 2
}

// Generate a basic bomberman map
func generateMap() [][]int {
	gameMap := make([][]int, MAP_HEIGHT)
	for i := range gameMap {
		gameMap[i] = make([]int, MAP_WIDTH)
	}

	// Create outer walls
	for y := 0; y < MAP_HEIGHT; y++ {
		for x := 0; x < MAP_WIDTH; x++ {
			if x == 0 || x == MAP_WIDTH-1 || y == 0 || y == MAP_HEIGHT-1 {
				gameMap[y][x] = 1 // Wall
			}
		}
	}

	// Create inner wall pattern (every other cell in grid)
	for y := 2; y < MAP_HEIGHT-2; y += 2 {
		for x := 2; x < MAP_WIDTH-2; x += 2 {
			gameMap[y][x] = 1 // Wall
		}
	}

	// Add random destructible blocks (2 = destructible)
	rand.Seed(time.Now().UnixNano())
	for y := 1; y < MAP_HEIGHT-1; y++ {
		for x := 1; x < MAP_WIDTH-1; x++ {
			if gameMap[y][x] == 0 {
				// Don't place blocks near spawn points
				if isNearSpawn(x, y) {
					continue
				}
				// 60% chance for destructible block
				if rand.Float32() < 0.6 {
					gameMap[y][x] = 2
				}
			}
		}
	}

	return gameMap
}

// Check if position is near spawn points
func isNearSpawn(x, y int) bool {
	spawns := [][]int{
		{1, 1}, {MAP_WIDTH - 2, 1},
		{1, MAP_HEIGHT - 2}, {MAP_WIDTH - 2, MAP_HEIGHT - 2},
	}

	for _, spawn := range spawns {
		dx := abs(x - spawn[0])
		dy := abs(y - spawn[1])
		if dx <= 1 && dy <= 1 {
			return true
		}
	}
	return false
}

// Absolute value helper
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// Main game loop that runs for all rooms
func gameTickLoop() {
	ticker := time.NewTicker(time.Second / GAME_TICK_RATE)
	cleanupTicker := time.NewTicker(ROOM_CLEANUP_INTERVAL)

	defer ticker.Stop()
	defer cleanupTicker.Stop()

	for {
		select {
		case <-ticker.C:
			updateAllRooms()
		case <-cleanupTicker.C:
			cleanupInactiveRooms()
		}
	}
}

// Update all game rooms
func updateAllRooms() {
	roomsMutex.RLock()
	rooms := make([]*GameRoom, 0, len(gameRooms))
	for _, room := range gameRooms {
		rooms = append(rooms, room)
	}
	roomsMutex.RUnlock()

	for _, room := range rooms {
		updateRoom(room)
	}
}

// Update individual room
func updateRoom(room *GameRoom) {
	room.mutex.Lock()
	defer room.mutex.Unlock()

	now := time.Now()

	switch room.State {
	case "waiting":
		// Check if we should start countdown
		if len(room.Players) >= 2 && !room.StartTime.IsZero() {
			if now.Sub(room.StartTime) >= WAITING_DURATION {
				room.State = "countdown"
				room.CountdownStart = now
				
				// Notify outside of lock
				go broadcastToRoom(room, Message{
					Type: "countdown",
					Data: map[string]interface{}{
						"duration": COUNTDOWN_DURATION.Milliseconds(),
					},
				}, "")
			}
		}

	case "countdown":
		// Check if countdown is finished
		if now.Sub(room.CountdownStart) >= COUNTDOWN_DURATION {
			room.State = "playing"
			room.StartTime = now
			
			// Notify outside of lock
			go broadcastToRoom(room, Message{
				Type: "gameStarted",
				Data: map[string]interface{}{
					"state": "playing",
				},
			}, "")
		}

	case "playing":
		// Update bombs
		updateBombs(room, now)
		
		// Check for game end condition
		alivePlayers := 0
		for _, player := range room.Players {
			if player.Lives > 0 {
				alivePlayers++
			}
		}
		
		if alivePlayers <= 1 {
			room.State = "finished"
			
			// Find winner
			var winner *Player
			for _, player := range room.Players {
				if player.Lives > 0 {
					winner = player
					break
				}
			}
			
			// Notify outside of lock
			winnerData := map[string]interface{}{
				"state": "finished",
			}
			if winner != nil {
				winnerData["winner"] = winner
			}
			
			go broadcastToRoom(room, Message{
				Type: "gameEnded",
				Data: winnerData,
			}, "")
		}
	}
}

// Update bombs in room
func updateBombs(room *GameRoom, now time.Time) {
	for bombID, bomb := range room.Bombs {
		// Check if bomb should explode
		if now.Sub(bomb.Created) >= 3*time.Second {
			explodeBomb(room, bomb, now)
			delete(room.Bombs, bombID)
		}
	}
}

// Handle bomb explosion
func explodeBomb(room *GameRoom, bomb *Bomb, now time.Time) {
	// Get explosion range
	explosionRange := 2 // Base range
	if player, exists := room.Players[bomb.PlayerID]; exists {
		explosionRange += player.PowerUps.Flames
	}

	// Calculate explosion positions
	explosions := [][]int{{bomb.X, bomb.Y}} // Center

	// Add explosion in 4 directions
	directions := [][]int{{0, -1}, {0, 1}, {-1, 0}, {1, 0}} // up, down, left, right
	for _, dir := range directions {
		for i := 1; i <= explosionRange; i++ {
			x := bomb.X + dir[0]*i
			y := bomb.Y + dir[1]*i

			// Check bounds
			if x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT {
				break
			}

			// Check for walls
			if room.Map[y][x] == 1 {
				break // Solid wall stops explosion
			}

			explosions = append(explosions, []int{x, y})

			// Destroy destructible blocks
			if room.Map[y][x] == 2 {
				room.Map[y][x] = 0
				// Maybe spawn power-up here
				break // Destructible block stops explosion
			}
		}
	}

	// Check for player damage
	for _, player := range room.Players {
		if player.Lives <= 0 {
			continue
		}

		for _, explosion := range explosions {
			if player.X == explosion[0] && player.Y == explosion[1] {
				player.Lives--
				log.Printf("Player %s hit by explosion, lives remaining: %d", player.ID, player.Lives)
				break
			}
		}
	}

	// Broadcast explosion
	go broadcastToRoom(room, Message{
		Type: "bombExploded",
		Data: map[string]interface{}{
			"bombId":     bomb.ID,
			"explosions": explosions,
			"map":        room.Map,
			"players":    room.Players,
		},
	}, "")
}

// Clean up inactive rooms and players
func cleanupInactiveRooms() {
	roomsMutex.Lock()
	defer roomsMutex.Unlock()

	now := time.Now()
	roomsToDelete := []string{}

	for roomID, room := range gameRooms {
		room.mutex.Lock()
		
		// Remove inactive players
		playersToRemove := []string{}
		for playerID, player := range room.Players {
			if now.Sub(player.LastSeen) > PLAYER_TIMEOUT {
				playersToRemove = append(playersToRemove, playerID)
			}
		}
		
		for _, playerID := range playersToRemove {
			delete(room.Players, playerID)
			delete(room.Clients, playerID)
		}
		
		// Mark empty rooms for deletion
		if len(room.Players) == 0 {
			roomsToDelete = append(roomsToDelete, roomID)
		}
		
		room.mutex.Unlock()
	}

	// Delete empty rooms
	for _, roomID := range roomsToDelete {
		delete(gameRooms, roomID)
		log.Printf("Cleaned up empty room: %s", roomID)
	}
}