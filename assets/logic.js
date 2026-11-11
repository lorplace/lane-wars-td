// Shared game logic (same rules as the 2D version)
// ================= GAME DATA =================
const COLS=11,ROWS=20,DT=1/30,INCOME_CAP=110;
const TOWERS=[
 {id:'arrow',name:'Archer Tower',key:'1',cost:10,dmg:7,rate:0.7,range:3,ground:1,air:1,pspd:10,desc:'Fast arrows, hits ground & air'},
 {id:'cannon',name:'Dwarven Cannon',key:'2',cost:20,dmg:14,rate:1.4,range:2.7,ground:1,air:0,splash:1.2,pspd:5,desc:'Arcing splash, ground only'},
 {id:'frost',name:'Frost Spire',key:'3',cost:18,dmg:3,rate:1,range:2.6,ground:1,air:1,slow:.5,pspd:7,desc:'Chills (50% slow), ground & air'},
 {id:'sniper',name:'Ballista',key:'4',cost:30,dmg:45,rate:2.4,range:6,ground:1,air:0,pspd:17,desc:'Huge range & damage, ground only'},
 {id:'flak',name:'Fire Brazier',key:'5',cost:22,dmg:20,rate:.6,range:4,ground:0,air:1,splash:.8,pspd:8,desc:'Fireballs vs AIR only, splash'}];
const CREEPS={normal:{hp:22,spd:1.6,armor:0,name:'Orc Grunt'},fast:{hp:15,spd:2.8,armor:0,name:'Dire Wolf'},
 armored:{hp:34,spd:1.15,armor:2,name:'Iron Brute'},flying:{hp:20,spd:1.5,armor:0,fly:1,name:'Wyvern'},boss:{hp:260,spd:1,armor:2,big:1,name:'Ogre Warlord'}};
const SENDS=[{name:'Wolf',key:'z',cost:8,inc:1,type:'fast',hp:28},{name:'Grunt',key:'x',cost:15,inc:2,type:'normal',hp:55},
 {name:'Brute',key:'c',cost:30,inc:4,type:'armored',hp:120},{name:'Wyvern',key:'v',cost:45,inc:6,type:'flying',hp:110},
 {name:'Warlord',key:'b',cost:100,inc:13,type:'boss',hp:480}];
const WAVETYPES=['normal','fast','armored','normal','flying','fast','armored','flying','normal','boss'];
const AIS=[{name:'Ironhide',diff:'Hard',pers:'builder',think:.8,sendBias:.25,mix:[5,2,1,1]},
 {name:'Vexa',diff:'Normal',pers:'sender',think:1.4,sendBias:.6,mix:[3,1,2,1]},
 {name:'Mopsy',diff:'Easy',pers:'balanced',think:2.8,sendBias:.4,mix:[4,1,1,0],sloppy:.35}];
const COLORS=['#5fd068','#f08a4a','#6a8cff','#e070e0'];
let G,errorsLog=[];
function rnd(a){return Math.random()*a}
function newPlayer(i){const p={i,name:i?AIS[i-1].name:'You',ai:i?AIS[i-1]:null,gold:95,income:12,lives:20,alive:true,
 grid:Array.from({length:ROWS},()=>Array(COLS).fill(null)),towers:[],creeps:[],proj:[],queue:[],qt:0,dist:null,path:[],kills:0,sent:0,think:1+rnd(1),built:0};
 computeDist(p);return p}
function newGame(){G={msel:[],t:0,players:[0,1,2,3].map(newPlayer),wave:0,waveT:15,incT:10,fx:[],log:[],paused:false,speed:1,over:false,sel:null,build:null,elim:[],simulating:false};
 addLog('The war begins! First wave in 15s.','#7a1a08');if(typeof updateUI==='function')updateUI(true);hideOv()}
