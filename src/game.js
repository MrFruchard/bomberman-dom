import TileMap from './TileMap.js';
import Player from './player.js';
import Bot from './bot.js';
import Collision from './collision.js';
import { Bomb } from './bomb.js';
import HUD from './hud.js';
import { startHistory } from './history.js'; // Assurez-vous d’avoir exporté correctement la logique d’histoire
import { map } from './map.js';

export let timerGlobal = {
  startTime: null,
  elapsedTime: 0,
  isPaused: false,
};

export let scoreGlobal = 0;

export function updateScoreGlobal(newScore) {
  scoreGlobal = newScore;
}

let level = 1;

export default class Game {
  constructor() {
    this.isPaused = false;
    document.querySelector('body').__game = this;
    // Ne pas initialiser le jeu ici, juste le menu
    this.level = getLevel();
    this.playerName = ''; // Stocke le nom du joueur
    this.keyDownHandler = this.handleKeyDown.bind(this);
    this.keyUpHandler = this.handleKeyUp.bind(this);
    this.pauseHandler = this.handlePause.bind(this);
    this.gameLoopId = null;

    this.menu();
  }

  handleKeyDown(e) {
    if (this.keys?.hasOwnProperty(e.code)) {
      this.keys[e.code] = true;
      if (e.code === 'Space' && !this.isPaused) {
        this.dropBomb();
      }
    }
  }

  handleKeyUp(e) {
    if (this.keys?.hasOwnProperty(e.code)) {
      this.keys[e.code] = false;
    }
  }

  handlePause(e) {
    if (e.key === 'Escape') {
      this.togglePause();
    }
  }

  menu() {
    console.log('Menu principal');
    const divTileMap = document.querySelector('#tilemap');
    divTileMap.innerHTML = ''; // Nettoyer le contenu existant

    // Supprimer le bouton pause s'il existe
    const pauseContainer = document.querySelector('.pause-container');
    if (pauseContainer) {
      pauseContainer.remove();
    }

    // Créer le conteneur principal du menu
    const menuContainer = document.createElement('div');
    menuContainer.style.display = 'flex';
    menuContainer.style.flexDirection = 'column';
    menuContainer.style.justifyContent = 'center';
    menuContainer.style.alignItems = 'center';
    menuContainer.style.height = '100%';
    menuContainer.style.backgroundImage = "url('assets/img/background/photo2pixel_download.png')";
    menuContainer.style.backgroundSize = '100% 100%';
    menuContainer.style.color = 'white';
    menuContainer.style.borderRadius = '12px';

    // Bouton Start
    const startButton = document.createElement('button');
    startButton.textContent = 'START';
    startButton.style.margin = '10px';
    startButton.addEventListener('click', () => {
      // Démarrer l’histoire avec un callback vers `this.startGame`
      startHistory(getLevel(), (playerName) => {
        this.playerName = playerName; // Stocker le nom du joueur
        this.startGame(); // Lancer la méthode de la classe Game
      });
      menuContainer.remove(); // Supprimer le menu
    });

    // Zone d'affichage du score
    const scoreDisplay = document.createElement('button');
    scoreDisplay.textContent = 'SCORE';
    scoreDisplay.style.margin = '10px';
    scoreDisplay.addEventListener('click', () => {
      menuContainer.remove(); // Supprimer le menu
      this.score(); // Afficher les scores
    });

    menuContainer.appendChild(startButton);
    menuContainer.appendChild(scoreDisplay);
    divTileMap.appendChild(menuContainer);
  }

