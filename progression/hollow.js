// Spirit → Hollow → RedEyes → Menos → Adjuchas progression

import { on, emit, rand } from '../core/utils.js';
import { Character }     from '../core/base.js';

export class HollowProgression {
  constructor(player, ui) {
    this.p      = player;
    this.ui     = ui;
    this.chain  = 0;
    this.startTime = null;

    on('playerDeath', () => this.enterSpirit());
    on('enemyDeath', (enemy) => {
      if (this.p.progStage === 'RedEyes' && enemy.name.includes('Red-Eyes')) {
        this.toMenos();  // after two kills check externally
      }
    });
  }

  enterSpirit() {
    this.p.progStage = 'Spirit';
    this.chain = 0;
    this.ui.log('You have died – press G (or click) 5 times to pull your chain.');
  }

  pullChain() {
    if (this.p.progStage !== 'Spirit') return;
    this.chain++;
    this.ui.log(`Chain pulled (${this.chain}/5)`);
    if (this.chain >= 5) {
      this.p.progStage = 'Hollow';
      this.ui.log('Transformed into Hollow! Teleport to Hueco Mundo.');
      emit('teleport', 'Hueco Mundo');
    }
  }

  toRedEyes() {
    if (this.p.lv >= 20 && this.p.progStage === 'Hollow') {
      this.p.progStage = 'RedEyes';
      this.ui.log('Red-Eyes stage unlocked! Defeat 2 Red-Eyes Hollows to become Menos.');
    }
  }

  toMenos() {
    // check killed count externally...
    this.p.progStage = 'Menos';
    this.startTime   = Date.now();
    this.ui.log('Menos stage! Survive 30m and 30 Hollow kills to advance.');
  }

  tryAdjuchas(killCount) {
    const survived = Date.now() - this.startTime >= 30*60*1000;
    if (killCount >= 30 && survived) {
      this.p.progStage = 'Adjuchas';
      this.ui.log('Evolved into Adjuchas!');
      emit('adjuchasStart');
    } else {
      this.ui.log('Need 30 kills AND 30m survival for Adjuchas.');
    }
  }
}
