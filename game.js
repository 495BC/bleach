/********************  DATA TYPES  *************************/
class Skill{
  constructor({name,cost,power,desc,type='melee',unlockLv=1}){Object.assign(this,{name,cost,power,desc,type,unlockLv});}
}
class Zanpakuto{
  constructor({name,shikaiSkills,bankaiSkills}){Object.assign(this,{name,shikaiSkills,bankaiSkills});}
}
class Character{
  constructor({name,hp,reiatsu,atk,def,spd,zanpakuto,faction}){
    Object.assign(this,{name,maxHp:hp,hp,maxRei:reiatsu,reiatsu,
      atk,def,spd,xp:0,lv:1,zanpakuto,faction,
      hasShikai:false,hasBankai:false,maskOn:false,statPts:0});
    this.skills=[new Skill({name:'Zanjutsu Slash',cost:0,power:1.0,desc:'Basic strike'})];
  }
  learnShikai(){if(!this.hasShikai){this.skills.push(...this.zanpakuto.shikaiSkills);this.hasShikai=true;}}
  learnBankai(){if(!this.hasBankai){this.skills.push(...this.zanpakuto.bankaiSkills);this.hasBankai=true;}}
  applyMask(){if(!this.maskOn){this.maskOn=true;this.atk=Math.floor(this.atk*1.4);this.spd=Math.floor(this.spd*1.3);}}
  removeMask(){if(this.maskOn){this.maskOn=false;this.atk=Math.round(this.atk/1.4);this.spd=Math.round(this.spd/1.3);}}
}
/********************  STATIC DB  **************************/
const ZanpakutoDB={
  Ichigo:new Zanpakuto({
    name:'Zangetsu',
    shikaiSkills:[new Skill({name:'Getsuga Slash',cost:10,power:2.2,desc:'Reiatsu wave',type:'ranged'})],
    bankaiSkills:[new Skill({name:'Tensa Getsuga',cost:25,power:4.0,desc:'Black Getsuga'})]
  }),
  Rukia:new Zanpakuto({
    name:'Sode no Shirayuki',
    shikaiSkills:[
      new Skill({name:'Tsukishiro',cost:12,power:2.0,desc:'Freezing circle'}),
      new Skill({name:'Hakuren',cost:15,power:2.6,desc:'Frost stream',type:'ranged'})
    ],
    bankaiSkills:[new Skill({name:'Hakka no Togame',cost:30,power:4.2,desc:'Absolute Zero'})]
  })
};
const Factions=['Soul Reaper','Hollow'];
const rand=(n)=>Math.floor(Math.random()*n);

