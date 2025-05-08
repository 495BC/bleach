// -------------------------
// game.js
// -------------------------
/** Core utilities **/
function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
function rand(n){ return Math.floor(Math.random()*n); }

/** Skill & Character **/
class Skill {
  constructor({name, cost=0, power=1.0, desc='', type='melee', unlockLv=1}) {
    Object.assign(this, {name, cost, power, desc, type, unlockLv});
  }
}

class Character {
  constructor({name, faction, stats:{hp, reiatsu, atk, def, spd}, zanpakuto=null}) {
    this.name       = name;
    this.faction    = faction;
    this.maxHp      = hp;       this.hp       = hp;
    this.maxRei     = reiatsu;  this.reiatsu  = reiatsu;
    this.atk        = atk;      this.def      = def;
    this.spd        = spd;
    this.lv         = 1;
    this.xp         = 0;
    this.statPts    = 0;
    this.zanpakuto  = zanpakuto;
    this.hasShikai  = false;
    this.hasBankai  = false;
    this.maskOn     = false;
    this.skills     = [];
    this.progStage  = 'Human';  // progression stage
    this.chainCount = 0;        // chain-pulls
    this.killPoints = 0;        // XP from remains
    this.killCounts = {};       // per-type kills
    this.menosStart = null;     // timestamp for Menos
    this.arrancarForm = null;   // Menoscar, Adjucar, Vastocar
  }
}

/** Powers definitions **/
const HollowArts = [
  {name:'Cero',           cost:8,  power:2.0, desc:'Red destruction beam', unlockLv:5, type:'ranged'},
  {name:'Bala',           cost:6,  power:1.6, desc:'Rapid reiatsu shot', type:'ranged', unlockLv:10},
  {name:'Gran Rey Cero',  cost:20, power:3.5, desc:'Massive domain wave', unlockLv:20, type:'ranged'},
  {name:'Hierro Smash',   cost:0,  power:1.2, desc:'Reinforced melee',   unlockLv:5, type:'melee'},
  {name:'Cero Oscuras',   cost:15, power:3.0, desc:'Dark destructive beam',unlockLv:25,type:'ranged'}
];

const ZanpakutoDB = {
  Ichigo: {
    name:'Zangetsu',
    shikai: [
      {name:'Getsuga Slash',  cost:10, power:2.2, desc:'Arc reiatsu wave', unlockLv:5, type:'ranged'},
      {name:'Shadow Slash',   cost:12, power:2.5, desc:'Hidden blade storm',unlockLv:8,type:'melee'}
    ],
    bankai:[
      {name:'Tensa Getsuga',  cost:25, power:4.0, desc:'Compressed black Getsuga',unlockLv:20},
      {name:'Mugetsu',        cost:50, power:6.0, desc:'Final Getsuga',unlockLv:25}
    ]
  },
  Rukia: {
    name:'Sode no Shirayuki',
    shikai:[
      {name:'Some no Mai',   cost:12, power:2.0, desc:'Freezing circle',unlockLv:5,type:'ranged'},
      {name:'Tsugi no Mai',  cost:15, power:2.6, desc:'Frost stream',unlockLv:8,type:'ranged'}
    ],
    bankai:[
      {name:'Hakka no Togame',cost:30,power:4.2,desc:'Absolute-zero explosion',unlockLv:20}
    ]
  }
};

const ArrancarForms = {
  Menoscar:{powerMult:1.35,hpBonus:35},
  Adjucar: {powerMult:1.50,hpBonus:50},
  Vastocar:{powerMult:1.80,hpBonus:80}
};

