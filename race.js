// ------------------
// race.js
// ------------------
// Implements Spirit→Hollow→RedEyes→Menos→Adjuchas→Arrancar→Segunda

import { rand, clamp } from './core.js';
import { HollowArts, ZanpakutoDB, ArrancarForms } from './powers.js';

export function initRaceSkills(player) {
  switch (player.faction) {
    case 'Soul Reaper':
      // start with basic blade
      player.skills = [ new Skill({ name:'Zanjutsu Slash', cost:0, power:1.0, desc:'Basic blade', unlockLv:1 }) ];
      break;
    case 'Hollow':
      player.skills = [ new Skill({ name:'Hollow Claw',    cost:0, power:1.0, desc:'Ferocious claw', unlockLv:1 }) ];
      break;
    // add Quincy & Fullbringer similarly…
  }
}

/**
 * Handle Spirit→Hollow chain-pulls.
 */
export function pullChain(player, ui) {
  if (player.progStage !== 'Spirit') return;
  player.chainCount = clamp(player.chainCount + 1, 0, 5);
  ui.updateChain(player.chainCount);
  if (player.chainCount === 5) {
    player.progStage = 'Hollow';
    ui.log('Became Hollow – teleport to Hueco Mundo'); // :contentReference[oaicite:2]{index=2}
    ui.teleport('Hueco Mundo');
  }
}

/**
 * Eating remains grants XP/points.
 */
export function eatRemains(player, ui, type='Normal') {
  const ptsMap = { Normal:1, RedEyes:3, Menos:5, Adjuchas:10 };  
  const pts = ptsMap[type] || 0;
  player.killPoints += pts;
  player.xp         += pts;
  player.killCounts[type] = (player.killCounts[type]||0) + 1;
  ui.log(`Ate ${type} remains: +${pts} XP`);              // :contentReference[oaicite:3]{index=3}
  checkProgression(player, ui);
}

/**
 * Advance Hollow stages & track Menos timer.
 */
export function checkProgression(player, ui) {
  if (player.progStage === 'Hollow' && player.lv >= 20) {
    player.progStage = 'RedEyes';
    ui.log('Red-Eyes stage reached – defeat 2 Red-Eyes Hollows'); // :contentReference[oaicite:4]{index=4}
  }
  if (player.progStage === 'RedEyes' && player.killCounts.RedEyes >= 2) {
    player.progStage = 'Menos';
    player.menosStart = Date.now();
    ui.log('Evolved to Menos – survive 30m & 30 kills');         // :contentReference[oaicite:5]{index=5}
  }
  if (player.progStage==='Menos') {
    const survived = Date.now() - player.menosStart >= 30*60*1000;
    if (player.killCounts.Hollow >= 30 && survived) {
      player.progStage = 'Adjuchas';
      ui.log('Became Adjuchas – new powers unlocked');            // :contentReference[oaicite:6]{index=6}
      // grant random Hollow art
      const art = HollowArts[rand(HollowArts.length)];
      player.skills.push(new Skill(art));
    }
  }
}

/**
 * Simple Arrancar mini-game (arrow sequence).
 */
export function tryArrancar(player, ui, inputSeq) {
  if (player.progStage !== 'Adjuchas') return;
  // generate and validate arrow sequence...
  const formNames = Object.keys(ArrancarForms);
  const pick = formNames[rand(formNames.length)];
  player.progStage    = 'Arrancar';
  player.arrancarForm = pick;
  const form = ArrancarForms[pick];
  player.maxHp = Math.floor(player.maxHp * form.powerMult) + form.hpBonus;
  ui.log(`Arrancar: ${pick} unlocked!`);                         // :contentReference[oaicite:7]{index=7}
}
