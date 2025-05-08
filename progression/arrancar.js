// Arrancar mini-game and transformation

import { on, rand } from '../core/utils.js';

export class ArrancarProgression {
  constructor(player, ui) {
    this.p  = player;
    this.ui = ui;
    this.forms = ['Menoscar','Adjucar','Vastocar'];
    this.requiredStage = 'Adjuchas';
    this.arrowSeq = [];
    this.playerWins = 0;

    on('dash', () => this.startMiniGame());
  }

  startMiniGame() {
    if (this.p.progStage !== this.requiredStage) return;
    this.arrowSeq = Array.from({length:5}, ()=>['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'][rand(4)]);
    this.ui.showArrows(this.arrowSeq);
  }

  checkSequence(inputSeq) {
    const correct = this.arrowSeq.every((k,i)=>k===inputSeq[i]);
    if (correct) {
      const form = this.forms[rand(this.forms.length)];
      this.p.progStage = 'Arrancar';
      this.p.arrancarForm = form;
      this.ui.log(`Arrancar form ${form} awakened!`);
      this.playerWins++;
    } else {
      this.ui.log('Mini-game failed. Cooldown triggered.');
    }
  }
}
