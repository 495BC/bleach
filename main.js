// ------------------
// main.js
// ------------------
// Bootstraps the game, handles text prompts and G-key inputs

import { Character, Skill, Zanpakuto } from './core.js';
import { battle }       from './combat.js';
import { initRaceSkills, pullChain, eatRemains, tryArrancar } from './race.js';
import { ZanpakutoDB }  from './powers.js';

const ui = createTextUI();  // your text-UI implementation

async function newGame() {
  const faction = await ui.prompt('Choose race (Soul Reaper / Hollow):');
  const name    = await ui.prompt('Enter name:');
  const baseStats = faction==='Hollow'
    ? { hp:180, reiatsu:80, atk:22, def:10, spd:11 }
    : { hp:160, reiatsu:90, atk:20, def:12, spd:14 };
  const zp = faction==='Soul Reaper' ? new Zanpakuto(ZanpakutoDB[name] || ZanpakutoDB.Ichigo) : null;
  const player = new Character({ name, faction, stats:baseStats, zanpakuto:zp });
  initRaceSkills(player);
  gameLoop(player);
}

async function gameLoop(player) {
  ui.renderPlayerPanel(player);
  document.addEventListener('keydown', e => {
    if (e.key==='g') pullChain(player, ui);
  });
  while (true) {
    const enemy = spawnEnemy(player);
    const win   = await battle(player, enemy, ui);
    if (!win) {
      pullChain(player, ui);  // Spirit logic
      break;
    }
    eatRemains(player, ui, enemy.progStage==='Hollow'?'Hollow':'Normal'); 
    ui.renderPlayerPanel(player);
    if (player.progStage==='Adjuchas') {
      const want = await ui.prompt('Transform to Arrancar? (y/n)');
      if (want==='y') tryArrancar(player, ui);
    }
  }
}

newGame();
