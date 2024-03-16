export const actions = {
  getBashEnemyDamage: (enemy, attackUsed, playerStats) => {
    // Cosas por añadir
    // Refactorizar chance del SMAAAASH, y que despues de que haga no se saltee las probabilidades de abajo:

    // Chance de fallar el ataque
    // Si el jugador tiene el estado de efecto de llorar, aumentara su chance de fallar el ataque
    if (
      playerStats.statusEffects["crying"] ||
      playerStats.statusEffects["nausea"]
    ) {
      const missRate = Math.floor(Math.random() * 16) + 8;
      if (missRate == 8) return [0, { smashed: false, missed: true }];
    } else {
      const missRate = Math.floor(Math.random() * 16) + 1;
      if (missRate == 1) return [0, { smashed: false, missed: true }];
    }

    // Ataques criticos (los SMAAAASHes!)
    // Duplican el daño infligido al enemigo
    const smashChance = Math.max(playerStats.guts / 500, 1 / 20);
    const smashed = Math.random() < smashChance;
    const attackDamage = smashed
      ? 4 * playerStats.offense - enemy.stats.defense
      : attackUsed.attackLevel * playerStats.offense - enemy.stats.defense;

    // Chance de que los enemigos esquiven el ataque
    // Si el jugador hace un ataque critico el enemigo no podra esquivarlo
    if (!smashed) {
      const enemyDodgeRate =
        (2 * (enemy.stats.speed - playerStats.speed)) / 500;
      const enemyDodged = Math.random() < enemyDodgeRate;
      if (enemyDodged) return [0, { smashed: false, enemyDodged: true }];
    }

    // Factor benefactor para el jugador
    // Cada ataque tiene chance de infligir 20% mas o menos de daño al enemigo.
    const rng = Math.round(Math.random() * 2);
    const extraDamage = [
      // Mas daño
      -((attackDamage * 20) / 100),
      // Igual de daño
      0,
      // Menos daño
      (attackDamage * 20) / 100,
    ];

    // Debug
    console.groupCollapsed("Daños");
    console.log("Daño infligido al enemigo: ", attackDamage);
    if (smashed) {
      console.log("SMAAAASH!");
    }

    console.log("Daño extra: ", extraDamage[rng]);
    console.log(
      "Ahora la vida del enemigo es: ",
      enemy.stats.hp - Math.abs(attackDamage + extraDamage[rng])
    );
    console.groupEnd();

    return [
      Math.round(Math.abs(attackDamage + extraDamage[rng])),
      { smashed: smashed },
    ];
  },
  getPluralPsiMoveAction: (enemies, psiMove, playerStats) => {
    // Implementar logica para los ataques psi
    const PSI_ATTACKS_DICT = {
      psi_rockin: {
        alpha: () => {
          const attackDamage = 40 + Math.round(Math.random() * 80);

          const psiResults = [];
          enemies.forEach((enemy) => {
            const missRate = (2 * enemy.stats.speed - playerStats.speed) / 10;

            console.log("MISS RATE ", missRate);

            const enemyDodged = Math.random() < 0;
            enemyDodged
              ? psiResults.push({
                  to: enemy,
                  results: [0, false, { enemyDodged: true }],
                })
              : psiResults.push({
                  to: enemy,
                  results: [attackDamage, false, {}],
                });
          });
          return psiResults;
        },
      },
    };

    const psiResult =
      PSI_ATTACKS_DICT[psiMove.psiName][psiMove.psiSelectedLevel]();

    console.log(
      `RESULTADO DEL PSI: ${psiMove.psiName} ${psiMove.psiSelectedLevel}`,
      psiResult
    );

    return psiResult;
  },
  getSinglePsiMoveAction: (enemy, psiMove, playerStats) => {
    // Implementar logica para los ataques psi
    const PSI_ATTACKS_DICT = {
      psi_freeze: {
        alpha: () => {
          const freezeChance = 0.1;
          const attackDamage = 30 + Math.round(Math.random() * 90);
          // Si el enemigo tiene debilidad al hielo, le hara un 25% mas de daño
          enemy.stats.vulnerabilities.forEach((vulnerability) => {
            if (vulnerability == psiMove.psiName)
              return Math.round(Math.abs(attackDamage + (attackDamage * 25) / 100));
          });
          // Si el enemigo tiene resistencia al hielo, le hara un 25% menos de daño
          enemy.stats.strengths.forEach((strength) => {
            if (strength == psiMove.psiName)
              return Math.round(Math.abs(attackDamage - (attackDamage * 25) / 100));
          });

          // Daño mas random
          if (Math.random() < 0.5) {
            return Math.round(Math.abs(attackDamage - (attackDamage * 10) / 100));
          } else {
            return Math.round(Math.abs(attackDamage + (attackDamage * 10) / 100));
          }
        },
      },
    };

    const psiResult =
      PSI_ATTACKS_DICT[psiMove.psiName][psiMove.psiSelectedLevel]();

    console.log(
      `RESULTADO DEL PSI: ${psiMove.psiName} ${psiMove.psiSelectedLevel}`,
      psiResult
    );

    return psiResult;
  },
};