/** Game container **/
const Game = {
  player: null,
  enemy: null,
  arrowSeq: [],
  arrowInput: [],

  /** UI elements **/
  els: {
    playerPanel:  document.getElementById('player-panel'),
    battlePanel:  document.getElementById('battle-panel'),
    arrowPanel:   document.getElementById('arrow-mini'),
    playerInfo:   document.getElementById('player-info'),
    chainCount:   document.getElementById('chainCount'),
    stageDisplay: document.getElementById('stageDisplay'),
    killPoints:   document.getElementById('killPoints'),
    teleportBtn:  document.getElementById('btnTeleport'),
    eatBtn:       document.getElementById('btnEat'),
    statPanel:    document.getElementById('stat-panel'),
    spLeft:       document.getElementById('spLeft'),
    statBtns:     document.getElementById('stat-buttons'),
    battleLog:    document.getElementById('battle-log'),
    skillGrid:    document.getElementById('skill-grid'),
    arrowsDiv:    document.getElementById('arrows'),
    arrowLog:     document.getElementById('arrow-log'),
    canvas:       document.getElementById('battle-canvas'),
    nextBtn:      document.getElementById('btnNext')
  },

  /** Initialization **/
  init() {
    // button hooks
    document.getElementById('btnNew').onclick  = ()=> this.newGame();
    document.getElementById('btnSave').onclick = ()=> this.save();
    document.getElementById('btnLoad').onclick = ()=> this.load();
    document.getElementById('btnChain').onclick= ()=> this.pullChain();
    document.getElementById('btnTeleport').onclick= ()=> this.teleport('Hueco Mundo');
    document.getElementById('btnEat').onclick  = ()=> this.eatRemains();
    document.getElementById('btnArrancar').onclick= ()=> this.attemptArrancar();
    document.getElementById('btnNext').onclick= ()=> this.startBattle();

    window.addEventListener('keydown', e=>{
      if (e.key.toLowerCase()==='g') this.pullChain();
      if (this.els.arrowPanel.classList.contains('hidden')===false) {
        const key = e.key.replace('Arrow','Arrow');
        this.handleArrowInput(key);
      }
    });
  },

  /** New Game **/
  newGame() {
    const faction = prompt('Race: Soul Reaper or Hollow?').trim();
    const name    = prompt('Name?').trim() || 'Rookie';
    const stats   = faction==='Hollow'
      ? {hp:180,reiatsu:80,atk:22,def:10,spd:11}
      : {hp:160,reiatsu:90,atk:20,def:12,spd:14};
    const zp       = faction==='Soul Reaper'
      ? new SkillHolder(ZanpakutoDB[name]||ZanpakutoDB.Ichigo) : null;

    this.player = new Character({name,faction,stats,zanpakuto:zp});
    this.initSkills(); this.updatePlayerUI();
    this.els.playerPanel.classList.remove('hidden');
    this.startBattle();
  },

  /** Set starting skills **/
  initSkills() {
    const p = this.player;
    if (p.faction==='Soul Reaper') {
      p.skills = [ new Skill({name:'Zanjutsu Slash',cost:0,power:1,desc:'Basic blade',unlockLv:1}) ];
    } else {
      p.skills = [ new Skill({name:'Hollow Claw',cost:0,power:1,desc:'Ferocious claw',unlockLv:1}) ];
    }
  },

  /** Update Player UI **/
  updatePlayerUI() {
    const p = this.player;
    this.els.playerInfo.innerHTML = `
      <strong>${p.name}</strong> (${p.faction})<br>
      Stage: ${p.progStage}<br>
      HP ${p.hp}/${p.maxHp} | Rei ${p.reiatsu}/${p.maxRei}<br>
      Lv ${p.lv} XP ${p.xp}/${this.xpToLevel(p.lv)}<br>
      ATK ${p.atk} DEF ${p.def} SPD ${p.spd}
    `;
    this.els.chainCount.textContent = `${p.chainCount}/5`;
    this.els.stageDisplay.textContent = `Stage: ${p.progStage}`;
    this.els.killPoints.textContent = `Kill Points: ${p.killPoints}`;
    this.els.teleportBtn.classList.toggle('hidden', p.progStage!=='Hollow');
    this.els.eatBtn.classList.toggle('hidden', p.progStage==='Human'||p.progStage==='Spirit');
    this.els.statPanel.classList.toggle('hidden', p.statPts===0);
    this.els.spLeft.textContent = p.statPts;
    // stat buttons
    if (this.els.statBtns.childElementCount===0) {
      ['hp','atk','def','spd','rei'].forEach(stat=>{
        const btn=document.createElement('button');
        btn.textContent=`+${stat.toUpperCase()}`;
        btn.onclick=()=> this.allocateStat(stat);
        this.els.statBtns.appendChild(btn);
      });
    }
  },

  /** Save/Load **/
  save() {
    localStorage.setItem('BleachSave', JSON.stringify(this.player));
    alert('Saved.');
  },
  load() {
    const data = localStorage.getItem('BleachSave');
    if (!data) return alert('No save.');
    Object.assign(this.player, JSON.parse(data));
    this.updatePlayerUI();
    alert('Loaded.');
  },

  /** Chain-pull mini-game **/
  pullChain() {
    const p = this.player;
    if (p.progStage!=='Spirit') return;
    p.chainCount = clamp(p.chainCount+1,0,5);
    this.updatePlayerUI();
    if (p.chainCount===5) {
      p.progStage='Hollow';
      alert('You have become a Hollow!'); 
      this.teleport('Hueco Mundo');
    }
  },

  /** Teleport stub **/
  teleport(loc) {
    alert(`Teleported to ${loc}.`);
    this.updatePlayerUI();
  },

  /** Eat remains **/
  eatRemains() {
    const p=this.player;
    const type = p.progStage==='Hollow'?'Hollow':'Normal';
    const pts = ({Normal:1,Hollow:1,RedEyes:3,Menos:5,Adjuchas:10})[type]||0;
    p.killPoints += pts;
    p.xp         += pts;
    p.killCounts[type] = (p.killCounts[type]||0)+1;
    alert(`Ate ${type} remains: +${pts} XP`);
    this.checkProgression();
    this.updatePlayerUI();
  },

  /** Check progression gates **/
  checkProgression() {
    const p=this.player;
    if (p.progStage==='Hollow' && p.lv>=20) {
      p.progStage='RedEyes';
      alert('Stage → Red-Eyes! Defeat 2 Red-Eyes Hollows.');
    }
    if (p.progStage==='RedEyes' && (p.killCounts.RedEyes||0)>=2) {
      p.progStage='Menos';
      p.menosStart=Date.now();
      alert('Stage → Menos! Survive 30m & 30 Hollow kills.');
    }
    if (p.progStage==='Menos') {
      const survived=(Date.now()-p.menosStart)>=30*60*1000;
      if ((p.killCounts.Hollow||0)>=30 && survived) {
        p.progStage='Adjuchas';
        alert('Stage → Adjuchas! New Hollow Art learned.');
        const art = HollowArts[rand(HollowArts.length)];
        p.skills.push(new Skill(art));
      }
    }
  },

  /** Arrancar mini-game **/
  startArrancarMini() {
    const p=this.player;
    if (p.progStage!=='Adjuchas') return;
    // generate 4-arrow seq
    this.arrowSeq = Array.from({length:4},_=>['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'][rand(4)]);
    this.arrowInput=[];
    this.els.arrowsDiv.innerHTML = this.arrowSeq.map(a=>`[${a.replace('Arrow','')}]`).join(' ');
    this.els.arrowLog.innerHTML = '';
    this.els.arrowPanel.classList.remove('hidden');
  },
  handleArrowInput(key) {
    if (!this.arrowSeq.length) return;
    this.arrowInput.push(key);
    const idx = this.arrowInput.length-1;
    this.els.arrowLog.innerHTML += `Pressed ${key.replace('Arrow','')}<br>`;
    if (key!==this.arrowSeq[idx]) {
      alert('Failed mini-game.');
      this.els.arrowPanel.classList.add('hidden');
      return;
    }
    if (this.arrowInput.length===this.arrowSeq.length) {
      // success
      const forms = Object.keys(ArrancarForms);
      const pick  = forms[rand(forms.length)];
      const fm    = ArrancarForms[pick];
      p.progStage   = 'Arrancar';
      p.arrancarForm= pick;
      p.maxHp       = Math.floor(p.maxHp*fm.powerMult)+fm.hpBonus;
      alert(`Arrancar ${pick} unlocked!`);
      this.els.arrowPanel.classList.add('hidden');
      this.updatePlayerUI();
    }
  },

  attemptArrancar() { this.startArrancarMini(); },

  /** Combat **/
  startBattle() {
    const p = this.player;
    this.enemy = this.generateEnemy();
    this.els.battlePanel.classList.remove('hidden');
    this.logBattle(`A wild ${this.enemy.name} appears!`);
    this.updateBattleHUD();
    this.renderSkills();
  },
  logBattle(msg) {
    this.els.battleLog.innerHTML += `<div>${msg}</div>`;
    this.els.battleLog.scrollTop = this.els.battleLog.scrollHeight;
  },
  updateBattleHUD() {
    const ctx = this.els.canvas.getContext('2d');
    ctx.clearRect(0,0,480,240);
    ctx.fillStyle='#fff';
    ctx.fillText(`${this.player.name}`,20,30);
    ctx.fillText(`HP:${this.player.hp}/${this.player.maxHp}`,20,50);
    ctx.fillText(`${this.enemy.name}`,300,30);
    ctx.fillText(`HP:${this.enemy.hp}/${this.enemy.maxHp}`,300,50);
  },
  renderSkills() {
    this.els.skillGrid.innerHTML = '';
    this.player.skills.forEach((sk,i)=>{
      if (sk.unlockLv>this.player.lv) return;
      const btn = document.createElement('button');
      btn.textContent = `${sk.name} (${sk.cost})`;
      btn.onclick = ()=> this.playerTurn(i);
      this.els.skillGrid.appendChild(btn);
    });
  },
  playerTurn(idx) {
    const sk = this.player.skills[idx];
    if (this.player.reiatsu<sk.cost) {
      this.logBattle('Not enough Reiatsu!');
      return;
    }
    this.player.reiatsu = clamp(this.player.reiatsu-sk.cost,0,this.player.maxRei);
    const dmg = Math.floor(Math.max(1,this.player.atk*sk.power-this.enemy.def)*(0.8+Math.random()*0.4));
    this.enemy.hp = clamp(this.enemy.hp-dmg,0,this.enemy.maxHp);
    this.logBattle(`You used ${sk.name}: ${dmg} dmg`);
    this.updateBattleHUD();
    if (this.enemy.hp===0) return this.onEnemyDefeat();
    setTimeout(()=>this.enemyTurn(),500);
  },
  enemyTurn() {
    const sk = this.enemy.skills[rand(this.enemy.skills.length)];
    if (this.enemy.reiatsu<sk.cost) {
      this.enemy.reiatsu = clamp(this.enemy.reiatsu+5,0,this.enemy.maxRei);
      this.logBattle(`${this.enemy.name} recovers Reiatsu`);
    } else {
      this.enemy.reiatsu = clamp(this.enemy.reiatsu-sk.cost,0,this.enemy.maxRei);
      const dmg = Math.floor(Math.max(1,this.enemy.atk*sk.power-this.player.def)*(0.8+Math.random()*0.4));
      this.player.hp = clamp(this.player.hp-dmg,0,this.player.maxHp);
      this.logBattle(`${this.enemy.name} used ${sk.name}: ${dmg} dmg`);
      this.updateBattleHUD();
      if (this.player.hp===0) return this.onPlayerDefeat();
    }
    this.renderSkills();
  },
  onEnemyDefeat() {
    this.logBattle(`%cVictory!`,`color:lime`);
    this.player.xp+=20+rand(15);
    while(this.player.xp>=this.xpToLevel(this.player.lv)) this.levelUp();
    this.els.nextBtn.classList.remove('hidden');
    this.updatePlayerUI();
  },
  onPlayerDefeat() {
    this.logBattle(`%cDefeated…`,`color:red`);
    this.player.progStage='Spirit';
    this.els.nextBtn.classList.add('hidden');
    this.updatePlayerUI();
  },
  xpToLevel(lv){ return 40+lv*25; },
  levelUp() {
    const p=this.player;
    p.xp-=this.xpToLevel(p.lv); p.lv++; p.statPts+=5;
    p.maxHp+=15; p.hp=p.maxHp; p.maxRei+=10; p.reiatsu=p.maxRei;
    alert(`Level ${p.lv}! +5 stat points`);
    if (p.lv===5 && p.faction==='Soul Reaper') this.learnShikai();
    if (p.lv===15 && p.faction==='Soul Reaper') this.maskOn();
    if (p.lv===20 && p.faction==='Soul Reaper') this.learnBankai();
    this.updatePlayerUI();
  },
  learnShikai() {
    const db = ZanpakutoDB[this.player.name];
    if (!db) return;
    const pool=db.shikai.filter(s=>s.unlockLv<=this.player.lv);
    if(pool.length){
      const s=pool[rand(pool.length)];
      this.player.skills.push(new Skill(s));
      alert(`Shikai skill ${s.name} learned!`);
    }
  },
  learnBankai() {
    const db = ZanpakutoDB[this.player.name];
    if (!db) return;
    const pool=db.bankai.filter(s=>s.unlockLv<=this.player.lv);
    if(pool.length){
      const s=pool[rand(pool.length)];
      this.player.skills.push(new Skill(s));
      alert(`Bankai skill ${s.name} learned!`);
    }
  },
  maskOn() {
    const p=this.player;
    if (!p.maskOn) {
      p.maskOn=true;
      p.atk=Math.floor(p.atk*1.4); p.spd=Math.floor(p.spd*1.3);
      alert('Hollow Mask On!');
    }
  },

  /** Enemy generator **/
  generateEnemy() {
    const tiers = this.player.faction==='Soul Reaper'
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
        ];
    const idx = Math.min(tiers.length-1, Math.floor(this.player.lv/5));
    const b   = tiers[idx];
    const e   = new Character({ name:b.name, faction:this.player.faction==='Soul Reaper'?'Hollow':'Soul Reaper',
                                stats:{hp:b.hp,reiatsu:b.rei,atk:b.atk,def:b.def,spd:b.spd} });
    e.skills=[ new Skill({name:'Basic Attack',power:1,cost:0,desc:'Default'} ) ];
    return e;
  }
};

// start
window.onload = ()=> Game.init();
