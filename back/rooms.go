package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Room response structure for API
type RoomResponse struct {
	ID          string            `json:"id"`
	PlayerCount int               `json:"playerCount"`
	MaxPlayers  int               `json:"maxPlayers"`
	State       string            `json:"state"`
	Players     map[string]string `json:"players"` // ID -> Name mapping
	CreatedAt   time.Time         `json:"createdAt"`
}

// Get list of available rooms
func getRooms(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	roomsMutex.RLock()
	rooms := make([]RoomResponse, 0, len(gameRooms))
	
	for _, room := range gameRooms {
		room.mutex.RLock()
		
		// Create player name mapping
		playerNames := make(map[string]string)
		for playerID, player := range room.Players {
			playerNames[playerID] = player.Name
		}
		
		roomResponse := RoomResponse{
			ID:          room.ID,
			PlayerCount: len(room.Players),
			MaxPlayers:  room.MaxPlayers,
			State:       room.State,
			Players:     playerNames,
			CreatedAt:   room.StartTime,
		}
		
		rooms = append(rooms, roomResponse)
		room.mutex.RUnlock()
	}
	roomsMutex.RUnlock()

	if err := json.NewEncoder(w).Encode(rooms); err != nil {
		http.Error(w, "Unable to encode response", http.StatusInternalServerError)
		return
	}
}

// Create a new room
func createRoom(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Parse request body
	var requestData struct {
		Name       string `json:"name"`
		MaxPlayers int    `json:"maxPlayers"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate input
	if requestData.Name == "" {
		http.Error(w, "Room name is required", http.StatusBadRequest)
		return
	}

	maxPlayers := requestData.MaxPlayers
	if maxPlayers < 2 || maxPlayers > 4 {
		maxPlayers = 4 // Default to 4 players
	}

	// Create new room
	roomID := generateRoomID()
	room := &GameRoom{
		ID:         roomID,
		Players:    make(map[string]*Player),
		Bombs:      make(map[string]*Bomb),
		Map:        generateMap(),
		State:      "waiting",
		MaxPlayers: maxPlayers,
		Clients:    make(map[string]*Client),
		StartTime:  time.Now(),
	}

	roomsMutex.Lock()
	gameRooms[roomID] = room
	roomsMutex.Unlock()

	// Return room info
	response := RoomResponse{
		ID:          room.ID,
		PlayerCount: 0,
		MaxPlayers:  room.MaxPlayers,
		State:       room.State,
		Players:     make(map[string]string),
		CreatedAt:   room.StartTime,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Unable to encode response", http.StatusInternalServerError)
		return
	}
}

// Generate unique room ID
func generateRoomID() string {
	return fmt.Sprintf("room_%d", time.Now().UnixNano())
}