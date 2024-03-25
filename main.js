import { RollingCounter } from "./rollingCounter";
import { actions } from "./actions.js";
import { getPsiHandler } from "./psiHandlers.js";
import { SFX } from "./sfx.js";

// Funcion utilitaria
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clearAllChildren = (element) => {
  while (element.firstChild) {
    element.removeChild(element.lastChild);
  }
};

// 0: opcion nueva
// 1: opcion vieja
let mainUiOptionSelected = null;

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
const blinkEnemySprite = async (enemySprite) => {
  enemySprite.classList.add("invisible");
  await wait(200);
  enemySprite.classList.remove("invisible");
  await wait(200);
  enemySprite.classList.add("invisible");
  await wait(200);
  enemySprite.classList.remove("invisible");
};

const charSelectMenu = document.createElement("div");
charSelectMenu.classList.add("charselect-menu");

let actionSelected = null;
const displayCharacterSelector = (
  context,
  contextElement,
  characters,
  psiMove = null
) => {
  // Borrar enemigos anteriores
  clearAllChildren(charSelectMenu);

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

    if (contextElement == actionButtons.bash) {
      // Ataque comun
      characterLI.addEventListener("click", () => {
        console.log("Enemigo ", character.name, "seleccionado.");
        if (context.toLowerCase() == "enemies") {
          console.log("vida de antes del enemigo: ", character.stats.hp);
          const [attackDamage, additionalAttackInfo] =
            actions.getBashEnemyDamage(
              character,
              PLAYER_BASH_ATTACK,
              PLAYER_STATS
            );
          toggleDialogueBox();
          SFX.attack1.play();
          SFX.attack1.once("end", async () => {
            await wait(200);

            if (additionalAttackInfo.missed) {
              await typewrite("Fallo el ataque!");
            } else if (additionalAttackInfo.smashed) {
              const smashImage = document.getElementById("smash-attack");
              smashImage.classList.toggle("hidden");
              SFX.smash.play();
              blinkEnemySprite(character.sprite);
              blinkBgColor("#00ff6a99");

              SFX.smash.once("end", async () => {
                // SFX.enemyHit.play();
                await typewrite(
                  `${PLAYER_BASH_ATTACK.attackMessage} ${character.name},\r\n infligiendo ${attackDamage} de daño.`
                );
              });
            } else {
              SFX.attack2.play();
              SFX.attack2.once("end", async () => {
                if (additionalAttackInfo.enemyDodged) {
                  await typewrite("El enemigo esquivo el ataque!");
                } else {
                  SFX.enemyHit.play();
                  blinkEnemySprite(character.sprite);
                  await typewrite(
                    `${PLAYER_BASH_ATTACK.attackMessage} ${character.name},\r\n infligiendo ${attackDamage} de daño.`
                  );
                }
              });
            }
          });
        }
        charSelectMenu.remove();
        actionSelected = null;
      });
    } else if (contextElement == actionButtons.psi && psiMove) {
      // Con movimiento psi seleccionado
      const psiMoveSelectedContainer = document.createElement("ul");
      psiMoveSelectedContainer.classList.add("charselect-menu--selected-move");

      const psiMoveSelectedLabel = document.createElement("li");
      psiMoveSelectedLabel.textContent = psiMove.psiDisplayName;
      psiMoveSelectedContainer.appendChild(psiMoveSelectedLabel);

      charSelectMenu.appendChild(psiMoveSelectedContainer);

      characterLI.addEventListener("click", async () => {
        console.log("Personaje", character.name, "seleccionado.");
        // Ataques que van dirigidos al enemigo
        // (Hay que calcular si hace daño o aplica un estado de efecto)

        // console.log("vida de antes del enemigo: ", character.stats.hp);
        const charactersCopy = GAME_CHARACTERS;

        console.warn("EJECUTANDO PSI", psiMove);
        getPsiHandler(psiMove, characters);

        charSelectMenu.remove();
        actionSelected = null;
      });
    }

    charSelectMenu.appendChild(characterLI);
  });
  console.groupEnd();

  contextElement.appendChild(charSelectMenu);
};
const toggleDialogueBox = () => {
  document.querySelector(".actions__inner").classList.toggle("hidden");
  document.querySelector(".dialogue-box").classList.toggle("hidden");
};

