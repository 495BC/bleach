/*********************
 *  Core Data Types  *
 *********************/
class Skill {
  constructor({ name, cost, power, desc, type = 'melee', unlockLv = 1 }) {
    Object.assign(this, { name, cost, power, desc, type, unlockLv });
  }
}

class Zanpakuto {
  constructor({ name, shikaiSkills, bankaiSkills }) {
    this.name = name;
    this.shikaiSkills = shikaiSkills;   // array of Skill
    this.bankaiSkills = bankaiSkills;   // array of Skill
  }
}

class Character {
  constructor({ name, hp, reiatsu, atk, def, spd, zanpakuto, faction }) {
    Object.assign(this, { name, maxHp: hp, hp, maxRei: reiatsu, reiatsu,
                          atk, def, spd, xp: 0, lv: 1,
                          zanpakuto, faction,
                          hasShikai: false, hasBankai: false, maskOn: false });
    this.skills = [
      new Skill({ name: 'Zanjutsu Slash', cost: 0, power: 1.0, desc: 'Basic blade strike' })
    ];
  }

  learnShikai() {
    if (!this.hasShikai) {
      this.skills.push(...this.zanpakuto.shikaiSkills);
      this.hasShikai = true;
    }
  }

  learnBankai() {
    if (!this.hasBankai) {
      this.skills.push(...this.zanpakuto.bankaiSkills);
      this.hasBankai = true;
    }
  }

