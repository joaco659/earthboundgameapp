/*
    * psiHandlers.js
    ** (Este modulo interactua directamente con el DOM de la web)
    El modulo encargado de ejecutar acciones custom para cada psi,
    mostrando dialogos y animaciones diferentes.
*/
import { actions } from "./actions.js";
import { SFX } from "./sfx.js";

// Funciones utilitarias
// Pausa la ejecucion del hilo
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Elimina todos los hijos de un elemento
const clearAllChildren = (element) => {
  while (element.firstChild) {
    element.removeChild(element.lastChild);
  }
};
// Muestra la caja de dialogo
const toggleDialogueBox = () => {
  document.querySelector(".actions__inner").classList.toggle("hidden");
  document.querySelector(".dialogue-box").classList.toggle("hidden");
};
// Efecto de maquina de escribir como en el juego original
const typewrite = async (message, speed = 30) => {
  const dialogueBox = document.querySelector(".dialogue-box");

  // Si la caja de dialogo no se muestra, no escribe nada
  if (!dialogueBox.classList.contains("hidden")) {
    dialogueBox.textContent = "";
    console.log("escribiendo");
    for (let i = 0; i < message.length; i++) {
      dialogueBox.textContent += message.charAt(i);
      SFX.text.play();
      // Respeta comas y puntos
      const WAIT_TIMES = {
        ".": 1000,
        ",": 400,
      };
      await wait(WAIT_TIMES[message.charAt(i)] || speed);
    }
  } else {
    console.log("NO MOSTRAR CAJA DE DIALOGO");
  }
};
// Parpadea el sprite del enemigo
const blinkEnemySprite = async (enemySprite) => {
  enemySprite.classList.add("invisible");
  await wait(200);
  enemySprite.classList.remove("invisible");
  await wait(200);
  enemySprite.classList.add("invisible");
  await wait(200);
  enemySprite.classList.remove("invisible");
};

const displayPsiAttackGif = (psiName, displayTime) => {
  const psiAnimationContainer = document.querySelector(".bg-psi-animation");
  const psiAnimClass = `_PSI_ANIM-${psiName}`;
  psiAnimationContainer.classList.remove("hidden");
  psiAnimationContainer.classList.add(psiAnimClass);
  console.log("MOSTRANDO ANIMACION DE PSI");

  setInterval(() => {
    psiAnimationContainer.classList.add("hidden");
    psiAnimationContainer.classList.remove(psiAnimClass);
    console.log("FIN ANIMACION DE PSI");
  }, displayTime);
};

/**
 * Obtiene el accionar de un psi en especifico
 * @param {object} psiMove Movimiento psi
 * @param {object[]} characters Personajes (enemigos y aliados)
 * @returns {void}
 */
export const getPsiHandler = (psiMove, characters) => {
  const PSI_HANDLERS = {
    psi_freeze: {
      // Aca puede ir el codigo general, y con cada nivel muestra algo diferente
      alpha: async () => {
        const personajes = {
          allies: [{ name: "Jugador" }],
          enemies: [{ name: "Joaco" }],
        };

        toggleDialogueBox();
        await wait(100);

        await typewrite(
          `${psiMove.psiUser.name} tried ${psiMove.psiDisplayName} α!`
        );
        displayPsiAttackGif("psi_freeze-alpha", 2000);
      },
    },
  };

  SFX.psi.play();
  PSI_HANDLERS[psiMove.psiName][psiMove.psiSelectedLevel]();
};