/******************  GAME STATE  ***************************/
const Game={
  player:null,enemy:null,battleActive:false,
  logEl:document.getElementById('battle-log'),
  skillGrid:document.getElementById('skill-grid'),
  spLeftEl:document.getElementById('spLeft'),
  log(msg){this.logEl.insertAdjacentHTML('beforeend',`<div>${msg}</div>`);this.logEl.scrollTop=this.logEl.scrollHeight;},
  clearLog(){this.logEl.innerHTML='';},
  updateHUD(){
    // canvas HP bars + names
    const ctx=document.getElementById('battle-canvas').getContext('2d');
    ctx.clearRect(0,0,480,240);
    ctx.fillStyle='#fff';
    ctx.fillText(`${this.player.name}`,20,30);
    ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp}`,20,50);
    ctx.fillText(`${this.enemy.name}`,300,30);
    ctx.fillText(`HP: ${this.enemy.hp}/${this.enemy.maxHp}`,300,50);
  },
  updatePlayerPanel(){
    const p=this.player;
    document.getElementById('player-info').innerHTML=`
      <strong>${p.name}</strong> (${p.faction})<br>
      HP ${p.hp}/${p.maxHp} | Rei ${p.reiatsu}/${p.maxRei}<br>
      Lv ${p.lv} XP ${p.xp}/${this.xpToLevel(p.lv)}<br>
      ATK ${p.atk} DEF ${p.def} SPD ${p.spd}
    `;
    document.getElementById('btnShikai').classList.toggle('hidden',p.hasShikai||p.lv<5);
    document.getElementById('btnBankai').classList.toggle('hidden',p.hasBankai||p.lv<20);
    document.getElementById('btnHollow').classList.toggle('hidden',p.faction!=='Soul Reaper'||p.maskOn||p.lv<15);
    // stat panel
    document.getElementById('stat-panel').classList.toggle('hidden',p.statPts===0);
    this.spLeftEl.textContent=p.statPts;
  },
  populateSkills(){
    this.skillGrid.innerHTML='';
    this.player.skills.forEach((sk,idx)=>{
      if(sk.unlockLv>this.player.lv)return;
      const btn=document.createElement('button');
      btn.textContent=`${sk.name} (${sk.cost})`;
      btn.className='skill-btn';
      btn.onclick=()=>this.playerTurn(idx);
      this.skillGrid.appendChild(btn);
    });
  },
  /************  BATTLE FLOW  ************/
  startBattle(){
    this.enemy=this.generateEnemy();
    this.battleActive=true;
    this.clearLog();
    this.log(`Encountered ${this.enemy.name}!`);
    this.renderNextBtn(false);
    this.updateHUD();
    this.populateSkills();
    document.getElementById('battle-panel').classList.remove('hidden');
  },
  playerTurn(skillIdx){
    if(!this.battleActive) return;
    const skill=this.player.skills[skillIdx];
    if(this.player.reiatsu<skill.cost){this.log('Not enough Rei.');return;}
    this.player.reiatsu-=skill.cost;
    const dmg=this.calcDamage(this.player,this.enemy,skill.power);
    this.enemy.hp-=dmg;
    this.log(`<strong>You</strong> used ${skill.name}‑ ${dmg} dmg`);
    this.updateHUD();
    if(this.checkBattleEnd())return;
    setTimeout(()=>this.enemyTurn(),400);
  },
  enemyTurn(){
    if(!this.battleActive)return;
    const sk=this.enemy.skills[rand(this.enemy.skills.length)];
    if(this.enemy.reiatsu<sk.cost){this.enemy.reiatsu+=5;this.log(`${this.enemy.name} focuses Rei.`);}
    else{
      this.enemy.reiatsu-=sk.cost;
      const dmg=this.calcDamage(this.enemy,this.player,sk.power);
      this.player.hp-=dmg;
      this.log(`${this.enemy.name} used ${sk.name}‑ ${dmg} dmg`);
      this.updateHUD();
    }
    this.checkBattleEnd();
  },
  checkBattleEnd(){
    if(this.player.hp<=0){this.log('<span style="color:red">You were defeated…</span>');this.endBattle();return true;}
    if(this.enemy.hp<=0){
      const gained=20+rand(15);
      this.log(`<span style="color:lime">Victory! +${gained} XP</span>`);
      this.player.xp+=gained;
      while(this.player.xp>=this.xpToLevel(this.player.lv)){this.player.xp-=this.xpToLevel(this.player.lv);this.levelUp();}
      this.updatePlayerPanel();
      this.endBattle(true);
      return true;
    }
    return false;
  },
  endBattle(victory=false){
    this.battleActive=false;
    this.renderNextBtn(victory);
  },
  renderNextBtn(show){document.getElementById('btnNext').classList.toggle('hidden',!show);},
  calcDamage(att,tgt,power){const base=Math.max(1,(att.atk*power)-tgt.def);return Math.floor(base*(0.8+Math.random()*0.4));},
  levelUp(){
    const p=this.player;
    p.lv++;p.statPts+=5;
    p.maxHp+=15;p.hp=p.maxHp;
    p.maxRei+=10;p.reiatsu=p.maxRei;
    this.log(`<span style="color:gold">Level ${p.lv} achieved! +5 Stat Points</span>`);
    if(p.lv===5){p.learnShikai();this.log('Shikai awakened!');}
    if(p.lv===15&&p.faction==='Soul Reaper'){this.log('Hollow Mask attainable!');}
    if(p.lv===20){p.learnBankai();this.log('Bankai attainable!');}
    this.populateSkills();this.updatePlayerPanel();
  },
  xpToLevel(lv){return 40+lv*25;},
  /************  GENERATION  ************/
  generateEnemy(){
    if(this.player.faction==='Soul Reaper'){
      // fight Hollow line
      const tiers=[
        {name:'Small Hollow',hp:60,rei:30,atk:8,def:4,spd:5,skills:[new Skill({name:'Claw',cost:0,power:1.3})]},
        {name:'Menos Grande',hp:140,rei:60,atk:16,def:8,spd:6,skills:[new Skill({name:'Cero',cost:12,power:2.2,type:'ranged'})]},
        {name:'Adjuchas',hp:200,rei:80,atk:22,def:12,spd:9,skills:[new Skill({name:'Shadow Claw',cost:10,power:2.0})]},
        {name:'Vasto Lord',hp:260,rei:110,atk:28,def:16,spd:11,skills:[new Skill({name:'Oscuras',cost:20,power:3.0,type:'ranged'})]}
      ];
      return this.scaleEnemy(tiers);
    }else{
      // Hollow player fights Shinigami
      const tiers=[
        {name:'Rukongai Guard',hp:70,rei:35,atk:9,def:4,spd:6,skills:[new Skill({name:'Slash',cost:0,power:1.4})]},
        {name:'Seated Officer',hp:150,rei:70,atk:18,def:9,spd:8,skills:[new Skill({name:'Hadō #31',cost:12,power:2.1,type:'ranged'})]},
        {name:'Vice‑Captain',hp:210,rei:90,atk:23,def:13,spd:11,skills:[new Skill({name:'Shikai Art',cost:15,power:2.5})]},
        {name:'Captain',hp:280,rei:120,atk:30,def:17,spd:13,skills:[new Skill({name:'Bankai Strike',cost:25,power:3.4})]}
      ];
      return this.scaleEnemy(tiers);
    }
  },
  scaleEnemy(tiers){
    const idx=Math.min(tiers.length-1,Math.floor(this.player.lv/5));
    const base=tiers[idx];
    const e=new Character({...base,zanpakuto:null,faction:base.name.includes('Hollow')?'Hollow':'Soul Reaper'});
    e.skills=base.skills;
    return e;
  },
  /****************  SAVE/LOAD  ****************/
  save(){localStorage.setItem('BleachRPGSave',JSON.stringify(this.player));alert('Saved.');},
  load(){
    const data=localStorage.getItem('BleachRPGSave');if(!data)return alert('No save.');
    const raw=JSON.parse(data);
    this.player=new Character({...raw,zanpakuto:ZanpakutoDB[raw.name]||ZanpakutoDB.Ichigo});
    Object.assign(this.player,raw);
    this.updatePlayerPanel();
    alert('Loaded.');
  },
  /******************  INIT  *******************/
  init(){
    /* ── new game ── */
    document.getElementById('btnNew').onclick=()=>{
      const faction=prompt('Choose race: Soul Reaper / Hollow').trim();
      if(!Factions.includes(faction)){alert('Invalid.');return;}
      const name=prompt('Enter your name').trim()||'Player';
      const baseStats=faction==='Soul Reaper'?
        {hp:160,reiatsu:90,atk:20,def:10,spd:12,zanpakuto:ZanpakutoDB.Ichigo}:
        {hp:180,reiatsu:80,atk:22,def:10,spd:11,zanpakuto:null};
      this.player=new Character({...baseStats,name,faction});
      /* stat buttons */
      const statBtns=['hp','atk','def','spd','rei'].map(stat=>{
        const b=document.createElement('button');
        b.textContent=`+${stat.toUpperCase()}`;
        b.onclick=()=>this.allocateStat(stat);
        return b;
      });
      document.getElementById('stat-buttons').replaceChildren(...statBtns);

      document.getElementById('player-panel').classList.remove('hidden');
      this.updatePlayerPanel();
      this.startBattle();
    };
    /* transforms */
    document.getElementById('btnShikai').onclick=()=>{this.player.learnShikai();this.populateSkills();this.log('Shikai released!');this.updatePlayerPanel();};
    document.getElementById('btnBankai').onclick=()=>{this.player.learnBankai();this.populateSkills();this.log('Bankai unleashed!');this.updatePlayerPanel();};
    document.getElementById('btnHollow').onclick=()=>{this.player.applyMask();this.log('Mask on!');this.updatePlayerPanel();};

    /* stat allocate */
    this.allocateStat=(stat)=>{
      if(this.player.statPts<=0)return;
      this.player.statPts--;
      switch(stat){
        case'hp':this.player.maxHp+=10;this.player.hp=this.player.maxHp;break;
        case'atk':this.player.atk+=2;break;
        case'def':this.player.def+=2;break;
        case'spd':this.player.spd+=1;break;
        case'rei':this.player.maxRei+=6;this.player.reiatsu=this.player.maxRei;break;
      }
      this.updatePlayerPanel();this.log(`Point invested in ${stat.toUpperCase()}.`);
    };

    /* save/load */
    document.getElementById('btnSave').onclick=()=>this.save();
    document.getElementById('btnLoad').onclick=()=>{this.load();this.populateSkills();};

    /* next enemy */
    document.getElementById('btnNext').onclick=()=>this.startBattle();
  }
};

window.onload=()=>Game.init();
