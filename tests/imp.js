const {chromium}=require('playwright-core');const path=require('path'),fs=require('fs');const OUT=path.join(__dirname,'out');fs.mkdirSync(OUT,{recursive:true});const GAME='file://'+path.resolve(__dirname,'..','index.html');const CHROME=process.env.CHROME_PATH||'/usr/bin/google-chrome';const URL=process.argv[2]||GAME;
(async()=>{const b=await chromium.launch({executablePath:CHROME,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const pg=await b.newPage({viewport:{width:1500,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await pg.goto(URL);await pg.waitForFunction(()=>window.LTW&&LTW.ready,null,{timeout:180000});
const shots=[];
for(const race of ['human','orc','undead']){await pg.evaluate(()=>showLobby());await pg.click(`.rc[data-r="${race}"]`);await pg.click('#lstart');await pg.waitForTimeout(300);
 await pg.evaluate(()=>{const G=LTW.G,me=G.players[0];me.gold=3000;const cells=[];for(let x=0;x<10;x++)cells.push([x,3]);for(let x=1;x<11;x++)cells.push([x,7]);
  cells.forEach(([x,y],k)=>{const t=LTW.build(me,k%5,x,y);if(t){t.lvl=2;t.bt=1}});G.waveT=.1;LTW.cam.goal=null;LTW.cam.tx=5.5;LTW.cam.tz=7;LTW.cam.dist=14;LTW.cam.yaw=0});
 await pg.waitForTimeout(200);
 // spawn mixed creeps continuously, then run real-time a few seconds
 await pg.evaluate(()=>{const G=LTW.G;G.players[1].gold=99999;for(let k=0;k<8;k++){LTW.sendCreep(G.players[1],0,0);LTW.sendCreep(G.players[1],1,0);LTW.sendCreep(G.players[1],3,0);LTW.sendCreep(G.players[1],2,0)}});await pg.waitForTimeout(1200);await pg.evaluate(()=>{for(const c of LTW.G.players[0].creeps){c.hp*=40;c.maxhp*=40}});await pg.waitForTimeout(1500);await pg.evaluate(()=>{for(const c of LTW.G.players[0].creeps)if(c.maxhp<500){c.hp*=40;c.maxhp*=40}});
 await pg.waitForTimeout(4200);
 const st=await pg.evaluate(()=>[LTW.G.players[0].creeps.length,LTW.G.players[0].kills,document.querySelectorAll('.ft').length]);console.log(race,st);
 await pg.screenshot({path:path.join(OUT,`imp_${race}.png`)});shots.push(race)}
// low fx toggle + numbers toggle
await pg.click('#fxq');await pg.click('#nums');console.log('toggles',await pg.evaluate(()=>[LTW.FXQ.low,LTW.FXQ.nums,document.getElementById('fxq').textContent]));await pg.click('#fxq');await pg.click('#nums');
// long AI run
for(let m=0;m<6;m++)await pg.evaluate(()=>{const G=LTW.G;LTW.simulate(30);if(G.over==='lose')G.over='spect'});
await pg.evaluate(()=>{LTW.jumpLane(2)});await pg.waitForTimeout(4000);
console.log('fps',await pg.evaluate(()=>window.FPS),'errs',errs,await pg.evaluate(()=>LTW.errorsLog.slice(0,3)));await b.close()})();
