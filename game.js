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
  constructor({ name, faction, hp, reiatsu, atk, def, spd, zanpakuto = null }) {
    Object.assign(this, {
      name, faction,
      maxHp: hp,     hp,
      maxRei: reiatsu, reiatsu,
      atk, def, spd,
      xp: 0, lv: 1, statPts: 0,
      zanpakuto,
      hasShikai: false, hasBankai: false, maskOn: false,
      // Progression fields
      isSpirit: false, chainPulls: 0,
      progStage: 'Human', // 'Spirit','Hollow','RedEyes','Menos','Adjuchas','Arrancar','Vastocar'
      killCounts: {}, killPoints: 0,
      menosStart: null, teleportUsed: false,
      hollowArts: [], arrancarForm: null
    });
    // Starting skill by faction
    if (faction === 'Soul Reaper') {
      this.skills = [ new Skill({ name:'Zanjutsu Slash',cost:0,power:1.0,desc:'Basic blade strike',unlockLv:1 }) ];
    } else {
      this.skills = [ new Skill({ name:'Hollow Claw',    cost:0,power:1.0,desc:'Ferocious claw swipe',unlockLv:1 }) ];
    }
  }

  // — Transformation & Progression Methods —

  onDeath() {
    if (!this.isSpirit) {
      this.isSpirit = true;
      this.progStage = 'Spirit';
      Game.log('You have died—press G five times to pull your chain of fate.');
    } else {
      Game.log('You are already in spirit form.');
    }
  }

  pullChain() {
    if (this.progStage !== 'Spirit') return;
    this.chainPulls++;
    Game.log(`Chain pulled (${this.chainPulls}/5).`);
    if (this.chainPulls >= 5) {
      this.progStage = 'Hollow';
      this.isSpirit = false;
      Game.log('Transformed into Hollow! Teleporting to Hueco Mundo…');
      Game.teleportTo('Hueco Mundo');
    }
  }

  eatRemains(type) {
    // type: 'Normal','RedEyes','Menos','AncientMenos',...
    const ptsMap = {
      Normal: 1,     RedEyes:3,
      Menos:5,       AncientMenos:15,
      Adjuchas:10,   AncientAdjuchas:25,
      VastoLorde:50, AncientVasto:75,
      StormArrancar:100, ImpureHogyoku:1000
    };
    const pts = ptsMap[type] || 0;
    this.killPoints += pts;
    this.xp += pts; // XP matches points for simplicity
    this.killCounts[type] = (this.killCounts[type]||0) + 1;
    Game.log(`Gained ${pts} XP (${type})`);
    Game.checkLevelUp();
  }

  startMenosTimer() {
    if (this.progStage === 'Menos' && !this.menosStart) {
      this.menosStart = Date.now();
      Game.log('30-minute survival timer started.');
    }
  }

  attemptAdjuchas() {
    if (this.progStage === 'Menos') {
      const survived = (Date.now() - this.menosStart) >= 30*60*1000;
      if (this.killCounts['Hollow'] >= 30 && survived) {
        this.progStage = 'Adjuchas';
        this.applyBuffs();
        Game.log('Evolved into Adjuchas!');
      } else {
        Game.log('Need 30 kills AND 30m survival to become Adjuchas.');
      }
    }
  }

  startArrancarMiniGame() {
    if (['Menos','Adjuchas','VastoLorde'].includes(this.progStage)) {
      Game.startArrowMiniGame(this.progStage);
    }
  }

  completeArrancar(form) {
    // form: 'Menoscar','Adjucar','Vastocar'
    this.arrancarForm = form;
    this.progStage = 'Arrancar';
    this.applyBuffs();
    Game.log(`Arrancar form ${form} unlocked!`);
  }

  applyBuffs() {
    // Buff multipliers per stage
    const buffs = {
      Menos:      { multiplier:1.2,  extraHp:50, xpBoost:0.2 },
      Adjuchas:   { multiplier:1.05, extraHp:50, xpBoost:0.4 },
      VastoLorde: { multiplier:1.15, extraHp:80, xpBoost:0.8 },
    };
    const b = buffs[this.progStage] || {};
    this.maxHp = Math.floor(this.maxHp * (b.multiplier||1) + (b.extraHp||0));
    this.hp    = this.maxHp;
    Game.log(`Buffs applied: HP×${b.multiplier||1}+${b.extraHp||0}, XP+${(b.xpBoost||0)*100}%`);
  }

  learnShikai() {
    if (this.faction==='Soul Reaper' && !this.hasShikai && this.lv>=5) {
      const pool = this.zanpakuto.shikaiSkills.filter(s => s.unlockLv<=this.lv);
      const pick = pool[rand(pool.length)];
      this.skills.push(pick);
      this.hasShikai = true;
      Game.log(`Shikai skill ${pick.name} learned.`);
    }
  }

  learnBankai() {
    if (this.faction==='Soul Reaper' && !this.hasBankai && this.lv>=20) {
      const pool = this.zanpakuto.bankaiSkills.filter(s => s.unlockLv<=this.lv);
      const pick = pool[rand(pool.length)];
      this.skills.push(pick);
      this.hasBankai = true;
      Game.log(`Bankai skill ${pick.name} learned.`);
    }
  }
}

