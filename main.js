import { Howl, Howler } from "howler";
import { RollingCounter } from "./rollingCounter";
import { actions } from "./actions.js";

// Funcion utilitaria
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const hpCounter = new RollingCounter(
  document.getElementById("hp-counter"),
  3,
  false
);
const ppCounter = new RollingCounter(
  document.getElementById("pp-counter"),
  3,
  false
);

// ppCounter.rollTo(0, 40, 10);
// hpCounter.rollTo(0, 70, 10);

// const actionMenu = document.querySelector(".action-menu");

// const typewrite = (message, speed, i = 0) => {
//   const dialogueBox = document.querySelector(".dialogue-box");

//   // Si la caja de dialogo no se muestra, no escribe nada
//   if (!dialogueBox.classList.contains("hidden") && i < message.length) {
//     console.log("escribiendo");
//     dialogueBox.textContent += message.charAt(i);
//     i++;
//     setTimeout(() => {
//       typewrite(message, speed, i);
//     }, speed);
//   }
// };

const SFX = {
  text: new Howl({
    src: ["./sounds/text.wav"],
  }),
  attack1: new Howl({
    src: ["./sounds/attack1.wav"],
  }),
  attack2: new Howl({
    src: ["./sounds/attack2.wav"],
  }),
  smash: new Howl({
    src: ["./sounds/smash.wav"],
  }),
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

// Fondo de colores que parpadea para ataques criticos como en el juego original
const bgScreenColor = document.querySelector(".bg-screen-color");
const blinkBgColor = async (color) => {
  bgScreenColor.setAttribute("style", `background-color: ${color}`);
  bgScreenColor.classList.remove("hidden");
  await wait(300);
  bgScreenColor.classList.add("hidden");
  await wait(300);
  bgScreenColor.classList.remove("hidden");
  await wait(300);
  bgScreenColor.classList.add("hidden");
};

const charSelectMenu = document.createElement("div");
charSelectMenu.classList.add("charselect-menu");

let actionSelected = null;
const displayCharacterSelector = (context, contextElement, characters) => {
  // Borrar enemigos anteriores
  while (charSelectMenu.firstChild) {
    charSelectMenu.removeChild(charSelectMenu.lastChild);
  }

  if (actionSelected == contextElement) {
    charSelectMenu.remove();
    console.log("already selected");
    actionSelected = null;
    return;
  }
  actionSelected = contextElement;

  console.group("Seleccion de personajes");
  characters.map((character) => {
    console.log(character);
    const characterLI = document.createElement("li");
    characterLI.textContent = character.name;
    characterLI.addEventListener("click", () => {
      console.log("Enemigo ", character.name, "seleccionado.");
      if (context.toLowerCase() == "enemies") {
        console.log("vida de antes del enemigo: ", character.stats.hp);
        const [attackDamage, playerSmashed] = actions.getBashEnemyDamage(
          character,
          PLAYER_BASH_ATTACK,
          PLAYER_STATS
        );
        toggleDialogueBox();
        SFX.attack1.play();
        SFX.attack1.once("end", async () => {
          await wait(200);

          if (playerSmashed) {
            const smashImage = document.getElementById("smash-attack");
            smashImage.classList.toggle("hidden");
            SFX.smash.play();
            blinkBgColor("#00ff6a99");

            SFX.smash.once("end", async () => {
              await typewrite(
                `${PLAYER_BASH_ATTACK.attackMessage} ${character.name},\r\n infligiendo ${attackDamage} de daño.`
              );
            });
          } else {
            SFX.attack2.play();
            SFX.attack2.once("end", async () => {
              await typewrite(
                `${PLAYER_BASH_ATTACK.attackMessage} ${character.name},\r\n infligiendo ${attackDamage} de daño.`
              );
            });
          }
        });
      }
      charSelectMenu.remove();
      actionSelected = null;
    });

    charSelectMenu.appendChild(characterLI);
  });
  console.groupEnd();

  contextElement.appendChild(charSelectMenu);
};
const toggleDialogueBox = () => {
  document.querySelector(".actions__inner").classList.toggle("hidden");
  document.querySelector(".dialogue-box").classList.toggle("hidden");
};

const actionButtons = {
  bash: document.getElementById("action_bash"),
  psi: document.getElementById("action_psi"),
  goods: document.getElementById("action_goods"),
  defend: document.getElementById("action_defend"),
  autoFight: document.getElementById("action_autofight"),
  runAway: document.getElementById("action_runaway"),
};

const Enemies = [
  {
    name: "Joaco",
    initialMessage: "El creador del fangame te reta a una batalla.",
    stats: {
      hp: 99,
      pp: 0,
      offense: 20,
      defense: 25,
      speed: 6,
      guts: 50,
      rewardExp: 130,
      wealth: 659,
      drops: [],
      vulnerabilities: ["psi_fire", "psi_freeze"],
    },
    attacks: [
      {
        attackMessage: ` te golpea con toda su furia! `,
        attackType: "physical",
        attackLevel: 1,
        targets: 1,
        ppCost: 0,
      },
    ],
  },
];

const PLAYER_STATS = {
  hp: 85,
  pp: 25,
  offense: 15,
  defense: 20,
  speed: 5,
  guts: 30,
};

const PLAYER_BASH_ATTACK = {
  attackMessage: `Golpeas con fuerza a `,
  attackType: "physical",
  attackLevel: 1,
  targets: 1,
  ppCost: 0,
};

hpCounter.value = PLAYER_STATS.hp;
ppCounter.value = PLAYER_STATS.pp;

actionButtons.bash.children[0].addEventListener("click", () => {
  displayCharacterSelector("enemies", actionButtons.bash, Enemies);
});
document.getElementById("action_psi").addEventListener("click", async () => {
  ppCounter.rollTo(0, 40, 10);
  document.querySelector(".actions__inner").classList.add("hidden");
  document.querySelector(".dialogue-box").classList.remove("hidden");
  await typewrite(
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    30
  );
});

document.addEventListener("DOMContentLoaded", () => {
  // Las acciones hacen ruido al hacer click en ellas
  Object.entries(actionButtons).forEach((key) => {
    key[1].addEventListener("click", () => {
      SFX.text.play();
    });
  });
});
