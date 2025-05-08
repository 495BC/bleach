// ------------------
// combat.js
// ------------------
// Turn-based text combat with damage & status

import { clamp, rand } from './core.js';

export async function battle(player, enemy, ui) {
  ui.log(`A wild ${enemy.name} appears!`);
  let turn = player.spd >= enemy.spd ? 'player' : 'enemy';
  while (player.hp>0 && enemy.hp>0) {
    if (turn === 'player') {
      const idx = await ui.promptSkill(player.skills);
      const sk  = player.skills[idx];
      if (player.reiatsu < sk.cost) {
        ui.log('Not enough Reiatsu!');
      } else {
        player.reiatsu = clamp(player.reiatsu - sk.cost, 0, player.maxRei);
        const dmg = Math.floor(Math.max(1, player.atk*sk.power - enemy.def) * (0.8 + Math.random()*0.4));
        enemy.hp = clamp(enemy.hp - dmg, 0, enemy.maxHp);
        ui.log(`You used ${sk.name}: ${dmg} dmg`);
        ui.updateHUD(player, enemy);
        if (enemy.hp === 0) break;
      }
      turn = 'enemy';
    } else {
      const sk = enemy.skills[rand(enemy.skills.length)];
      if (enemy.reiatsu < sk.cost) {
        enemy.reiatsu = clamp(enemy.reiatsu + 5, 0, enemy.maxRei);
        ui.log(`${enemy.name} recovers Reiatsu`);
      } else {
        enemy.reiatsu = clamp(enemy.reiatsu - sk.cost, 0, enemy.maxRei);
        const dmg = Math.floor(Math.max(1, enemy.atk*sk.power - player.def) * (0.8 + Math.random()*0.4));
        player.hp = clamp(player.hp - dmg, 0, player.maxHp);
        ui.log(`${enemy.name} used ${sk.name}: ${dmg} dmg`);
        ui.updateHUD(player, enemy);
        if (player.hp === 0) break;
      }
      turn = 'player';
    }
    await ui.wait(300);
  }
  return player.hp>0;
}