/********************  STATIC DB  **************************/
const hollowArts = [
  { name:'Cero', cost:8, power:2.0, desc:'Red destruction beam', type:'ranged' },
  { name:'Bala', cost:6, power:1.6, desc:'Rapid reiatsu shot',   type:'ranged' },
  { name:'Gran Rey Cero', cost:20, power:3.5, desc:'Massive beam',    type:'ranged' },
  { name:'Hierro Smash',   cost:0,  power:1.2, desc:'Reinforced melee',type:'melee' },
  { name:'Cero Oscuras',   cost:15, power:3.0, desc:'Dark beam',       type:'ranged' }
];

const ZanpakutoDB = {
  Ichigo: new Zanpakuto({
    name:'Zangetsu',
    shikaiSkills:[
      new Skill({name:'Getsuga Slash',     cost:10,power:2.2,desc:'Arc wave',unlockLv:5}),
      new Skill({name:'Getsuga Tenshou',   cost:12,power:2.5,desc:'Enhanced wave',unlockLv:8})
    ],
    bankaiSkills:[
      new Skill({name:'Tensa Getsuga',cost:25,power:4.0,desc:'Black Getsuga',unlockLv:20}),
      new Skill({name:'Mugetsu',      cost:50,power:6.0,desc:'Final form',unlockLv:25})
    ]
  }),
  Rukia: new Zanpakuto({
    name:'Sode no Shirayuki',
    shikaiSkills:[
      new Skill({name:'Some no Mai',cost:12,power:2.0,desc:'Freezing circle',unlockLv:5}),
      new Skill({name:'Hakuren',    cost:15,power:2.6,desc:'Frost stream',unlockLv:8})
    ],
    bankaiSkills:[
      new Skill({name:'Hakka no Togame',cost:30,power:4.2,desc:'Absolute zero',unlockLv:20})
    ]
  })
};

const Factions = ['Soul Reaper','Hollow'];
const rand     = n => Math.floor(Math.random()*n);
const clamp   = (v,min,max) => Math.max(min,Math.min(max,v));

