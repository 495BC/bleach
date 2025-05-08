// Handles agility-based dash chaining (flashstep mechanics)
import { clamp, rand, on } from '../core/utils.js';

export class Flashstep {
  constructor(character, ui) {
    this.char = character;
    this.ui   = ui;
    this.queue= [];
    on('dash', () => this.tryChain());
  }

  tryChain() {
    // press & hold dash within window to extend chain
    if (this.queue.length < this.char.spd * 0.1) {
      this.queue.push(Date.now());
      this.ui.log('Flashstep chain +1');
    } else {
      this.ui.log('Chain limit reached');
    }
  }

  getChainCount() {
    // expire after 2 seconds
    const now = Date.now();
    this.queue = this.queue.filter(t => now - t < 2000);
    return this.queue.length;
  }

  reset() { this.queue = []; }
}
