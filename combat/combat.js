import { clamp, rand } from '../core/utils.js';
import { on, emit }  from '../core/utils.js';

export class Combat {
  constructor(player, enemy, ui) {
    this.player = player;
    this.enemy  = enemy;
    this.ui     = ui;      // reference to UI methods (log, updateHUD)
    this.turn   = player.spd >= enemy.spd ? 'player' : 'enemy';
  }

  /**
   * Advance one action in the battle.
   */
  next() {
    if (this.turn === 'player') this.playerAction();
    else                       this.enemyAction();
  }

  playerAction(skillIdx) {
    const skill = this.player.skills[skillIdx];
    if (!skill || this.player.reiatsu < skill.cost) {
      this.ui.log('Not enough Reiatsu!');
      return;
    }
    this.player.reiatsu = clamp(this.player.reiatsu - skill.cost, 0, this.player.maxRei);
    const dmg = this.calcDamage(this.player, this.enemy, skill.power);
    this.enemy.hp = clamp(this.enemy.hp - dmg, 0, this.enemy.maxHp);
    this.ui.log(`You used ${skill.name}: ${dmg} dmg`);
    this.ui.updateHUD();
    if (this.checkEnd()) return;
    this.turn = 'enemy';
    setTimeout(() => this.next(), 400);
  }

  enemyAction() {
    const choice = rand(this.enemy.skills.length);
    const skill  = this.enemy.skills[choice];
    if (this.enemy.reiatsu < skill.cost) {
      this.enemy.reiatsu = clamp(this.enemy.reiatsu + 5, 0, this.enemy.maxRei);
      this.ui.log(`${this.enemy.name} focuses Reiatsu`);
    } else {
      this.enemy.reiatsu = clamp(this.enemy.reiatsu - skill.cost, 0, this.enemy.maxRei);
      const dmg = this.calcDamage(this.enemy, this.player, skill.power);
      this.player.hp = clamp(this.player.hp - dmg, 0, this.player.maxHp);
      this.ui.log(`${this.enemy.name} used ${skill.name}: ${dmg} dmg`);
      this.ui.updateHUD();
    }
    if (this.checkEnd()) return;
    this.turn = 'player';
    this.next();
  }

  checkEnd() {
    if (this.player.hp <= 0) {
      this.ui.log('<span style="color:red">You were defeated…</span>');
      emit('playerDeath');
      return true;
    }
    if (this.enemy.hp <= 0) {
      this.ui.log('<span style="color:lime">Enemy defeated!</span>');
      emit('enemyDeath', this.enemy);
      return true;
    }
    return false;
  }

  calcDamage(att, tgt, power) {
    // Basic formula; extend with statusEffects
    const base = Math.max(1, att.atk * power - tgt.def);
    return Math.floor(base * (0.8 + Math.random()*0.4));
  }
}
