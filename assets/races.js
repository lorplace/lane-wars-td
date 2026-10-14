// Races and setup phase. Loaded after logic.js + core.js; overrides/wraps their functions.
"use strict";
const RACE_LIST=['human','orc','undead'];   // add 'nightelf' etc. here + an entry in RACES/HEROES + visuals in game3d raceTower/raceBase
const sc=(a,L)=>Array.isArray(a)?a[0]+a[1]*L:(a||0);
const RACES={
 human:{name:'Human Alliance',color:'#3a6ad0',tint:0xffffff,desc:'Disciplined builders: arrows, cannons, frost magic and siege ballistae.',bases:['Keep','Castle','Citadel'],
  towers:[Object.assign({},TOWERS[0],{sfx:'arrow'}),Object.assign({},TOWERS[1],{sfx:'cannon',arc:1}),Object.assign({},TOWERS[2],{name:'Frost Mage Tower',sfx:'frost'}),Object.assign({},TOWERS[3],{sfx:'sniper'}),Object.assign({},TOWERS[4],{name:'Gryphon Fire Brazier',sfx:'flak'})]},
 orc:{name:'Orc Horde',color:'#b03a1a',tint:0xd09070,desc:'Brutal power: stunning spears, boulders, war drums and chain lightning.',bases:['Great Hall','Stronghold','Fortress'],
  towers:[
   {id:'spear',name:'Spear Thrower',key:'1',cost:10,dmg:9,rate:.85,range:3,ground:1,air:1,pspd:11,stunChance:.1,stunDur:.6,sfx:'arrow',desc:'Heavy spears, ground & air, 10% chance to stun'},
   {id:'rock',name:'Orc Catapult',key:'2',cost:20,dmg:17,rate:1.7,range:3.2,ground:1,air:0,splash:1.4,arc:1,pspd:5,sfx:'cannon',desc:'Big arcing boulders, wide splash, ground only'},
   {id:'drums',name:'War Drums',key:'3',cost:18,dmg:0,rate:1,range:2.5,ground:0,air:0,support:1,sfx:'',desc:'No attack. Towers within 2.5 tiles attack 20% faster (+5%/level)'},
   {id:'lightning',name:'Lightning Totem',key:'4',cost:30,dmg:18,rate:1.8,range:4.2,ground:1,air:1,chain:3,sfx:'sniper',desc:'Chain lightning hits up to 4 targets, ground & air'},
   {id:'poison',name:'Wind Rider Perch',key:'5',cost:22,dmg:14,rate:.7,range:4,ground:0,air:1,pspd:9,dot:{mult:.5,dur:3},sfx:'flak',desc:'Poison spears vs AIR only: damage over time'}]},
 undead:{name:'Undead Scourge',color:'#6a3a9a',tint:0x9a88c0,desc:'Cursed arts: crits, plague clouds, corpse catapults and frost wyrms.',bases:['Necropolis','Halls of the Dead','Black Citadel'],
  towers:[
   {id:'spirit',name:'Spirit Ziggurat',key:'1',cost:10,dmg:6,rate:.7,range:3.2,ground:1,air:1,pspd:9,crit:{chance:.2,mult:3},sfx:'frost',desc:'Spirit bolts, ground & air, 20% chance of x3 crit'},
   {id:'meat',name:'Meat Wagon',key:'2',cost:20,dmg:12,rate:1.4,range:3,ground:1,air:0,splash:1.3,arc:1,pspd:5,dot:{mult:.3,dur:3},sfx:'cannon',desc:'Arcing corpses: splash + plague DoT, ground only'},
   {id:'plague',name:'Plague Cauldron',key:'3',cost:18,dmg:4,rate:1,range:1.8,ground:1,air:0,pulse:1,sfx:'',desc:'Poison cloud: damages & slows ALL ground creeps in range'},
   {id:'bone',name:'Bone Spire',key:'4',cost:30,dmg:40,rate:2.4,range:5.5,ground:1,air:0,pspd:16,crit:{chance:.25,mult:2},sfx:'sniper',desc:'Long-range bone lance, ground only, 25% crit'},
   {id:'wyrm',name:'Frost Wyrm Roost',key:'5',cost:22,dmg:17,rate:.7,range:4,ground:0,air:1,pspd:8,splash:.8,slow:.5,sfx:'frost',desc:'Freezing breath vs AIR only: splash + slow'}]}};
