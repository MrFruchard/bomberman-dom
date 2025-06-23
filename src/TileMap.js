import { getLevel } from './game.js';

export default class TileMap {
  constructor(map, Countbonus, bonus, totalBlockBreakable, cleCurrent, totalBlockHerbe) {
    this.map = map;
    this.Countbonus = Countbonus;
    this.bonus = bonus;
    this.cleCurrent = cleCurrent;
    this.totalBlockBreakable = totalBlockBreakable;
    this.imageBordureLeftRight = this.#image('block.png');
    this.imageBordureBackFront = this.#image('bordureRelief.png');
    this.imageBlockUnbreakable = this.#image('bordureRelief.png');
    this.imageHerbe = this.#image(`herbe${1 + getLevel()}.png`);
    this.imageBlockBreakable = this.#image('block2.png');
    this.imageBonus1 = this.#image('speed.png');
    this.imageBonus2 = this.#image('power.png');
    this.imageBonus3 = this.#image('heart.png');
    this.imageKey = this.#image('keyOrigin.png');
    this.imagePorte = this.#image('portail.png');

    this.tilesInitialized = false;
    this.randomBlockGetBonus = this.randomBlockGetBonus();
    this.randomBlockGetKey = this.randomBlockGetKey(this.randomBlockGetBonus);

    this.totalBlockHerbe = totalBlockHerbe;
    this.level = getLevel();
    this.currentBlock = 0;
    this.currentHerbe = 0;
  }

  #image(filename) {
    const img = new Image();
    img.src = 'assets/img/map/' + filename;
    return img;
  }

  draw() {
    const tilemapElement = document.getElementById('tilemap');

    // Sauvegarder les éléments player et bot
    const playerElement = document.getElementById('player');
    const botElement = document.getElementById('bot');

    // Créer un conteneur pour la grille
    const gridContainer = document.createElement('div');
    gridContainer.classList.add('grid-container');

    if (this.tilesInitialized) return;
    for (let row = 0; row < this.map.length; row++) {
      for (let col = 0; col < this.map[row].length; col++) {
        const tile = this.map[row][col];
        const tileDiv = document.createElement('div');
        let image = null;
        switch (tile) {
          case 1:
            tileDiv.classList.add('border');
            image = this.imageBordureLeftRight;
            tileDiv.style.backgroundImage = `url(${image.src})`;
            break;
          case 2:
            tileDiv.classList.add('border');
            image = this.imageBordureBackFront;
            tileDiv.style.backgroundImage = `url(${image.src})`;
            break;
          case 3:
            tileDiv.classList.add('block-unbreakable');
            image = this.imageBlockUnbreakable;
            tileDiv.style.backgroundImage = `url(${image.src})`;
            break;
          case 4:
            this.currentHerbe++;
            if (this.currentHerbe === this.totalBlockHerbe - 1) {
              tileDiv.classList.add('herbe');
              image = this.imageHerbe;
              tileDiv.style.backgroundImage = `url(${image.src})`;
              image = this.imagePorte;
              const porteDiv = document.createElement('div');
              porteDiv.classList.add('porte');
              tileDiv.style.position = 'relative';
              porteDiv.style.backgroundImage = `url(${image.src})`;
              // porteDiv.style.backgroundPosition = '0px 0px';
              tileDiv.appendChild(porteDiv);
            } else {
              tileDiv.classList.add('herbe');
              image = this.imageHerbe;
              tileDiv.style.backgroundImage = `url(${image.src})`;
            }

            break;
          case 5:
            tileDiv.classList.add('block-breakable');
            this.currentBlock++;

            if (this.randomBlockGetBonus.includes(this.currentBlock)) {
              tileDiv.dataset.breakable = 'true';
              image = this.imageBlockBreakable;
              tileDiv.style.backgroundImage = `url(${image.src})`;
              this.#addRandomBonus(tileDiv);
              //tileDiv.addEventListener('click', () => this.destroyBlock(tileDiv));
            } else if (this.randomBlockGetKey.includes(this.currentBlock)) {
              tileDiv.dataset.breakable = 'true';
              image = this.imageBlockBreakable;
              tileDiv.style.backgroundImage = `url(${image.src})`;
              this.#addRandomKey(tileDiv);
              //tileDiv.addEventListener('click', () => this.destroyBlock(tileDiv));
            } else {
              tileDiv.dataset.breakable = 'true';
              image = this.imageBlockBreakable;
              tileDiv.style.backgroundImage = `url(${image.src})`;
              //tileDiv.addEventListener('click', () => this.destroyBlock(tileDiv));
            }

            break;
        }
        gridContainer.appendChild(tileDiv);
      }
    }

    // Vider le tilemap
    tilemapElement.innerHTML = '';

    // Ajouter la grille
    tilemapElement.appendChild(gridContainer);

    // Réajouter les éléments player et bot
    if (playerElement) tilemapElement.appendChild(playerElement);
    if (botElement) tilemapElement.appendChild(botElement);

    this.tilesInitialized = true;
  }

  randomBlockGetBonus() {
    let tab = [];
    for (let i = 0; i < this.Countbonus; i++) {
      let r = Math.floor(Math.random() * this.totalBlockBreakable) + 1;
      if (!tab.includes(r)) {
        tab.push(r);
      } else {
        i--;
      }
    }
    return tab;
  }

  randomBlockGetKey(tabBonus) {
    let tab = [];
    let r;
    do {
      r = Math.floor(Math.random() * this.totalBlockBreakable) + 1;
    } while (tabBonus.includes(r) || tab.includes(r));
    tab.push(r);
    return tab;
  }

  #addRandomKey(tileDiv) {
    let image = this.imageKey;
    const keyImage = document.createElement('div');
    keyImage.style.backgroundImage = `url(${image.src})`;
    keyImage.classList.add('key');
    tileDiv.style.position = 'relative';

    keyImage.style.display = 'none';
    tileDiv.appendChild(keyImage);
  }

  #addRandomBonus(tileDiv) {
    let r = Math.floor(Math.random() * this.bonus.length);
    const bonusImage = document.createElement('div');

    bonusImage.classList.add('bonus', this.bonus[r]);
    bonusImage.style.display = 'none'; // Le bonus sera caché initialement

    // Assurez-vous que le parent a une position relative
    tileDiv.style.position = 'relative';
    tileDiv.appendChild(bonusImage);
  }

  destroyBlock(tileDiv) {
    let image = this.imageHerbe;
    tileDiv.style.backgroundImage = `url(${image.src})`;
    tileDiv.dataset.breakable = 'false';
    tileDiv.classList.remove('block-breakable');
    tileDiv.classList.add('herbe');
    const bonusImage = tileDiv.querySelector('.bonus');
    const keyImage = tileDiv.querySelector('.key');
    if (bonusImage) {
      tileDiv.classList.remove('block-breakable');
      bonusImage.style.display = 'block';
    } else if (keyImage) {
      tileDiv.classList.remove('block-breakable');
      keyImage.style.display = 'block';
    }
  }
}