// Setup del menu de PSI
const psiSelectMenu = document.createElement("div");
psiSelectMenu.classList.add("psiselect-menu");
// Funcion multiuso para renderizar interfaz fija y dinamica (los ataques PSI)
const psiSelectMenuBody = {
  info: () => {
    const psiInfoContainer = document.createElement("ul");
    psiInfoContainer.classList.add("psiselect-menu__psi-info");
    psiInfoContainer.classList.add("hidden");
    const psiInfoSubject = document.createElement("li");
    const psiInfoPPCost = document.createElement("li");
    psiInfoContainer.appendChild(psiInfoSubject);
    psiInfoContainer.appendChild(psiInfoPPCost);

    return psiInfoContainer;
  },
  types: () => {
    const psiSelectMenuTypes = document.createElement("ul");
    psiSelectMenuTypes.classList.add("psiselect-menu__psi-types");
    const offense = document.createElement("li");
    const recover = document.createElement("li");
    const assist = document.createElement("li");
    offense.textContent = "Offense";
    offense.dataset.psiType = "offense";
    recover.textContent = "Recover";
    recover.dataset.psiType = "recover";
    assist.textContent = "Assist";
    assist.dataset.psiType = "assist";

    const loadMoves = (opt) => {
      offense.classList.remove("selected-opt");
      recover.classList.remove("selected-opt");
      assist.classList.remove("selected-opt");

      clearAllChildren(psiSelectMenu.children[2]);
      psiSelectMenuBody.moves(PLAYER_PSI_MOVES[opt]).forEach((move) => {
        psiSelectMenu.children[2].appendChild(move);
      });
    };

    // Carga de los movimientos
    offense.addEventListener("click", (e) => {
      loadMoves("offense");
      offense.classList.add("selected-opt");
    });

    recover.addEventListener("click", (e) => {
      loadMoves("recover");
      recover.classList.add("selected-opt");
    });

    assist.addEventListener("click", (e) => {
      loadMoves("assist");
      assist.classList.add("selected-opt");
    });

    psiSelectMenuTypes.appendChild(offense);
    psiSelectMenuTypes.appendChild(recover);
    psiSelectMenuTypes.appendChild(assist);

    return psiSelectMenuTypes;
  },
  movesContainer: () => {
    const psiMovesContainer = document.createElement("ul");
    psiMovesContainer.classList.add("psiselect-menu__psi-moves");
    return psiMovesContainer;
  },
  moves: (PSI_MOVES) => {
    const psiMovesContainer = [];
    PSI_MOVES.map((psiMove) => {
      const psiMoveContainer = document.createElement("ul");
      psiMoveContainer.classList.add("psiselect-menu__psi-moves--psi-move");
      psiMoveContainer.dataset.psiMoveName = psiMove.psiName;

      const psiDisplayName = document.createElement("p");

      const psiMoveLevelsContainer = document.createElement("ul");
      psiMoveLevelsContainer.classList.add("psi-move--levels");

      psiDisplayName.textContent = psiMove.psiDisplayName;
      psiMoveContainer.appendChild(psiDisplayName);
      psiMoveContainer.appendChild(psiMoveLevelsContainer);

      const renderedPsiLevels = [];
      const psiLevelsRenderList = [
        ["alpha", "beta", "gamma", "Omega"],
        ["alpha", "beta", "Sigma", "Omega"],
      ];

      Object.entries(psiMove.psiLevels).forEach((level) => {
        if (!(level[0] == "psiLevelType")) {
          const psiMoveLevel = document.createElement("li");
          // textContent e innerText no aceptan entidades html (&alpha;), en su lugar uso innerHTML
          psiMoveLevel.innerHTML = `&${level[0]};`;
          psiMoveLevel.dataset.psiLevel = level[0];
          psiMoveLevel.dataset.psiLevelEnabled = true;
          renderedPsiLevels.push(level[0]);

          // Muestra info del ataque psi como el costo y el alcance
          psiMoveLevel.addEventListener("mouseenter", () => {
            const psiInfoContainer = psiSelectMenu.children[0];
            psiInfoContainer.classList.remove("hidden");
            psiInfoContainer.children[0].textContent =
              psiMove.psiSubjectMessage;
            psiInfoContainer.children[1].textContent = `PP Cost: ${level[1].ppCost}`;
          });

          psiMoveLevel.addEventListener("click", () => {
            let selectedPsiMove = psiMove;
            selectedPsiMove.psiSelectedLevel = level[0];
            selectedPsiMove.psiUser = { name: "Jugador", stats: PLAYER_STATS };
            psiSelectMenu.remove();

            actionSelected = null;
            if (selectedPsiMove.psiSubject == "enemies") {
              // Cuando es un psi que afecta a todos los enemigos, no muestra el selector de personaje
              if (selectedPsiMove.psiScope == "all") {
                (async function () {
                  const psiResults = actions.getPluralPsiMoveAction(
                    Enemies,
                    selectedPsiMove,
                    PLAYER_STATS
                  );

                  toggleDialogueBox();
                  await typewrite("Ataque psi en plural");
                })();
              } else {
                displayCharacterSelector(
                  "enemies",
                  actionButtons.psi,
                  Enemies,
                  selectedPsiMove
                );
              }
            } else {
              // Esto mucho no se va a usar ya que por ahora solo va a haber un aliado
              // (el cual es el jugador)
              if (selectedPsiMove.psiScope == "all") {
                (async function () {
                  const psiResults = actions.getPluralPsiMoveAction(
                    [{ name: "Jugador", stats: PLAYER_STATS }],
                    selectedPsiMove,
                    PLAYER_STATS
                  );

                  toggleDialogueBox();
                  await typewrite("Ataque aliado psi en plural");
                })();
              } else {
                displayCharacterSelector(
                  "allies",
                  actionButtons.psi,
                  // Refactorizar
                  // Hacer una variable donde se guarde el equipo, incluyendo al jugador
                  // (eso si en un futuro se pueden incluir aliados) :)
                  [{ name: "Jugador", stats: PLAYER_STATS }],
                  selectedPsiMove
                );
              }
            }
          });

          psiMoveLevel.addEventListener("mouseleave", () => {
            const psiInfoContainer = psiSelectMenu.children[0];
            psiInfoContainer.classList.add("hidden");
            psiInfoContainer.children[0].textContent = "";
            psiInfoContainer.children[1].textContent = "";
          });

          psiMoveLevelsContainer.appendChild(psiMoveLevel);
        }
      });

      // Debug
      // console.log(
      //   `Rendered psi levels for ${psiMove.psiDisplayName}:`,
      //   renderedPsiLevels
      // );

      /*
        Esto lo hago por imitar la interfaz del juego donde no aparecen los demas niveles,
        pero su espacio vacio sigue ahi para cuando aparezcan.
      */
      psiLevelsRenderList[psiMove.psiLevels.psiLevelType].map(
        (level, index) => {
          if (!(level == renderedPsiLevels[index])) {
            const psiMoveLevel = document.createElement("li");
            psiMoveLevel.innerHTML = `&${level};`;
            psiMoveLevel.dataset.psiLevel = level;
            psiMoveLevel.dataset.psiLevelEnabled = false;
            psiMoveLevelsContainer.appendChild(psiMoveLevel);
          }
        }
      );

      psiMovesContainer.push(psiMoveContainer);
    });
    return psiMovesContainer;
  },
};

