/********************  DATA TYPES  *************************/
class Skill {
  constructor({ name, cost, power, desc, type = 'melee', unlockLv = 1 }) {
    Object.assign(this, { name, cost, power, desc, type, unlockLv });
  }
}

class Zanpakuto {
  constructor({ name, shikaiSkills = [], bankaiSkills = [] }) {
    this.name = name;
    this.shikaiSkills = shikaiSkills;
    this.bankaiSkills = bankaiSkills;
  }
}

class Character {
  constructor({ name, hp, reiatsu, atk, def, spd, zanpakuto = null, faction }) {
    this.name      = name;
    this.maxHp     = hp;     this.hp      = hp;
    this.maxRei    = reiatsu;this.reiatsu = reiatsu;
    this.atk       = atk;    this.def     = def;
    this.spd       = spd;
    this.xp        = 0;
    this.lv        = 1;
    this.statPts   = 0;
    this.zanpakuto = zanpakuto;
    this.faction   = faction;
    this.hasShikai = false;
    this.hasBankai = false;
    this.maskOn    = false;

    // Starting skill by faction
    if (faction === 'Soul Reaper') {
      this.skills = [
        new Skill({ name: 'Zanjutsu Slash', cost: 0, power: 1.0, desc: 'Basic blade strike', unlockLv: 1 })
      ];
    } else {
      this.skills = [
        new Skill({ name: 'Hollow Claw', cost: 0, power: 1.0, desc: 'Ferocious claw swipe', unlockLv: 1 })
      ];
      this.hollowArtsChosen = [];
    }
  }

  learnShikai() {
    if (this.zanpakuto && !this.hasShikai && this.faction === 'Soul Reaper') {
      const pool = this.zanpakuto.shikaiSkills.filter(sk => sk.unlockLv <= this.lv);
      if (pool.length) {
        const pick = pool[rand(pool.length)];
        this.skills.push(pick);
        this.hasShikai = true;
      }
    }
  }

  learnBankai() {
    if (this.zanpakuto && !this.hasBankai && this.faction === 'Soul Reaper') {
      const pool = this.zanpakuto.bankaiSkills.filter(sk => sk.unlockLv <= this.lv);
      if (pool.length) {
        const pick = pool[rand(pool.length)];
        this.skills.push(pick);
        this.hasBankai = true;
      }
    }
  }

  applyMask() {
    if (!this.maskOn && this.faction === 'Soul Reaper') {
      this.maskOn = true;
      this.atk = Math.floor(this.atk * 1.4);
      this.spd = Math.floor(this.spd * 1.3);
    }
  }

  removeMask() {
    if (this.maskOn) {
      this.maskOn = false;
      this.atk = Math.round(this.atk / 1.4);
      this.spd = Math.round(this.spd / 1.3);
    }
  }
}

/********************  STATIC DB  **************************/
const hollowArts = [
  { name: 'Cero',             cost: 8,  power: 2.0, desc: 'Red destruction beam',        type: 'ranged' },
  { name: 'Bala',             cost: 6,  power: 1.6, desc: 'Fast reiatsu shot',           type: 'ranged' },
  { name: 'Gran Rey Cero',    cost: 20, power: 3.5, desc: 'Massive red wave',            type: 'ranged' },
  { name: 'Hierro Smash',     cost: 0,  power: 1.2, desc: 'Reinforced skin smash',       type: 'melee' },
  { name: 'Cero Oscuras',     cost: 15, power: 3.0, desc: 'Dark destructive beam',       type: 'ranged' }
];