/******************  GAME STATE  ***************************/
const Game = {
  player: null, enemy: null,
  battleActive:false, currentTurn:null,
  logEl:document.getElementById('battle-log'),
  skillGrid:document.getElementById('skill-grid'),
  panels: {
    player: document.getElementById('player-panel'),
    battle: document.getElementById('battle-panel'),
    quest:  document.getElementById('quest-panel')
  },

  /**********  LOGGING & UI  **********/
  log(msg) {
    const d = document.createElement('div');
    d.innerHTML = msg;
    this.logEl.appendChild(d);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  },
  clearLog() { this.logEl.innerHTML = ''; },

  updateHUD() {
    const ctx = document.getElementById('battle-canvas').getContext('2d');
    ctx.clearRect(0,0,480,240);
    ctx.fillStyle='#fff';
    ctx.fillText(`${this.player.name}`,20,30);
    ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp}`,20,50);
    ctx.fillText(`${this.enemy.name}`,300,30);
    ctx.fillText(`HP: ${this.enemy.hp}/${this.enemy.maxHp}`,300,50);
  },

  updatePlayerPanel() {
    const p = this.player;
    document.getElementById('player-info').innerHTML = `
      <strong>${p.name}</strong> (${p.faction})<br>
      Stage: ${p.progStage}<br>
      HP ${p.hp}/${p.maxHp} | Rei ${p.reiatsu}/${p.maxRei}<br>
      Lv ${p.lv} XP ${p.xp}/${this.xpToLevel(p.lv)} | SP ${p.statPts}
    `;
    // Transform & progression buttons
    document.getElementById('btnShikai').classList.toggle('hidden', !(p.faction==='Soul Reaper'&&p.lv>=5&&!p.hasShikai));
    document.getElementById('btnBankai').classList.toggle('hidden', !(p.faction==='Soul Reaper'&&p.lv>=20&&!p.hasBankai));
    document.getElementById('btnHollow').classList.toggle('hidden', true); // repurpose for Arrancar
    document.getElementById('stat-panel').classList.toggle('hidden', p.statPts===0);
  },

  populateSkills() {
    this.skillGrid.innerHTML = '';
    this.player.skills.forEach((sk,idx) => {
      if (sk.unlockLv>this.player.lv) return;
      const btn = document.createElement('button');
      btn.textContent = `${sk.name} (${sk.cost})`;
      btn.disabled   = !this.battleActive || this.currentTurn!=='player';
      btn.onclick    = ()=>this.playerTurn(idx);
      this.skillGrid.appendChild(btn);
    });
  },

  /**********  BATTLE FLOW  **********/
  startBattle() {
    this.enemy = this.generateEnemy();
    this.battleActive = true;
    this.clearLog(); this.updateHUD(); this.populateSkills();
    this.currentTurn = (this.player.spd>=this.enemy.spd?'player':'enemy');
    this.log(`Encountered <strong>${this.enemy.name}</strong>!`);
    if (this.currentTurn==='enemy') setTimeout(()=>this.enemyTurn(),500);
    this.panels.battle.classList.remove('hidden');
  },

  playerTurn(i) {
    const sk = this.player.skills[i];
    if (this.player.reiatsu<sk.cost) { this.log('Not enough Rei!'); return; }
    this.player.reiatsu = clamp(this.player.reiatsu-sk.cost,0,this.player.maxRei);
    const dmg = this.calcDamage(this.player,this.enemy,sk.power);
    this.enemy.hp = clamp(this.enemy.hp-dmg,0,this.enemy.maxHp);
    this.log(`You used ${sk.name} for ${dmg} dmg.`);
    this.updateHUD();
    if (this.checkBattleEnd()) return;
    this.currentTurn='enemy'; this.populateSkills();
    setTimeout(()=>this.enemyTurn(),500);
  },

  enemyTurn() {
    const sk = this.enemy.skills[rand(this.enemy.skills.length)];
    if (this.enemy.reiatsu<sk.cost) {
      this.enemy.reiatsu = clamp(this.enemy.reiatsu+5,0,this.enemy.maxRei);
      this.log(`${this.enemy.name} focuses Rei.`);
    } else {
      this.enemy.reiatsu = clamp(this.enemy.reiatsu-sk.cost,0,this.enemy.maxRei);
      const dmg = this.calcDamage(this.enemy,this.player,sk.power);
      this.player.hp = clamp(this.player.hp-dmg,0,this.player.maxHp);
      this.log(`${this.enemy.name} used ${sk.name} for ${dmg} dmg.`);
      this.updateHUD();
    }
    if (this.checkBattleEnd()) return;
    this.currentTurn='player'; this.populateSkills();
  },

  checkBattleEnd() {
    if (this.player.hp<=0) {
      this.log('<span style="color:red">Defeated…</span>');
      this.player.onDeath(); this.endBattle(); return true;
    }
    if (this.enemy.hp<=0) {
      // award XP and points based on progStage
      const type = this.enemy.faction==='Hollow'?'Normal':this.enemy.faction;
      this.player.eatRemains(type);
      this.endBattle(true); return true;
    }
    return false;
  },

  endBattle(win=false) {
    this.battleActive=false;
    this.skillGrid.classList.add('hidden');
    // Show next button if win
    document.getElementById('btnNext').classList.toggle('hidden',!win);
  },

  calcDamage(att,tgt,pwr) {
    const base = Math.max(1,(att.atk*pwr)-tgt.def);
    return Math.floor(base*(0.8+Math.random()*0.4));
  },

  xpToLevel(lv) { return 40+lv*25; },

  checkLevelUp() {
    while (this.player.xp>=this.xpToLevel(this.player.lv)) {
      this.player.xp-=this.xpToLevel(this.player.lv);
      this.player.lv++;
      this.player.statPts+=5;
      this.log(`<span style="color:gold">Level ${this.player.lv}! +5 SP</span>`);
      this.player.learnShikai();
      this.player.learnBankai();
      if (this.player.progStage==='Hollow' && this.player.lv>=20) {
        this.player.progStage='RedEyes';
        this.log('Red-Eyes stage unlocked! Defeat a Red-Eyes Hollow to become Menos.');
      }
      if (this.player.progStage==='RedEyes') {
        // wait for a Red-Eyes kill to call transform
      }
      if (this.player.progStage==='Menos') this.player.startMenosTimer();
    }
    this.updatePlayerPanel();
  },

  generateEnemy() {
    const tiers = (this.player.faction==='Soul Reaper'
      ? [
          {name:'Small Hollow',hp:60,rei:30,atk:8,def:4,spd:5},
          {name:'Red-Eyes Hollow',hp:80,rei:40,atk:12,def:6,spd:7},
          {name:'Menos Grande',hp:140,rei:60,atk:16,def:8,spd:6},
          {name:'Adjuchas',hp:200,rei:80,atk:22,def:12,spd:9},
          {name:'Vasto Lorde',hp:260,rei:110,atk:28,def:16,spd:11}
        ]
      : [
          {name:'Rukongai Guard',hp:70,rei:35,atk:9,def:4,spd:6},
          {name:'Seated Officer',hp:150,rei:70,atk:18,def:9,spd:8},
          {name:'Vice-Captain',hp:210,rei:90,atk:23,def:13,spd:11},
          {name:'Captain',hp:280,rei:120,atk:30,def:17,spd:13}
        ]
    );
    const idx = Math.min(tiers.length-1,Math.floor(this.player.lv/5));
    const b = tiers[idx];
    const e = new Character({ name:b.name, faction:this.player.faction==='Soul Reaper'?'Hollow':'Soul Reaper',
                              hp:b.hp, reiatsu:b.rei, atk:b.atk, def:b.def, spd:b.spd });
    e.skills = [ new Skill({ name:'Basic Attack',cost:0,power:1.0,desc:'Default' }) ];
    return e;
  },

  teleportTo(loc) {
    Game.log(`<< Teleported to ${loc} >>`);
    // stub: implement map switching
  },

  /**********  Mini-Games & NPCs  **********/
  startArrowMiniGame(stage) {
    Game.log(`Arrow mini-game for ${stage} Arrancar transformation started (press arrow keys)`);
    // stub: actual arrow mini-game logic with success/failure callback
  },

  /**********  SAVE/LOAD  **********/
  save() {
    localStorage.setItem('BleachRPGSave', JSON.stringify(this.player));
    alert('Game saved.');
  },
  load() {
    const data = localStorage.getItem('BleachRPGSave');
    if (!data) return alert('No save.');
    const raw = JSON.parse(data);
    this.player = Object.assign(new Character(raw), raw);
    alert('Game loaded.');
    this.updatePlayerPanel();
  },

  /**********  INIT  **********/
  init() {
    // bind buttons
    document.getElementById('btnNew').onclick = () => {
      const fc = prompt('Race: Soul Reaper / Hollow').trim();
      if (!Factions.includes(fc)) return alert('Invalid race.');
      const nm = prompt('Name:').trim();
      const base = fc==='Soul Reaper'
        ? { hp:160,reiatsu:90,atk:20,def:10,spd:12,zanpakuto:ZanpakutoDB.Ichigo }
        : { hp:180,reiatsu:80,atk:22,def:10,spd:11,zanpakuto:null };
      this.player = new Character({ name:nm, faction:fc, ...base });
      document.getElementById('player-panel').classList.remove('hidden');
      this.updatePlayerPanel();
      this.startBattle();
    };

    // transforms & progression
    document.addEventListener('keydown', e => {
      if (e.key==='G' && this.player) this.player.pullChain();
    });
    document.getElementById('btnSave').onclick = ()=>this.save();
    document.getElementById('btnLoad').onclick = ()=>this.load();
    document.getElementById('btnNext').onclick = ()=>this.startBattle();
  }
};

window.onload = ()=>Game.init();