  async score() {
    console.log('score');

    const divTileMap = document.querySelector('#tilemap');
    divTileMap.innerHTML = ''; // Nettoyer le contenu existant

    let scores = [];

    try {
      const response = await fetch('http://localhost:8080/score', {
        method: 'GET',
      });
      scores = await response.json();
    } catch (error) {
      console.error('Erreur lors du chargement des scores :', error);
      // Si une erreur survient, on utilise des données factices
      scores = [
        { name: 'Alice',   score: 150, time: '1:30' },
        { name: 'Bob',     score: 120, time: '1:45' },
        { name: 'Charlie', score: 110, time: '2:00' },
        { name: 'Dave',    score: 100, time: '2:15' },
        { name: 'Eve',     score: 90,  time: '2:30' },
        { name: 'Frank',   score: 80,  time: '2:45' },
        { name: 'Grace',   score: 70,  time: '3:00' },
      ];
    }

    // Trier les scores par ordre décroissant
    scores.sort((a, b) => b.score - a.score);

    let currentPage = 0; // Page actuelle
    const scoresPerPage = 6; // Nombre de scores par page

    const renderScores = () => {
      divTileMap.innerHTML = ''; // Réinitialiser la divTileMap à chaque changement de page

      // Création du tableau
      const table = document.createElement('table');
      table.style.width = '50%';
      table.style.borderCollapse = 'collapse';
      table.style.margin = '20px auto';
      table.style.color = 'white';
      table.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      table.style.padding = '10px';

      // Création de l'en-tête du tableau
      const headerRow = document.createElement('tr');
      ['Rank', 'Nom', 'Score', 'Time'].forEach((headerText) => {
        const th = document.createElement('th');
        th.textContent = headerText;
        th.style.border = '1px solid white';
        th.style.padding = '8px';
        th.style.textAlign = 'center';
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);

      // Calcul des indices pour la pagination
      const startIndex = currentPage * scoresPerPage;
      const endIndex = Math.min(startIndex + scoresPerPage, scores.length);

      let rank = startIndex + 1; // Ajustement du rang pour chaque page

      for (let i = startIndex; i < endIndex; i++) {
        const scoreEntry = scores[i];
        const row = document.createElement('tr');

        // Colonne du rang
        const rankCell = document.createElement('td');
        // Gestion du suffixe (1st, 2nd, 3rd, etc.)
        let place = ['st', 'nd', 'rd'][rank - 1] || 'th';
        rankCell.textContent = `${rank}${place}`;
        rankCell.style.border = '1px solid white';
        rankCell.style.padding = '8px';
        rankCell.style.textAlign = 'center';
        row.appendChild(rankCell);

        // Colonne du nom
        const nameCell = document.createElement('td');
        nameCell.textContent = scoreEntry.name;
        nameCell.style.border = '1px solid white';
        nameCell.style.padding = '8px';
        nameCell.style.textAlign = 'center';
        row.appendChild(nameCell);

        // Colonne du score
        const scoreCell = document.createElement('td');
        scoreCell.textContent = scoreEntry.score;
        scoreCell.style.border = '1px solid white';
        scoreCell.style.padding = '8px';
        scoreCell.style.textAlign = 'center';
        row.appendChild(scoreCell);

        // Colonne du temps
        const timeCell = document.createElement('td');
        timeCell.textContent = scoreEntry.time;
        timeCell.style.border = '1px solid white';
        timeCell.style.padding = '8px';
        timeCell.style.textAlign = 'center';
        row.appendChild(timeCell);

        table.appendChild(row);
        rank++;
      }

      // Conteneur pour le tableau et les boutons
      const divTable = document.createElement('div');
      divTable.style.position = 'absolute';
      divTable.style.top = '50%';
      divTable.style.left = '50%';
      divTable.style.transform = 'translate(-50%, -50%)';
      divTable.style.display = 'flex';
      divTable.style.flexDirection = 'column';
      divTable.style.alignItems = 'center';

      // Bouton "Retour au Menu"
      const backButton = document.createElement('button');
      backButton.textContent = 'Retour au Menu';
      backButton.style.marginTop = '20px';
      backButton.style.padding = '10px 20px';
      backButton.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      backButton.style.border = 'none';
      backButton.style.cursor = 'pointer';
      backButton.style.fontSize = '16px';
      backButton.style.color = 'black';
      backButton.addEventListener('click', () => {
        this.menu(); // Revenir au menu principal
      });

      // Bouton "Page Précédente" (affiché seulement si ce n'est pas la première page)
      if (currentPage > 0) {
        const prevButton = document.createElement('button');
        prevButton.textContent = '← Page Précédente';
        prevButton.style.marginTop = '10px';
        prevButton.style.padding = '10px 15px';
        prevButton.style.cursor = 'pointer';
        prevButton.disabled = currentPage === 0;
        prevButton.addEventListener('click', () => {
          currentPage = Math.max(0, currentPage - 1);
          renderScores();
        });
        divTable.appendChild(prevButton);
      }

      // Bouton "Page Suivante"
      const nextButton = document.createElement('button');
      nextButton.textContent = 'Page Suivante →';
      nextButton.style.marginTop = '10px';
      nextButton.style.padding = '10px 15px';
      nextButton.style.cursor = 'pointer';
      nextButton.disabled = endIndex >= scores.length;
      nextButton.addEventListener('click', () => {
        currentPage = Math.min(Math.ceil(scores.length / scoresPerPage) - 1, currentPage + 1);
        renderScores();
      });

      // Ajout des éléments dans le conteneur
      divTable.appendChild(table);
      divTable.appendChild(nextButton);
      divTable.appendChild(backButton);
      divTileMap.appendChild(divTable);
    };

    // Affichage de la première page
    renderScores();
  }

  startGame() {
    console.log('Démarrage du jeu');

    this.removeEventListeners();

    const divTileMap = document.querySelector('#tilemap');
    divTileMap.innerHTML = ''; // Nettoyer le contenu existant

    const player = document.createElement('div');
    player.id = 'player';
    const bot = document.createElement('div');
    bot.id = 'bot';
    divTileMap.appendChild(player);
    divTileMap.appendChild(bot);

    this.initGame();
    this.HUD = new HUD(this.player, this.bot);
    document.addEventListener('keydown', this.pauseHandler);
  }

  nextLevel() {
    console.log('Niveau suivant');
    // Sauvegarder le score actuel avant de passer au niveau suivant
    const currentScore = parseInt(document.getElementById('score').textContent);
    scoreGlobal = currentScore;

    // Sauvegarder le temps écoulé
    if (this.HUD) {
      this.HUD.pauseTimer();
    }

    incrementLevel();
    this.level = getLevel();
    if (this.level > 3) {
      this.HUD.gameOver();
      return;
    }

    console.log('Next level:', this.level);
    startHistory(this.level, (playerName) => {
      this.playerName = playerName;
      this.startGame();
    });
  }

  initGame() {
    console.log('Initialisation du jeu');

    // Map configuration
    this.Countbonus = 6;
    this.bonus = ['Bonus1', 'Bonus2', 'Bonus3'];
    this.key = this.level;
    this.map = map(11, 13);
    this.cle = 1;

    this.totalBlockBreakable = this.countBlockBreakable();
    this.totalBlockHerbe = this.countBlockHerbe();
    this.tileMap = new TileMap(this.map, this.Countbonus, this.bonus, this.totalBlockBreakable, this.cle, this.totalBlockHerbe);

    // Initialisation de la carte
    this.tileMap.draw();

    this.player = new Player(this.key, this.level);
    this.bot = new Bot();

    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      Space: false,
    };
    this.setupEventListeners();
    this.startGameLoop();
  }

