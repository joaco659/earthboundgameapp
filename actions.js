export const actions = {
  getBashEnemyDamage: (enemy, attackUsed, playerStats) => {
    // Ataques criticos (los SMAAAASHes!)
    // Duplican el daño infligo al enemigo
    const smashed =
      Math.round(Math.random() * playerStats.guts) == playerStats.guts;
    const attackDamage = smashed
      ? (attackUsed.attackLevel * playerStats.offense - enemy.stats.defense) * 2
      : attackUsed.attackLevel * playerStats.offense - enemy.stats.defense;

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

    console.log("Daño infligido al enemigo: ", attackDamage);
    if (smashed) {
      console.log("SMAAAASH!");
    }

    console.log("Daño extra: ", extraDamage[rng]);
    console.log(
      "Ahora la vida del enemigo es: ",
      enemy.stats.hp - Math.abs(attackDamage + extraDamage[rng])
    );

    return [Math.abs(attackDamage + extraDamage[rng]), smashed];
  },
};