function addLog(text,color){G.log.unshift({text,color});G.log.length=Math.min(G.log.length,9)}
function bfs(grid){const d=Array.from({length:ROWS},()=>Array(COLS).fill(Infinity)),q=[];
 for(let x=0;x<COLS;x++)if(!grid[ROWS-1][x]){d[ROWS-1][x]=0;q.push([x,ROWS-1])}
 for(let h=0;h<q.length;h++){const[x,y]=q[h];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;
  if(nx<0||ny<0||nx>=COLS||ny>=ROWS||grid[ny][nx]||d[ny][nx]!==Infinity)continue;d[ny][nx]=d[y][x]+1;q.push([nx,ny])}}return d}
const SPAWN=[5,0];
function computeDist(p){p.dist=bfs(p.grid);const path=[[SPAWN[0],SPAWN[1]]];let [x,y]=SPAWN;
 for(let k=0;k<400&&p.dist[y][x]>0;k++){let best=null,bd=p.dist[y][x];for(const[ox,oy]of[[0,1],[1,0],[-1,0],[0,-1]]){const nx=x+ox,ny=y+oy;
  if(nx<0||ny<0||nx>=COLS||ny>=ROWS||p.grid[ny][nx])continue;if(p.dist[ny][nx]<bd){bd=p.dist[ny][nx];best=[nx,ny]}}if(!best)break;[x,y]=best;path.push(best)}p.path=path}
function canPlace(p,x,y){if(x<0||y<1||x>=COLS||y>=ROWS-1||p.grid[y][x])return false;
 for(const c of p.creeps)if(!c.fly&&((c.cx===x&&c.cy===y)||(c.tx===x&&c.ty===y)))return false;
 p.grid[y][x]=1;const d=bfs(p.grid);p.grid[y][x]=null;
 if(d[SPAWN[1]][SPAWN[0]]===Infinity)return false;
 for(const c of p.creeps)if(!c.fly&&d[c.ty][c.tx]===Infinity)return false;return true}
function build(p,ti,x,y){const d=TOWERS[ti];if(p.gold<d.cost||!canPlace(p,x,y))return false;
 const t={def:d,ti,x,y,lvl:1,cd:0,spent:d.cost,ang:-Math.PI/2,fl:0,bt:0};p.grid[y][x]=t;p.towers.push(t);p.gold-=d.cost;computeDist(p);p.built++;
 fx(p,'build',x+.5,y+.5,{ttl:.7});if(p.i===0)sfx('build');return t}
function tStat(t){const m=Math.pow(1.65,t.lvl-1);return{dmg:t.def.dmg*m,range:t.def.range+.3*(t.lvl-1),rate:t.def.rate*Math.pow(.92,t.lvl-1)}}
function upCost(t){return t.lvl>=4?null:Math.round(t.def.cost*t.lvl*1.1)}
function upgrade(p,t){const c=upCost(t);if(c==null||p.gold<c)return false;p.gold-=c;t.spent+=c;t.lvl++;fx(p,'upgrade',t.x+.5,t.y+.5,{ttl:1});if(p.i===0)sfx('upgrade');return true}
function sell(p,t){const r=Math.floor(t.spent*.7);p.gold+=r;p.grid[t.y][t.x]=null;p.towers.splice(p.towers.indexOf(t),1);computeDist(p);if(G.sel===t)G.sel=null;
 fx(p,'build',t.x+.5,t.y+.5,{ttl:.6});fx(p,'float',t.x+.5,t.y+.3,{ttl:1.2,text:'+'+r});if(p.i===0)sfx('sell')}
let CID=0;
function makeCreep(type,hp,bounty,from){const d=CREEPS[type];return{id:CID++,type,hp,maxhp:hp,spd:d.spd,armor:d.armor+(G.wave>10?Math.floor(G.wave/6):0),fly:!!d.fly,
 big:!!d.big,bounty,from,x:SPAWN[0]+.5+(d.fly?(rnd(6)-3):0),y:.5,cx:SPAWN[0],cy:0,tx:SPAWN[0],ty:0,slowT:0,dir:Math.PI/2,ph:rnd(6),hitT:0}}
