let playerName = null;

export function startHistory(level, startGameCallback) {
  if (level === 1) {
    phase1(level, startGameCallback);
  } else if (level === 2) {
    phase2(level, startGameCallback);
  } else {
    phase3(level, startGameCallback);
  }
}

function phase1(level, startGameCallback) {
  const divTile = document.querySelector('#tilemap');
  divTile.innerHTML = ''; // Nettoyer l’écran précédent

  const divHistory = document.createElement('div');
  divHistory.style.backgroundColor = 'black';
  divHistory.style.color = 'white';
  divHistory.style.padding = '10px';
  divTile.appendChild(divHistory);

  const storyPhase1 = 'L’histoire commence dans la paisible ville de Crystal Town...\n' + 'Mais aujourd’hui, un cri retentit : Les diamants de la ville ont été volés !\n' + 'Dark Blaster, le redoutable ennemi, a utilisé ces pierres précieuses \n' + 'pour activer son arme ultime.\n\n' + 'C’est à vous de le vaincre et de ramener les diamants.';

  let index = 0;
  const interval = 10; // Vitesse d'affichage des lettres

  const typeEffect = setInterval(() => {
    if (index < storyPhase1.length) {
      divHistory.textContent += storyPhase1[index];
      index++;
    } else {
      clearInterval(typeEffect);
      createInput(divTile, level, startGameCallback); // Crée l’input après l’histoire
    }
  }, interval);
}

function createInput(divTile, level, startGameCallback) {
  const inputContainer = document.createElement('div');
  inputContainer.style.marginTop = '20px';

  const inputField = document.createElement('input');
  inputField.type = 'text';
  inputField.placeholder = 'Entrez votre nom...';
  inputField.style.padding = '10px';
  inputField.style.fontSize = '16px';
  inputField.style.borderRadius = '5px';
  inputField.style.border = '1px solid #ccc';
  inputField.style.width = '200px';

  const submitButton = document.createElement('button');
  submitButton.textContent = 'Valider';
  submitButton.style.marginLeft = '10px';
  submitButton.style.padding = '10px';
  submitButton.style.fontSize = '16px';
  submitButton.style.borderRadius = '5px';
  submitButton.style.border = 'none';
  submitButton.style.cursor = 'pointer';

  submitButton.addEventListener('click', () => {
    playerName = inputField.value.trim();
    if (playerName) {
      divTile.innerHTML = ''; // Nettoyer la zone pour démarrer le jeu
      createFadeEffect(level, () => {
        startGameCallback(playerName); // Appeler `startGame` après l’animation
      });
    } else {
      alert('Veuillez entrer un nom valide.');
    }
  });

  inputContainer.appendChild(inputField);
  inputContainer.appendChild(submitButton);
  divTile.appendChild(inputContainer);
}

function createFadeEffect(level, loadMapCallback, startGameCallback) {
  const fadeOverlay = document.createElement('div');
  fadeOverlay.style.position = 'absolute';
  fadeOverlay.style.top = '0';
  fadeOverlay.style.left = '0';
  fadeOverlay.style.width = '100%';
  fadeOverlay.style.height = '100%';
  fadeOverlay.style.backgroundColor = 'black';
  fadeOverlay.style.color = 'white';
  fadeOverlay.style.display = 'flex';
  fadeOverlay.style.justifyContent = 'center';
  fadeOverlay.style.alignItems = 'center';
  fadeOverlay.style.fontSize = '40px';
  fadeOverlay.style.fontWeight = 'bold';
  fadeOverlay.style.opacity = '0';
  fadeOverlay.style.transition = 'opacity 1s ease-in-out';
  fadeOverlay.style.zIndex = '9999'; // Mettre l'overlay au-dessus de tout

  fadeOverlay.textContent = `Niveau ${level}`;

  document.body.appendChild(fadeOverlay);

  // Charger la map en arrière-plan
  setTimeout(() => {
    loadMapCallback();
  }, 1000);

  // Démarrer le fondu noir
  setTimeout(() => {
    fadeOverlay.style.opacity = '1';
  }, 100); // Laisser le DOM s'initialiser avant de déclencher la transition

  // Attendre que l’animation de fondu soit terminée avant de démarrer le jeu
  setTimeout(() => {
    fadeOverlay.style.opacity = '0'; // Faire disparaître le fondu
    setTimeout(() => {
      fadeOverlay.remove(); // Retirer l’élément du DOM
    }, 1000);
  }, 2000); // Laisser le texte visible pendant 2 secondes
}

function phase2(level, startGameCallback) {
  const divTile = document.querySelector('#tilemap');
  divTile.innerHTML = ''; // Nettoyer l’écran précédent

  const divEnemies = document.createElement('div');
  divEnemies.style.backgroundColor = 'black';
  divEnemies.style.color = 'white';
  divEnemies.style.padding = '10px';
  divTile.appendChild(divEnemies);

  const storyPhase2 = 'Les ennemis approchent... Des sbires de Dark Blaster apparaissent !\n' + 'Ils bloquent votre chemin et vous devez les vaincre et trouver la clef avant d’avancer.\n\n' + 'Préparez-vous à affronter des vagues d’ennemis dangereux.';

  let index = 0;
  const interval = 10; // Vitesse d'affichage des lettres

  const typeEffect = setInterval(() => {
    if (index < storyPhase2.length) {
      divEnemies.textContent += storyPhase2[index];
      index++;
    } else {
      clearInterval(typeEffect);
      createContinueButton(divTile, level, startGameCallback);
    }
  }, interval);
}

function phase3(level, startGameCallback) {
  const divTile = document.querySelector('#tilemap');
  divTile.innerHTML = ''; // Nettoyer l’écran précédent

  const divBoss = document.createElement('div');
  divBoss.style.backgroundColor = 'black';
  divBoss.style.color = 'white';
  divBoss.style.padding = '10px';
  divTile.appendChild(divBoss);

  const bossIntro = 'Le moment tant attendu est arrivé...\n' + 'Le Boss Final, Dark Blaster, se tient devant vous.\n' + 'Ses pouvoirs sont amplifiés par les diamants qu’il a volés.\n\n' + 'C’est votre dernière chance de sauver Crystal Town.';

  let index = 0;
  const interval = 10; // Vitesse d'affichage des lettres

  const typeEffect = setInterval(() => {
    if (index < bossIntro.length) {
      divBoss.textContent += bossIntro[index];
      index++;
    } else {
      clearInterval(typeEffect);
      createContinueButton(divTile, level, startGameCallback);
    }
  }, interval);
}

function createContinueButton(divTile, level, startGameCallback) {
  const continueButton = document.createElement('button');
  continueButton.textContent = 'Continuer';
  continueButton.style.marginTop = '20px';
  continueButton.style.padding = '10px';
  continueButton.style.fontSize = '16px';
  continueButton.style.cursor = 'pointer';

  continueButton.addEventListener('click', () => {
    divTile.innerHTML = ''; // Nettoyer la zone
    createFadeEffect(level, () => startGameCallback(playerName));
  });

  divTile.appendChild(continueButton);
}