  removeEventListeners() {
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);
    document.removeEventListener('keydown', this.pauseHandler);
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  setupEventListeners() {
    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
  }

  togglePause() {
    console.log('Pause');
    this.isPaused = !this.isPaused;

    let pauseOverlay = document.querySelector('.pause-overlay');
    if (!pauseOverlay) {
      pauseOverlay = document.createElement('div');
      pauseOverlay.className = 'pause-overlay';

      const pauseMenu = document.createElement('div');
      pauseMenu.className = 'pause-menu';

      const title = document.createElement('h2');
      title.className = 'pause-title';
      title.textContent = 'PAUSE';

      const resumeButton = document.createElement('button');
      resumeButton.textContent = 'Resume';
      resumeButton.addEventListener('click', () => this.togglePause());

      const restartButton = document.createElement('button');
      restartButton.textContent = 'Restart Game';
      restartButton.addEventListener('click', () => {
        this.togglePause();
        this.restartGame();
      });

      const menuButton = document.createElement('button');
      menuButton.textContent = 'Main Menu';
      menuButton.addEventListener('click', () => {
        this.togglePause();
        this.returnToMainMenu();
      });

      pauseMenu.appendChild(title);
      pauseMenu.appendChild(resumeButton);
      pauseMenu.appendChild(restartButton);
      pauseMenu.appendChild(menuButton);
      pauseOverlay.appendChild(pauseMenu);
      document.body.appendChild(pauseOverlay);
    }

    if (this.isPaused) {
      pauseOverlay.style.display = 'flex';
      setTimeout(() => {
        pauseOverlay.classList.add('visible');
      }, 10);
    } else {
      pauseOverlay.classList.remove('visible');
      setTimeout(() => {
        pauseOverlay.style.display = 'none';
      }, 300);
    }
  }

