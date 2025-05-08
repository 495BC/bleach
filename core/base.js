// Defines Character, Skill, and Zanpakuto abstractions.

export class Skill {
  constructor({ name, cost, power, desc, type = 'melee', unlockLv = 1 }) {
    Object.assign(this, { name, cost, power, desc, type, unlockLv });
  }
}

export class Zanpakuto {
  constructor({ name, shikaiSkills = [], bankaiSkills = [] }) {
    this.name = name;
    this.shikaiSkills = shikaiSkills;   // array of Skill
    this.bankaiSkills = bankaiSkills;   // array of Skill
  }
}

export class Character {
  constructor({ name, faction, stats: { hp, reiatsu, atk, def, spd }, zanpakuto = null }) {
    this.name      = name;
    this.faction   = faction;
    this.maxHp     = hp;     this.hp      = hp;
    this.maxRei    = reiatsu;this.reiatsu = reiatsu;
    this.atk       = atk;    this.def     = def;
    this.spd       = spd;

    this.lv        = 1;
    this.xp        = 0;
    this.statPts   = 0;

    this.zanpakuto = zanpakuto;
    this.hasShikai = false;
    this.hasBankai = false;
    this.maskOn    = false;

    // Starting skills will be assigned by a factory in progression modules
    this.skills    = [];
  }
}
