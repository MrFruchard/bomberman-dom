// hud.js
import { scoreGlobal, timerGlobal, updateScoreGlobal } from './game.js';

export default class HUD {
  constructor(player, bot, restartGame) {
    this.player = player;
    this.bot = bot;
    this.game = document.querySelector('body').__game;
    this.hudElement = null;
    this.topHudElement = null;
    this.timerInterval = null;
    this.createHUD();
  }

  createHUD() {
    this.createTopHUD();
    this.createBottomHUD();

    const tilemap = document.getElementById('tilemap');
    tilemap.appendChild(this.topHudElement);
    tilemap.appendChild(this.hudElement);
  }

  createTopHUD() {
    this.topHudElement = document.createElement('div');
    this.topHudElement.style.position = 'absolute';
    this.topHudElement.style.top = '-40px';
    this.topHudElement.style.left = '0';
    this.topHudElement.style.right = '0';
    this.topHudElement.style.display = 'flex';
    this.topHudElement.style.justifyContent = 'space-between';
    this.topHudElement.style.padding = '5px 20px';
    this.topHudElement.style.zIndex = '1000';

    const heartsContainer = document.createElement('div');
    heartsContainer.id = 'hearts-container';
    heartsContainer.style.display = 'flex';
    heartsContainer.style.gap = '5px';
    this.updateHearts(heartsContainer);

    const speedContainer = document.createElement('div');
    speedContainer.id = 'speed-container';
    speedContainer.style.display = 'flex';
    speedContainer.style.gap = '5px';
    this.updateSpeed(speedContainer);

    const powerContainer = document.createElement('div');
    powerContainer.id = 'power-container';
    powerContainer.style.display = 'flex';
    powerContainer.style.gap = '5px';
    this.updatePower(powerContainer);

    const keyContainer = document.createElement('div');
    keyContainer.id = 'key-container';
    keyContainer.style.display = 'flex';
    keyContainer.style.gap = '5px';
    this.updateKey(keyContainer);

    this.topHudElement.appendChild(heartsContainer);
    this.topHudElement.appendChild(speedContainer);
    this.topHudElement.appendChild(powerContainer);
    this.topHudElement.appendChild(keyContainer);
  }

  createBottomHUD() {
    this.hudElement = document.createElement('div');
    this.hudElement.className = 'game-hud';
    this.hudElement.style.position = 'absolute';
    this.hudElement.style.bottom = '10px';
    this.hudElement.style.left = '0';
    this.hudElement.style.right = '0';
    this.hudElement.style.display = 'flex';
    this.hudElement.style.justifyContent = 'space-between';
    this.hudElement.style.padding = '0 20px';
    this.hudElement.style.color = 'white';
    this.hudElement.style.fontFamily = 'MaPolicePerso, sans-serif';
    this.hudElement.style.fontSize = '16px';

    const scoreContainer = document.createElement('div');
    scoreContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    scoreContainer.style.padding = '5px 15px';
    scoreContainer.style.borderRadius = '20px';

    const scoreElement = document.createElement('div');
    scoreElement.id = 'score';
    scoreElement.textContent = scoreGlobal.toString();
    scoreContainer.appendChild(scoreElement);

    const timerContainer = document.createElement('div');
    timerContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    timerContainer.style.padding = '5px 15px';
    timerContainer.style.borderRadius = '20px';

    const timerElement = document.createElement('div');
    timerElement.id = 'timer';
    timerElement.textContent = '00:00';
    timerContainer.appendChild(timerElement);

    this.hudElement.appendChild(scoreContainer);
    this.hudElement.appendChild(timerContainer);
    this.startTimer();
  }

  startTimer() {
    if (!timerGlobal.startTime) {
      timerGlobal.startTime = Date.now() - timerGlobal.elapsedTime;
    }

    this.timerInterval = setInterval(() => {
      if (!this.game?.isPaused) {
        const currentTime = Date.now();
        const totalElapsedTime = Math.floor((currentTime - timerGlobal.startTime) / 1000);
        const minutes = Math.floor(totalElapsedTime / 60);
        const seconds = totalElapsedTime % 60;
        const timerElement = document.getElementById('timer');
        if (timerElement) {
          timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
          timerGlobal.elapsedTime = (currentTime - timerGlobal.startTime);
        }
      }
    }, 1000);
  }

  pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  createHeartIcon() {
    const heart = document.createElement('div');
    heart.style.width = '30px';
    heart.style.height = '30px';
    heart.style.backgroundImage = "url('/assets/img/map/heart.png')";
    heart.style.backgroundSize = 'contain';
    heart.style.backgroundRepeat = 'no-repeat';
    return heart;
  }

  createPowerIcon() {
    const power = document.createElement('div');
    power.style.width = '30px';
    power.style.height = '30px';
    power.style.backgroundImage = "url('/assets/img/map/power.png')";
    power.style.backgroundSize = 'contain';
    power.style.backgroundRepeat = 'no-repeat';
    return power;
  }

  createSpeedIcon() {
    const speed = document.createElement('div');
    speed.style.width = '30px';
    speed.style.height = '30px';
    speed.style.backgroundImage = "url('/assets/img/map/speed.png')";
    speed.style.backgroundSize = 'contain';
    speed.style.backgroundRepeat = 'no-repeat';
    return speed;
  }

  createKeyIcon() {
    const key = document.createElement('div');
    key.style.width = '30px';
    key.style.height = '30px';
    key.style.backgroundImage = "url('/assets/img/map/keyOrigin.png')";
    key.style.backgroundSize = 'contain';
    key.style.backgroundRepeat = 'no-repeat';
    return key;
  }