let CFG={race:['human','orc','undead','human'],diff:'mixed'},LOBBY_OPEN=true;
const DIFF={easy:{think:1.6,sloppy:.3,gold:0},normal:{think:1.1,sloppy:.08,gold:0},hard:{think:.7,sloppy:0,gold:25}};
function randomizeAIs(){for(let i=1;i<4;i++){CFG.race[i]=RACE_LIST[Math.floor(Math.random()*RACE_LIST.length)]}}
function baseName(p){return RACES[p.race].bases[0]}
// ---------- players / heroes ----------
const _newPlayerR=newPlayer;newPlayer=function(i){const p=_newPlayerR(i);p.race=CFG.race[i];p.tdefs=RACES[p.race].towers;p.allies=[];p.zones=[];p._drums=[];
 if(p.ai&&CFG.diff!=='mixed'){const d=DIFF[CFG.diff];p.ai=Object.assign({},p.ai,{think:p.ai.think*d.think,sloppy:d.sloppy,diff:CFG.diff[0].toUpperCase()+CFG.diff.slice(1)});p.gold+=d.gold}
 return p};
// ---------- towers ----------
build=function(p,ti,x,y){const d=p.tdefs[ti];if(!d||p.gold<d.cost||!canPlace(p,x,y))return false;
 const t={def:d,ti,x,y,lvl:1,cd:0,spent:d.cost,ang:-Math.PI/2,fl:0,bt:0,p};p.grid[y][x]=t;p.towers.push(t);p.gold-=d.cost;computeDist(p);p.built++;
 fx(p,'build',x+.5,y+.5,{ttl:.7});if(p.i===0)sfx('build');return t};
const _tStatR=tStat;tStat=function(t){const s=_tStatR(t),p=t.p;if(!p)return s;
 if(p._drums.length&&!t.def.support)for(const d of p._drums)if(Math.hypot(d.x-t.x,d.y-t.y)<=d.def.range+.01){s.rate/=1.15+.05*d.lvl;s.drum=true;break}return s};
function chainHit(p,x0,y0,t,dmg,n,decay,slow,color){const pts=[[x0,y0]],hitS=new Set();let cur=t;for(let k=0;k<=n&&cur;k++){damage(p,cur,dmg);if(slow)cur.slowT=Math.max(cur.slowT,slow);hitS.add(cur);pts.push([cur.x,cur.y]);dmg*=decay;
 let nx=null,bd=3;for(const c of p.creeps)if(!c.dead&&!hitS.has(c)){const d=Math.hypot(c.x-cur.x,c.y-cur.y);if(d<bd){bd=d;nx=c}}cur=nx}fx(p,'chain',x0,y0,{pts,color})}
function lineHit(p,h,ang,len,w,dmg,stun,color){const dx=Math.cos(ang),dy=Math.sin(ang);for(const c of p.creeps){if(c.dead)continue;const rx=c.x-h.x,ry=c.y-h.y,along=rx*dx+ry*dy,perp=Math.abs(rx*dy-ry*dx);
 if(along>=-.3&&along<=len&&perp<=w){damage(p,c,dmg);if(stun)c.stunT=Math.max(c.stunT||0,stun)}}fx(p,'line',h.x,h.y,{ang,len,color})}
towerStep=function(p,t,dt){t.cd-=dt;if(t.fl>0)t.fl-=dt;if(t.cd>0)return;const d=t.def;if(d.support){t.cd=.5;return}const s=tStat(t),tx=t.x+.5,ty=t.y+.5;
 if(d.pulse){let any=false;for(const c of p.creeps)if(!c.dead&&!c.fly&&Math.hypot(c.x-tx,c.y-ty)<=s.range){damage(p,c,s.dmg);c.slowT=Math.max(c.slowT,1.2);any=true}
  if(any){t.cd=s.rate;t.fl=.3;fx(p,'pulse',tx,ty,{r:s.range})}return}
 let tgt=null,ty0=-1;for(const c of p.creeps){if(c.dead||(c.fly?!d.air:!d.ground))continue;if(Math.hypot(c.x-tx,c.y-ty)<=s.range&&c.y>ty0){ty0=c.y;tgt=c}}
 if(!tgt)return;t.cd=s.rate;t.ang=Math.atan2(tgt.y-ty,tgt.x-tx);t.fl=.18;
 if(d.chain){chainHit(p,tx,ty-.3,tgt,s.dmg,d.chain,.75,0,0xa0d0ff);if(p.i===0)sfx('sniper');return}
 p.proj.push({k:d.id,arc:!!d.arc,x:tx,y:ty-.25,sx:tx,sy:ty-.25,tgt,ex:tgt.x,ey:tgt.y,sp:d.pspd||8,dmg:s.dmg,splash:d.splash||0,slow:d.slow?1.5+.3*t.lvl:0,air:d.air,ground:d.ground,prog:0,a:t.ang,lvl:t.lvl,h:0,
  dot:d.dot?{dps:s.dmg*d.dot.mult,dur:d.dot.dur}:null,crit:d.crit||null,stun:d.stunChance&&Math.random()<d.stunChance?d.stunDur:0});if(p.i===0&&d.sfx)sfx(d.sfx)};