function nextAlive(i){for(let k=1;k<4;k++){const j=(i+k)%4;if(G.players[j].alive)return j}return -1}
// income gain from sends has diminishing returns + a cap (tones down the late snowball)
function sendGain(p,si){if(p.income>=INCOME_CAP)return 0;return Math.max(1,Math.round(SENDS[si].inc*30/(30+p.sent)))}
function sendCreep(p,si,target){const s=SENDS[si];if(!p.alive||p.gold<s.cost)return false;
 if(target==null||target===p.i||!G.players[target].alive)target=nextAlive(p.i);if(target<0)return false;
 p.gold-=s.cost;p.income=Math.min(INCOME_CAP,p.income+sendGain(p,si));p.sent++;const hp=Math.round(s.hp*(1+.07*G.wave));
 G.players[target].queue.push(makeCreep(s.type,hp,Math.ceil(s.cost/6),p.i));
 if(si>=2||p.i===0||target===0)addLog(`${p.name} sent ${s.name} → ${G.players[target].name}`,COLORS[p.i]);
 if(p.i===0)sfx('send');else if(target===0)sfx('warn');return true}
function startWave(){G.wave++;const n=G.wave,type=WAVETYPES[(n-1)%WAVETYPES.length],cnt=type==='boss'?2:10,
 hp=Math.round(CREEPS[type].hp*Math.pow(1.13,n-1)*Math.pow(1.06,Math.max(0,n-18))),b=2+Math.floor(n/4)+(type==='boss'?15:0);
 for(const p of G.players)if(p.alive)for(let k=0;k<cnt;k++)p.queue.push(makeCreep(type,hp,b,-1));
 addLog(`Wave ${n}: ${cnt} × ${CREEPS[type].name}`,'#3a2410');sfx('horn')}
function moveCreep(p,c,dt){let sp=c.spd*(c.slowT>0?.5:1)*dt;c.ph+=sp*5;if(c.slowT>0)c.slowT-=dt;if(c.hitT>0)c.hitT-=dt;const ox=c.x,oy=c.y;
 if(c.fly){c.y+=sp;}else{while(sp>0){const gx=c.tx+.5,gy=c.ty+.5,dx=gx-c.x,dy=gy-c.y,L=Math.hypot(dx,dy);
  if(L<=sp){c.x=gx;c.y=gy;sp-=L;c.cx=c.tx;c.cy=c.ty;if(c.cy===ROWS-1){c.y=ROWS;break}
   let best=null,bd=p.dist[c.cy][c.cx];for(const[ox,oy]of[[0,1],[1,0],[-1,0],[0,-1]]){const nx=c.cx+ox,ny=c.cy+oy;
    if(nx<0||ny<0||nx>=COLS||ny>=ROWS||p.grid[ny][nx])continue;if(p.dist[ny][nx]<bd){bd=p.dist[ny][nx];best=[nx,ny]}}
   if(!best){c.y+=.0001;break}c.tx=best[0];c.ty=best[1]}else{c.x+=dx/L*sp;c.y+=dy/L*sp;sp=0}}}
 const mx=c.x-ox,my=c.y-oy;if(mx*mx+my*my>1e-6){const a=Math.atan2(my,mx);let d=a-c.dir;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;c.dir+=d*Math.min(1,dt*12)}
 if(c.y>=ROWS-.05){c.dead=true;if(p.alive){p.lives-=c.big?3:1;fx(p,'leak',c.x,ROWS-.5,{ttl:.8});if(p.i===0)sfx('leak');if(p.lives<=0)eliminate(p)}}}
function eliminate(p){p.lives=0;p.alive=false;p.queue=[];p.creeps=[];p.proj=[];G.elim.push(p.i);addLog(`☠ ${p.name} has fallen on wave ${G.wave}!`,'#a01010');sfx('fall');endGame()}
function endGame(){if(G.over&&G.over!=='spect')return;const alive=G.players.filter(q=>q.alive);
 if(alive.length===1&&alive[0].i===0)G.over='win';else if(alive.length<=1)G.over='aiwin';else if(!G.players[0].alive&&G.over!=='spect')G.over='lose';else return;
 sfx(G.over==='win'?'win':'lose');showOv()}
