package main

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"net/http"
	"os"
)

// Structure des données
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

var score []scoreToSend

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

	// Ajouter le middleware CORS
	http.Handle("/", corsMiddleware(r))

	port := ":8080"
	fmt.Println("Server running on port", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
