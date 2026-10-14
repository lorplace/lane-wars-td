const {chromium}=require('playwright-core');const path=require('path'),fs=require('fs');const OUT=path.join(__dirname,'out');fs.mkdirSync(OUT,{recursive:true});const GAME='file://'+path.resolve(__dirname,'..','index.html');const CHROME=process.env.CHROME_PATH||'/usr/bin/google-chrome';const URL=process.argv[2]||GAME;
(async()=>{const b=await chromium.launch({executablePath:CHROME,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const pg=await b.newPage({viewport:{width:1500,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>m.type()==='error'&&errs.push(m.text()));
const t0=Date.now();await pg.goto(URL);await pg.waitForFunction(()=>window.LTW&&LTW.ready,null,{timeout:180000});console.log('load s',(Date.now()-t0)/1000,errs);
await pg.click('.rc[data-r="undead"]');await pg.waitForTimeout(800);await pg.screenshot({path:path.join(OUT,'lobby.png')});
for(const race of ['human','orc','undead']){await pg.evaluate(()=>showLobby());await pg.click(`.rc[data-r="${race}"]`);await pg.click('#lstart');await pg.waitForTimeout(400);
 console.log(race,await pg.evaluate(()=>{const G=LTW.G,me=G.players[0];me.gold+=300;let n=0;for(let x=0;x<10;x++)if(LTW.build(me,x%5,x,4))n++;return [me.race,n,G.players.map(p=>p.race).join(','),!!document.getElementById('heropanel'),typeof heroStep]}));}
await pg.keyboard.press('Enter');await pg.keyboard.press('t');await pg.keyboard.press('k');await pg.keyboard.press('h');
for(let m=0;m<12;m++){const r=await pg.evaluate(()=>{const G=LTW.G;LTW.simulate(30);if(G.over==='lose')G.over='spect';return [G.wave,G.players.map(p=>`${p.race[0]}♥${p.lives} tw${p.towers.length}`).join(' | ')]});if(m%4==3)console.log(JSON.stringify(r))}
await pg.evaluate(()=>{hideOv&&hideOv();LTW.G.over=LTW.G.over==='lose'?'spect':LTW.G.over});
// pan via right-drag
const c0=await pg.evaluate(()=>LTW.cam.tx);await pg.mouse.move(900,400);await pg.mouse.down({button:'right'});for(let k=1;k<=10;k++)await pg.mouse.move(900-k*40,400);await pg.mouse.up({button:'right'});
console.log('right-drag dx',(await pg.evaluate(()=>LTW.cam.tx))-c0);
// key jump to lane 2 (key 8), and minimap click on lane 3
await pg.keyboard.press('8');await pg.waitForTimeout(1500);console.log('key8 tx',await pg.evaluate(()=>LTW.cam.tx.toFixed(1)));
const bb=await pg.locator('#mm').boundingBox();await pg.mouse.click(bb.x+bb.width*.88,bb.y+bb.height/2);await pg.waitForTimeout(1500);console.log('mm tx',await pg.evaluate(()=>LTW.cam.tx.toFixed(1)));
// keyboard pan
await pg.keyboard.down('a');await pg.waitForTimeout(600);await pg.keyboard.up('a');console.log('after A tx',await pg.evaluate(()=>LTW.cam.tx.toFixed(1)));
await pg.keyboard.press('7');await pg.waitForTimeout(500);await pg.evaluate(()=>{LTW.cam.goal={tx:LTW.cam.tx,tz:9,dist:24}});
for(let k=0;k<6;k++){await pg.evaluate(()=>LTW.step(1/30));await pg.waitForTimeout(500)}
console.log('lane1 views',await pg.evaluate(()=>{const keys=[];for(const v of creepViewsDbg())keys.push(v);return keys.join(',')}).catch(e=>'n/a'),'plates',await pg.evaluate(()=>[...document.querySelectorAll('#plates div')].filter(d=>d.style.display!=='none').map(d=>d.innerText).join(' / ')));
await pg.screenshot({path:path.join(OUT,'screenshot_opponent_view.png')});
await pg.keyboard.down(' ');await pg.keyboard.up(' ');await pg.waitForTimeout(1500);console.log('space home tx',await pg.evaluate(()=>LTW.cam.tx.toFixed(1)));
console.log('errs',errs,await pg.evaluate(()=>LTW.errorsLog.slice(0,3)));await b.close()})();