  restartGame() {
    console.log('Restart Game');
    level = 1;
    scoreGlobal = 0;
    timerGlobal = {
      startTime: new Date(),
      elapsedTime: 0,
      isPaused: false,
    };
    if (this.HUD) {
      this.HUD.destroy();
    }
    this.removeEventListeners();
    const divTileMap = document.querySelector('#tilemap');
    divTileMap.innerHTML = '';
    this.isPaused = false;
    this.startGame();
  }

  returnToMainMenu() {
    console.log('Main Menu');
    resetLevel();
    if (this.HUD) {
      this.HUD.destroy();
    }
    this.removeEventListeners();
    this.isPaused = false;
    const divTileMap = document.querySelector('#tilemap');
    divTileMap.innerHTML = '';

    const pauseOverlay = document.querySelector('.pause-overlay');
    if (pauseOverlay) {
      pauseOverlay.remove();
    }
    scoreGlobal = 0
    timerGlobal = {
      startTime: new Date(),
      elapsedTime: 0,
      isPaused: false,
    }

    this.menu();
  }

  countBlockBreakable() {
    return this.map.reduce((count, row) => {
      return count + row.filter((cell) => cell === 5).length;
    }, 0);
  }
  countBlockHerbe() {
    return this.map.reduce((count, row) => {
      return count + row.filter((cell) => cell === 4).length;
    }, 0);
  }

  dropBomb() {
    console.log('Drop Bomb');
    if (this.isPaused) return;

    const cellWidth = 64;

    // Calcul de la colonne et de la ligne en fonction de la position du joueur
    // On suppose que this.player.x et this.player.y indiquent la position en pixels du joueur.
    const col = Math.floor(this.player.x / cellWidth);
    const row = Math.floor(this.player.y / cellWidth);

    // Calcul de la position centrale de la cellule
    const bombX = col * cellWidth + cellWidth / 2;
    const bombY = row * cellWidth + cellWidth / 2;

    // Par exemple, la longueur de la flamme (rayon d'explosion) est de 2 cases.
    const flameLength = this.player.flame;

    // Création de la bombe en lui passant sa position et la longueur de l'explosion
    const bomb = new Bomb(bombX, bombY, flameLength, this.player, this.bot, this.HUD);
    bomb.dropBomb();
  }

  endGame() {
    console.log('Fin du jeu');
    this.removeEventListeners();
    this.isPaused = true;
    this.HUD.pauseTimer();

    // Sauvegarder le score actuel
    const currentScore = parseInt(document.getElementById('score').textContent);
    scoreGlobal = currentScore;

    // Sauvegarder le temps écoulé
    timerGlobal.elapsedTime = this.HUD.getElapsedTime();

    // Envoyer le score au serveur
    this.sendScore(this.playerName, currentScore, timerGlobal.elapsedTime);

    // Retourner au menu principal
    this.returnToMainMenu();
  }

  startGameLoop() {
    console.log('Game Loop');
    const gameLoop = () => {
      if (this.player && this.bot) {
        this.player.move(this.keys, this.isPaused);
        this.bot.moveAutonomously(this.isPaused);

        if (!this.isPaused && Collision.checkCollision(this.player, this.bot)) {
          console.log('Collision detected!');
          this.player.decreaseLife();
        }
      }
      this.gameLoopId = requestAnimationFrame(gameLoop);
    };

    this.gameLoopId = requestAnimationFrame(gameLoop);
  }
}

// Lancement du jeu lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
export function getLevel() {
  return level;
}

export function incrementLevel() {
  level++;
}

export function resetLevel() {
  level = 1;
}