psiSelectMenu.appendChild(psiSelectMenuBody.info());
psiSelectMenu.appendChild(psiSelectMenuBody.types());
psiSelectMenu.appendChild(psiSelectMenuBody.movesContainer());

const displayPsiSelector = (contextElement) => {
  clearAllChildren(psiSelectMenu.children[2]);
  if (actionSelected == contextElement) {
    // Se quita el seleccionado de las demas opciones al abrir el menu
    Object.entries(psiSelectMenu.children[1].children).forEach((key) =>
      key[1].classList.remove("selected-opt")
    );
    psiSelectMenu.remove();
    console.log("already selected");
    actionSelected = null;
    return;
  }
  actionSelected = contextElement;

  contextElement.appendChild(psiSelectMenu);

  // Se muestran los PSI ofensivos al abrir el menu
  psiSelectMenu.children[1].children[0].classList.add("selected-opt");
  psiSelectMenuBody.moves(PLAYER_PSI_MOVES.offense).forEach((move) => {
    psiSelectMenu.children[2].appendChild(move);
  });
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
    sprite: document.getElementById("enemy"),
    stats: {
      hp: 800,
      pp: 0,
      offense: 55,
      defense: 31,
      speed: 9,
      guts: 14,
      rewardExp: 130,
      wealth: 659,
      drops: [],
      vulnerabilities: ["psi_fire"],
      strengths: ["psi_freeze"],
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

// Mas o menos las stats que tiene Ness al nivel 19
// (lo nerfee)
const PLAYER_STATS = {
  hp: 165,
  pp: 30,
  offense: 45,
  defense: 24,
  speed: 11,
  luck: 13,
  guts: 15,
  statusEffects: [],
};

const PLAYER_BASH_ATTACK = {
  attackMessage: `Golpeas con fuerza a `,
  attackType: "physical",
  attackLevel: 1,
  targets: 1,
  ppCost: 0,
};

// Los ataques psi deberian ir todos en un archivo JSON a modo de DB
// (tambien estan nerfeados xd)
const PLAYER_PSI_MOVES = {
  offense: [
    {
      psiName: "psi_rockin",
      psiDisplayName: "PSI Rockin",
      psiSubject: "enemies",
      psiScope: "all",
      psiSubjectMessage: "To all the enemies",
      psiLevels: {
        // Esto es para diferenciar si los niveles deben renderizarse de distinta forma
        // -- Averiguar una forma de optimizar
        psiLevelType: 0,
        alpha: {
          damage: [50, 100],
          ppCost: 10,
        },
      },
    },
    {
      psiName: "psi_freeze",
      psiDisplayName: "PSI Freeze",
      psiSubject: "enemies",
      // Tiene de scope a todos los enemigos, pero selecciona varios o uno solo al azar
      psiScope: "one",
      psiSubjectMessage: "To one enemy",
      psiLevels: {
        psiLevelType: 0,
        alpha: {
          damage: [60, 120],
          ppCost: 4,
        },
      },
    },
  ],
  recover: [
    {
      psiName: "psi_lifeup",
      psiDisplayName: "PSI Lifeup",
      psiSubject: "allies",
      psiScope: "one",
      psiSubjectMessage: "To one of us",
      psiLevels: {
        psiLevelType: 1,
        alpha: {
          restore: 100,
          ppCost: 5,
        },
      },
    },
  ],
  assist: [],
};

const GAME_CHARACTERS = {
  allies: [
    {
      name: "Jugador",
      stats: PLAYER_STATS,
    },
  ],
  enemies: Enemies,
};

hpCounter.value = PLAYER_STATS.hp;
ppCounter.value = PLAYER_STATS.pp;

actionButtons.bash.children[0].addEventListener("click", () => {
  displayCharacterSelector("enemies", actionButtons.bash, Enemies);
});
actionButtons.psi.children[0].addEventListener("click", () => {
  displayPsiSelector(actionButtons.psi);
});

document.addEventListener("DOMContentLoaded", () => {
  // Las acciones hacen ruido al hacer click en ellas
  Object.entries(actionButtons).forEach((key) => {
    key[1].addEventListener("click", (e) => {
      // e.stopPropagation();
      mainUiOptionSelected = key[1];
      SFX.text.play();
    });
  });
});
