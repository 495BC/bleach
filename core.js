// ------------------
// core.js
// ------------------
// Defines Character, Skill, Zanpakuto, plus utility functions

/**
 * Clamp value v to [min, max].
 */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Random integer in [0, n).
 */
export function rand(n) {
  return Math.floor(Math.random() * n);
}

/**
 * Represents an ability or attack.
 */
export class Skill {
  constructor({ name, cost = 0, power = 1.0, desc = '', type = 'melee', unlockLv = 1 }) {
    Object.assign(this, { name, cost, power, desc, type, unlockLv });
  }
}

/**
 * Represents a Zanpakutō with its Shikai/Bankai skills.
 */
export class Zanpakuto {
  constructor({ name, shikaiSkills = [], bankaiSkills = [] }) {
    this.name           = name;
    this.shikaiSkills   = shikaiSkills;   // array of Skill
    this.bankaiSkills   = bankaiSkills;   // array of Skill
  }
}

/**
 * Core character model.
 */
export class Character {
  constructor({ name, faction, stats: { hp, reiatsu, atk, def, spd }, zanpakuto = null }) {
    this.name        = name;
    this.faction     = faction;
    this.maxHp       = hp;      this.hp       = hp;
    this.maxRei      = reiatsu; this.reiatsu  = reiatsu;
    this.atk         = atk;     this.def      = def;
    this.spd         = spd;
    this.lv          = 1;
    this.xp          = 0;
    this.statPts     = 0;
    this.zanpakuto   = zanpakuto;
    this.hasShikai   = false;
    this.hasBankai   = false;
    this.maskOn      = false;
    this.skills      = [];      // populated by race logic
    // progression fields
    this.progStage   = 'Human'; // Human, Spirit, Hollow, RedEyes, Menos, Adjuchas, Arrancar, Segunda
    this.chainCount  = 0;       // for Spirit→Hollow :contentReference[oaicite:0]{index=0}
    this.killPoints  = 0;       // remains-eaten XP :contentReference[oaicite:1]{index=1}
    this.killCounts  = {};      // track kills by type
    this.menosStart  = null;    // timestamp when Menos begins
    this.arrancarForm= null;    // Menoscar, Adjucar, Vastocar
  }
}
