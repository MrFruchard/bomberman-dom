package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// Structure des données pour les scores
type scoreToSend struct {
	Name  string `json:"name"`
	Score int    `json:"score"`
	Time  string `json:"time"` // Temps en millisecondes
}

type scoreToGet struct {
	Name  string `json:"name"`
	Score int    `json:"score"`
	Time  string `json:"time"`
}

// Structures pour le multijoueur
type Player struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	X        int       `json:"x"`
	Y        int       `json:"y"`
	Lives    int       `json:"lives"`
	Score    int       `json:"score"`
	PowerUps PowerUps  `json:"powerUps"`
	LastSeen time.Time `json:"-"`
}

type PowerUps struct {
	Bombs  int `json:"bombs"`
	Flames int `json:"flames"`
	Speed  int `json:"speed"`
}

type Bomb struct {
	ID       string    `json:"id"`
	X        int       `json:"x"`
	Y        int       `json:"y"`
	PlayerID string    `json:"playerId"`
	Timer    int       `json:"timer"`
	Created  time.Time `json:"-"`
}

type GameRoom struct {
	ID          string             `json:"id"`
	Players     map[string]*Player `json:"players"`
	Bombs       map[string]*Bomb   `json:"bombs"`
	Map         [][]int            `json:"map"`
	State       string             `json:"state"` // "waiting", "countdown", "playing", "finished"
	MaxPlayers  int                `json:"maxPlayers"`
	StartTime   time.Time          `json:"-"`
	CountdownStart time.Time       `json:"-"`
	Clients     map[string]*Client `json:"-"`
	mutex       sync.RWMutex       `json:"-"`
}

type Client struct {
	Conn     *websocket.Conn
	PlayerID string
	RoomID   string
	Send     chan []byte
}

type Message struct {
	Type    string      `json:"type"`
	Data    interface{} `json:"data,omitempty"`
	From    string      `json:"from,omitempty"`
	To      string      `json:"to,omitempty"`
	RoomID  string      `json:"roomId,omitempty"`
}

type ChatMessage struct {
	PlayerID    string    `json:"playerId"`
	PlayerName  string    `json:"playerName"`
	Message     string    `json:"message"`
	Timestamp   time.Time `json:"timestamp"`
}

type PlayerInput struct {
	Type      string `json:"type"` // "move", "bomb", "pause"
	Direction string `json:"direction,omitempty"` // "up", "down", "left", "right"
	X         int    `json:"x,omitempty"`
	Y         int    `json:"y,omitempty"`
}

var (
	score []scoreToSend
	gameRooms = make(map[string]*GameRoom)
	roomsMutex sync.RWMutex
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins for development
		},
	}
)

// Middleware pour gérer les en-têtes CORS
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Si la méthode est OPTIONS, on répond directement
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// Sinon, on passe au prochain handler
		next.ServeHTTP(w, r)
	})
}

func sendScore(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	err := json.NewEncoder(w).Encode(score)
	if err != nil {
		http.Error(w, "Unable to encode response", http.StatusInternalServerError)
	}
}

func getScore(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var newScore scoreToGet

	// Décoder le score envoyé dans la requête POST
	err := json.NewDecoder(r.Body).Decode(&newScore)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Ajouter le score à la liste existante
	newEntry := scoreToSend{
		Name:  newScore.Name,
		Score: newScore.Score,
		Time:  newScore.Time,
	}
	score = append(score, newEntry)

	// Sauvegarder dans le fichier JSON
	saveScoresToFile("./json_directory/scores.json")
}

func saveScoresToFile(filename string) {
	// Ouvrir le fichier en écriture (création ou remplacement)
	file, err := os.Create(filename)
	if err != nil {
		fmt.Println("Error creating file:", err)
		return
	}
	defer file.Close()

	// Encoder et écrire les scores
	encoder := json.NewEncoder(file)
	err = encoder.Encode(score)
	if err != nil {
		fmt.Println("Error encoding data to file:", err)
	}
}

func loadScoresFromFile(filename string) []scoreToSend {
	var existingScores []scoreToSend

	// Ouvrir le fichier s'il existe
	file, err := os.Open(filename)
	if err != nil {
		// Si le fichier n'existe pas, retourner une liste vide
		fmt.Println("No existing scores found, starting fresh.")
		return existingScores
	}
	defer file.Close()

	// Décoder les scores depuis le fichier
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&existingScores)
	if err != nil {
		fmt.Println("Error decoding scores from file:", err)
	}

	return existingScores
}

func main() {
	// Charger les scores existants dans la variable globale "score"
	score = loadScoresFromFile("./json_directory/scores.json")

	// INITIALISE LE ROUTEUR
	r := mux.NewRouter()

	// ROUTES ET ENDPOINTS
	r.HandleFunc("/score", sendScore).Methods("GET")
	r.HandleFunc("/score", getScore).Methods("POST")
	r.HandleFunc("/ws", handleWebSocket).Methods("GET")
	r.HandleFunc("/rooms", getRooms).Methods("GET")
	r.HandleFunc("/rooms", createRoom).Methods("POST")

	// Ajouter le middleware CORS
	http.Handle("/", corsMiddleware(r))

	// Start game loop for all rooms
	go gameTickLoop()

	port := ":8080"
	fmt.Println("Bomberman multiplayer server running on port", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
