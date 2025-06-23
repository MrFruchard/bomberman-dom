package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocket handler
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// Get player name and room ID from query parameters
	playerName := r.URL.Query().Get("name")
	roomID := r.URL.Query().Get("room")
	
	if playerName == "" {
		log.Printf("Player name is required")
		conn.WriteJSON(Message{Type: "error", Data: "Player name is required"})
		return
	}

	// Create or join room
	room := getOrCreateRoom(roomID)
	if room == nil {
		conn.WriteJSON(Message{Type: "error", Data: "Room is full"})
		return
	}

	// Create client
	client := &Client{
		Conn:   conn,
		RoomID: room.ID,
		Send:   make(chan []byte, 256),
	}

	// Add player to room
	player := addPlayerToRoom(room, client, playerName)
	if player == nil {
		conn.WriteJSON(Message{Type: "error", Data: "Cannot join room"})
		return
	}

	client.PlayerID = player.ID

	// Register client
	room.mutex.Lock()
	room.Clients[client.PlayerID] = client
	room.mutex.Unlock()

	log.Printf("Player %s (%s) joined room %s", playerName, player.ID, room.ID)

	// Send welcome message
	welcomeData := map[string]interface{}{
		"playerId": player.ID,
		"roomId":   room.ID,
		"room":     room,
	}
	client.sendMessage(Message{Type: "welcome", Data: welcomeData})

	// Notify other players
	broadcastToRoom(room, Message{
		Type: "playerJoined",
		Data: player,
		From: player.ID,
	}, client.PlayerID)

	// Send current game state
	gameState := map[string]interface{}{
		"players": room.Players,
		"bombs":   room.Bombs,
		"map":     room.Map,
		"state":   room.State,
	}
	client.sendMessage(Message{Type: "gameState", Data: gameState})

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump(room)
}

// Read messages from the client
func (c *Client) readPump(room *GameRoom) {
	defer func() {
		removePlayerFromRoom(room, c.PlayerID)
		close(c.Send)
	}()

	c.Conn.SetReadLimit(512)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var msg Message
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Handle different message types
		handleClientMessage(room, c, msg)
	}
}

// Write messages to the client
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// Send message to client
func (c *Client) sendMessage(msg Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	select {
	case c.Send <- data:
	default:
		close(c.Send)
	}
}

// Handle different types of client messages
func handleClientMessage(room *GameRoom, client *Client, msg Message) {
	room.mutex.Lock()
	player, exists := room.Players[client.PlayerID]
	room.mutex.Unlock()

	if !exists {
		return
	}

	// Update player last seen
	player.LastSeen = time.Now()

	switch msg.Type {
	case "chat":
		handleChatMessage(room, client, msg)
	case "playerInput":
		handlePlayerInput(room, client, msg)
	case "ping":
		client.sendMessage(Message{Type: "pong"})
	}
}

// Handle chat messages
func handleChatMessage(room *GameRoom, client *Client, msg Message) {
	room.mutex.RLock()
	player, exists := room.Players[client.PlayerID]
	room.mutex.RUnlock()

	if !exists {
		return
	}

	// Parse chat data
	var chatData map[string]interface{}
	if data, ok := msg.Data.(map[string]interface{}); ok {
		chatData = data
	} else {
		return
	}

	message, ok := chatData["message"].(string)
	if !ok || message == "" {
		return
	}

	// Create chat message
	chatMsg := ChatMessage{
		PlayerID:   player.ID,
		PlayerName: player.Name,
		Message:    message,
		Timestamp:  time.Now(),
	}

	// Broadcast to all players in room
	broadcastToRoom(room, Message{
		Type: "chat",
		Data: chatMsg,
		From: client.PlayerID,
	}, "")
}

// Handle player input (movement, bombs)
func handlePlayerInput(room *GameRoom, client *Client, msg Message) {
	if room.State != "playing" {
		return
	}

	room.mutex.Lock()
	player, exists := room.Players[client.PlayerID]
	room.mutex.Unlock()

	if !exists || player.Lives <= 0 {
		return
	}

	// Parse input data
	var inputData PlayerInput
	if data, ok := msg.Data.(map[string]interface{}); ok {
		if inputType, ok := data["type"].(string); ok {
			inputData.Type = inputType
		}
		if direction, ok := data["direction"].(string); ok {
			inputData.Direction = direction
		}
		if x, ok := data["x"].(float64); ok {
			inputData.X = int(x)
		}
		if y, ok := data["y"].(float64); ok {
			inputData.Y = int(y)
		}
	} else {
		return
	}

	switch inputData.Type {
	case "move":
		handlePlayerMovement(room, player, inputData)
	case "bomb":
		handlePlayerBomb(room, player, inputData)
	}
}

// Handle player movement
func handlePlayerMovement(room *GameRoom, player *Player, input PlayerInput) {
	newX, newY := player.X, player.Y

	switch input.Direction {
	case "up":
		newY--
	case "down":
		newY++
	case "left":
		newX--
	case "right":
		newX++
	default:
		return
	}

	// Check bounds and collisions
	if isValidMove(room, newX, newY) {
		room.mutex.Lock()
		player.X = newX
		player.Y = newY
		room.mutex.Unlock()

		// Broadcast movement to all players
		moveData := map[string]interface{}{
			"playerId": player.ID,
			"x":        newX,
			"y":        newY,
		}
		broadcastToRoom(room, Message{
			Type: "playerMoved",
			Data: moveData,
			From: player.ID,
		}, "")
	}
}

// Handle player placing bomb
func handlePlayerBomb(room *GameRoom, player *Player, input PlayerInput) {
	room.mutex.Lock()
	defer room.mutex.Unlock()

	// Check if player can place bomb
	playerBombs := 0
	for _, bomb := range room.Bombs {
		if bomb.PlayerID == player.ID {
			playerBombs++
		}
	}

	maxBombs := 1 + player.PowerUps.Bombs
	if playerBombs >= maxBombs {
		return
	}

	// Check if there's already a bomb at player position
	for _, bomb := range room.Bombs {
		if bomb.X == player.X && bomb.Y == player.Y {
			return
		}
	}

	// Create bomb
	bombID := fmt.Sprintf("bomb_%s_%d", player.ID, time.Now().UnixNano())
	bomb := &Bomb{
		ID:       bombID,
		X:        player.X,
		Y:        player.Y,
		PlayerID: player.ID,
		Timer:    3000, // 3 seconds
		Created:  time.Now(),
	}

	room.Bombs[bombID] = bomb

	// Broadcast bomb placement
	broadcastToRoom(room, Message{
		Type: "bombPlaced",
		Data: bomb,
		From: player.ID,
	}, "")
}

// Check if a move is valid (no walls, within bounds)
func isValidMove(room *GameRoom, x, y int) bool {
	// Check bounds
	if x < 0 || y < 0 || y >= len(room.Map) || x >= len(room.Map[0]) {
		return false
	}

	// Check for walls (assuming 1 = wall, 0 = empty)
	if room.Map[y][x] == 1 {
		return false
	}

	return true
}

// Broadcast message to all players in room except exclude
func broadcastToRoom(room *GameRoom, msg Message, exclude string) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}

	room.mutex.RLock()
	clients := make([]*Client, 0, len(room.Clients))
	for clientID, client := range room.Clients {
		if clientID != exclude {
			clients = append(clients, client)
		}
	}
	room.mutex.RUnlock()

	for _, client := range clients {
		select {
		case client.Send <- data:
		default:
			close(client.Send)
		}
	}
}