const ZanpakutoDB = {
  Ichigo: new Zanpakuto({
    name: 'Zangetsu',
    shikaiSkills: [
      new Skill({ name: 'Getsuga Slash',    cost: 10, power: 2.2, desc: 'Arc reiatsu wave',                type: 'ranged', unlockLv: 5 }),
      new Skill({ name: 'Getsuga Tenshou',  cost: 12, power: 2.5, desc: 'Enhanced reiatsu wave',          type: 'ranged', unlockLv: 8 })
    ],
    bankaiSkills: [
      new Skill({ name: 'Tensa Getsuga',    cost: 25, power: 4.0, desc: 'Compressed black Getsuga',       unlockLv: 20 }),
      new Skill({ name: 'Mugetsu',           cost: 50, power: 6.0, desc: 'Final Getsuga Tenshou',          unlockLv: 25 })
    ]
  }),
  Rukia: new Zanpakuto({
    name: 'Sode no Shirayuki',
    shikaiSkills: [
      new Skill({ name: 'Some no Mai: Tsukishiro', cost: 12, power: 2.0, desc: 'Freezing circle',  unlockLv: 5 }),
      new Skill({ name: 'Tsugi no Mai: Hakuren',    cost: 15, power: 2.6, desc: 'Frost stream',     type: 'ranged', unlockLv: 8 }),
      new Skill({ name: 'Kurai Shiroba',           cost: 18, power: 3.0, desc: 'Bitter white dance', unlockLv: 10 })
    ],
    bankaiSkills: [
      new Skill({ name: 'Hakka no Togame',        cost: 30, power: 4.2, desc: 'Absolute-zero explosion', unlockLv: 20 }),
      new Skill({ name: 'Danse Macabre',          cost: 35, power: 4.5, desc: 'Snowstorm nightmare',    unlockLv: 25 })
    ]
  })
};

const Factions = ['Soul Reaper', 'Hollow'];
const rand     = n => Math.floor(Math.random() * n);
const clamp   = (v, min, max) => Math.max(min, Math.min(max, v));