function damage(p,c,dmg){const real=Math.max(dmg*.25,dmg-c.armor);c.hp-=real;c.hitT=.12;if(c.hp<=0&&!c.dead){c.dead=true;p.gold+=c.bounty;p.kills++;
 fx(p,'death',c.x,c.y,{ttl:.9,type:c.type,big:c.big,fly:c.fly,dir:c.dir});fx(p,'float',c.x,c.y-.3,{ttl:1.1,text:'+'+c.bounty});if(p.i===0)sfx('die')}}
function firstTarget(p, def, x, y, range) {
 let target = null;
 let shortest = Infinity;
 for (const creep of p.creeps) {
  if (creep.dead || !(creep.fly ? def.air : def.ground)) continue;
  if ((creep.x-x)**2 + (creep.y-y)**2 > range*range) continue;
  // Ground units finish on reaching the last row's center.
  const remaining = creep.fly ? ROWS-.05-creep.y :
   p.dist[creep.ty][creep.tx] + Math.abs(creep.tx+.5-creep.x) + Math.abs(creep.ty+.5-creep.y);
  if (remaining < shortest) {
   shortest = remaining;
   target = creep;
  }
 }
 return target;
}
function towerStep(p,t,dt){t.cd-=dt;if(t.fl>0)t.fl-=dt;if(t.cd>0)return;const s=tStat(t),tx=t.x+.5,ty=t.y+.5;const tgt=firstTarget(p,t.def,tx,ty,s.range);
 if(!tgt)return;t.cd=s.rate;t.ang=Math.atan2(tgt.y-ty,tgt.x-tx);t.fl=.18;
 p.proj.push({k:t.def.id,x:tx,y:ty-.25,sx:tx,sy:ty-.25,tgt,ex:tgt.x,ey:tgt.y,sp:t.def.pspd,dmg:s.dmg,splash:t.def.splash||0,slow:t.def.slow?1.5+.3*t.lvl:0,
  air:t.def.air,ground:t.def.ground,prog:0,a:t.ang,lvl:t.lvl,h:0});if(p.i===0)sfx(t.def.id)}
function projStep(p,pr,dt){
 if(pr.k==='cannon'){const D=Math.max(.3,Math.hypot(pr.ex-pr.sx,pr.ey-pr.sy));pr.prog=Math.min(1,pr.prog+pr.sp*dt/D);pr.x=pr.sx+(pr.ex-pr.sx)*pr.prog;pr.y=pr.sy+(pr.ey-pr.sy)*pr.prog;
  pr.h=Math.sin(Math.PI*pr.prog)*(.5+D*.25);if(p.i===0&&Math.random()<.5)fx(p,'smoke',pr.x,pr.y-pr.h,{ttl:.5});if(pr.prog>=1)hit(p,pr,pr.tgt);return}
 if(pr.tgt&&!pr.tgt.dead){pr.ex=pr.tgt.x;pr.ey=pr.tgt.y}const dx=pr.ex-pr.x,dy=pr.ey-pr.y,L=Math.hypot(dx,dy),m=pr.sp*dt;pr.a=Math.atan2(dy,dx);
 if(p.i===0&&(pr.k==='frost'||pr.k==='flak')&&Math.random()<.7)fx(p,pr.k==='frost'?'sparkle':'ember',pr.x,pr.y,{ttl:.4});
 if(L<=m){pr.x=pr.ex;pr.y=pr.ey;hit(p,pr,pr.tgt&&!pr.tgt.dead?pr.tgt:null)}else{pr.x+=dx/L*m;pr.y+=dy/L*m}}
function hit(p,pr,tgt){pr.done=true;
 if(pr.splash){for(const c of p.creeps)if(!c.dead&&(c.fly?pr.air:pr.ground)&&Math.hypot(c.x-pr.x,c.y-pr.y)<=pr.splash)damage(p,c,c===tgt?pr.dmg:pr.dmg*.6);
  fx(p,'boom',pr.x,pr.y,{ttl:.55,r:pr.splash,fire:pr.k==='flak'});if(p.i===0)sfx('boom')}
 else if(tgt&&!tgt.dead){damage(p,tgt,pr.dmg);fx(p,pr.k==='frost'?'frosthit':'spark',pr.x,pr.y,{ttl:.35})}
 if(pr.slow&&tgt)tgt.slowT=pr.slow}
