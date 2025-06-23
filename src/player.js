import Collision from './collision.js';

import Bonus from './powerUp.js';

export default class Player {
  constructor(key, level) {
    this.element = document.getElementById('player');
    this.x = 80;
    this.y = 70;
    this.life = 1;
    this.speed = 2;
    this.flame = 1;
    this.name = '';
    this.getKey = 0;
    this.totalKey = key;
    this.level = level;

    // Animation properties
    this.frameX = 0;
    this.frameDelay = 10;
    this.frameCount = 0;
    this.maxFrames = 3;
    this.isMoving = false;
    this.direction = 'down';

    // Définir des limites pour la carte (adapter ces valeurs selon votre layout)
    this.mapWidth = 832; // exemple
    this.mapHeight = 704; // exemple

    // Position initiale
    this.updatePosition();
  }

  addKey() {
    this.getKey++;
    if (this.getKey === this.totalKey) {
      this.getKey = 0;
      this.level++;
    }
  }
  decreaseLife() {
    this.life--;
    // Mettre à jour le HUD
    const game = document.querySelector('body').__game;
    if (game && game.HUD) {
      game.HUD.updateLife();
    }
  }

  updatePosition() {
    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';
  }

  updateSprite() {
    if (!this.isMoving) {
      // Position statique (image par défaut)
      this.element.style.backgroundPosition = '0px 0';
    } else {
      // Position selon la direction
      let sourceY;
      switch (this.direction) {
        case 'down':
          sourceY = 0;
          break;
        case 'right':
          sourceY = -250;
          break;
        case 'left':
          sourceY = -100;
          break;
        case 'up':
          sourceY = -50;
          break;
        default:
          sourceY = 0;
      }
      this.element.style.backgroundPosition = `${-this.frameX * 56}px ${sourceY}px`;
    }
  }

  move(keys, isPaused) {
    if (isPaused) return;
    let newX = this.x;
    let newY = this.y;
    this.isMoving = false;

    // Calcul du déplacement selon les touches pressées
    if (keys.ArrowLeft) {
      newX -= this.speed;
      this.direction = 'left';
      this.isMoving = true;
    }
    if (keys.ArrowRight) {
      newX += this.speed;
      this.direction = 'right';
      this.isMoving = true;
    }
    if (keys.ArrowUp) {
      newY -= this.speed;
      this.direction = 'up';
      this.isMoving = true;
    }
    if (keys.ArrowDown) {
      newY += this.speed;
      this.direction = 'down';
      this.isMoving = true;
    }

    // Handle animation
    if (this.isMoving) {
      this.frameCount++;
      if (this.frameCount >= this.frameDelay) {
        this.frameCount = 0;
        this.frameX = (this.frameX + 1) % this.maxFrames;
      }
    } else {
      this.frameX = 0;
    }

    this.obstacles = document.querySelectorAll('.block-unbreakable, .border, .block-breakable, .porte');
    const size = {
      width: this.element.offsetWidth,
      height: this.element.offsetHeight,
    };

    // Check horizontal movement
    const horizontalMove = {
      x: newX,
      y: this.y,
    };

    if (!Collision.getCollisionWithObstacles(horizontalMove, size, this.obstacles, 7)) {
      this.x = newX;
    }

    // Check vertical movement
    const verticalMove = {
      x: this.x,
      y: newY,
    };

    if (!Collision.getCollisionWithObstacles(verticalMove, size, this.obstacles, 7)) {
      this.y = newY;
    }

    // Apply map boundaries
    const mapSize = { width: this.mapWidth, height: this.mapHeight };
    const boundedPosition = Collision.checkMapBoundaries({ x: this.x, y: this.y }, size, mapSize);

    this.x = boundedPosition.x;
    this.y = boundedPosition.y;

    //bonus et key
    const playerRect = document.getElementById('player');
    const bonusPlayer = new Bonus(playerRect, this, this.obstacles);

    bonusPlayer.checkCollisions();
    this.updatePosition();
    this.updateSprite();
  }
}
