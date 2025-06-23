# **Bomberman - README**

## 📖 **Project Description**
Welcome to **Bomberman**! The goal is simple: explore the arena, break the crates, and find the hidden key to unlock the exit door. Can you be quick and strategic enough to escape ?
https://make-your-game-plum.vercel.app/
---

## 🎮 **Game Objective**
- Find the **key** hidden inside one of the destructible crates.
- Use the **key** to unlock the door and complete the level.

---

## 🕹️ **Gameplay**
1. The player is placed in an arena filled with destructible crates and indestructible walls.
2. Use **bombs** to destroy the crates and reveal what’s inside.
3. Some crates may contain bonuses or the key you’re looking for.
4. Once you’ve obtained the key, head to the **exit door** to win.

---

## ⚙️ **Main Features**
- Player movement using directional keys.
- Bomb placement and explosion mechanics to destroy crates.
- Bonus items.
- Key discovery and exit unlocking.
- Collision detection with walls and obstacles.
- **Score Management**: The game interacts with a backend Go API using `GET` and `POST` requests to save and retrieve player scores.
- **Endgame Score Display**: Player scores are displayed at the end of each game.
- **Random Map Generation**: Each new game generates a random map layout, offering unique gameplay every time.

---

## 🛠️ **Technologies Used**
- **Main Language**: JavaScript
- **Game Engine**: HTML5
- **Styling**: CSS for user interface

---

## 📂 **Project Structure**

```plaintext
/make-your-game
    ├── index.html          # Main game page (the entry point of the game)
    ├── style.css           # CSS for game styling and layout
    ├── back/               # Backend-related scripts and logic
    │   └── main.go
    │    └── json_directory/     # Directory containing game data in JSON format
    │       └── (JSON data files)
    ├── src/                # All game scripts and logic
    │   ├── bomb.js         # Logic for placing and detonating bombs
    │   ├── bot.js          # Bot/AI behavior 
    │   ├── collision.js    # Collision detection system
    │   ├── game.js         # Main game control and flow
    │   ├── history.js      # Game state history 
    │   ├── hud.js          # Heads-up display (HUD) management
    │   ├── map.js          # Map generation and management
    │   ├── player.js       # Player movement and actions
    │   ├── powerup.js      # Power-up logic and behavior
    │   └── tilemap.js      # Tilemap rendering and interactions
    ├── assets/             # Contains images, sounds, and other game assets
    │   ├── font/           # Game fonts
    │   └── img/            # Game-related images (player, crates, bombs, etc.) 
    └── README.md           # Project documentation
```

## 📧 **Contributors**
- [Mohamed-Amine Tliche](https://github.com/Lacquey7)
- [Romain Savary](https://github.com/MrFruchard)
- [Samuel Quibel](https://github.com/KCsam11)  
Thank you for playing and good luck! 🎉