// ================= AI =================
function aiPattern(){const cells=[];[3,6,9,12,15].forEach((r,k)=>{const gap=k%2?0:COLS-1;const order=[];for(let x=0;x<COLS;x++)if(x!==gap)order.push(x);
 order.sort((a,b)=>Math.abs(a-5)-Math.abs(b-5));order.forEach(x=>cells.push([x,r]))});return cells}
const PATTERN=aiPattern();
function aiPick(ai){const w=ai.mix,tot=w.reduce((a,b)=>a+b);let r=rnd(tot);for(let i=0;i<4;i++){if((r-=w[i])<0)return i}return 0}
function aiStep(p,dt){p.think-=dt;if(p.think>0)return;const ai=p.ai;p.think=ai.think*(.7+rnd(.6));if(p.gold>150)p.think=.25;
 if(ai.sloppy&&Math.random()<ai.sloppy)return;
 const flak=p.towers.filter(t=>t.ti===4).length,airThreat=G.wave>=3||p.queue.some(c=>c.fly)||p.creeps.some(c=>c.fly);
 const leaking=p.lives<14,minTowers=4+G.wave*1.5;
 if(G.t>55&&p.towers.length>=minTowers*(leaking?1.5:1)&&Math.random()<ai.sendBias){
  for(let s=SENDS.length-1;s>=0;s--){if(p.gold>=SENDS[s].cost*(ai.pers==='sender'?1:1.5)){
   let target;if(ai.pers==='sender'){const opp=G.players.filter(q=>q.alive&&q!==p).sort((a,b)=>a.lives-b.lives);target=opp[0]&&opp[0].i}
   sendCreep(p,s,target);return}}}
 if(airThreat&&flak<1+Math.floor(G.wave/4)&&p.gold>=TOWERS[4].cost){if(aiBuildAt(p,4))return}
 let ti=aiPick(ai);if(p.gold>=TOWERS[ti].cost&&aiBuildAt(p,ti))return;
 if(p.gold>=40||(p.built>=PATTERN.length)){const ups=p.towers.filter(t=>upCost(t)!=null).sort((a,b)=>a.lvl-b.lvl||b.y-a.y);if(ups[0])upgrade(p,ups[0])}}
function aiBuildAt(p,ti){if(p.ai.sloppy&&Math.random()<.2){const x=Math.floor(rnd(COLS)),y=1+Math.floor(rnd(ROWS-2));return !!build(p,ti,x,y)}
 for(const[x,y]of PATTERN)if(!p.grid[y][x]&&canPlace(p,x,y))return !!build(p,ti,x,y);
 for(let k=0;k<20;k++){const x=Math.floor(rnd(COLS)),y=1+Math.floor(rnd(ROWS-2));if(canPlace(p,x,y))return !!build(p,ti,x,y)}return false}
// ================= LOOP =================
function fx(p,type,x,y,o){if(G.simulating||G.fx.length>900)return;if(p.i!==0&&(type==='smoke'||type==='ember'||type==='sparkle'))return;
 const f=Object.assign({p:p.i,type,x,y,t:0,ttl:.5},o);if(type==='death'||type==='boom'||type==='frosthit'||type==='build'||type==='upgrade'){f.parts=[];const n=p.i===0?(type==='boom'?16:12):5;
  for(let k=0;k<n;k++){const a=rnd(6.283),s=.5+rnd(1.8);f.parts.push({a,s,z:rnd(1)})}}G.fx.push(f)}
function step(dt){if(G.over&&G.over!=='spect')return;G.t+=dt;G.waveT-=dt;G.incT-=dt;
 if(G.waveT<=0){startWave();G.waveT=25}
 if(G.incT<=0){G.incT=10;for(const p of G.players)if(p.alive){p.gold+=p.income;if(p.i===0){fx(p,'float',5.5,ROWS-2,{ttl:1.6,text:'Income +'+p.income,big:1});sfx('coin')}}}
 for(const p of G.players){if(!p.alive)continue;if(p.ai)aiStep(p,dt);
  p.qt-=dt;if(p.queue.length&&p.qt<=0){p.creeps.push(p.queue.shift());p.qt=.55}
  for(const c of p.creeps)moveCreep(p,c,dt);for(const t of p.towers){towerStep(p,t,dt);if(t.bt<1)t.bt+=dt*2}
  for(const pr of p.proj)projStep(p,pr,dt);p.proj=p.proj.filter(q=>!q.done);p.creeps=p.creeps.filter(c=>!c.dead)}
 for(const f of G.fx)f.t+=dt;G.fx=G.fx.filter(f=>f.t<f.ttl)}