  updateHearts(container = document.getElementById('hearts-container')) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < this.player.life; i++) {
      container.appendChild(this.createHeartIcon());
    }
  }

  updateSpeed(container = document.getElementById('speed-container')) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < this.player.speed; i++) {
      container.appendChild(this.createSpeedIcon());
    }
  }

  updatePower(container = document.getElementById('power-container')) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < this.player.flame; i++) {
      container.appendChild(this.createPowerIcon());
    }
  }

  updateKey(container = document.getElementById('key-container')) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < this.player.getKey; i++) {
      container.appendChild(this.createKeyIcon());
    }
  }

  updateLife() {
    this.updateHearts();
    if (this.player.life <= 0) {
      this.gameOver();
    }
  }

  updateScore(points) {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      let currentScore = parseInt(scoreElement.textContent);
      let newScore = currentScore + points;
      scoreElement.textContent = newScore.toString();
      updateScoreGlobal(newScore)
    }
  }

  updateFlame() {
    this.updatePower();
  }

  destroy() {
    if (this.hudElement && this.hudElement.parentNode) {
      this.hudElement.parentNode.removeChild(this.hudElement);
    }
    if (this.topHudElement && this.topHudElement.parentNode) {
      this.topHudElement.parentNode.removeChild(this.topHudElement);
    }
    this.pauseTimer();
  }

  async gameOver() {
    this.pauseTimer();
    this.game.removeEventListeners();
    this.game.isPaused = true;
    if (this.game.gameLoopId) {
      cancelAnimationFrame(this.game.gameLoopId);
      this.game.gameLoopId = null;
    }

    const gameOverOverlay = document.createElement('div');
    gameOverOverlay.className = 'game-over-overlay';

    const gameOverMessage = document.createElement('h2');
    gameOverMessage.className = 'game-over-message';
    gameOverMessage.textContent = this.player.life <= 0 ? 'Game Over - Bot Wins!' : 'Congratulations - You Win!';

    const currentScore = parseInt(document.getElementById('score').textContent);
    const currentTime = document.getElementById('timer').textContent;

    try {
      // Envoi des scores au serveur
      await fetch('http://localhost:8080/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.game.playerName,
          score: currentScore,
          time: currentTime,
        }),
      });

      // Récupération des scores depuis le serveur
      const response = await fetch('http://localhost:8080/score');
      let scores = await response.json();
      scores.sort((a, b) => b.score - a.score);

      // Création et affichage du tableau des scores
      const table = document.createElement('table');
      table.className = 'scores-table';

      const header = table.createTHead();
      const headerRow = header.insertRow();
      ['Rank', 'Name', 'Score', 'Time'].forEach((text) => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
      });

      const tbody = table.createTBody();
      let currentRank = scores.findIndex((score) =>
          score.name === this.game.playerName &&
          score.score === currentScore
      ) + 1;
      if (currentRank === 0) currentRank = scores.length + 1;

      for (let i = 0; i < 5 && i < scores.length; i++) {
        const row = tbody.insertRow();
        const rankCell = row.insertCell();
        const nameCell = row.insertCell();
        const scoreCell = row.insertCell();
        const timeCell = row.insertCell();

        let place = ['st', 'nd', 'rd'][i] || 'th';
        rankCell.textContent = `${i + 1}${place}`;
        nameCell.textContent = scores[i].name;
        scoreCell.textContent = scores[i].score;
        timeCell.textContent = scores[i].time;

        if (
            scores[i].name === this.game.playerName &&
            scores[i].score === currentScore &&
            scores[i].time === currentTime
        ) {
          row.className = 'current-score-row';
        }
      }

      if (currentRank > 5) {
        const separatorRow = tbody.insertRow();
        for (let i = 0; i < 4; i++) {
          const cell = separatorRow.insertCell();
          cell.textContent = '...';
        }

        const currentRow = tbody.insertRow();
        currentRow.className = 'current-score-row';
        [
          `${currentRank}${['st', 'nd', 'rd'][currentRank - 1] || 'th'}`,
          this.game.playerName,
          currentScore,
          currentTime,
        ].forEach((text) => {
          const cell = currentRow.insertCell();
          cell.textContent = text;
        });
      }

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'scores-button-container';

      const menuButton = document.createElement('button');
      menuButton.textContent = 'Main Menu';
      menuButton.addEventListener('click', () => {
        document.querySelector('body').__game.returnToMainMenu();
      });

      buttonContainer.appendChild(menuButton);
      gameOverOverlay.appendChild(gameOverMessage);
      gameOverOverlay.appendChild(table);
      gameOverOverlay.appendChild(buttonContainer);

      document.getElementById('tilemap').appendChild(gameOverOverlay);
    } catch (error) {
      console.error('Erreur lors de la gestion des scores:', error);

      // Utilisation de données factices en cas d'erreur
      let scores = [
        {name: 'Alice', score: 150, time: '1:30'},
        {name: 'Bob', score: 120, time: '1:45'},
        {name: 'Charlie', score: 110, time: '2:00'},
        {name: 'Dave', score: 100, time: '2:15'},
        {name: 'Eve', score: 90, time: '2:30'},
      ];
      scores.sort((a, b) => b.score - a.score);

      const table = document.createElement('table');
      table.className = 'scores-table';

      const header = table.createTHead();
      const headerRow = header.insertRow();
      ['Rank', 'Name', 'Score', 'Time'].forEach((text) => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
      });

      const tbody = table.createTBody();
      // Tenter de retrouver le rang du joueur dans les scores factices
      let currentRank = scores.findIndex((score) =>
          score.name === this.game.playerName &&
          score.score === currentScore
      ) + 1;
      if (currentRank === 0) currentRank = scores.length + 1;

      for (let i = 0; i < 5 && i < scores.length; i++) {
        const row = tbody.insertRow();
        const rankCell = row.insertCell();
        const nameCell = row.insertCell();
        const scoreCell = row.insertCell();
        const timeCell = row.insertCell();

        let place = ['st', 'nd', 'rd'][i] || 'th';
        rankCell.textContent = `${i + 1}${place}`;
        nameCell.textContent = scores[i].name;
        scoreCell.textContent = scores[i].score;
        timeCell.textContent = scores[i].time;

        if (
            scores[i].name === this.game.playerName &&
            scores[i].score === currentScore &&
            scores[i].time === currentTime
        ) {
          row.className = 'current-score-row';
        }
      }

      if (currentRank > 5) {
        const separatorRow = tbody.insertRow();
        for (let i = 0; i < 4; i++) {
          const cell = separatorRow.insertCell();
          cell.textContent = '...';
        }

        const currentRow = tbody.insertRow();
        currentRow.className = 'current-score-row';
        [
          `${currentRank}${['st', 'nd', 'rd'][currentRank - 1] || 'th'}`,
          this.game.playerName,
          currentScore,
          currentTime,
        ].forEach((text) => {
          const cell = currentRow.insertCell();
          cell.textContent = text;
        });
      }

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'scores-button-container';

      const menuButton = document.createElement('button');
      menuButton.textContent = 'Main Menu';
      menuButton.addEventListener('click', () => {
        document.querySelector('body').__game.returnToMainMenu();
      });

      buttonContainer.appendChild(menuButton);
      gameOverOverlay.appendChild(gameOverMessage);
      gameOverOverlay.appendChild(table);
      gameOverOverlay.appendChild(buttonContainer);

      document.getElementById('tilemap').appendChild(gameOverOverlay);
    }
  }
}