projStep=function(p,pr,dt){
 if(pr.arc||pr.k==='cannon'){const D=Math.max(.3,Math.hypot(pr.ex-pr.sx,pr.ey-pr.sy));pr.prog=Math.min(1,pr.prog+pr.sp*dt/D);pr.x=pr.sx+(pr.ex-pr.sx)*pr.prog;pr.y=pr.sy+(pr.ey-pr.sy)*pr.prog;
  pr.h=Math.sin(Math.PI*pr.prog)*(.5+D*.25);if(pr.prog>=1)hit(p,pr,pr.tgt);return}
 if(pr.tgt&&!pr.tgt.dead){pr.ex=pr.tgt.x;pr.ey=pr.tgt.y}const dx=pr.ex-pr.x,dy=pr.ey-pr.y,L=Math.hypot(dx,dy),m=pr.sp*dt;pr.a=Math.atan2(dy,dx);
 if(L<=m){pr.x=pr.ex;pr.y=pr.ey;hit(p,pr,pr.tgt&&!pr.tgt.dead?pr.tgt:null)}else{pr.x+=dx/L*m;pr.y+=dy/L*m}};
const _hitR=hit;hit=function(p,pr,tgt){if(pr.crit&&Math.random()<pr.crit.chance){pr.dmg*=pr.crit.mult;if(tgt)fx(p,'float',tgt.x,tgt.y-.2,{ttl:.9,text:'crit!'})}_hitR(p,pr,tgt);
 if(pr.dot){const list=pr.splash?p.creeps.filter(c=>!c.dead&&Math.hypot(c.x-pr.x,c.y-pr.y)<=pr.splash):tgt&&!tgt.dead?[tgt]:[];for(const c of list){c.dotDps=Math.max(c.dotDps||0,pr.dot.dps);c.dotT=pr.dot.dur}}};
const _moveCreepR=moveCreep;moveCreep=function(p,c,dt){if(c.dotT>0){c.dotT-=dt;c.dotAcc=(c.dotAcc||0)+c.dotDps*dt;if(c.dotAcc>=4||c.dotT<=0){const a=c.dotAcc;c.dotAcc=0;damage(p,c,a);if(c.dead)return}}_moveCreepR(p,c,dt)};
// ---------- setup phase / wave hold ----------
const SETUP_TIME=60;
const _newGameR=newGame;newGame=function(){_newGameR();G.msel=[];G.waveT=SETUP_TIME;G.holdWaves=false;G.inLobby=LOBBY_OPEN;G.log.length=0;addLog(`Setup phase: build your maze! First wave in ${SETUP_TIME}s (Enter = start now).`,'#7a1a08');
 if(typeof onNewGame==='function')onNewGame()};
const _stepR=step;step=function(dt){if(G.inLobby)return;for(const p of G.players)p._drums=p.towers.filter(t=>t.def.support);const w=G.waveT;_stepR(dt);if(G.holdWaves&&G.wave>0&&G.waveT<w)G.waveT=w};
function startWavesNow(){if(G.inLobby)return;if(G.waveT>.2)G.waveT=.05}
// ---------- impact info for the renderer (which projectile hit, crits, damage numbers) ----------
{const _hitI=hit;hit=function(p,pr,tgt){const prev=G._imp;G._imp={k:pr.k,lvl:pr.lvl||1,a:pr.a,stun:pr.stun,crit:false,tgt,splash:pr.splash,air:tgt&&tgt.fly};
 if(pr.crit&&!pr._critRolled){pr._critRolled=1;if(Math.random()<pr.crit.chance){pr.dmg*=pr.crit.mult;G._imp.crit=true}pr.crit=null}
 try{_hitI(p,pr,tgt)}finally{G._imp=prev}};
 const _dmgI=damage;damage=function(p,c,dmg){const hp=c.hp,was=c.dead;_dmgI(p,c,dmg);const d=hp-Math.max(0,c.hp);if(d>0&&!was&&!G.simulating)fx(p,'dmgnum',c.x,c.y,{v:d,crit:!!(G._imp&&G._imp.crit&&G._imp.tgt===c),dot:!G._imp&&!G._chain,fly:c.fly,big:c.big})};
 const _chainI=chainHit;chainHit=function(...a){G._chain=1;try{_chainI(...a)}finally{G._chain=0}}}