function simulate(sec){G.simulating=true;try{const n=Math.round(sec/DT);for(let i=0;i<n;i++)step(DT)}finally{G.simulating=false}}
// ================= SOUND (WebAudio synth) =================
let AC=null,MG=null,muted=false,NB=null;const lastS={};
function ac(){if(AC===null){try{AC=new(window.AudioContext||window.webkitAudioContext)();MG=AC.createGain();MG.gain.value=.5;MG.connect(AC.destination);
 NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}catch(e){AC=false}}return AC}
function tone(f,d,type,vol,slide,delay){const a=AC,t0=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t0);
 if(slide)o.frequency.exponentialRampToValueAtTime(slide,t0+d);g.gain.setValueAtTime(0.0001,t0);g.gain.linearRampToValueAtTime(vol,t0+.008);g.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(g);g.connect(MG);o.start(t0);o.stop(t0+d+.05)}
function noise(d,vol,freq,delay,q){const a=AC,t0=a.currentTime+(delay||0),s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=NB;f.type='lowpass';f.frequency.value=freq;f.Q.value=q||1;
 g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);s.connect(f);f.connect(g);g.connect(MG);s.start(t0,rnd(.5));s.stop(t0+d+.05)}
const SFX={arrow:()=>{noise(.07,.12,4000);tone(1100,.06,'triangle',.04,500)},cannon:()=>{tone(140,.3,'sine',.35,45);noise(.25,.25,700)},
 frost:()=>{tone(1300,.18,'sine',.06,2100);tone(1900,.2,'triangle',.03,null,.05)},sniper:()=>{tone(320,.14,'sawtooth',.08,70);noise(.08,.15,2500)},
 flak:()=>{noise(.3,.18,1200);tone(220,.22,'square',.03,90)},boom:()=>{noise(.45,.3,450);tone(80,.35,'sine',.25,35)},die:()=>{tone(260,.16,'square',.04,110);noise(.1,.06,1500)},
 leak:()=>{tone(220,.45,'sawtooth',.1,100)},build:()=>{noise(.12,.15,600);tone(300,.07,'square',.05);tone(420,.09,'square',.05,null,.08)},
 upgrade:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,.18,'triangle',.07,null,i*.07))},sell:()=>{tone(784,.12,'triangle',.07);tone(523,.15,'triangle',.07,null,.1)},
 coin:()=>{tone(1318,.1,'square',.03);tone(1760,.18,'square',.03,null,.07)},horn:()=>{tone(147,.9,'sawtooth',.07,150);tone(220,.7,'sawtooth',.05,null,.35);noise(.5,.04,400)},
 send:()=>{tone(330,.2,'sawtooth',.05,660);noise(.15,.06,900)},warn:()=>{tone(660,.09,'square',.05);tone(660,.09,'square',.05,null,.14)},
 fall:()=>{tone(300,.8,'sawtooth',.07,60)},win:()=>{[392,523,659,784,1046].forEach((f,i)=>tone(f,.4,'triangle',.09,null,i*.15))},lose:()=>{[392,330,262,196].forEach((f,i)=>tone(f,.5,'sawtooth',.06,null,i*.25))}};
function sfx(n){if(muted||!G||G.simulating)return;const a=ac();if(!a||a.state!=='running')return;const now=performance.now();if(lastS[n]&&now-lastS[n]<(n==='arrow'||n==='die'?60:90))return;lastS[n]=now;try{SFX[n]()}catch(e){}}
function unlockAudio(){const a=ac();if(a&&a.state==='suspended')a.resume()}
addEventListener('pointerdown',unlockAudio);addEventListener('keydown',unlockAudio);