/******************  GAME STATE  ***************************/
const Game = {
  player: null,
  enemy: null,
  battleActive: false,
  currentTurn: null,

  logEl:     document.getElementById('battle-log'),
  skillGrid: document.getElementById('skill-grid'),
  spLeftEl:  document.getElementById('spLeft'),
  btnMask:   document.getElementById('btnHollow'),

  log(msg) {
    const d = document.createElement('div');
    d.innerHTML = msg;
    this.logEl.appendChild(d);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  },

  clearLog() {
    this.logEl.innerHTML = '';
  },

  updateHUD() {
    const ctx = document.getElementById('battle-canvas').getContext('2d');
    ctx.clearRect(0, 0, 480, 240);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${this.player.name}`,           20, 30);
    ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp}`, 20, 50);
    ctx.fillText(`${this.enemy.name}`,            300, 30);
    ctx.fillText(`HP: ${this.enemy.hp}/${this.enemy.maxHp}`, 300, 50);
  },

  updatePlayerPanel() {
    const p = this.player;
    document.getElementById('player-info').innerHTML = `
      <strong>${p.name}</strong> (${p.faction})<br>
      HP ${p.hp}/${p.maxHp} | Rei ${p.reiatsu}/${p.maxRei}<br>
      Lv ${p.lv} XP ${p.xp}/${this.xpToLevel(p.lv)}<br>
      ATK ${p.atk} DEF ${p.def} SPD ${p.spd}
    `;
    document.getElementById('btnShikai').classList.toggle('hidden', !(p.lv >= 5 && !p.hasShikai));
    document.getElementById('btnBankai').classList.toggle('hidden', !(p.lv >= 20 && !p.hasBankai));
    if (p.faction === 'Soul Reaper' && p.lv >= 15) {
      this.btnMask.classList.remove('hidden');
      this.btnMask.textContent = p.maskOn ? 'Hollow Mask Off' : 'Hollow Mask On';
    } else {
      this.btnMask.classList.add('hidden');
    }
    document.getElementById('stat-panel').classList.toggle('hidden', p.statPts === 0);
    this.spLeftEl.textContent = p.statPts;
  },

  populateSkills() {
    this.skillGrid.innerHTML = '';
    this.player.skills.forEach((sk, idx) => {
      if (sk.unlockLv > this.player.lv) return;
      const btn = document.createElement('button');
      btn.textContent = `${sk.name} (${sk.cost})`;
      btn.className = 'skill-btn';
      btn.disabled  = !this.battleActive || this.currentTurn !== 'player';
      btn.onclick   = () => this.playerTurn(idx);
      this.skillGrid.appendChild(btn);
    });
    this.skillGrid.classList.toggle('hidden', !this.battleActive);
  },

  /************  BATTLE FLOW  ************/
  startBattle() {
    this.enemy        = this.generateEnemy();
    this.battleActive = true;
    this.clearLog();
    this.renderNextBtn(false);
    this.updateHUD();
    this.populateSkills();
    this.currentTurn = (this.player.spd >= this.enemy.spd) ? 'player' : 'enemy';
    this.log(`Encountered <strong>${this.enemy.name}</strong>!`);
    if (this.currentTurn === 'enemy') {
      this.log(`${this.enemy.name} acts first!`);
      setTimeout(() => this.enemyTurn(), 500);
    } else {
      this.log(`You act first!`);
    }
    document.getElementById('battle-panel').classList.remove('hidden');
  },

  playerTurn(idx) {
    if (!this.battleActive || this.currentTurn !== 'player') return;
    const sk = this.player.skills[idx];
    if (this.player.reiatsu < sk.cost) {
      this.log('Not enough Rei!');
      return;
    }
    this.player.reiatsu = clamp(this.player.reiatsu - sk.cost, 0, this.player.maxRei);
    const dmg = this.calcDamage(this.player, this.enemy, sk.power);
    this.enemy.hp = clamp(this.enemy.hp - dmg, 0, this.enemy.maxHp);
    this.log(`<strong>You</strong> used <em>${sk.name}</em> for ${dmg} dmg.`);
    this.updateHUD();
    if (this.checkBattleEnd()) return;
    this.currentTurn = 'enemy';
    this.populateSkills();
    setTimeout(() => this.enemyTurn(), 500);
  },

  enemyTurn() {
    if (!this.battleActive || this.currentTurn !== 'enemy') return;
    const sk = this.enemy.skills[rand(this.enemy.skills.length)];
    if (this.enemy.reiatsu < sk.cost) {
      this.enemy.reiatsu = clamp(this.enemy.reiatsu + 5, 0, this.enemy.maxRei);
      this.log(`${this.enemy.name} focuses Rei.`);
    } else {
      this.enemy.reiatsu = clamp(this.enemy.reiatsu - sk.cost, 0, this.enemy.maxRei);
      const dmg = this.calcDamage(this.enemy, this.player, sk.power);
      this.player.hp = clamp(this.player.hp - dmg, 0, this.player.maxHp);
      this.log(`<strong>${this.enemy.name}</strong> used ${sk.name} for ${dmg} dmg.`);
      this.updateHUD();
    }
    if (this.checkBattleEnd()) return;
    this.currentTurn = 'player';
    this.populateSkills();
  },

  checkBattleEnd() {
    if (this.player.hp <= 0) {
      this.log('<span style="color:red">You were defeated…</span>');
      this.endBattle();
      return true;
    }
    if (this.enemy.hp <= 0) {
      const gained = 20 + rand(15);
      this.log(`<span style="color:lime">Victory! +${gained} XP</span>`);
      this.player.xp += gained;
      while (this.player.xp >= this.xpToLevel(this.player.lv)) {
        this.player.xp -= this.xpToLevel(this.player.lv);
        this.levelUp();
      }
      this.updatePlayerPanel();
      this.endBattle(true);
      return true;
    }
    return false;
  },

  endBattle(victory = false) {
    this.battleActive = false;
    this.skillGrid.classList.add('hidden');
    this.renderNextBtn(victory);
  },

  renderNextBtn(show) {
    document.getElementById('btnNext').classList.toggle('hidden', !show);
  },

  calcDamage(att, tgt, power) {
    const base = Math.max(1, (att.atk * power) - tgt.def);
    return Math.floor(base * (0.8 + Math.random() * 0.4));
  },

  levelUp() {
    const p = this.player;
    p.lv++;
    p.statPts += 5;
    p.maxHp  += 15; p.hp      = p.maxHp;
    p.maxRei += 10; p.reiatsu = p.maxRei;
    this.log(`<span style="color:gold">Level ${p.lv} achieved! +5 Stat Points</span>`);

    // Soul Reaper unlocks
    if (p.lv === 5  && p.faction === 'Soul Reaper') { p.learnShikai(); this.log('Shikai awakened!'); }
    if (p.lv === 20 && p.faction === 'Soul Reaper') { p.learnBankai(); this.log('Bankai attainable!'); }

    // Hollow arts at lv 5 & 10
    if (p.lv === 5  && p.faction === 'Hollow') this.unlockHollowArt(5);
    if (p.lv === 10 && p.faction === 'Hollow') this.unlockHollowArt(10);

    this.populateSkills();
    this.updatePlayerPanel();
  },

  unlockHollowArt(lv) {
    const p = this.player;
    const avail = hollowArts.filter(a => !p.hollowArtsChosen.includes(a.name));
    if (!avail.length) return;
    const art = avail[rand(avail.length)];
    p.hollowArtsChosen.push(art.name);
    const sk = new Skill({ ...art, unlockLv: lv });
    p.skills.push(sk);
    this.log(`Hollow Art “${sk.name}” learned at Lv ${lv}!`);
  },

  xpToLevel(lv) {
    return 40 + lv * 25;
  },

  generateEnemy() {
    let tiers;
    if (this.player.faction === 'Soul Reaper') {
      tiers = [
        { name:'Small Hollow',  hp:60,  rei:30,  atk:8,  def:4,  spd:5,  skills:[new Skill({name:'Claw',cost:0,power:1.3})] },
        { name:'Menos Grande',  hp:140, rei:60,  atk:16, def:8,  spd:6,  skills:[new Skill({name:'Cero',cost:12,power:2.2,type:'ranged'})] },
        { name:'Adjuchas',      hp:200, rei:80,  atk:22, def:12, spd:9,  skills:[new Skill({name:'Shadow Claw',cost:10,power:2.0})] },
        { name:'Vasto Lord',    hp:260, rei:110, atk:28, def:16, spd:11, skills:[new Skill({name:'Oscuras',cost:20,power:3.0,type:'ranged'})] }
      ];
    } else {
      tiers = [
        { name:'Rukongai Guard',hp:70,  rei:35,  atk:9,  def:4,  spd:6,  skills:[new Skill({name:'Slash',cost:0,power:1.4})] },
        { name:'Seated Officer',hp:150, rei:70,  atk:18, def:9,  spd:8,  skills:[new Skill({name:'Hadō #31',cost:12,power:2.1,type:'ranged'})] },
        { name:'Vice-Captain',  hp:210, rei:90,  atk:23, def:13, spd:11, skills:[new Skill({name:'Shikai Art',cost:15,power:2.5})] },
        { name:'Captain',       hp:280, rei:120, atk:30, def:17, spd:13, skills:[new Skill({name:'Bankai Strike',cost:25,power:3.4})] }
      ];
    }
    const idx = Math.min(tiers.length - 1, Math.floor(this.player.lv / 5));
    const b   = tiers[idx];
    const e   = new Character({
      name:    b.name,
      hp:      b.hp,
      reiatsu: b.rei,
      atk:     b.atk,
      def:     b.def,
      spd:     b.spd,
      faction: this.player.faction === 'Soul Reaper' ? 'Hollow' : 'Soul Reaper'
    });
    e.skills = b.skills;
    return e;
  },

  save() {
    localStorage.setItem('BleachRPGSave', JSON.stringify(this.player));
    alert('Game saved.');
  },

  load() {
    const data = localStorage.getItem('BleachRPGSave');
    if (!data) return alert('No save data.');
    let raw;
    try { raw = JSON.parse(data); }
    catch { return alert('Save file corrupted.'); }

    const baseZ = ZanpakutoDB[raw.name] || null;
    this.player = new Character({
      name:      raw.name,
      hp:        raw.maxHp,
      reiatsu:   raw.maxRei,
      atk:       raw.atk,
      def:       raw.def,
      spd:       raw.spd,
      zanpakuto: baseZ,
      faction:   raw.faction
    });

    this.player.xp              = raw.xp;
    this.player.lv              = raw.lv;
    this.player.statPts         = raw.statPts || 0;
    this.player.hasShikai       = raw.hasShikai;
    this.player.hasBankai       = raw.hasBankai;
    this.player.maskOn          = raw.maskOn;
    this.player.skills          = (raw.skills || []).map(s => new Skill(s));
    this.player.hollowArtsChosen= raw.hollowArtsChosen || [];
    this.updatePlayerPanel();
    this.populateSkills();
    alert('Game loaded.');
  },

  init() {
    // New Game
    document.getElementById('btnNew').onclick = () => {
      let fc = '';
      while (!['soul reaper','hollow'].includes(fc)) {
        const inF = prompt('Choose race: Soul Reaper / Hollow');
        if (inF === null) return;
        fc = inF.trim().toLowerCase();
      }
      const faction = fc === 'soul reaper' ? 'Soul Reaper' : 'Hollow';

      let nm = '';
      while (!nm) {
        const inN = prompt('Enter your name (no HTML):');
        if (inN === null) { nm = faction + 'Rookie'; break; }
        nm = inN.trim().replace(/</g,'').replace(/>/g,'');
      }

      const base = faction === 'Soul Reaper'
        ? { hp:160, reiatsu:90,  atk:20, def:10, spd:12, zanpakuto:ZanpakutoDB.Ichigo }
        : { hp:180, reiatsu:80,  atk:22, def:10, spd:11, zanpakuto:null };
      this.player = new Character({ name:nm, faction, ...base });

      const statBtns = ['hp','atk','def','spd','rei'].map(stat => {
        const b = document.createElement('button');
        b.textContent = `+${stat.toUpperCase()}`;
        b.onclick     = () => this.allocateStat(stat);
        return b;
      });
      document.getElementById('stat-buttons').replaceChildren(...statBtns);

      document.getElementById('player-panel').classList.remove('hidden');
      this.updatePlayerPanel();
      this.startBattle();
    };

    // Transforms
    document.getElementById('btnShikai').onclick = () => {
      this.player.learnShikai();
      this.populateSkills();
      this.log('Shikai released!');
      this.updatePlayerPanel();
    };
    document.getElementById('btnBankai').onclick = () => {
      this.player.learnBankai();
      this.populateSkills();
      this.log('Bankai unleashed!');
      this.updatePlayerPanel();
    };
    this.btnMask.onclick = () => {
      if (this.player.maskOn) this.player.removeMask();
      else                     this.player.applyMask();
      this.log(this.player.maskOn ? 'Mask on!' : 'Mask off.');
      this.updatePlayerPanel();
    };

    // Stat allocation
    this.allocateStat = stat => {
      if (this.player.statPts <= 0) return;
      this.player.statPts--;
      switch(stat) {
        case 'hp':  this.player.maxHp  += 10; this.player.hp = this.player.maxHp; break;
        case 'atk': this.player.atk    += 2;                        break;
        case 'def': this.player.def    += 2;                        break;
        case 'spd': this.player.spd    += 1;                        break;
        case 'rei': this.player.maxRei += 6; this.player.reiatsu = this.player.maxRei; break;
      }
      this.log(`+1 ${stat.toUpperCase()} invested.`);
      this.updatePlayerPanel();
    };

    // Save/Load
    document.getElementById('btnSave').onclick = () => this.save();
    document.getElementById('btnLoad').onclick = () => this.load();

    // Next enemy
    document.getElementById('btnNext').onclick = () => this.startBattle();
  }
};

window.onload = () => Game.init();
