// ------------------
// powers.js
// ------------------
// Defines all race- and stage-specific powers

import { Skill } from './core.js';

// —— Hollow Arts ——  
export const HollowArts = [
  { name:'Cero',           cost:8,  power:2.0, desc:'Red destruction beam',        type:'ranged', unlockLv:5 },
  { name:'Bala',           cost:6,  power:1.6, desc:'Fast reiatsu shot',           type:'ranged', unlockLv:10 },
  { name:'Gran Rey Cero',  cost:20, power:3.5, desc:'Massive domain-breaking wave',type:'ranged', unlockLv:20 },
  { name:'Hierro Smash',   cost:0,  power:1.2, desc:'Reinforced melee strike',    type:'melee',  unlockLv:5 },
  { name:'Cero Oscuras',   cost:15, power:3.0, desc:'Dark destructive beam',       type:'ranged', unlockLv:25 }
];

// —— Soul Reaper Shikai & Bankai ——
export const ZanpakutoDB = {
  Ichigo: {
    name: 'Zangetsu',
    shikai: [
      { name:'Getsuga Slash',   cost:10, power:2.2, desc:'Arc reiatsu wave',         type:'ranged', unlockLv:5 },
      { name:'Shadow Slash',    cost:12, power:2.5, desc:'Hidden blade storm',       type:'melee',  unlockLv:8 }
    ],
    bankai: [
      { name:'Tensa Getsuga',   cost:25, power:4.0, desc:'Compressed black Getsuga',               unlockLv:20 },
      { name:'Mugetsu',         cost:50, power:6.0, desc:'Final Getsuga',                           unlockLv:25 }
    ]
  },
  Rukia: {
    name: 'Sode no Shirayuki',
    shikai: [
      { name:'Some no Mai',     cost:12, power:2.0, desc:'Freezing circle',         type:'ranged', unlockLv:5 },
      { name:'Tsugi no Mai',    cost:15, power:2.6, desc:'Frost stream',            type:'ranged', unlockLv:8 }
    ],
    bankai: [
      { name:'Hakka no Togame', cost:30, power:4.2, desc:'Absolute-zero explosion',                 unlockLv:20 }
    ]
  }
};

// —— Quincy Schrifts & Fullbrings ——  
export const QuincySchrifts = [
  // e.g. { name:'Apocalypse', cost:20, power:3.0, desc:'Massive arrow storm', unlockLv:80 }
];

export const Fullbrings = [
  // e.g. { name:'Midas Touch', cost:10, power:2.0, desc:'Gold-based smash', unlockLv:15 }
];

// —— Arrancar Resurrección Forms ——  
export const ArrancarForms = {
  Menoscar:   { cost:0, powerMult:1.35,  hpBonus:35,  desc:'Initial mask form' },
  Adjucar:    { cost:0, powerMult:1.50,  hpBonus:50,  desc:'Enhanced mask form' },
  Vastocar:   { cost:0, powerMult:1.80,  hpBonus:80,  desc:'Full-powered mask form' }
};