  applyMask() {
    if (!this.maskOn) {
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

/**************************
 *  Static Data & Utils   *
 **************************/
const ZanpakutoDB = {
  Ichigo: new Zanpakuto({
    name: 'Zangetsu',
    shikaiSkills: [
      new Skill({ name: 'Getsuga Slash', cost: 10, power: 2.2, desc: 'Arc reiatsu wave', type: 'ranged' })
    ],
    bankaiSkills: [
      new Skill({ name: 'Tensa Getsuga', cost: 25, power: 4.0, desc: 'Compressed black Getsuga' })
    ]
  }),
  Rukia: new Zanpakuto({
    name: 'Sode no Shirayuki',
    shikaiSkills: [
      new Skill({ name: 'Some no Mai: Tsukishiro', cost: 12, power: 2.0, desc: 'Freezing circle' }),
      new Skill({ name: 'Tsugi no Mai: Hakuren', cost: 15, power: 2.6, desc: 'Frost stream', type: 'ranged' })
    ],
    bankaiSkills: [
      new Skill({ name: 'Hakka no Togame', cost: 30, power: 4.2, desc: 'Absolute Zero explosion' })
    ]
  })
};

const Factions = ['Soul Reaper', 'Arrancar', 'Quincy'];
const rand = (n) => Math.floor(Math.random() * n);

/***********************
 *  Game State & I/O   *
 ***********************/
const Game = {
  player: null,
  enemy: null,
  logEl: document.getElementById('battle-log'),
  skillGrid: document.getElementById('skill-grid'),

  log(msg) {
    this.logEl.insertAdjacentHTML('beforeend', `<div>${msg}</div>`);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  },

  clearLog() { this.logEl.innerHTML = ''; },

  updatePlayerPanel() {
    const info = `
      <strong>${this.player.name}</strong> (${this.player.faction})<br>
      HP ${this.player.hp}/${this.player.maxHp} | Rei ${this.player.reiatsu}/${this.player.maxRei}<br>
      Lv ${this.player.lv} XP ${this.player.xp}<br>
      ATK ${this.player.atk} DEF ${this.player.def} SPD ${this.player.spd}
    `;
    document.getElementById('player-info').innerHTML = info;
    document.getElementById('btnShikai').classList.toggle('hidden', this.player.hasShikai);
    document.getElementById('btnBankai').classList.toggle('hidden', this.player.lv < 20 || this.player.hasBankai);
    document.getElementById('btnHollow').classList.toggle('hidden', this.player.maskOn);
  },

  populateSkills() {
    this.skillGrid.innerHTML = '';
    this.player.skills.forEach((sk, idx) => {
      if (sk.unlockLv > this.player.lv) return;
      const btn = document.createElement('button');
      btn.textContent = `${sk.name} (${sk.cost})`;
      btn.className = 'skill-btn';
      btn.onclick = () => this.playerTurn(idx);
      this.skillGrid.appendChild(btn);
    });
  },

  startBattle() {
    this.enemy = this.generateEnemy();
    this.clearLog();
    this.log(`A wild ${this.enemy.name} appears!`);
    this.renderBattleHUD();
    this.populateSkills();
    document.getElementById('battle-panel').classList.remove('hidden');
  },

  playerTurn(skillIdx) {
    const skill = this.player.skills[skillIdx];
    if (this.player.reiatsu < skill.cost) { this.log('Not enough reiatsu!'); return; }
    this.player.reiatsu -= skill.cost;
    const dmg = this.calcDamage(this.player, this.enemy, skill.power);
    this.enemy.hp -= dmg;
    this.log(`<strong>You</strong> used <em>${skill.name}</em> for ${dmg} dmg.`);
    if (this.checkBattleEnd()) return;
    setTimeout(() => this.enemyTurn(), 500);
    this.updatePlayerPanel();
  },

  enemyTurn() {
    const skill = this.enemy.skills[rand(this.enemy.skills.length)];
    if (this.enemy.reiatsu < skill.cost) { this.enemy.reiatsu += 5; this.log(`${this.enemy.name} focuses reiatsu.`); }
    else {
      this.enemy.reiatsu -= skill.cost;
      const dmg = this.calcDamage(this.enemy, this.player, skill.power);
      this.player.hp -= dmg;
      this.log(`${this.enemy.name} used ${skill.name} for ${dmg} dmg.`);
    }
    this.checkBattleEnd();
    this.updatePlayerPanel();
  },

  checkBattleEnd() {
    if (this.player.hp <= 0) { this.log('<span style="color:red">You were defeated…</span>'); return true; }
    if (this.enemy.hp <= 0) {
      const gained = 20 + rand(15);
      this.log(`<span style="color:lime">Victory! +${gained} XP</span>`);
      this.player.xp += gained;
      while (this.player.xp >= this.xpToLevel(this.player.lv)) {
        this.player.xp -= this.xpToLevel(this.player.lv);
        this.levelUp();
      }
      this.updatePlayerPanel();
      return true;
    }
    return false;
  },

  calcDamage(attacker, target, power) {
    const base = Math.max(1, (attacker.atk * power) - target.def);
    return Math.floor(base * (0.8 + Math.random() * 0.4));
  },

  levelUp() {
    this.player.lv++;
    this.player.maxHp += 20; this.player.hp = this.player.maxHp;
    this.player.maxRei += 10; this.player.reiatsu = this.player.maxRei;
    this.player.atk += 3; this.player.def += 2; this.player.spd += 1;
    this.log(`<span style="color:gold">Leveled up to Lv ${this.player.lv}!</span>`);
    if (this.player.lv === 10) { this.player.learnShikai(); this.log('Shikai awakened!'); }
    if (this.player.lv === 20) { this.player.learnBankai(); this.log('Bankai attainable!'); }
    this.populateSkills();
  },

  xpToLevel(lv) { return 50 + (lv - 1) * 30; },

  /***************
   *  Generation *
   ***************/
  generateEnemy() {
    const archetypes = [
      { name: 'Menos Grande', hp: 120, rei: 40, atk: 15, def: 8, spd: 5,
        skills: [new Skill({ name: 'Cero', cost: 10, power: 2.0, desc: 'Red destruction beam', type: 'ranged' })] },
      { name: 'Adjuchas Hollow', hp: 150, rei: 60, atk: 18, def: 10, spd: 8,
        skills: [new Skill({ name: 'Shadow Claw', cost: 8, power: 1.8, desc: 'Ripping slash' })] },
      { name: 'Arrancar Rebel', hp: 180, rei: 80, atk: 22, def: 12, spd: 10,
        skills: [
          new Skill({ name: 'Bala', cost: 6, power: 1.6, desc: 'Rapid reiatsu shot', type: 'ranged' }),
          new Skill({ name: 'Sonído Lunge', cost: 12, power: 2.4, desc: 'High‑speed thrust' })
        ] }
    ];
    const base = archetypes[rand(archetypes.length)];
    const e = new Character({ ...base, zanpakuto: null, faction: 'Hollow' });
    e.skills = base.skills;
    return e;
  },

  /*****************
   *  Save / Load  *
   *****************/
  save() {
    localStorage.setItem('bleachRPGSave', JSON.stringify(this.player));
    alert('Game saved.');
  },

  load() {
    const data = localStorage.getItem('bleachRPGSave');
    if (!data) return alert('No save data.');
    const raw = JSON.parse(data);
    // Rehydrate class
    this.player = new Character({ ...raw, zanpakuto: ZanpakutoDB[raw.name] });
    Object.assign(this.player, raw);
    this.updatePlayerPanel();
    alert('Save loaded.');
  },

  /**********
   *  Init  *
   **********/
  init() {
    document.getElementById('btnNew').onclick = () => {
      // Quick‑start with Ichigo; extend UI to pick later.
      this.player = new Character({
        name: 'Ichigo', hp: 200, reiatsu: 100, atk: 25, def: 12, spd: 14,
        zanpakuto: ZanpakutoDB.Ichigo, faction: 'Soul Reaper'
      });
      document.getElementById('player-panel').classList.remove('hidden');
      this.updatePlayerPanel();
      this.startBattle();
    };

    document.getElementById('btnShikai').onclick = () => {
      this.player.learnShikai();
      this.populateSkills();
      this.log('<em>Shikai released!</em>');
    };
    document.getElementById('btnBankai').onclick = () => {
      this.player.learnBankai();
      this.populateSkills();
      this.log('<em>Bankai unleashed!</em>');
    };
    document.getElementById('btnHollow').onclick = () => {
      this.player.applyMask();
      this.updatePlayerPanel();
      this.log('<em>Hollow mask donned!</em>');
    };

    document.getElementById('btnSave').onclick = () => this.save();
    document.getElementById('btnLoad').onclick = () => this.load();
  },

  /*********
   *  HUD  *
   *********/
  renderBattleHUD() {
    // Simple sprite‑less representation (placeholder for real graphics)
    const ctx = document.getElementById('battle-canvas').getContext('2d');
    ctx.clearRect(0, 0, 480, 240);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${this.player.name}`, 20, 30);
    ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp}`, 20, 50);
    ctx.fillText(`${this.enemy.name}`, 300, 30);
    ctx.fillText(`HP: ${this.enemy.hp}/${this.enemy.maxHp}`, 300, 50);
  }
};

window.onload = () => Game.init();
