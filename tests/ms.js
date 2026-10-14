const {chromium}=require('playwright-core');const path=require('path'),fs=require('fs');const OUT=path.join(__dirname,'out');fs.mkdirSync(OUT,{recursive:true});const GAME='file://'+path.resolve(__dirname,'..','index.html');const CHROME=process.env.CHROME_PATH||'/usr/bin/google-chrome';const URL=process.argv[2]||GAME;
(async()=>{const b=await chromium.launch({executablePath:CHROME,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const pg=await b.newPage({viewport:{width:1500,height:850}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>m.type()==='error'&&errs.push(m.text()));
pg.on('dialog',d=>{console.log('dialog:',d.message());d.accept()});
await pg.goto(URL);await pg.waitForFunction(()=>window.LTW&&LTW.ready,null,{timeout:180000});await pg.click('#lstart');await pg.waitForTimeout(300);
await pg.evaluate(()=>{const me=LTW.G.players[0];me.gold=100;for(let x=2;x<7;x++)LTW.build(me,0,x,5);LTW.build(me,1,9,1);LTW.cam.goal=null;LTW.cam.tx=5.5;LTW.cam.tz=8;LTW.cam.dist=20;LTW.cam.yaw=0});
await pg.waitForTimeout(800);
const r=await pg.evaluate(()=>{const V=new LTW.camera.position.constructor();const pts=LTW.G.players[0].towers.filter(t=>t.y===5).map(t=>{V.set(t.x+.5,.6,t.y+.5).project(LTW.camera);return[(V.x+1)/2*innerWidth,(1-V.y)/2*innerHeight]});return pts});
const xs=r.map(p=>p[0]),ys=r.map(p=>p[1]);
await pg.keyboard.down('Shift');await pg.mouse.move(Math.min(...xs)-25,Math.min(...ys)-25);await pg.mouse.down();for(let k=1;k<=8;k++)await pg.mouse.move(Math.min(...xs)-25+k*(Math.max(...xs)-Math.min(...xs)+50)/8,Math.min(...ys)-25+k*(Math.max(...ys)-Math.min(...ys)+50)/8);
await pg.mouse.up();await pg.keyboard.up('Shift');await pg.waitForTimeout(300);
console.log('selected',await pg.evaluate(()=>[LTW.G.msel.length,LTW.G.players[0].gold]),await pg.evaluate(()=>document.getElementById('info').innerText.replace(/\n/g,' | ')));
await pg.screenshot({path:path.join(OUT,'ms.png')});
await pg.keyboard.press('u');console.log('after U',await pg.evaluate(()=>[LTW.G.players[0].gold,LTW.G.msel.map(t=>t.lvl).join('')]));
await pg.keyboard.down('u');await pg.waitForTimeout(600);await pg.keyboard.up('u');console.log('held U (repeat ignored)',await pg.evaluate(()=>[LTW.G.players[0].gold,LTW.G.msel.map(t=>t.lvl).join('')]));
await pg.evaluate(()=>{LTW.G.players[0].gold=2000});for(let k=0;k<5;k++)await pg.keyboard.press('u');console.log('max 4',await pg.evaluate(()=>LTW.G.msel.map(t=>t.lvl).join('')));
// shift click toggle the catapult in
const cp=await pg.evaluate(()=>{const V=new LTW.camera.position.constructor();V.set(9.5,.3,1.5).project(LTW.camera);return[(V.x+1)/2*innerWidth,(1-V.y)/2*innerHeight]});
await pg.keyboard.down('Shift');await pg.mouse.click(cp[0],cp[1]);await pg.keyboard.up('Shift');console.log('toggle',await pg.evaluate(()=>LTW.G.msel.length));
await pg.keyboard.press('Control+a');console.log('ctrl+a',await pg.evaluate(()=>[LTW.G.msel.length,LTW.cam.tx.toFixed(1)]));
// build mode shift-click still continuous
await pg.keyboard.press('Escape');await pg.keyboard.press('1');const c2=await pg.evaluate(()=>{const V=new LTW.camera.position.constructor();return [[3.5,8.5],[5.5,8.5]].map(([x,z])=>{V.set(x,0,z).project(LTW.camera);return[(V.x+1)/2*innerWidth,(1-V.y)/2*innerHeight]})});
await pg.keyboard.down('Shift');for(const c of c2)await pg.mouse.click(c[0],c[1]);await pg.keyboard.up('Shift');console.log('build shift-click',await pg.evaluate(()=>[LTW.G.players[0].towers.length,LTW.G.build]));
await pg.keyboard.press('Escape');await pg.keyboard.press('Control+a');await pg.keyboard.press('Delete');console.log('sold all',await pg.evaluate(()=>LTW.G.players[0].towers.length));
console.log('errs',errs);await b.close()})();
