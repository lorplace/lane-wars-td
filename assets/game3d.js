"use strict";
// Lane Siege 3D renderer/controller. Gameplay rules live in logic.js (shared with the 2D version).
const T=THREE,$=id=>document.getElementById(id);
const LG=7;function OX(i){return i*(COLS+LG)}
const TAU=Math.PI*2;
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// ---------------- renderer / scene ----------------
const canvas=$('gl');
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new T.Scene();scene.fog=new T.Fog(0xb9cbe0,50,150);scene.background=new T.Color(0xb9cbe0);
const camera=new T.PerspectiveCamera(45,1,.3,600);
const sky=new T.Mesh(new T.SphereGeometry(450,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,
 vertexShader:'varying vec3 vp;void main(){vp=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'varying vec3 vp;void main(){float h=vp.y;vec3 top=vec3(.22,.42,.75),hor=vec3(.73,.8,.88),gr=vec3(.3,.36,.26);vec3 c=h>0.?mix(hor,top,pow(h,.55)):mix(hor,gr,min(1.,-h*5.));gl_FragColor=vec4(c,1.);}'}));
sky.renderOrder=-10;scene.add(sky);
scene.add(new T.HemisphereLight(0xd8e6ff,0x4a5a2a,1.15));
const sun=new T.DirectionalLight(0xffe8c8,2.6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:120});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;scene.add(sun,sun.target);
// ---------------- textures ----------------
function ctex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
 if(rep){t.wrapS=t.wrapT=T.RepeatWrapping}t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}
function noiseFill(x,w,h,R,base,hue,n){x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<n;i++){x.fillStyle=`hsla(${hue[0]+R()*hue[1]},${35+R()*25}%,${20+R()*25}%,.5)`;x.fillRect(R()*w,R()*h,1+R()*3,1+R()*3)}}
const grassT=ctex(256,256,(x,w,h)=>{const R=rng(3);noiseFill(x,w,h,R,'#557f30',[80,35],5000);x.lineWidth=1;for(let i=0;i<1400;i++){const px=R()*w,py=R()*h;x.strokeStyle=`hsla(${80+R()*30},50%,${30+R()*25}%,.7)`;x.beginPath();x.moveTo(px,py);x.lineTo(px+R()*2-1,py-2-R()*3);x.stroke()}
 for(let i=0;i<60;i++){x.fillStyle=['#f4e46a','#f0f0f0','#d07ad0'][i%3];x.fillRect(R()*w,R()*h,2,2)}},true);grassT.repeat.set(40,22);
const dirtT=ctex(128,128,(x,w,h)=>{const R=rng(5);const g=x.createRadialGradient(64,64,20,64,64,64);noiseFill(x,w,h,R,'#8b6a3e',[25,15],1600);
 for(let i=0;i<40;i++){x.fillStyle='rgba(160,150,130,.9)';x.beginPath();x.ellipse(R()*w,R()*h,1+R()*2,1+R()*1.5,0,0,7);x.fill()}
 // soft alpha edge
 const id=x.getImageData(0,0,w,h);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const dx=Math.abs(xx-63.5)/64,dy=Math.abs(yy-63.5)/64,d=Math.max(dx,dy);id.data[(yy*w+xx)*4+3]=255*Math.min(1,Math.max(0,(1-d)/.22+R()*.3))}x.putImageData(id,0,0)});
const stoneT=ctex(128,128,(x,w,h)=>{const R=rng(9);x.fillStyle='#3e3a34';x.fillRect(0,0,w,h);for(let yy=0;yy<h;yy+=16)for(let xx=-(yy%32?8:0);xx<w;xx+=24){const g=100+R()*50;x.fillStyle=`rgb(${g},${g-4},${g-14})`;x.fillRect(xx+1,yy+1,22,14);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(xx+2,yy+2,18,2)}},true);
const laneT=ctex(COLS*32,ROWS*32,(x,w,h)=>{const R=rng(11);noiseFill(x,w,h,R,'#5b8a34',[80,35],7000);
 for(let i=0;i<10;i++){const cx=R()*w,cy=R()*h,g=x.createRadialGradient(cx,cy,0,cx,cy,90);g.addColorStop(0,'rgba(30,60,10,.25)');g.addColorStop(1,'rgba(30,60,10,0)');x.fillStyle=g;x.fillRect(0,0,w,h)}
 x.strokeStyle='rgba(0,0,0,.09)';for(let i=1;i<COLS;i++){x.beginPath();x.moveTo(i*32,32);x.lineTo(i*32,h-32);x.stroke()}for(let j=1;j<ROWS;j++){x.beginPath();x.moveTo(0,j*32);x.lineTo(w,j*32);x.stroke()}
 for(const yy of[0,h-32])for(let r=0;r<4;r++)for(let xx=-(r%2)*6;xx<w;xx+=12){const g=95+R()*45;x.fillStyle=`rgb(${g},${g-4},${g-12})`;x.fillRect(xx+1,yy+r*8+1,10,6)}});
const glowT=ctex(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64)});
const swirlT=ctex(128,128,(x)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'#ffe0ff');g.addColorStop(.3,'#a040e0');g.addColorStop(1,'#200030');x.fillStyle=g;x.fillRect(0,0,128,128);
 x.strokeStyle='rgba(255,200,255,.5)';x.lineWidth=3;for(let k=0;k<5;k++){x.beginPath();for(let a=0;a<9;a+=.1){const r=a*6;x.lineTo(64+Math.cos(a+k*1.25)*r,64+Math.sin(a+k*1.25)*r)}x.stroke()}});
// ---------------- materials / geometry cache ----------------
const MAT={},GEO={};function mat(k,o,basic){return MAT[k]||(MAT[k]=basic?new T.MeshBasicMaterial(o):new T.MeshStandardMaterial(Object.assign({flatShading:true,roughness:.85,metalness:0},o)))}
function geo(k,f){return GEO[k]||(GEO[k]=f())}
function mesh(g,m,x,y,z,sh){const o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);if(sh!==false){o.castShadow=true}return o}
const ADD={transparent:true,blending:T.AdditiveBlending,depthWrite:false};
// ---------------- models ----------------
const MD={};
function loadModels(){const loader=new GLTFLoader();return Promise.all(Object.entries(window.MODELS).map(([k,b64])=>new Promise((res,rej)=>{
 const s=atob(b64),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);loader.parse(u.buffer,'',g=>{MD[k]=g;res()},e=>rej(e))})))}
function cloneModel(k){const o=MD[k].scene.clone(true);o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});return o}
// ---------------- terrain ----------------
function laneDist(x,z){let b=1e9;for(let i=0;i<4;i++){const x0=OX(i)-1.2,x1=OX(i)+COLS+1.2,z0=-3,z1=ROWS+6;b=Math.min(b,Math.hypot(Math.max(x0-x,0,x-x1),Math.max(z0-z,0,z-z1)))}return b}
function hgt(x,z){const d=laneDist(x,z);if(d<=0)return -.02;const n=Math.sin(x*.35)*Math.cos(z*.3)+Math.sin(x*.13+z*.21)*1.3+Math.sin(x*.71-z*.53)*.35;return Math.min(1,d/2.5)*Math.max(.15,.7+d*.28+n*.7)}
const WX0=-40,WX1=OX(3)+COLS+40,WZ0=-45,WZ1=ROWS+45;
function buildTerrain(){const w=WX1-WX0,h=WZ1-WZ0,g=new T.PlaneGeometry(w,h,Math.round(w*1.2),Math.round(h*1.2));g.rotateX(-Math.PI/2);g.translate(WX0+w/2,0,WZ0+h/2);
 const p=g.attributes.position,col=new Float32Array(p.count*3),R=rng(17);for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=hgt(x,z);p.setY(i,y);
  const rock=Math.min(1,Math.max(0,(y-2.2)/1.5)),v=.85+R()*.2;col[i*3]=(.85+rock*.25)*v;col[i*3+1]=(1-rock*.25)*v;col[i*3+2]=(.75+rock*.2)*v}
 g.setAttribute('color',new T.BufferAttribute(col,3));g.computeVertexNormals();const m=new T.Mesh(g,new T.MeshLambertMaterial({map:grassT,vertexColors:true}));m.receiveShadow=true;scene.add(m);
 // lanes
 const lg=new T.PlaneGeometry(COLS,ROWS);lg.rotateX(-Math.PI/2);const lm=new T.MeshLambertMaterial({map:laneT});
 const walls=[],posts=[];for(let i=0;i<4;i++){const l=new T.Mesh(lg,lm);l.position.set(OX(i)+COLS/2,.005,ROWS/2);l.receiveShadow=true;scene.add(l);
  for(let z=-1;z<ROWS+1;z++){walls.push([OX(i)-.3,z+.5,0]);walls.push([OX(i)+COLS+.3,z+.5,0]);if(z%4===0){posts.push([OX(i)-.3,z+.5]);posts.push([OX(i)+COLS+.3,z+.5])}}
  for(let x=0;x<COLS;x++)if(Math.abs(x+.5-5.5)>1.6)walls.push([OX(i)+x+.5,-1.3,1])}
 const wm=new T.InstancedMesh(new T.BoxGeometry(.55,.55,1.02),new T.MeshLambertMaterial({map:stoneT}),walls.length),M4=new T.Matrix4();
 walls.forEach(([x,z,r],k)=>{M4.makeRotationY(r?Math.PI/2:0);M4.setPosition(x,.22,z);wm.setMatrixAt(k,M4)});wm.receiveShadow=true;wm.castShadow=true;scene.add(wm);
 const pm=new T.InstancedMesh(new T.CylinderGeometry(.32,.38,.95,8),new T.MeshLambertMaterial({map:stoneT}),posts.length);posts.forEach(([x,z],k)=>{M4.makeTranslation(x,.45,z);pm.setMatrixAt(k,M4)});pm.castShadow=true;scene.add(pm);
 // decorations (instanced KayKit nature models)
 const R2=rng(23),trees={tree_single_A:[],tree_single_B:[],trees_A_medium:[],rock_single_A:[],rock_single_C:[]};const keys=Object.keys(trees);
 for(let n=0;n<5000;n++){const x=WX0+10+R2()*(WX1-WX0-20),z=WZ0+10+R2()*(WZ1-WZ0-20),d=laneDist(x,z);if(d<.7)continue;const y=hgt(x,z);let k;const r=R2();
  if(r<.45)k=r<.25?'tree_single_A':'tree_single_B';else if(r<.6)k='trees_A_medium';else if(r<.68)k=r<.64?'rock_single_A':'rock_single_C';else continue;
  if(trees[k].length>({mountain_A_grass_trees:40,hills_A_trees:60,trees_A_medium:220,tree_single_A:350,tree_single_B:350,rock_single_A:160,rock_single_C:160})[k])continue;
  const s=k.startsWith('mountain')?4+R2()*3:k.startsWith('hills')?2.4+R2()*1.4:k.startsWith('rock')?(d>4&&R2()<.4?6+R2()*6:2.5+R2()*3):1.8+R2()*1.2;
  trees[k].push(new T.Matrix4().compose(new T.Vector3(x,y-.05,z),new T.Quaternion().setFromEuler(new T.Euler(0,R2()*TAU,0)),new T.Vector3(s,s*(.85+R2()*.3),s)))}
 for(const k of keys)instanceModel(k,trees[k],!k.startsWith('mountain'));
 // spawn portals + end castles
 for(let i=0;i<4;i++){const cx=OX(i)+5.5;const g=new T.Group();g.position.set(cx,0,-1.2);
  const ring=mesh(geo('portal',()=>new T.TorusGeometry(1.35,.22,8,24)),mat('portalStone',{color:0x6a6070,map:stoneT}));ring.position.y=1.45;g.add(ring);
  for(const s of[-1,1]){const p=mesh(geo('ppost',()=>new T.CylinderGeometry(.3,.4,3,8)),mat('pstone',{color:0x8a8478,map:stoneT}),s*1.6,1.5,0);g.add(p);
   const c=mesh(geo('pcrys',()=>new T.OctahedronGeometry(.25)),mat('pcrysm',{color:0xd080ff,emissive:0xa040ff,emissiveIntensity:1.5}),s*1.6,3.25,0,false);g.add(c)}
  const disc=new T.Mesh(geo('pdisc',()=>new T.CircleGeometry(1.2,32)),new T.MeshBasicMaterial({map:swirlT,...ADD,side:T.DoubleSide,opacity:.9}));disc.position.y=1.45;g.add(disc);PORTALS.push(disc);
  scene.add(g);
}
 // hover tile, rings
 HOVER=new T.Mesh(new T.PlaneGeometry(.96,.96).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0x40ff40,transparent:true,opacity:.35,depthWrite:false}));HOVER.position.y=.03;HOVER.visible=false;HOVER.renderOrder=5;HOVER.material.polygonOffset=true;HOVER.material.polygonOffsetFactor=-4;HOVER.material.polygonOffsetUnits=-4;scene.add(HOVER);
 HOVERL=new T.LineLoop(new T.BufferGeometry().setFromPoints([[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([a,b])=>new T.Vector3(a,0,b))),new T.LineBasicMaterial({color:0xffffff,depthTest:false,transparent:true}));HOVERL.renderOrder=20;HOVER.add(HOVERL);HOVERL.position.y=.02;
 RANGE=new T.Group();const rr=new T.Mesh(new T.RingGeometry(.97,1,96).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0xffe080,transparent:true,opacity:.85,depthWrite:false}));
 const rf=new T.Mesh(new T.CircleGeometry(1,64).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0xffe080,transparent:true,opacity:.1,depthWrite:false}));RANGE.add(rr,rf);RANGE.position.y=.04;RANGE.visible=false;rr.renderOrder=rf.renderOrder=4;RANGE.rr=rr;RANGE.rf=rf;scene.add(RANGE);
 SELR=new T.Mesh(new T.TorusGeometry(.62,.04,6,32).rotateX(Math.PI/2),new T.MeshBasicMaterial({color:0xffe27a}));SELR.visible=false;scene.add(SELR);
 for(let i=0;i<4;i++){const d=new T.Mesh(lg,new T.MeshBasicMaterial({color:0x200000,transparent:true,opacity:.5,depthWrite:false}));d.position.set(OX(i)+COLS/2,.06,ROWS/2);d.visible=false;scene.add(d);DEAD.push(d)}
 // path tiles (instanced dirt)
 for(let i=0;i<4;i++){const im=new T.InstancedMesh(geo('ptile',()=>new T.PlaneGeometry(1.25,1.25).rotateX(-Math.PI/2)),new T.MeshLambertMaterial({map:dirtT,alphaTest:.45,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),COLS*ROWS);
  im.count=0;im.receiveShadow=true;im.position.y=.006;im.renderOrder=-1;scene.add(im);PATHS.push({im,ref:null})}}
const PORTALS=[],DEAD=[],PATHS=[];let HOVER,HOVERL,RANGE,SELR;
function instanceModel(k,mats,cast){if(!mats.length)return;const src=MD[k].scene;src.updateMatrixWorld(true);const tmp=new T.Matrix4();
 src.traverse(m=>{if(!m.isMesh)return;const im=new T.InstancedMesh(m.geometry,m.material,mats.length);mats.forEach((M,i)=>im.setMatrixAt(i,tmp.multiplyMatrices(M,m.matrixWorld)));
  im.castShadow=cast;im.receiveShadow=true;scene.add(im)})}
function updatePaths(){const M4=new T.Matrix4(),q=new T.Quaternion(),s=new T.Vector3(),v=new T.Vector3();G.players.forEach((p,i)=>{const P=PATHS[i];if(P.ref===p.path)return;P.ref=p.path;
 p.path.forEach(([x,y],k)=>{q.setFromAxisAngle(new T.Vector3(0,1,0),((x*7+y*13)%4)*Math.PI/2);s.set(1,1,1);v.set(OX(i)+x+.5,(k%3)*.001,y+.5);M4.compose(v,q,s);P.im.setMatrixAt(k,M4)});
 P.im.count=p.path.length;P.im.instanceMatrix.needsUpdate=true})}
// ---------------- towers ----------------
const TOPH=[2.19,1.5,1.5,1.5,2.49];
function makeTower(ti,lvl,race){race=race||'human';if(race!=='human')return raceTower(race,ti,lvl);return makeHumanTower(ti,lvl)}
function makeHumanTower(ti,lvl){const g=new T.Group(),hy=1+.12*(lvl-1),S=.9;let base,aim=null,arm=null,ex={};
 base=cloneModel(['tower_A','tower_catapult','tower_base','tower_base','tower_B'][ti]);base.scale.set(S,S*hy,S);g.add(base);const top=TOPH[ti]*S*hy;
 const wood=mat('wood',{color:0x7a4a22}),gold=mat('gold',{color:0xe8b830,metalness:.6,roughness:.35,emissive:0x3a2800});
 if(ti===0){aim=new T.Group();aim.position.y=top-.05;const body=mesh(geo('arB',()=>new T.CylinderGeometry(.09,.13,.34,6)),mat('cloak',{color:0x2f6a2a}),0,.17,0);
  const head=mesh(geo('arH',()=>new T.SphereGeometry(.085,8,6)),mat('skin',{color:0xe0b088}),0,.42,0);const hood=mesh(geo('arHo',()=>new T.ConeGeometry(.1,.16,6)),mat('cloak'),0,.5,-.01);
  const bow=mesh(geo('bow',()=>new T.TorusGeometry(.2,.018,4,10,Math.PI)),wood,0,.28,.14);bow.rotation.set(0,Math.PI/2,Math.PI/2);aim.add(body,head,hood,bow);g.add(aim)}
 else if(ti===1){aim=base.getObjectByName('catapult_turret_blue');arm=base.getObjectByName('catapult_arm_blue')}
 else if(ti===2){const c=mesh(geo('crys',()=>new T.OctahedronGeometry(.3,0)),mat('ice',{color:0x9ae8ff,emissive:0x2aa0ff,emissiveIntensity:.9,transparent:true,opacity:.92,roughness:.2}),0,top+.55,0);
  c.scale.set(.8+.12*lvl,1.7+.25*lvl,.8+.12*lvl);g.add(c);ex.crystal=c;const glow=new T.Sprite(new T.SpriteMaterial({map:glowT,color:0x60c8ff,...ADD,opacity:.6}));glow.scale.setScalar(1.6+.2*lvl);glow.position.y=top+.55;g.add(glow);ex.glow=glow;
  if(lvl>=3){const orb=new T.Group();orb.position.y=top+.5;for(let k=0;k<lvl;k++){const s=mesh(geo('shard',()=>new T.TetrahedronGeometry(.11)),mat('ice'),Math.cos(k/lvl*TAU)*.55,0,Math.sin(k/lvl*TAU)*.55,false);orb.add(s)}g.add(orb);ex.orbit=orb}}
 else if(ti===3){aim=new T.Group();aim.position.y=top+.12;aim.add(mesh(geo('stock',()=>new T.BoxGeometry(.13,.12,1)),wood,0,0,0));
  const bw=mesh(geo('bbow',()=>new T.TorusGeometry(.45,.035,4,12,Math.PI*.85)),mat('dwood',{color:0x4a2a12}),0,0,.3);bw.rotation.set(-Math.PI/2,0,Math.PI*.075);aim.add(bw);
  const bolt=mesh(geo('bolt',()=>new T.CylinderGeometry(.025,.025,.95,5).rotateX(Math.PI/2)),mat('steel',{color:0xc8c8d0,metalness:.7,roughness:.3}),0,.09,.08);aim.add(bolt);ex.bolt=bolt;
  aim.add(mesh(geo('bstand',()=>new T.CylinderGeometry(.08,.12,.25,6)),wood,0,-.12,0));g.add(aim)}
 else if(ti===4){const bowl=mesh(geo('bowl',()=>new T.CylinderGeometry(.36,.22,.2,8)),mat('iron',{color:0x3a3a40,metalness:.6,roughness:.5}),0,top+.08,0);g.add(bowl);
  const fl=new T.Group();fl.position.y=top+.15;for(let k=0;k<3;k++){const f=new T.Mesh(geo('flame'+k,()=>new T.ConeGeometry(.28-k*.07,.7+k*.15,7,1,true)),new T.MeshBasicMaterial({color:[0xff4010,0xff9020,0xffe070][k],...ADD,opacity:.85}));f.position.y=.3+k*.05;fl.add(f)}g.add(fl);ex.flames=fl;
  const gl=new T.Sprite(new T.SpriteMaterial({map:glowT,color:0xff8030,...ADD,opacity:.7}));gl.scale.setScalar(1.8);gl.position.y=top+.5;g.add(gl);ex.glow=gl}
 if(lvl>=2){const r=mesh(geo('gring',()=>new T.TorusGeometry(.6,.05,6,20).rotateX(Math.PI/2)),gold,0,.08,0,false);g.add(r)}
 if(lvl>=3){for(const s of[-1,1]){const pole=mesh(geo('pole',()=>new T.CylinderGeometry(.02,.02,1.1,4)),wood,s*.5,top*.55+.5,.35);g.add(pole);
  const fl=mesh(geo('ban',()=>new T.BoxGeometry(.02,.4,.28)),mat('banner',{color:0xb02020,side:T.DoubleSide}),s*.5,top*.55+.82,.5);g.add(fl)}}
 if(lvl>=4){const rune=new T.Mesh(geo('rune',()=>new T.RingGeometry(.75,.95,6,1).rotateX(-Math.PI/2)),new T.MeshBasicMaterial({color:0xffd050,...ADD,opacity:.8}));rune.position.y=.05;g.add(rune);ex.rune=rune;
  const st=mesh(geo('star',()=>new T.OctahedronGeometry(.13)),mat('gemg',{color:0xffe070,emissive:0xffb000,emissiveIntensity:1}),0,top+(ti===2?1.6:ti===4?1.4:1.0),0,false);g.add(st);ex.star=st}
 if(lvl>=5){const au=new T.Sprite(new T.SpriteMaterial({map:glowT,color:lvl>=6?0xc060ff:0x8080ff,...ADD,opacity:.55}));au.scale.set(2.2,top*1.6+1,1);au.position.y=top*.6;g.add(au);ex.aura=au;
  const r2=new T.Mesh(geo('rune2',()=>new T.RingGeometry(1.0,1.12,24).rotateX(-Math.PI/2)),new T.MeshBasicMaterial({color:lvl>=6?0xd070ff:0x8090ff,...ADD,opacity:.8}));r2.position.y=.06;g.add(r2);ex.rune2=r2}
 for(let k=0;k<lvl;k++)g.add(mesh(geo('pip',()=>new T.OctahedronGeometry(.06)),gold,(k-(lvl-1)/2)*.16,.18,.58,false));
 return {g,aim,arm,ex,ti,lvl,top}}
const towerViews=[new Map(),new Map(),new Map(),new Map()];
function syncTowers(i,p,now,dt){const vm=towerViews[i],seen=new Set();for(const t of p.towers){seen.add(t);let v=vm.get(t);
  if(!v||v.lvl!==t.lvl){const old=v;if(v)scene.remove(v.g);v=makeTower(t.ti,t.lvl,p.race);if(old){v.vb=1;v.pulse=1;v.ang=old.ang}v.g.position.set(OX(i)+t.x+.5,0,t.y+.5);v.ang=t.ang;scene.add(v.g);vm.set(t,v)}
  if(v.vb==null)v.vb=(t.bt!=null&&t.bt<1)?0:1;v.vb=Math.min(1,v.vb+dt*2.5);const b=v.vb;if(v.pulse>0)v.pulse=Math.max(0,v.pulse-dt*3);const pu=1+.12*Math.sin((v.pulse||0)*Math.PI);v.g.scale.set(pu,(b<1?.15+.85*(1-Math.pow(1-b,3))*(1+.15*Math.sin(b*Math.PI)):1)*pu,pu);
  const target=Math.PI/2-t.ang;let d=target-v.ang;d=Math.atan2(Math.sin(d),Math.cos(d));v.ang+=d*Math.min(1,dt*10);
  if(v.aim)v.aim.rotation.y=v.ang+(v.ti===1?Math.PI:0);
  if(v.arm)v.arm.rotation.x=t.fl>0?-1.1*(t.fl/.18):0;
  if(v.ex.bolt)v.ex.bolt.visible=t.cd<.5;
  if(v.ex.crystal){v.ex.crystal.position.y=(v.ex.cy!=null?v.ex.cy:v.top+.55)+Math.sin(now*2+t.x)*.08;v.ex.crystal.rotation.y=now*.8;v.ex.glow.material.opacity=.45+.2*Math.sin(now*3+t.y)+(t.fl>0?.4:0)}
  if(v.ex.orbit)v.ex.orbit.rotation.y=now*1.5;raceTowerAnim(v,t,i,now,dt);
  if(v.ex.flames){v.ex.flames.children.forEach((f,k)=>{const s=1+.18*Math.sin(now*13+k*2+t.x)+(t.fl>0?.4:0);f.scale.set(1,s,1);f.rotation.y=now*(k+1)});if(i===0||laneNear(i))if(Math.random()<dt*8)emit(OX(i)+t.x+.5+(Math.random()-.5)*.3,v.top+.7,t.y+.5,0,1.2,0,.6,.35,1,.5,.1,-.5)}
  if(v.ex.rune)v.ex.rune.rotation.y=now*.6;if(v.ex.rune2)v.ex.rune2.rotation.y=-now*.9;if(v.ex.aura)v.ex.aura.material.opacity=.4+.15*Math.sin(now*3+t.x);if(v.ex.star){v.ex.star.rotation.y=now*2}}
 for(const[t,v]of vm)if(!seen.has(t)){scene.remove(v.g);vm.delete(t)}}
// ---------------- creeps ----------------
const SKIN={wolf:mat('wolf',{color:0x80766a}),wolfd:mat('wolfd',{color:0x4a423a}),wyv:mat('wyv',{color:0x3a6fb0}),wyvw:mat('wyvw',{color:0x6a9ad8,side:T.DoubleSide}),
 ogre:mat('ogre',{color:0xa04028}),ogreb:mat('ogreb',{color:0xc8684a}),cloth:mat('cloth',{color:0x5a3a1a}),horn:mat('horn',{color:0xe8dcc0}),eye:mat('eye',{color:0xffee40,emissive:0xffcc00,emissiveIntensity:2}),bone:mat('bone',{color:0xe8e2d0})};
function pivotLimb(geoK,gf,m,x,y,z,len){const p=new T.Group();p.position.set(x,y,z);const l=mesh(geo(geoK,gf),m,0,-len/2,0);p.add(l);return p}
function makeWolf(){const g=new T.Group(),b=new T.Group();g.add(b);const body=mesh(geo('wb',()=>new T.SphereGeometry(.5,9,7)),SKIN.wolf,0,.5,0);body.scale.set(.42,.4,.8);b.add(body);
 const mane=mesh(geo('wm',()=>new T.SphereGeometry(.3,8,6)),SKIN.wolfd,0,.6,.22);mane.scale.set(1,1,1.2);b.add(mane);
 const head=new T.Group();head.position.set(0,.66,.5);b.add(head);const hd=mesh(geo('wh',()=>new T.SphereGeometry(.2,8,6)),SKIN.wolf);hd.scale.set(1,.95,1.2);head.add(hd);
 head.add(mesh(geo('wsn',()=>new T.BoxGeometry(.14,.12,.25)),SKIN.wolfd,0,-.04,.22));for(const s of[-1,1]){const e=mesh(geo('wear',()=>new T.ConeGeometry(.06,.16,4)),SKIN.wolfd,s*.1,.18,-.03);head.add(e);head.add(mesh(geo('weye',()=>new T.SphereGeometry(.03,4,3)),SKIN.eye,s*.08,.05,.17,false))}
 const legs=[[-.15,.22],[.15,.22],[-.15,-.25],[.15,-.25]].map(([x,z])=>{const l=pivotLimb('wleg',()=>new T.CylinderGeometry(.055,.04,.42,5),SKIN.wolfd,x,.42,z,.42);b.add(l);return l});
 const tail=pivotLimb('wtail',()=>new T.CylinderGeometry(.06,.02,.45,5),SKIN.wolf,0,.6,-.5,.45);tail.rotation.x=-2.2;b.add(tail);
 return {o:g,kind:'wolf',anim(ph,dt){legs.forEach((l,k)=>l.rotation.x=Math.sin(ph*1.6+(k===0||k===3?0:Math.PI))*.8);b.position.y=Math.abs(Math.sin(ph*1.6))*.06;tail.rotation.z=Math.sin(ph*2)*.4;head.rotation.x=Math.sin(ph*1.6)*.08}}}
function makeWyvern(){const g=new T.Group(),b=new T.Group();g.add(b);const body=mesh(geo('yb',()=>new T.SphereGeometry(.5,9,7)),SKIN.wyv);body.scale.set(.55,.5,1.3);b.add(body);
 const neck=mesh(geo('yn',()=>new T.CylinderGeometry(.11,.18,.5,6).rotateX(Math.PI/2.6)),SKIN.wyv,0,.15,.75);b.add(neck);const head=mesh(geo('yh',()=>new T.SphereGeometry(.19,8,6)),SKIN.wyv,0,.3,1.02);head.scale.set(1,.85,1.4);b.add(head);
 for(const s of[-1,1]){b.add(mesh(geo('yhorn',()=>new T.ConeGeometry(.04,.22,4).rotateX(-1.2)),SKIN.horn,s*.09,.42,.92));b.add(mesh(geo('weye'),SKIN.eye,s*.1,.34,1.16,false))}
 const tail=mesh(geo('yt',()=>new T.ConeGeometry(.16,1.1,6).rotateX(-Math.PI/2)),SKIN.wyv,0,0,-1.1);b.add(tail);
 const wshape=new T.Shape();wshape.moveTo(0,0);wshape.lineTo(1.5,.35);wshape.lineTo(1.35,-.15);wshape.lineTo(1.0,-.45);wshape.lineTo(.55,-.35);wshape.lineTo(.2,-.5);wshape.lineTo(0,-.3);
 const wg=geo('wing',()=>new T.ShapeGeometry(wshape).rotateX(-Math.PI/2));const wings=[-1,1].map(s=>{const p=new T.Group();p.position.set(s*.2,.15,.15);const w=mesh(wg,SKIN.wyvw);w.scale.x=s;p.add(w);b.add(p);return [p,s]});
 g.scale.setScalar(.75);return {o:g,kind:'wyv',anim(ph){const f=Math.sin(ph*1.8);wings.forEach(([p,s])=>p.rotation.z=s*f*.75);b.position.y=-f*.06;tail.rotation.y=Math.sin(ph)*.25}}}
function makeOgre(){const g=new T.Group(),b=new T.Group();g.add(b);const body=mesh(geo('ob',()=>new T.SphereGeometry(.5,10,8)),SKIN.ogre,0,1.1,0);body.scale.set(1.3,1.45,1.05);b.add(body);
 const belly=mesh(geo('obl',()=>new T.SphereGeometry(.42,8,6)),SKIN.ogreb,0,1.0,.2);belly.scale.set(1.1,1,.8);b.add(belly);b.add(mesh(geo('olo',()=>new T.CylinderGeometry(.55,.62,.35,8)),SKIN.cloth,0,.62,0));
 const head=mesh(geo('oh',()=>new T.SphereGeometry(.3,8,7)),SKIN.ogre,0,1.85,.15);b.add(head);for(const s of[-1,1]){const h=mesh(geo('ohorn',()=>new T.ConeGeometry(.08,.42,5)),SKIN.horn,s*.25,2.1,.1);h.rotation.z=-s*.7;b.add(h);b.add(mesh(geo('oeye',()=>new T.SphereGeometry(.05,4,3)),SKIN.eye,s*.11,1.9,.42,false))}
 b.add(mesh(geo('otusk',()=>new T.ConeGeometry(.035,.14,4)),SKIN.horn,.1,1.72,.42));b.add(mesh(geo('otusk'),SKIN.horn,-.1,1.72,.42));
 const arms=[-1,1].map(s=>{const a=pivotLimb('oarm',()=>new T.CylinderGeometry(.16,.12,.85,6),SKIN.ogre,s*.7,1.5,0,.85);b.add(a);return a});
 const club=mesh(geo('oclub',()=>new T.CylinderGeometry(.18,.08,1.1,6)),SKIN.cloth,0,-1.1,.25);club.rotation.x=1.3;arms[1].add(club);
 const legs=[-1,1].map(s=>{const l=pivotLimb('oleg',()=>new T.CylinderGeometry(.2,.16,.65,6),SKIN.ogreb,s*.3,.62,0,.62);b.add(l);return l});
 const aura=new T.Mesh(geo('aura',()=>new T.RingGeometry(.5,1.1,24).rotateX(-Math.PI/2)),new T.MeshBasicMaterial({color:0xff3010,...ADD,opacity:.5}));aura.position.y=.04;g.add(aura);
 g.scale.setScalar(.62);return {o:g,kind:'ogre',anim(ph,dt,now){legs[0].rotation.x=Math.sin(ph)*.5;legs[1].rotation.x=-Math.sin(ph)*.5;arms[0].rotation.x=-Math.sin(ph)*.4;arms[1].rotation.x=Math.sin(ph)*.4-.3;
  b.position.y=Math.abs(Math.sin(ph))*.06;aura.material.opacity=.35+.2*Math.sin(now*5);aura.scale.setScalar(1+.1*Math.sin(now*5))}}}
function makeSkel(k){const src=MD[k];const o=SkeletonUtils.clone(src.scene);o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.frustumCulled=false}});
 const wrap=new T.Group();wrap.add(o);o.scale.setScalar(k==='warrior'?.56:.48);const mixer=new T.AnimationMixer(o),clip=n=>src.animations.find(a=>a.name===n);
 const walk=mixer.clipAction(clip(k==='warrior'?'Walking_A':'Walking_D_Skeletons')||clip('Walking_A'));walk.play();const die=mixer.clipAction(clip('Death_A'));die.setLoop(T.LoopOnce,1);die.clampWhenFinished=true;
 return {o:wrap,kind:k,mixer,walk,die,anim(ph,dt,now,sp){walk.timeScale=sp*.75;mixer.update(dt)}}}
function makeProxy(k){const g=new T.Group();g.add(mesh(geo('pxb',()=>new T.CylinderGeometry(.16,.2,.6,6)),k==='warrior'?mat('steelp',{color:0x8a8a96}):SKIN.bone,0,.35,0));
 g.add(mesh(geo('pxh',()=>new T.SphereGeometry(.15,6,5)),SKIN.bone,0,.78,0));return {o:g,kind:'px'+k,anim(ph){g.children[0].rotation.z=Math.sin(ph)*.1}}}
const CREEPKIND={normal:'minion',armored:'warrior',fast:'wolf',flying:'wyv',boss:'ogre'};
const POOL={};const creepViews=[new Map(),new Map(),new Map(),new Map()],dying=[];
function laneNear(i){return Math.abs(OX(i)+COLS/2-cam.tx)<COLS/2+LG+cam.dist*.45&&cam.dist<80}
function getView(c,near){let k=CREEPKIND[c.type];if((k==='minion'||k==='warrior')&&!near)k='px'+k;const pool=POOL[k]||(POOL[k]=[]);let v=pool.pop();
 if(!v){v=k==='wolf'?makeWolf():k==='wyv'?makeWyvern():k==='ogre'?makeOgre():k.startsWith('px')?makeProxy(k.slice(2)):makeSkel(k);v.key=k;
  v.slow=new T.Mesh(geo('slowr',()=>new T.RingGeometry(.3,.55,20).rotateX(-Math.PI/2)),new T.MeshBasicMaterial({color:0x80e0ff,...ADD,opacity:.8}));v.slow.position.y=.05;v.o.add(v.slow);
  v.mark=new T.Mesh(geo('markr',()=>new T.RingGeometry(.42,.5,20).rotateX(-Math.PI/2)),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false}));v.mark.position.y=.04;v.o.add(v.mark)}
 v.o.rotation.set(0,0,0);v.o.position.set(0,0,0);v.dieT=0;if(v.die){v.die.stop();v.walk.play()}v.o.visible=true;scene.add(v.o);return v}
function releaseView(v){scene.remove(v.o);POOL[v.key].push(v)}
const HB=[];
function syncCreeps(i,p,now,dt){const vm=creepViews[i],near=laneNear(i)||i===0,seen=new Set();
 for(const c of p.creeps){seen.add(c.id);let v=vm.get(c.id);if(v&&near&&v.key.startsWith('px')){releaseView(v);v=null}if(!v){v=getView(c,near);v.c=c;vm.set(c.id,v)}
  const fly=c.fly,h=fly?1.6+Math.sin(now*3+c.id)*.15:0;v.o.position.set(OX(i)+c.x,h,c.y);v.o.rotation.y=fly?0:Math.PI/2-c.dir;
  const sp=c.spd*(c.slowT>0?.5:1);if(near)v.anim(c.ph,dt*(G.paused?0:G.speed),now,sp);v.slow.visible=c.slowT>0;v.slow.position.y=fly?-h+.05:.05;v.mark.visible=c.from>=0;if(c.from>=0)v.mark.material.color.set(COLORS[c.from]);
  creepStatus(v,c,i,h,near,dt);if(c.slowT>0&&near&&Math.random()<dt*6)emit(OX(i)+c.x,h+.6,c.y,0,.5,0,.7,.25,.6,.9,1,0);
  HB.push(OX(i)+c.x,h+(c.big?1.65:fly?.75:1.25),c.y,Math.max(0,c.hp/c.maxhp),c.big?1.1:.7,0);if(c.stunT>0&&near&&Math.random()<dt*12)emit(OX(i)+c.x+(Math.random()-.5)*.4,h+1.45,c.y+(Math.random()-.5)*.4,0,.3,0,.5,.22,1,.9,.2,0)}
 for(const[id,v]of vm)if(!seen.has(id)){vm.delete(id);const c=v.c;if(c.hp<=0&&near){v.dieT=.001;dying.push(v)}else releaseView(v)}}
function updateDying(dt){for(let k=dying.length-1;k>=0;k--){const v=dying[k];if(v.dieT===.001&&v.die){v.walk.stop();v.die.reset().play()}v.dieT+=dt;
 if(v.die)v.mixer.update(dt);else{v.o.rotation.z=Math.min(1.5,v.dieT*4);if(v.c.fly)v.o.position.y=Math.max(0,v.o.position.y-dt*4)}
 v.slow.visible=false;if(v.dieT>1.1)v.o.position.y-=dt*1.2;if(v.dieT>1.8){dying.splice(k,1);releaseView(v)}}}
// health bars (instanced billboards)
const HBMAX=900,hbBg=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0x100804,transparent:true,opacity:.85,depthWrite:false}),HBMAX),
 hbFg=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xffffff,depthWrite:false,transparent:true}),HBMAX);
hbBg.frustumCulled=hbFg.frustumCulled=false;hbFg.renderOrder=2;hbBg.renderOrder=1;hbFg.instanceColor=new T.InstancedBufferAttribute(new Float32Array(HBMAX*3),3);scene.add(hbBg,hbFg);
function updateHB(){const n=Math.min(HBMAX,HB.length/6),M4=new T.Matrix4(),v=new T.Vector3(),s=new T.Vector3(),right=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0),fwd=new T.Vector3();camera.getWorldDirection(fwd);
 const col=new T.Color();for(let k=0;k<n;k++){const x=HB[k*6],y=HB[k*6+1],z=HB[k*6+2],f=HB[k*6+3],w=HB[k*6+4],cc=HB[k*6+5];v.set(x,y,z);s.set(w+.06,.13,1);M4.compose(v,camera.quaternion,s);hbBg.setMatrixAt(k,M4);
  v.addScaledVector(right,-(1-f)*w/2).addScaledVector(fwd,-.01);s.set(Math.max(.001,w*f),.08,1);M4.compose(v,camera.quaternion,s);hbFg.setMatrixAt(k,M4);
  col.set(cc===1?0x3a8cff:f>.6?0x3ad04a:f>.3?0xe8c030:0xe04020);hbFg.setColorAt(k,col)}
 hbBg.count=hbFg.count=n;hbBg.instanceMatrix.needsUpdate=hbFg.instanceMatrix.needsUpdate=true;hbFg.instanceColor.needsUpdate=true;HB.length=0}
// ---------------- projectiles ----------------
const projViews=[new Map(),new Map(),new Map(),new Map()],PPOOL={};
const ORBC={frost:[0xe0ffff,0x50b8ff,.8],flak:[0xfff0a0,0xff7020,1],coil:[0xd0ffb0,0x40ff40,1.4],sleep:[0xf0d0ff,0xa040ff,1.2],spirit:[0xf0d0ff,0x9050ff,.9],poison:[0xd0ffa0,0x60c020,.9],wyrm:[0xe0ffff,0x60c0ff,1.1]};
function makeProj(k){let o;if(k==='spear'||k==='bone'){o=makeProj('arrow');o.scale.setScalar(k==='spear'?1.7:1.5);if(k==='bone')o.traverse(m=>{if(m.isMesh)m.material=SKIN.bone});o.userData.k=k;return o}
 else if(k==='rock'){o=tintObj(cloneModel('projectile_catapult'),0xb09070);o.scale.setScalar(1.8)}
 else if(k==='meat'){o=new T.Group();o.add(mesh(geo('pmeat',()=>new T.IcosahedronGeometry(.16,0)),mat('meat',{color:0x8a2a2a}),0,0,0,false))}
 else if(k==='bolt'){o=new T.Group();const hm=new T.Group();hm.add(mesh(geo('hmh',()=>new T.BoxGeometry(.28,.2,.2)),mat('steel'),0,0,0,false),mesh(geo('hmhd',()=>new T.CylinderGeometry(.03,.03,.35,5)),mat('wood'),0,-.2,0,false));o.add(hm);o.userData.spin=hm;
  const sp=new T.Sprite(new T.SpriteMaterial({map:glowT,color:0x80b0ff,...ADD}));sp.scale.setScalar(1.1);o.add(sp)}
 else if(k==='arrow'){o=new T.Group();const s=mesh(geo('ash',()=>new T.CylinderGeometry(.015,.015,.5,4).rotateX(Math.PI/2)),mat('wood'),0,0,0,false);o.add(s,mesh(geo('ahd',()=>new T.ConeGeometry(.035,.1,4).rotateX(Math.PI/2)),mat('steel'),0,0,.28,false))}
 else if(k==='cannon'){o=cloneModel('projectile_catapult');o.scale.setScalar(1.4)}
 else if(k==='sniper'){o=new T.Group();o.add(mesh(geo('bolt'),mat('steel'),0,0,0,false));const tr=new T.Mesh(geo('trail',()=>new T.CylinderGeometry(.03,.0,1.6,5).rotateX(-Math.PI/2).translate(0,0,-.9)),new T.MeshBasicMaterial({color:0xfff0c0,...ADD,opacity:.7}));o.add(tr)}
 else{o=new T.Group();const C=ORBC[k]||ORBC.frost;o.add(mesh(geo('pcore',()=>new T.SphereGeometry(.11,8,6)),new T.MeshBasicMaterial({color:C[0]}),0,0,0,false));
  const sp=new T.Sprite(new T.SpriteMaterial({map:glowT,color:C[1],...ADD}));sp.scale.setScalar(C[2]);o.add(sp)}
 o.userData.k=k;return o}
function syncProj(i,p,dt,near){const vm=projViews[i],seen=new Set();for(const pr of p.proj){seen.add(pr);let o=vm.get(pr);
  if(!o){o=(PPOOL[pr.k]||(PPOOL[pr.k]=[])).pop()||makeProj(pr.k);vm.set(pr,o);scene.add(o);pr._L0=Math.max(.1,Math.hypot(pr.ex-pr.x,pr.ey-pr.y));o.position.set(OX(i)+pr.x,2,pr.y)}
  const ey=pr.tgt&&pr.tgt.fly?1.7:pr.tgt&&pr.tgt.big?1.0:.6;let y;if(pr.k==='cannon'||pr.arc)y=ey+(1-pr.prog)*1.2+pr.h*1.6;else{const L=Math.hypot(pr.ex-pr.x,pr.ey-pr.y);y=ey+(2.1-ey)*Math.min(1,L/pr._L0)}
  const nx=OX(i)+pr.x,ny=y,nz=pr.y,ox=o.position.x,oy=o.position.y,oz=o.position.z;if(Math.hypot(nx-ox,ny-oy,nz-oz)>1e-4){o.lookAt(nx+(nx-ox),ny+(ny-oy),nz+(nz-oz))}o.position.set(nx,ny,nz);if(o.userData.spin){o.userData.spin.rotation.x+=dt*25;if(near)emit(nx,ny,nz,0,0,0,.3,.3,.5,.7,1,0)}
  if(near){if(pr.k==='flak'&&Math.random()<.9)emit(nx,ny,nz,(Math.random()-.5)*.4,.3,(Math.random()-.5)*.4,.35,.4,1,.5,.1,0);
   if(pr.k==='frost'&&Math.random()<.8)emit(nx,ny,nz,(Math.random()-.5)*.3,0,(Math.random()-.5)*.3,.4,.25,.6,.9,1,0);
   if(ORBC[pr.k]&&pr.k!=='frost'&&pr.k!=='flak'&&Math.random()<.7){const c=new T.Color(ORBC[pr.k][1]);emit(nx,ny,nz,(Math.random()-.5)*.3,0,(Math.random()-.5)*.3,.4,.3,c.r,c.g,c.b,0)}
   if(pr.k==='meat'&&Math.random()<.5)emit(nx,ny,nz,0,0,0,.5,.3,.5,1,.3,1);
   if((pr.k==='cannon'||pr.k==='rock')&&Math.random()<.6)emit(nx,ny,nz,0,.2,0,.6,.35,.35,.33,.3,0)}}
 for(const[pr,o]of vm)if(!seen.has(pr)){vm.delete(pr);scene.remove(o);PPOOL[o.userData.k].push(o)}}
// ---------------- particles ----------------
const PMAX=3000,pPos=new Float32Array(PMAX*3),pCol=new Float32Array(PMAX*3),pSz=new Float32Array(PMAX),pA=new Float32Array(PMAX),
 pVel=new Float32Array(PMAX*3),pLife=new Float32Array(PMAX),pMax=new Float32Array(PMAX),pG=new Float32Array(PMAX),pS0=new Float32Array(PMAX);let pN=0;
const pGeo=new T.BufferGeometry();pGeo.setAttribute('position',new T.BufferAttribute(pPos,3).setUsage(T.DynamicDrawUsage));pGeo.setAttribute('color',new T.BufferAttribute(pCol,3).setUsage(T.DynamicDrawUsage));
pGeo.setAttribute('size',new T.BufferAttribute(pSz,1).setUsage(T.DynamicDrawUsage));pGeo.setAttribute('alpha',new T.BufferAttribute(pA,1).setUsage(T.DynamicDrawUsage));
const pMat=new T.ShaderMaterial({uniforms:{scale:{value:600}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
 vertexShader:'attribute float size;attribute float alpha;varying vec3 vC;varying float vA;uniform float scale;void main(){vC=color;vA=alpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*scale/-mv.z;gl_Position=projectionMatrix*mv;}',
 fragmentShader:'varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d)*vA;gl_FragColor=vec4(vC*a,a);}',vertexColors:true});
const pts=new T.Points(pGeo,pMat);pts.frustumCulled=false;pts.renderOrder=3;scene.add(pts);
function emit(x,y,z,vx,vy,vz,life,size,r,g,b,grav){if(pN>=PMAX)return;const k=pN++;pPos[k*3]=x;pPos[k*3+1]=y;pPos[k*3+2]=z;pVel[k*3]=vx;pVel[k*3+1]=vy;pVel[k*3+2]=vz;pLife[k]=0;pMax[k]=life;pS0[k]=size;pCol[k*3]=r;pCol[k*3+1]=g;pCol[k*3+2]=b;pG[k]=grav}
function burst(x,y,z,n,spd,life,size,cols,grav,up){for(let k=0;k<n;k++){const a=Math.random()*TAU,e=Math.random()*(up||1),s=spd*(.4+Math.random()*.8),c=cols[k%cols.length];
 emit(x,y,z,Math.cos(a)*s,(e*1.2+.2)*s,Math.sin(a)*s,life*(.6+Math.random()*.6),size*(.6+Math.random()*.8),c[0],c[1],c[2],grav)}}
function updateParticles(dt){for(let k=0;k<pN;k++){pLife[k]+=dt;if(pLife[k]>=pMax[k]){const l=--pN;if(k!==l){for(const[A,n]of[[pPos,3],[pVel,3],[pCol,3]])for(let j=0;j<n;j++)A[k*n+j]=A[l*n+j];pLife[k]=pLife[l];pMax[k]=pMax[l];pG[k]=pG[l];pS0[k]=pS0[l]}k--;continue}
  pVel[k*3+1]-=pG[k]*dt;pPos[k*3]+=pVel[k*3]*dt;pPos[k*3+1]+=pVel[k*3+1]*dt;pPos[k*3+2]+=pVel[k*3+2]*dt;if(pPos[k*3+1]<.02&&pG[k]>0){pPos[k*3+1]=.02;pVel[k*3+1]*=-.3;pVel[k*3]*=.7;pVel[k*3+2]*=.7}
  const f=pLife[k]/pMax[k];pA[k]=f<.1?f*10:1-(f-.1)/.9;pSz[k]=pS0[k]*(1+f*.5)}
 pGeo.setDrawRange(0,pN);for(const a of['position','color','size','alpha'])pGeo.attributes[a].needsUpdate=true;pMat.uniforms.scale.value=renderer.domElement.height/(2*Math.tan(camera.fov*Math.PI/360))}
// rings & flashes
const RINGS=[];function ringFx(x,z,r,color,life,y){let o=RINGS.find(o=>!o.visible);if(!o){if(RINGS.length>90)return;o=new T.Mesh(geo('fxring',()=>new T.RingGeometry(.82,1,40).rotateX(-Math.PI/2)),new T.MeshBasicMaterial({...ADD,opacity:1}));RINGS.push(o);scene.add(o)}
 o.visible=true;o.material.color.set(color);o.position.set(x,y||.08,z);o.userData={t:0,life,r}}
const FLASH=[];function flashFx(x,y,z,color,size,life){let o=FLASH.find(o=>!o.visible);if(!o){if(FLASH.length>70)return;o=new T.Sprite(new T.SpriteMaterial({map:glowT,...ADD}));FLASH.push(o);scene.add(o)}
 o.visible=true;o.material.color.set(color);o.position.set(x,y,z);o.userData={t:0,life,size}}
function updateFxObjs(dt){updateLines(dt);for(const o of RINGS)if(o.visible){const u=o.userData;u.t+=dt;const f=u.t/u.life;if(f>=1){o.visible=false;continue}o.scale.setScalar(u.r*(.2+.8*Math.sqrt(f)));o.material.opacity=1-f}
 for(const o of FLASH)if(o.visible){const u=o.userData;u.t+=dt;const f=u.t/u.life;if(f>=1){o.visible=false;continue}o.scale.setScalar(u.size*(.6+f*.6));o.material.opacity=1-f}}
// floating text (HTML)
const FLOATS=[];function floatText(x,y,z,text,big,color,size){let e=FLOATS.find(f=>!f.on);if(!e){if(FLOATS.length>90)return;const d=document.createElement('div');d.className='ft';$('floats').appendChild(d);e={d};FLOATS.push(e)}
 e.on=true;e.t=0;e.p=new T.Vector3(x,y,z);e.d.textContent=text;e.d.style.fontSize=size||(big?'20px':'15px');e.d.style.color=color||'';e.d.style.display=''}
const V3=new T.Vector3();
function updateFloats(dt){for(const e of FLOATS)if(e.on){e.t+=dt;if(e.t>1.3){e.on=false;e.d.style.display='none';continue}V3.copy(e.p);V3.y+=e.t*1.1;V3.project(camera);
 if(V3.z>1){e.d.style.display='none';continue}e.d.style.display='';e.d.style.left=((V3.x+1)/2*innerWidth)+'px';e.d.style.top=((1-V3.y)/2*innerHeight)+'px';e.d.style.opacity=e.t<.9?1:(1.3-e.t)/.4}}
// game fx hook (replaces the 2D version's fx)
const DCOL={normal:[[.95,.93,.85],[.6,.3,.9]],armored:[[.8,.8,.85],[.6,.3,.9]],fast:[[.55,.5,.45],[.7,.1,.1]],flying:[[.3,.55,1],[.8,.9,1]],boss:[[1,.35,.1],[1,.8,.2]]};
window.fx=function(p,type,x,y,o){if(G.simulating)return;const i=p.i,wx=OX(i)+x,wz=y,near=i===0||laneNear(i);let m=near?1:.3;o=o||{};
 if(FXQ.low)m*=.45;if(impactFx(type,p,i,wx,wz,o,m,near))return;
 if(raceFx(type,p,i,wx,wz,o,m))return;
 switch(type){
 case 'boom':if(o.color){const cc=c3(o.color);burst(wx,.5,wz,Math.round(36*m),3.2,.7,.45,[cc,[1,1,1],cc],3);ringFx(wx,wz,(o.r||1.5)*1.1,o.color,.45);flashFx(wx,.8,wz,o.color,3,.3);break}burst(wx,.5,wz,Math.round(36*m),3.2,.7,.45,o.fire?[[1,.5,.1],[1,.8,.3],[1,.3,.05]]:[[1,.7,.3],[1,.5,.15],[.45,.4,.35]],4);ringFx(wx,wz,o.r*1.1,o.fire?0xff7020:0xffc060,.45);flashFx(wx,.8,wz,o.fire?0xff6020:0xffc070,3,.3);break;
 case 'death':{const c=DCOL[o.type]||DCOL.normal;burst(wx,o.fly?1.6:.6,wz,Math.round(22*m),2.2,.8,.3,c,3);if(o.type==='normal'||o.type==='armored')burst(wx,.8,wz,Math.round(8*m),.6,1.2,.45,[[.5,.25,.9]],-1.5,3);if(o.big)ringFx(wx,wz,2,0xff4010,.7);break}
 case 'float':floatText(wx,o.big?1.2:1.6,wz,o.text,o.big);break;
 case 'spark':burst(wx,.8,wz,Math.round(6*m),1.5,.25,.2,[[1,.95,.6]],0);break;
 case 'frosthit':burst(wx,.8,wz,Math.round(14*m),1.6,.5,.28,[[.6,.9,1],[.9,1,1]],1);ringFx(wx,wz,.9,0x80e0ff,.4,.1);break;
 case 'build':burst(wx,.2,wz,Math.round(24*m),1.6,.8,.5,[[.35,.3,.22],[.3,.27,.2]],1.5);ringFx(wx,wz,1,0xc8b080,.5);break;
 case 'upgrade':for(let k=0;k<Math.round(30*m);k++){const a=Math.random()*TAU;emit(wx+Math.cos(a)*.5,.2,wz+Math.sin(a)*.5,0,1.8+Math.random()*2,0,1,.35,1,.85,.3,0)}ringFx(wx,wz,1.2,0xffd050,.8);flashFx(wx,1.5,wz,0xffe080,3,.5);break;
 case 'clap':ringFx(wx,wz,(o.r||2.6)*1.1,o.color||0xbfe8ff,.7);ringFx(wx,wz,1.9,0xffffff,.45);burst(wx,.2,wz,Math.round(36*m),3.5,.7,.5,[[.45,.4,.32],[.7,.85,1]],2,.3);flashFx(wx,.6,wz,0xbfe0ff,5,.35);break;
 case 'meteorfall':meteor(wx,wz,o.delay||0,o.color);break;
 case 'baseup':for(let k=0;k<Math.round(70*m);k++){const a=Math.random()*TAU,r=Math.random()*3;emit(wx+Math.cos(a)*r,.2,wz+1.2+Math.sin(a)*r,0,2+Math.random()*3,0,1.4,.5,1,.85,.4,0)}ringFx(wx,wz+1.2,4,0xffd050,1.2);flashFx(wx,3,wz+1.2,0xffe090,8,.8);break;
 case 'leak':burst(wx,.8,ROWS+.5,Math.round(20*m),2,.6,.4,[[1,.15,.05]],1);flashFx(wx,1,ROWS+.5,0xff2010,3.5,.5);break}};
// ---------------- bases ----------------
const baseViews=[],METEORS=[];
function makeBase(i,tier,race0){tier=0;const race=race0||G.players[i].race||'human',RT=RACES[race].tint,g=new T.Group(),cs=tintObj(cloneModel('castle'),RT);cs.scale.setScalar([1.1,1.4,1.7][tier]);g.add(cs);
 if(tier>=1)for(const s of[-1,1]){const t=tintObj(cloneModel(tier>=2?'tower_B':'tower_A'),RT);t.scale.setScalar(1+tier*.15);t.position.set(s*2.7,0,.2);g.add(t)}
 if(tier>=2){for(const s of[-1,1]){const t=tintObj(cloneModel('tower_A'),RT);t.scale.setScalar(.85);t.position.set(s*4.3,0,1.0);g.add(t);
   const pole=mesh(geo('bpole',()=>new T.CylinderGeometry(.04,.04,3,5)),mat('wood'),s*1.6,1.5,-1.6);g.add(pole);g.add(mesh(geo('bban',()=>new T.BoxGeometry(.03,1,.7)),race==='human'?mat('bgold',{color:0xe8b830,side:T.DoubleSide,emissive:0x3a2800}):race==='orc'?mat('bred',{color:0xa02010,side:T.DoubleSide,emissive:0x300800}):mat('bgreen',{color:0x40a040,side:T.DoubleSide,emissive:0x103010}),s*1.6,2.4,-1.95))}
  const r=new T.Mesh(new T.RingGeometry(3.0,3.5,48).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:race==='undead'?0x70ff50:race==='orc'?0xff6030:0xffd050,...ADD,opacity:.5}));r.position.y=.07;g.add(r);g.userData.rune=r;
  const gl=new T.Sprite(new T.SpriteMaterial({map:glowT,color:0xffd060,...ADD,opacity:.35}));gl.scale.set(7,7,1);gl.position.y=5.5;g.add(gl)}
 raceBaseDecor(g,race,tier);g.position.set(OX(i)+5.5,0,ROWS+2.2);return g}
function raceBaseDecor(g,race,tier){const n=6+tier*3,R0=2.6+tier*.5;
 if(race==='orc'){for(let k=0;k<n;k++){const a=Math.PI*.15+k/(n-1)*Math.PI*.7+Math.PI;const c=mesh(geo('bspike',()=>new T.ConeGeometry(.14,1.1,5)),SKIN.bone,Math.cos(a)*R0,.45,Math.sin(a)*R0*.6+.3);c.rotation.set(-Math.sin(a)*.6,0,Math.cos(a)*.6);g.add(c)}
  for(const s of[-1,1]){g.add(mesh(geo('btorch',()=>new T.CylinderGeometry(.06,.08,1.4,5)),mat('wood'),s*(R0+.4),.7,1.2));const f=new T.Sprite(new T.SpriteMaterial({map:glowT,color:0xff6020,...ADD,opacity:.9}));f.scale.setScalar(1.1);f.position.set(s*(R0+.4),1.5,1.2);g.add(f)}}
 else if(race==='undead'){const um=mat('ustone',{color:0x4a4058}),up=mat('uglow',{color:0x80ff80,emissive:0x40ff40,emissiveIntensity:1.2});
  for(let k=0;k<2+tier*2;k++){const s=k%2?1:-1,d=R0+.3+Math.floor(k/2)*.9;const ob=mesh(geo('bobel',()=>new T.CylinderGeometry(.1,.3,2.2,4)),um,s*d,1.1,.9-Math.floor(k/2)*.6);g.add(ob);
   g.add(mesh(geo('bobg',()=>new T.OctahedronGeometry(.16)),up,s*d,2.4,.9-Math.floor(k/2)*.6,false));const f=new T.Sprite(new T.SpriteMaterial({map:glowT,color:0x60ff40,...ADD,opacity:.7}));f.scale.setScalar(1);f.position.set(s*d,2.4,.9-Math.floor(k/2)*.6);g.add(f)}
  const fog=new T.Mesh(geo('bfog',()=>new T.CircleGeometry(4,32).rotateX(-Math.PI/2)),new T.MeshBasicMaterial({color:0x40ff60,...ADD,opacity:.12}));fog.position.y=.05;g.add(fog)}}
function syncBase(i,p,now){let v=baseViews[i];if(!v||v.race!==p.race){if(v)scene.remove(v.g);v={g:makeBase(i,0),race:p.race};scene.add(v.g);baseViews[i]=v}if(v.g.userData.rune)v.g.userData.rune.rotation.y=now*.3}
function meteor(x,z,delay,color){let m=METEORS.find(m=>!m.on);if(!m){const o=new T.Group();o.add(mesh(geo('met',()=>new T.IcosahedronGeometry(.35,0)),new T.MeshBasicMaterial({color:0xffc060}),0,0,0,false));
  const sp=new T.Sprite(new T.SpriteMaterial({map:glowT,color:0xff6020,...ADD}));sp.scale.setScalar(2.2);o.add(sp);scene.add(o);m={o};METEORS.push(m)}
 m.o.children[1].material.color.set(color||0xff6020);m.col=new T.Color(color||0xff7020);m.on=true;m.t=-delay;m.x=x;m.z=z;m.o.visible=false}
function updateMeteors(dt){for(const m of METEORS)if(m.on){m.t+=dt;if(m.t<0)continue;const f=m.t/.55;if(f>=1){m.on=false;m.o.visible=false;continue}m.o.visible=true;
 m.o.position.set(m.x-4*(1-f),.3+12*(1-f),m.z-3*(1-f));m.o.rotation.x+=dt*8;for(let k=0;k<3;k++)emit(m.o.position.x,m.o.position.y,m.o.position.z,(Math.random()-.5),.5,(Math.random()-.5),.5,.6,m.col.r,m.col.g,m.col.b,0)}}
const cam={tx:OX(0)+5.5,tz:13,dist:21,yaw:0,goal:null,mouse:null,inside:false};const keys=new Set();
function jumpLane(i,wide){cam.goal=wide?{tx:(OX(3)+COLS)/2,tz:10,dist:78}:{tx:OX(i)+5.5,tz:12,dist:21}}
function updateCamera(dt){const sp=(10+cam.dist*.9)*dt;let dx=0,dz=0;
 if(keys.has('w')||keys.has('arrowup'))dz-=1;if(keys.has('s')||keys.has('arrowdown'))dz+=1;if(keys.has('a')||keys.has('arrowleft'))dx-=1;if(keys.has('d')||keys.has('arrowright'))dx+=1;
 if(cam.mouse&&cam.inside&&!cam.drag&&!cam.pan&&ready&&!G.inLobby){const m=cam.mouse,e=8;if(m.x<e)dx-=1;if(m.x>innerWidth-e)dx+=1;if(m.y<e)dz-=1;if(m.y>innerHeight-e)dz+=1}
 if(keys.has('q'))cam.yaw+=dt*1.5;if(keys.has('e'))cam.yaw-=dt*1.5;
 if(dx||dz){cam.goal=null;const c=Math.cos(cam.yaw),s=Math.sin(cam.yaw);cam.tx+=(dx*c+dz*s)*sp;cam.tz+=(-dx*s+dz*c)*sp}
 if(cam.goal){const k=Math.min(1,dt*5);for(const f of['tx','tz','dist'])cam[f]+=(cam.goal[f]-cam[f])*k;if(Math.abs(cam.goal.tx-cam.tx)<.05&&Math.abs(cam.goal.dist-cam.dist)<.1)cam.goal=null}
 cam.tx=Math.max(-12,Math.min(OX(3)+COLS+12,cam.tx));cam.tz=Math.max(-10,Math.min(ROWS+14,cam.tz));cam.dist=Math.max(6,Math.min(95,cam.dist));
 const pitch=.72+.38*Math.min(1,(cam.dist-6)/45),c=Math.cos(pitch)*cam.dist;camera.position.set(cam.tx+Math.sin(cam.yaw)*c,Math.sin(pitch)*cam.dist,cam.tz+Math.cos(cam.yaw)*c);camera.lookAt(cam.tx,0,cam.tz);
 if(cam.shake>0){const a=cam.shake*.35;camera.position.x+=(Math.random()-.5)*a;camera.position.y+=(Math.random()-.5)*a;camera.position.z+=(Math.random()-.5)*a;cam.shake=Math.max(0,cam.shake-dt*2.2)}
 sky.position.copy(camera.position);
 const ext=Math.min(48,10+cam.dist*.75),sc=sun.shadow.camera;if(Math.abs(sc.right-ext)>1){sc.left=sc.bottom=-ext;sc.right=sc.top=ext;sc.updateProjectionMatrix()}
 sun.target.position.set(cam.tx,0,cam.tz);sun.position.set(cam.tx-18,34,cam.tz+14)}
// ---------------- input ----------------
const ray=new T.Raycaster(),gp=new T.Plane(new T.Vector3(0,1,0),0),ndc=new T.Vector2();let hoverCell=null;
function pick(e){ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(ndc,camera);const pt=new T.Vector3();if(!ray.ray.intersectPlane(gp,pt))return null;
 const gx=Math.floor(pt.x-OX(0)),gy=Math.floor(pt.z);return(gx>=0&&gy>=0&&gx<COLS&&gy<ROWS)?{gx,gy,pt}:{pt}}
canvas.addEventListener('mousemove',e=>{cam.mouse={x:e.clientX,y:e.clientY};cam.inside=true;if(cam.drag){cam.yaw-=(e.clientX-cam.drag.x)*.006;cam.drag.x=e.clientX}const h=pick(e);hoverCell=h&&h.gx!=null?h:null});
document.addEventListener('mouseleave',()=>{cam.inside=false});document.addEventListener('mouseenter',()=>{cam.inside=true});
canvas.addEventListener('mousedown',e=>{if(e.button===1){e.preventDefault();cam.drag={x:e.clientX}}else if(e.button===2||(e.button===0&&cam.space)){cam.pan={x:e.clientX,y:e.clientY,d:0};cam.panMoved=false}});
addEventListener('mouseup',e=>{if(e.button===1)cam.drag=null;if(cam.pan){if(cam.pan.d>6)cam.panMoved=true;cam.pan=null}});
addEventListener('mousemove',e=>{const P=cam.pan;if(!P)return;const dx=e.clientX-P.x,dy=e.clientY-P.y;P.x=e.clientX;P.y=e.clientY;P.d+=Math.abs(dx)+Math.abs(dy);if(P.d<=6)return;if(cam.space)cam.spaceDrag=true;
 cam.goal=null;const k=cam.dist*1.6/innerHeight,c=Math.cos(cam.yaw),sn=Math.sin(cam.yaw);cam.tx-=(dx*c+dy*sn)*k;cam.tz-=(-dx*sn+dy*c)*k*1.3});
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.goal=null;cam.dist*=1+Math.sign(e.deltaY)*.12},{passive:false});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();if(cam.panMoved){cam.panMoved=false;return}if(G.build!=null){G.build=null;return}setSel([])});
canvas.addEventListener('click',e=>{if(cam.panMoved){cam.panMoved=false;return}if(BOX.done){BOX.done=false;return}const h=pick(e),me=G.players[0];if(!h||h.gx==null||!me.alive){if(h&&h.gx==null)G.sel=null;return}
 const t=me.grid[h.gy][h.gx];if(t&&e.shiftKey&&G.build==null){const cur=curSel(),k=cur.indexOf(t);if(k>=0)cur.splice(k,1);else cur.push(t);setSel(cur);return}
 if(t){setSel([t]);G.build=null;return}if(G.build!=null){build(me,G.build,h.gx,h.gy);if(!e.shiftKey)G.build=null}else setSel([])});
canvas.addEventListener('dblclick',e=>{if(G.build!=null)return;const h=pick(e),me=G.players[0];if(!h||h.gx==null)return;const t=me.grid[h.gy][h.gx];if(t)setSel(me.towers.filter(o=>o.ti===t.ti))});
document.addEventListener('keydown',e=>{if(e.target.tagName==='SELECT')return;if(G&&G.inLobby){if(e.key==='Enter'&&!e.repeat)startGame();return}const k=e.key.toLowerCase(),me=G.players[0];if(k==='tab'){e.preventDefault()}
 if(!(e.ctrlKey||e.metaKey)&&['w','a','s','d','q','e','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){keys.add(k);if(k.startsWith('arrow'))e.preventDefault();return}
 if(e.repeat)return;if(k==='enter'){e.preventDefault();return startWavesNow()}if(k==='n'){G.holdWaves=!G.holdWaves;addLog(G.holdWaves?'Wave timer held between waves (N to resume).':'Wave timer resumed.','#5a3a10');return}if(k==='l'){return showLobby()}
 const ti=TD().findIndex(t=>t.key===k);if(ti>=0)return selBuild(ti);const si=SENDS.findIndex(s=>s.key===k);if(si>=0)return humanSend(si);
 if(k==='a'&&(e.ctrlKey||e.metaKey)){e.preventDefault();keys.delete('a');setSel(me.towers.slice());return}if(k==='escape'){G.build=null;setSel([])}else if(k==='p')G.paused=!G.paused;else if(k==='f')G.speed=G.speed===1?2:1;else if(k==='r')newGame();else if(k==='m')muted=!muted;
 else if(k==='u'&&G.msel.length)upgradeAll();else if(k==='u'&&G.sel)upgrade(me,G.sel);else if((k==='delete'||k==='backspace')&&G.msel.length){e.preventDefault();sellAll()}else if((k==='delete'||k==='backspace')&&G.sel){e.preventDefault();sell(me,G.sel)}
 else if(k===' '){e.preventDefault();cam.space=true;cam.spaceDrag=false}else if(k==='tab'){const cur=Math.round((cam.tx-5.5)/(COLS+LG));jumpLane(((cur<0?0:cur)+1)%4)}else if('6789'.includes(k)&&k)jumpLane(+k-6);else if(k==='0')jumpLane(0,true)});
document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys.delete(k);if(k===' '&&cam.space){cam.space=false;if(!cam.spaceDrag)jumpLane(0)}});addEventListener('blur',()=>keys.clear());
// ---------------- HUD ----------------
let ICON={};
function makeIcons(){const r=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r.setSize(80,80);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.6;
 const s=new T.Scene();s.add(new T.HemisphereLight(0xffffff,0x909070,2.6));const dl=new T.DirectionalLight(0xffffff,3.5);dl.position.set(3,5,4);s.add(dl);const c=new T.PerspectiveCamera(30,1,.1,50);
 const shot=(o,h,d)=>{s.add(o);c.position.set(d*.75,h*.5+d*.55,d);c.lookAt(0,h*.45,0);r.render(s,c);s.remove(o);return r.domElement.toDataURL()};
for(let i=0;i<5;i++)makeHumanTower(i,6);
 SENDS.forEach((sd,i)=>{const k=CREEPKIND[sd.type];const v=k==='wolf'?makeWolf():k==='wyv'?makeWyvern():k==='ogre'?makeOgre():makeSkel(k);if(v.mixer){v.walk.time=.3;v.mixer.update(0)}v.anim&&!v.mixer&&v.anim(.5,0,0,1);
  v.o.rotation.y=.7;v.o.position.y=sd.type==='flying'?-.3:0;ICON['s'+i]=shot(v.o,sd.type==='boss'?1.5:1,sd.type==='boss'?3.2:2.4)});ICR={r,s,c,shot};
 const cv=(f)=>{const c=document.createElement('canvas');c.width=c.height=20;f(c.getContext('2d'));return c.toDataURL()};
 ICON.gold=cv(x=>{x.fillStyle='#e8b830';x.beginPath();x.arc(10,10,8,0,7);x.fill();x.strokeStyle='#8a5a00';x.lineWidth=1.5;x.stroke();x.fillStyle='#fff0a0';x.beginPath();x.arc(8,8,3,0,7);x.fill()});
 ICON.heart=cv(x=>{x.fillStyle='#d02a2a';x.beginPath();x.moveTo(10,17);x.bezierCurveTo(-4,7,4,-2,10,5);x.bezierCurveTo(16,-2,24,7,10,17);x.fill()});
 ICON.sword=cv(x=>{x.strokeStyle='#ddd';x.lineWidth=2.5;x.beginPath();x.moveTo(4,16);x.lineTo(16,4);x.stroke();x.strokeStyle='#8a5a20';x.beginPath();x.moveTo(3,11);x.lineTo(9,17);x.stroke()})}
function mkButtons(){$('build').innerHTML=TD().map((t,i)=>`<button class="bt" id="b${i}" title="${t.desc} · dmg ${t.dmg} · range ${t.range}"><img src="${ICON['t'+i]}"><span>[${t.key}] ${t.name.split(' ').pop()}<br><span class="c">${t.cost}g</span></span></button>`).join('');
 $('send').innerHTML=SENDS.map((s,i)=>`<button class="bt" id="s${i}" title="${CREEPS[s.type].name}, ${s.hp} base hp"><img src="${ICON['s'+i]}"><span>[${s.key.toUpperCase()}] ${s.name}<br><span class="c">${s.cost}g</span> <span id="sg${i}"></span></span></button>`).join('');
 TD().forEach((t,i)=>$('b'+i).onclick=()=>selBuild(i));SENDS.forEach((s,i)=>$('s'+i).onclick=()=>humanSend(i))}
function selBuild(i){G.build=G.build===i?null:i;setSel([])}
function humanSend(i){const v=$('target').value;sendCreep(G.players[0],i,v==='next'?null:+v)}
let lastTarget='',lastInfo='',lastLog='';
function updateUI(force){if(!ICON.gold)return;const me=G.players[0];if(refreshForPlayer._r!==me.race&&ICR)refreshForPlayer();
 $('stats').innerHTML=`<img src="${ICON.gold}"> <span class="k">${me.gold}</span> gold &nbsp; <span class="k">+${me.income}</span>/10s <small>(cap ${INCOME_CAP})</small><br><img src="${ICON.heart}"> <span class="k">${me.lives}</span> lives &nbsp; <img src="${ICON.sword}"> wave <span class="k">${G.wave}</span> (next ${Math.ceil(G.waveT)}s)`;
 TD().forEach((t,i)=>{const b=$('b'+i);b.className='bt'+(G.build===i?' sel':'');b.disabled=me.gold<t.cost});SENDS.forEach((s,i)=>{$('s'+i).disabled=me.gold<s.cost||!me.alive;$('sg'+i).textContent='+'+sendGain(me,i)+' inc'});
 const opts='<option value="next">Next clockwise</option>'+G.players.slice(1).filter(p=>p.alive).map(p=>`<option value="${p.i}">${p.name}</option>`).join('');
 if(opts!==lastTarget||force){const v=$('target').value;$('target').innerHTML=opts;lastTarget=opts;if([...$('target').options].some(o=>o.value===v))$('target').value=v}
 $('score').innerHTML='<tr><td>Lord</td><td>♥</td><td>Gold</td><td>Inc</td><td>Twr</td><td>Kills</td><td>Sent</td></tr>'+G.players.map(p=>
  `<tr style="${p.alive?'':'text-decoration:line-through;opacity:.6'}"><td><b style="color:${COLORS[p.i]};text-shadow:0 0 2px #000">■</b> ${p.name} <small style="color:${RACES[p.race].color}">${RACES[p.race].name.split(' ')[0]}</small>${p.ai?' <small>'+p.ai.diff+'/'+p.ai.pers+'</small>':''}</td><td>${p.lives}</td><td>${p.gold}</td><td>${p.income}</td><td>${p.towers.length}</td><td>${p.kills}</td><td>${p.sent}</td></tr>`).join('');
 const t=G.sel;let html;if(G.msel.length){html=multiInfo(me)}else if(t){const s=tStat(t),u=upCost(t);html=`<h3>${t.def.name} <small>level ${t.lvl}/${towerMax(t)}</small></h3>${s.drum?'<span style=color:#8a2a10>♫ war drums</span> · ':''}Damage <b>${s.dmg.toFixed(1)}</b> · Range <b>${s.range.toFixed(1)}</b> · Every <b>${s.rate.toFixed(2)}s</b><br><i>${t.def.desc}</i><br>
  <button id="up" ${u==null||me.gold<u?'disabled':''}>⬆ [U] Upgrade ${u==null?(t.lvl<6?'(upgrade base)':'(max)'):'<span class=c>'+u+'g</span>'}</button><button id="sl">✖ [Del] Sell <span class=c>+${Math.floor(t.spent*.7)}g</span></button>`}
 else html=G.build!=null?`<h3>Placing: ${TD()[G.build].name}</h3>${TD()[G.build].desc}. Click a tile in your lane. Right-click / Esc to cancel.`:'<h3>Tower Info</h3>Click one of your towers to inspect, upgrade or sell it. Pick a tower type and click your lane to build. Creeps follow the dirt road — maze them!<br><small>Multi-select: Shift+drag box · Shift+click toggle · double-click = all of a type · Ctrl+A all</small><br><button id="selall">▣ Select all (Ctrl+A)</button>';
 if(html!==lastInfo){$('info').innerHTML=html;lastInfo=html;if($('selall'))$('selall').onclick=()=>setSel(G.players[0].towers.slice());if(G.msel.length){$('upall').onclick=upgradeAll;$('slall').onclick=sellAll;$('selnone').onclick=()=>setSel([])}else if(t){$('up').onclick=()=>upgrade(me,t);$('sl').onclick=()=>sell(me,t)}}
 $('pause').textContent=G.paused?'▶ Resume (P)':'❚❚ Pause (P)';$('speed').textContent='» Speed x'+G.speed+' (F)';$('mute').textContent=muted?'🔇 Muted (M)':'🔊 Sound (M)';
 const nt=WAVETYPES[G.wave%WAVETYPES.length];$('wave').textContent=G.wave?'Wave '+G.wave:'Setup phase';$('next').innerHTML=(G.holdWaves&&G.wave>0?'<b style=color:#a02010>⏸ HELD</b> · ':'')+`Next: <b>${CREEPS[nt].name}</b>${nt==='boss'?' (BOSS)':nt==='flying'?' (AIR!)':''} in ${Math.ceil(G.waveT)}s`;
 $('wbar').style.width=(100*(1-G.waveT/(G.wave?25:SETUP_TIME)))+'%';$('bstart').textContent=G.wave?'⚔ Next Wave Now (Enter)':'⚔ Start Waves Now (Enter)';$('bhold').textContent='⏸ Hold waves: '+(G.holdWaves?'ON':'off')+' (N)';$('bhold').className=G.holdWaves?'on':'';$('inc').textContent=`Income +${me.income} in ${Math.ceil(G.incT)}s`;$('ibar').style.width=(100*(1-G.incT/10))+'%';
 const lg=G.log.map(l=>`<div style="color:${l.color==='#3a2410'||l.color==='#7a1a08'?'#eadcbc':l.color==='#a01010'?'#ff7060':l.color}">• ${l.text}</div>`).slice(0,6).join('');if(lg!==lastLog){$('log').innerHTML=lg;lastLog=lg}}
const mm=$('mm'),mx=mm.getContext('2d'),MMS=316/(OX(3)+COLS+4),MMO=2;
function drawMinimap(){mx.fillStyle='#24361a';mx.fillRect(0,0,mm.width,mm.height);const s=MMS,oy=(mm.height-ROWS*s)/2;
 G.players.forEach((p,i)=>{const ox=(OX(i)+MMO)*s;mx.fillStyle=p.alive?'#4f7a2c':'#4a1a14';mx.fillRect(ox,oy,COLS*s,ROWS*s);mx.fillStyle='#9a7a48';for(const[x,y]of p.path)mx.fillRect(ox+x*s,oy+y*s,s,s);
  for(const t of p.towers){mx.fillStyle=['#d9c36a','#c0603a','#6ac8e8','#b07ae0','#ff7a2a'][t.ti];mx.fillRect(ox+t.x*s+.5,oy+t.y*s+.5,s-1,s-1)}
  for(const c of p.creeps){mx.fillStyle=c.fly?'#6af':c.big?'#f3f':'#f33';mx.fillRect(ox+c.x*s-1.2,oy+c.y*s-1.2,2.4,2.4)}
  mx.fillStyle=COLORS[i];mx.fillRect(ox,oy-4,COLS*s,3)});
 const vw=cam.dist*.9,vh=cam.dist*.55;mx.save();mx.translate((cam.tx+MMO)*s,oy+cam.tz*s);mx.rotate(-cam.yaw);mx.strokeStyle='#fff';mx.lineWidth=1.2;mx.strokeRect(-vw*s/2,-vh*s*.8,vw*s,vh*s);mx.restore()}
mm.addEventListener('mousedown',e=>{const r=mm.getBoundingClientRect(),X=(e.clientX-r.left)*mm.width/r.width,Y=(e.clientY-r.top)*mm.height/r.height;const s=MMS,oy=(mm.height-ROWS*s)/2;
 cam.goal={tx:X/s-MMO,tz:(Y-oy)/s+4,dist:cam.dist}});
const PLATES=[0,1,2,3].map(i=>{const d=document.createElement('div');d.className='plate';$('plates').appendChild(d);return d});
function updatePlates(){G.players.forEach((p,i)=>{V3.set(OX(i)+5.5,3.6,-1.2).project(camera);const d=PLATES[i];if(V3.z>1||Math.abs(V3.x)>1.2){d.style.display='none';return}d.style.display='';
 d.style.left=((V3.x+1)/2*innerWidth)+'px';d.style.top=((1-V3.y)/2*innerHeight)+'px';d.innerHTML=`<span style="color:${COLORS[i]}">■</span> ${p.name} <small>(${RACES[p.race].name})</small>${p.ai?' · '+p.ai.diff:''} <span style="color:#ff8070">♥ ${p.lives}</span>${p.alive?'':' <b style="color:#ff5040">FALLEN</b>'}`})}
function showOv(){$('overlay').style.display='flex';const w=G.players.find(p=>p.alive);$('ovtext').innerHTML=G.over==='win'?'🏆 <b>Victory!</b><br><small>Your keep stands alone.</small>':G.over==='aiwin'?`👑 <b>${w?w.name:'Nobody'}</b> conquers the realm<br><small>wave ${G.wave}</small>`:`☠ <b>Defeat</b><br><small>Your keep fell on wave ${G.wave}.</small>`;$('spec').style.display=G.over==='lose'?'':'none'}
function hideOv(){$('overlay').style.display='none'}
$('pause').onclick=()=>G.paused=!G.paused;$('speed').onclick=()=>G.speed=G.speed===1?2:1;$('restart').onclick=()=>newGame();$('ovbtn').onclick=()=>newGame();$('mute').onclick=()=>muted=!muted;$('spec').onclick=()=>{G.over='spect';hideOv()};
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();const s=Math.max(.6,Math.min(1.25,innerHeight/800));$('side').style.transform=`scale(${s})`;$('bl').style.transform=`scale(${s})`}
addEventListener('resize',resize);
// ---------------- ghost / selection ----------------
const GHOSTS={},ghostMat=new T.MeshBasicMaterial({color:0x60ff60,transparent:true,opacity:.62,depthWrite:true});
function updateGhost(){const me=G.players[0];let show=false;if(hoverCell&&G.build!=null&&me.alive){const{gx,gy}=hoverCell,ok=canPlace(me,gx,gy)&&me.gold>=TD()[G.build].cost;
  const col=ok?0x40ff40:0xff3030;HOVER.material.color.set(col);HOVER.material.opacity=.55;HOVERL.material.color.set(ok?0xd0ffd0:0xffd0d0);ghostMat.color.set(ok?0x80ff80:0xff6060);HOVER.position.set(OX(0)+gx+.5,.03,gy+.5);HOVER.visible=true;
  const gk=me.race+G.build;let g=GHOSTS[gk];if(!g){g=makeTower(G.build,1,me.race).g;g.traverse(m=>{if(m.isMesh||m.isSprite){m.material=ghostMat;m.castShadow=false;m.renderOrder=10}});GHOSTS[gk]=g;scene.add(g)}
  Object.values(GHOSTS).forEach(o=>o&&(o.visible=o===g));g.position.set(OX(0)+gx+.5,0,gy+.5);setRange(OX(0)+gx+.5,gy+.5,TD()[G.build].range,0xffffff);show=true}
 if(!show){HOVER.visible=false;Object.values(GHOSTS).forEach(o=>o&&(o.visible=false))}
 const t=G.sel;if(t&&me.towers.includes(t)){SELR.visible=true;SELR.position.set(OX(0)+t.x+.5,.1,t.y+.5);if(!show)setRange(OX(0)+t.x+.5,t.y+.5,tStat(t).range,0xffd050);show=true}else{SELR.visible=false;if(t&&!me.towers.includes(t))G.sel=null}
 syncMulti(me);RANGE.visible=show}
function setRange(x,z,r,c){RANGE.position.set(x,.04,z);RANGE.scale.setScalar(r);RANGE.rr.material.color.set(c);RANGE.rf.material.color.set(c)}
// ---------------- main loop ----------------
let last=performance.now(),acc=0,uiT=0,mmT=0,ready=false,fpsN=0,fpsT=0;window.FPS=0;
function frame(now){requestAnimationFrame(frame);if(!ready)return;try{const el=Math.min(.1,(now-last)/1000);last=now;fpsN++;fpsT+=el;if(fpsT>1){window.FPS=fpsN/fpsT;fpsN=0;fpsT=0}
 if(!G.paused&&(!G.over||G.over==='spect')){acc+=el*G.speed;let n=0;while(acc>=DT&&n<10){step(DT);acc-=DT;n++}if(n>=10)acc=0}
 const t=now/1000,gdt=G.paused?0:el*G.speed;updateCamera(el);updatePaths();
 G.players.forEach((p,i)=>{syncTowers(i,p,t,el);syncCreeps(i,p,t,gdt);syncProj(i,p,gdt,i===0||laneNear(i));DEAD[i].visible=!p.alive;syncBase(i,p,t)});updateMeteors(gdt);
 updateDying(gdt);updateImpacts(gdt);updateHB();updateParticles(gdt);updateFxObjs(gdt);PORTALS.forEach((d,i)=>{d.rotation.z=-t*1.5;if(Math.random()<el*10&&(i===0||laneNear(i)))emit(OX(i)+5.5+(Math.random()-.5)*2,.4+Math.random()*2.2,-1.1,0,.6,.4,.9,.3,.7,.3,1,0)});
 updateGhost();renderer.render(scene,camera);updateFloats(el);updatePlates();
 if((uiT+=el)>.15){uiT=0;updateUI()}if((mmT+=el)>.12){mmT=0;drawMinimap()}}catch(err){errorsLog.push(String(err.stack||err));console.error(err)}}
loadModels().then(()=>{buildTerrain();makeIcons();$('bstart').onclick=()=>startWavesNow();$('bhold').onclick=()=>{G.holdWaves=!G.holdWaves};$('blobby').onclick=()=>showLobby();$('lstart').onclick=()=>startGame();newGame();resize();ready=true;$('loading').style.display='none';showLobby();updateUI(true)}).catch(e=>{errorsLog.push('load:'+e);console.error(e);$('loading').textContent='Failed to load: '+e});
requestAnimationFrame(frame);
window.LTW={towerViews,get G(){return G},simulate,build,sendCreep,canPlace,upgrade,sell,newGame,errorsLog,step,cam,jumpLane,get ready(){return ready},renderer,scene,camera};

// ======== races / lobby additions ========
const TD=()=>G.players[0].tdefs;
const TINTC={};function tintObj(o,col){if(col==null||col===0xffffff)return o;const C=new T.Color(col);o.traverse(m=>{if(m.isMesh){const k=m.material.uuid+'_'+col;let mm=TINTC[k];if(!mm){mm=m.material.clone();mm.color.multiply(C);TINTC[k]=mm}m.material=mm}});return o}
function towerDecor(g,lvl,top,ex,banner){const gold=mat('gold'),wood=mat('wood');
 if(lvl>=2)g.add(mesh(geo('gring'),gold,0,.08,0,false));
 if(lvl>=3){for(const s of[-1,1]){g.add(mesh(geo('pole'),wood,s*.5,top*.55+.5,.35));g.add(mesh(geo('ban'),mat('banner_'+banner,{color:banner,side:T.DoubleSide}),s*.5,top*.55+.82,.5))}}
 if(lvl>=4){const rune=new T.Mesh(geo('rune'),new T.MeshBasicMaterial({color:banner===0x30a030?0x80ff60:0xffd050,...ADD,opacity:.8}));rune.position.y=.05;g.add(rune);ex.rune=rune;
  const st=mesh(geo('star'),mat('gemg'),0,top+1.0,0,false);g.add(st);ex.star=st}
 if(lvl>=5){const au=new T.Sprite(new T.SpriteMaterial({map:glowT,color:lvl>=6?0xc060ff:0x8080ff,...ADD,opacity:.55}));au.scale.set(2.2,top*1.6+1,1);au.position.y=top*.6;g.add(au);ex.aura=au;
  const r2=new T.Mesh(geo('rune2'),new T.MeshBasicMaterial({color:lvl>=6?0xd070ff:0x8090ff,...ADD,opacity:.8}));r2.position.y=.06;g.add(r2);ex.rune2=r2}
 for(let k=0;k<lvl;k++)g.add(mesh(geo('pip'),gold,(k-(lvl-1)/2)*.16,.18,.58,false))}
function raceTower(race,ti,lvl){const g=new T.Group(),hy=1+.12*(lvl-1),S=.9,ex={};let aim=null,arm=null,top=1.5*S*hy;const RT=RACES[race].tint;
 const wood=mat('wood'),dwood=mat('dwood',{color:0x4a2a12}),bone=SKIN.bone||mat('bonew',{color:0xe8e0c8});
 const tbase=(k,s)=>{const b=tintObj(cloneModel(k),RT);b.scale.set(S*(s||1),S*hy*(s||1),S*(s||1));g.add(b);return b};
 const glow=(c,y,s,o)=>{const gl=new T.Sprite(new T.SpriteMaterial({map:glowT,color:c,...ADD,opacity:o||.7}));gl.scale.setScalar(s);gl.position.y=y;g.add(gl);ex.glow=gl;return gl};
 if(race==='orc'){
  const spikes=()=>{for(let k=0;k<6;k++){const a=k/6*TAU;const c=mesh(geo('ospike',()=>new T.ConeGeometry(.07,.45,5)),bone,Math.cos(a)*.55,.35,Math.sin(a)*.55);c.rotation.set(Math.sin(a)*1.1,0,-Math.cos(a)*1.1);g.add(c)}};
  if(ti===0){tbase('tower_base');spikes();aim=new T.Group();aim.position.y=top+.05;aim.add(mesh(geo('oplat',()=>new T.CylinderGeometry(.45,.5,.12,8)),wood,0,0,0));
   for(const s of[-1,1]){aim.add(mesh(geo('ospear',()=>new T.CylinderGeometry(.025,.025,1.1,5).rotateX(Math.PI/2)),dwood,s*.12,.18,.1));aim.add(mesh(geo('ospt',()=>new T.ConeGeometry(.05,.16,4).rotateX(Math.PI/2)),mat('steel'),s*.12,.18,.68))}
   aim.add(mesh(geo('obox',()=>new T.BoxGeometry(.4,.18,.35)),dwood,0,.1,-.15));g.add(aim)}
  else if(ti===1){const b=tbase('tower_catapult');aim=b.getObjectByName('catapult_turret_blue');arm=b.getObjectByName('catapult_arm_blue');top=TOPH[1]*S*hy;spikes();g.add(mesh(geo('oskull',()=>new T.SphereGeometry(.13,7,6)),bone,0,.9,.55))}
  else if(ti===2){tbase('tower_base');spikes();g.add(mesh(geo('odrum',()=>new T.CylinderGeometry(.38,.38,.45,12)),mat('drumw',{color:0x8a3a1a}),0,top+.22,0));
   g.add(mesh(geo('ohide',()=>new T.CylinderGeometry(.39,.39,.03,12)),mat('hide',{color:0xe8d0a0}),0,top+.46,0));const st=new T.Group();st.position.y=top+.5;
   for(const s of[-1,1]){const p=new T.Group();p.position.x=s*.2;p.add(mesh(geo('ostick',()=>new T.CylinderGeometry(.025,.025,.45,4)),wood,0,.2,0));p.add(mesh(geo('oknob',()=>new T.SphereGeometry(.05,5,4)),mat('hide'),0,.42,0));st.add(p)}g.add(st);ex.drum=st;top+=.4;
   const r=new T.Mesh(geo('drumring',()=>new T.RingGeometry(.8,.95,24).rotateX(-Math.PI/2)),new T.MeshBasicMaterial({color:0xff6030,...ADD,opacity:.6}));r.position.y=.06;g.add(r);ex.dring=r}
  else if(ti===3){top=2.3*hy;for(let k=0;k<3;k++){const seg=mesh(geo('otot'+k,()=>new T.CylinderGeometry(.3-k*.04,.34-k*.04,.75,7)),mat('totem'+k,{color:[0x7a4a2a,0x9a5a2a,0x6a3a1a][k]}),0,(.38+k*.75)*hy,0);seg.scale.y=hy;g.add(seg);
    g.add(mesh(geo('oface',()=>new T.BoxGeometry(.3,.18,.08)),mat('paint',{color:0xc02a1a}),0,(.45+k*.75)*hy,.3-k*.04))}
   for(const s of[-1,1]){const w=mesh(geo('owing',()=>new T.BoxGeometry(.5,.08,.2)),mat('paint'),s*.4,top-.2,0);w.rotation.z=s*.4;g.add(w)}
   const orb=mesh(geo('oorb',()=>new T.IcosahedronGeometry(.22,0)),mat('lorb',{color:0xc0e0ff,emissive:0x4080ff,emissiveIntensity:1.6}),0,top+.25,0,false);g.add(orb);ex.crystal=orb;ex.cy=top+.25;glow(0x60a0ff,top+.25,1.6)}
  else{tbase('tower_B');top=TOPH[4]*S*hy;ex.wings=[];for(const s of[-1,1]){const p=new T.Group();p.position.set(s*.25,top-.1,0);const sh=new T.Mesh(geo('owingm',()=>{const q=new T.Shape();q.moveTo(0,0);q.lineTo(1,.4);q.lineTo(.9,-.2);q.lineTo(.4,-.3);return new T.ShapeGeometry(q)}),mat('batw',{color:0x5a3a2a,side:T.DoubleSide}));sh.scale.x=s;p.add(sh);g.add(p);ex.wings.push([p,s])}
   g.add(mesh(geo('ovial',()=>new T.SphereGeometry(.12,6,5)),mat('venom',{color:0x80d020,emissive:0x406000,emissiveIntensity:1}),0,top+.15,0,false))}
 }else{
  const um=mat('ustone',{color:0x4a4058}),ug=mat('uglow',{color:0x80ff80,emissive:0x40ff40,emissiveIntensity:1.2}),up=mat('upurp',{color:0xc080ff,emissive:0x8030ff,emissiveIntensity:1.4});
  if(ti===0){for(let k=0;k<3;k++){const b=mesh(geo('uzig'+k,()=>new T.BoxGeometry(1-k*.25,.45,1-k*.25)),um,0,(.22+k*.45)*hy,0);b.scale.y=hy;g.add(b)}top=1.35*hy;
   const orb=mesh(geo('uorb',()=>new T.OctahedronGeometry(.2)),up,0,top+.35,0,false);g.add(orb);ex.crystal=orb;ex.cy=top+.35;glow(0xa060ff,top+.35,1.5);
   for(const [x,z] of [[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]])g.add(mesh(geo('uspk',()=>new T.ConeGeometry(.06,.5,4)),bone,x,.7,z))}
  else if(ti===1){aim=new T.Group();g.add(aim);aim.add(mesh(geo('ucart',()=>new T.BoxGeometry(.7,.35,.9)),dwood,0,.4,0));for(const [x,z] of [[-.38,-.3],[.38,-.3],[-.38,.3],[.38,.3]])aim.add(mesh(geo('uwheel',()=>new T.CylinderGeometry(.2,.2,.08,10).rotateZ(Math.PI/2)),wood,x,.2,z));
   arm=new T.Group();arm.position.set(0,.6,-.2);arm.add(mesh(geo('uarm',()=>new T.BoxGeometry(.08,.08,.8)),wood,0,0,.35));arm.add(mesh(geo('umeat',()=>new T.SphereGeometry(.13,6,5)),mat('meat',{color:0x8a2a2a}),0,.08,.72));aim.add(arm);top=1.0;
   aim.add(mesh(geo('ugut',()=>new T.SphereGeometry(.18,6,5)),mat('meat'),0,.62,.25))}
  else if(ti===2){g.add(mesh(geo('ucbase',()=>new T.CylinderGeometry(.5,.6,.3,8)),um,0,.15,0));g.add(mesh(geo('ucaul',()=>new T.SphereGeometry(.42,10,8,0,TAU,Math.PI*.35,Math.PI*.65)),mat('ironc',{color:0x3a3a40}),0,.75,0));
   g.add(mesh(geo('uliq',()=>new T.CircleGeometry(.36,16).rotateX(-Math.PI/2)),ug,0,.78,0,false));top=.9;ex.plague=true;glow(0x60ff40,1,1.8,.6)}
  else if(ti===3){top=2.6*hy;const ob=mesh(geo('uob',()=>new T.CylinderGeometry(.12,.36,2.4,4)),um,0,1.2*hy,0);ob.scale.y=hy;g.add(ob);for(let k=0;k<3;k++){const r=mesh(geo('urib',()=>new T.TorusGeometry(.35,.04,4,10,Math.PI)),bone,0,(.6+k*.55)*hy,0);r.rotation.y=k*1.1;g.add(r)}
   g.add(mesh(geo('uskull',()=>new T.SphereGeometry(.2,8,6)),bone,0,top,0));for(const s of[-1,1])g.add(mesh(geo('ueye',()=>new T.SphereGeometry(.045,4,3)),up,s*.08,top+.02,.17,false))}
  else{g.add(mesh(geo('ucbase'),um,0,.15,0));for(let k=0;k<5;k++){const r=mesh(geo('urib2',()=>new T.TorusGeometry(.5,.05,4,10,Math.PI)),bone,0,.3,-.4+k*.2);r.rotation.y=Math.PI/2;r.scale.set(1,1.6*hy,1);g.add(r)}
   const c=mesh(geo('crys'),mat('ice'),0,1.3*hy,0);c.scale.set(1,1.8+.2*lvl,1);g.add(c);ex.crystal=c;ex.cy=1.3*hy;top=1.6*hy;glow(0x80d0ff,1.3*hy,1.6,.6)}}
 g.traverse(m=>{if(m.isMesh)m.castShadow=true});towerDecor(g,lvl,top,ex,race==='orc'?0xa02010:0x30a030);return {g,aim,arm,ex,ti,lvl,top}}
function raceTowerAnim(v,t,i,now,dt){const ex=v.ex;
 if(ex.drum){const hit=Math.sin(now*9+t.x)>0;ex.drum.children.forEach((p,k)=>p.rotation.x=(k?1:-1)*(hit?.5:-.2));ex.dring.scale.setScalar(1+.15*Math.sin(now*4));}
 if(ex.wings)for(const[p,s]of ex.wings)p.rotation.z=s*.5*Math.sin(now*7+t.x);
 if(ex.plague&&(i===0||laneNear(i))&&Math.random()<dt*10)emit(OX(i)+t.x+.5+(Math.random()-.5)*.4,.9,t.y+.5+(Math.random()-.5)*.4,0,.6,0,.9,.35,.4,1,.3,-.3)}
// lines (chain lightning)
const LINES=[];function chainFx(pts,color,thin){let L=LINES.find(l=>!l.visible);if(!L){if(LINES.length>60)return;const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(80*3),3));L=new T.Line(g,new T.LineBasicMaterial({...ADD,opacity:1}));L.frustumCulled=false;L.renderOrder=8;LINES.push(L);scene.add(L)}
 const a=L.geometry.attributes.position.array,J=thin?0:.28;let n=0;const put=(x,y,z)=>{a[n*3]=x;a[n*3+1]=y;a[n*3+2]=z;n++};
 for(let k=0;k<pts.length-1&&n<70;k++){const[x0,y0,z0]=pts[k],[x1,y1,z1]=pts[k+1],sg=thin?1:6;for(let s=0;s<sg;s++){const f=s/sg,j=s?J:0;put(x0+(x1-x0)*f+(Math.random()-.5)*j,y0+(y1-y0)*f+(Math.random()-.5)*j,z0+(z1-z0)*f+(Math.random()-.5)*j)}}
 const l=pts[pts.length-1];put(l[0],l[1],l[2]);L.geometry.setDrawRange(0,n);L.geometry.attributes.position.needsUpdate=true;L.material.color.set(color||0xa0d0ff);L.material.opacity=1;L.visible=true;L.userData={t:0,life:thin?.1:.3}}
function updateLines(dt){for(const L of LINES)if(L.visible){L.userData.t+=dt;const f=L.userData.t/L.userData.life;if(f>=1)L.visible=false;else L.material.opacity=1-f}}
const c3=c=>{const k=new T.Color(c);return [k.r,k.g,k.b]};
function raceFx(type,p,i,wx,wz,o,m){switch(type){
 case 'chain':{const pts=o.pts.map((q,k)=>[OX(i)+q[0],k===0?(o.thin?1.2:1.9):(q[2]||.8),q[1]]);chainFx(pts,o.color,o.thin);if(!o.thin){chainFx(pts,0xffffff,false);for(const q of pts)flashFx(q[0],q[1],q[2],o.color||0x80b0ff,1.2,.2)}return true}
 case 'line':{const col=c3(o.color||0xffd080);for(let d=0;d<o.len;d+=.35){const x=wx+Math.cos(o.ang)*d,z=wz+Math.sin(o.ang)*d;burst(x,.3,z,Math.max(1,Math.round(4*m)),1.4,.5,.35,[col,[.6,.5,.4]],1.5)}ringFx(wx+Math.cos(o.ang)*o.len,wz+Math.sin(o.ang)*o.len,1,o.color||0xffd080,.4);return true}
 case 'stomp':ringFx(wx,wz,(o.r||2.5)*1.1,0xd0a060,.7);ringFx(wx,wz,(o.r||2.5)*.7,0xffffff,.45);burst(wx,.2,wz,Math.round(50*m),4,.8,.6,[[.5,.4,.3],[.7,.6,.45]],2,.3);flashFx(wx,.6,wz,0xffd090,5,.35);return true
 case 'nova':ringFx(wx,wz,(o.r||2.5)*1.1,o.color||0x9fe8ff,.6);burst(wx,.4,wz,Math.round(44*m),3.5,.7,.45,[[.6,.9,1],[.9,1,1]],1);flashFx(wx,.8,wz,o.color||0xbff0ff,4,.35);return true
 case 'heal':for(let k=0;k<Math.round(30*m);k++){const a=Math.random()*TAU,r=Math.random()*.6;emit(wx+Math.cos(a)*r,.1,wz+Math.sin(a)*r,0,2+Math.random()*2,0,1,.35,1,1,.5,0)}ringFx(wx,wz,1.3,0xfff080,.6);flashFx(wx,1,wz,0xffffa0,3,.4);return true
 case 'summon':{const col=o.unit==='skel'?[[.5,1,.4],[.3,.2,.5]]:o.unit==='wolf'?[[.5,.8,1],[.8,.9,1]]:[[.6,.9,1],[1,1,1]];burst(wx,.5,wz,Math.round(26*m),2,.7,.4,col,1);ringFx(wx,wz,1,o.unit==='skel'?0x60ff60:0x80c0ff,.45);return true}
 case 'pulse':ringFx(wx,wz,(o.r||2)*1.05,o.color||0x70ff50,.6,.1);burst(wx,.6,wz,Math.round(10*m),1.6,.6,.3,[[.4,1,.3]],.5);return true}
 return false}
// icons & portraits
let ICR=null;
function towerIcons(race){for(let i=0;i<5;i++){const v=makeTower(i,2,race);if(v.aim)v.aim.rotation.y=.6;ICON['t'+i]=ICR.shot(v.g,2.8,3.6)}}
function refreshForPlayer(){if(!ICR||!G)return;const me=G.players[0];refreshForPlayer._r=me.race;towerIcons(me.race);mkButtons();lastInfo=null;if(typeof updateUI==='function')updateUI(true)}
function onNewGame(){
 for(const L of LINES)L.visible=false;refreshForPlayer()}
// lobby


// ---- lobby (race only) with rotating diorama preview ----
let LSEL={race:'human'},PV=null;
function showLobby(){LOBBY_OPEN=true;if(G){G.inLobby=true;G.paused=false}$('lobby').style.display='flex';renderLobby();if(!PV)initPreview();PV.on=true;setPreview()}
function renderLobby(){$('races').innerHTML=RACE_LIST.map(r=>{const R=RACES[r];return `<div class="rc ${LSEL.race===r?'on':''}" data-r="${r}" style="--rc:${R.color}"><h2>${R.name}</h2><p>${R.desc}</p><small><b>Base:</b> ${R.bases[0]}</small></div>`}).join('');
 const R=RACES[LSEL.race];$('hinfo').innerHTML=`<h2 style="color:${R.color}">${R.name}</h2><i>${R.desc}</i><ul>${R.towers.map(t=>`<li><div><b>[${t.key}] ${t.name}</b> <small>${t.cost}g · ${t.support?'support':(t.ground&&t.air?'ground + air':t.air?'AIR only':'ground only')}</small><br>${t.desc}</div></li>`).join('')}</ul>`;
 document.querySelectorAll('#races .rc').forEach(e=>e.onclick=()=>{LSEL.race=e.dataset.r;renderLobby();setPreview()})}
function initPreview(){const r=new T.WebGLRenderer({canvas:$('pv'),antialias:true,alpha:true,preserveDrawingBuffer:true});r.setSize(300,280,false);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.4;
 const s=new T.Scene();s.add(new T.HemisphereLight(0xffffff,0x605040,2.2));const dl=new T.DirectionalLight(0xffeedd,3);dl.position.set(4,8,5);s.add(dl);const c=new T.PerspectiveCamera(34,300/280,.1,100);
 const ped=new T.Mesh(new T.CylinderGeometry(5.2,5.5,.3,32),new T.MeshStandardMaterial({color:0x5a7a3a}));ped.position.y=-.15;s.add(ped);PV={r,s,c,cur:null,on:false,last:performance.now()};
 const loop=()=>{requestAnimationFrame(loop);if(!PV.on||!PV.cur)return;const now=performance.now(),dt=Math.min(.1,(now-PV.last)/1000);PV.last=now;PV.cur.rotation.y+=dt*.4;PV.r.render(PV.s,PV.c)};loop()}
function setPreview(){if(PV.cur)PV.s.remove(PV.cur);const g=new T.Group(),b=makeBase(0,0,LSEL.race);b.position.set(0,0,-1.6);b.scale.setScalar(.7);g.add(b);
 for(let i=0;i<5;i++){const v=makeTower(i,2,LSEL.race);const a=(i-2)*.55;v.g.position.set(Math.sin(a)*3.4,0,Math.cos(a)*3.4-.6);g.add(v.g)}
 PV.cur=g;PV.s.add(g);PV.c.position.set(0,7,10.5);PV.c.lookAt(0,1,0);PV.r.render(PV.s,PV.c)}
function startGame(){CFG.race[0]=LSEL.race;CFG.diff=$('diff').value;randomizeAIs();LOBBY_OPEN=false;if(PV)PV.on=false;$('lobby').style.display='none';newGame();jumpLane(0)}

// ---- multi-select ----
function curSel(){return G.msel.length?G.msel.slice():(G.sel?[G.sel]:[])}
function setSel(a){a=a.filter(t=>G.players[0].towers.includes(t));if(a.length===1){G.sel=a[0];G.msel=[]}else{G.sel=null;G.msel=a}lastInfo=null}
function multiInfo(me){const L=G.msel,by={};let up=0,nUp=0,sv=0;for(const t of L){by[t.def.name]=(by[t.def.name]||0)+1;const u=upCost(t);if(u!=null){up+=u;nUp++}sv+=Math.floor(t.spent*.7)}
 return `<h3>${L.length} towers selected</h3>${Object.entries(by).map(([n,c])=>`${c}× ${n}`).join(' · ')}<br>Levels: ${[1,2,3,4].map(l=>L.filter(t=>t.lvl===l).length+'×L'+l).join(' ')}<br>
 <button id="upall" ${nUp&&me.gold>=Math.min(...L.map(t=>upCost(t)??1e9))?'':'disabled'}>⬆ [U] Upgrade all <span class=c>${up}g</span> <small>(${nUp} upgradable)</small></button><button id="slall">✖ [Del] Sell all <span class=c>+${sv}g</span></button><button id="selnone">Clear (Esc)</button>`}
function upgradeAll(){const me=G.players[0];const L=G.msel.filter(t=>upCost(t)!=null).sort((a,b)=>upCost(a)-upCost(b));let n=0;for(const t of L){if(me.gold<upCost(t))break;if(upgrade(me,t))n++}
 if(n)addLog(`Upgraded ${n} tower${n>1?'s':''}.`,'#2a5a10');lastInfo=null;return n}
function sellAll(){const me=G.players[0],L=G.msel.slice();if(L.length>1&&!window.confirm(`Sell ${L.length} towers for ${L.reduce((a,t)=>a+Math.floor(t.spent*.7),0)} gold?`))return 0;for(const t of L)sell(me,t);setSel([]);return L.length}
const MRING=new T.InstancedMesh(new T.TorusGeometry(.6,.045,6,28).rotateX(Math.PI/2),new T.MeshBasicMaterial({color:0x7affd0}),300);MRING.count=0;MRING.frustumCulled=false;scene.add(MRING);
function syncMulti(me){if(G.msel.some(t=>!me.towers.includes(t)))setSel(G.msel);const M4=new T.Matrix4(),n=Math.min(300,G.msel.length),pu=1+.06*Math.sin(performance.now()/150);
 for(let k=0;k<n;k++){const t=G.msel[k];M4.makeScale(pu,1,pu).setPosition(OX(0)+t.x+.5,.1,t.y+.5);MRING.setMatrixAt(k,M4)}MRING.count=n;MRING.instanceMatrix.needsUpdate=true}
const BOX={on:false,done:false},boxEl=document.createElement('div');boxEl.style.cssText='position:fixed;border:1.5px solid #7affd0;background:rgba(122,255,208,.12);pointer-events:none;display:none;z-index:20';document.body.appendChild(boxEl);
canvas.addEventListener('mousedown',e=>{if(e.button!==0||!e.shiftKey||G.build!=null||cam.space||G.inLobby)return;BOX.on=true;BOX.x0=BOX.x1=e.clientX;BOX.y0=BOX.y1=e.clientY});
addEventListener('mousemove',e=>{if(!BOX.on)return;BOX.x1=e.clientX;BOX.y1=e.clientY;const x=Math.min(BOX.x0,BOX.x1),y=Math.min(BOX.y0,BOX.y1),w=Math.abs(BOX.x1-BOX.x0),h=Math.abs(BOX.y1-BOX.y0);
 if(w+h>6)Object.assign(boxEl.style,{display:'block',left:x+'px',top:y+'px',width:w+'px',height:h+'px'})});
addEventListener('mouseup',e=>{if(!BOX.on||e.button!==0)return;BOX.on=false;boxEl.style.display='none';const x0=Math.min(BOX.x0,BOX.x1),x1=Math.max(BOX.x0,BOX.x1),y0=Math.min(BOX.y0,BOX.y1),y1=Math.max(BOX.y0,BOX.y1);
 if(x1-x0+y1-y0<=6)return;BOX.done=true;const me=G.players[0],V=new T.Vector3(),got=[];for(const t of me.towers){V.set(OX(0)+t.x+.5,.6,t.y+.5).project(camera);if(V.z>1)continue;
  const sx=(V.x+1)/2*innerWidth,sy=(1-V.y)/2*innerHeight;if(sx>=x0&&sx<=x1&&sy>=y0&&sy<=y1)got.push(t)}setSel(got);setTimeout(()=>{BOX.done=false},0)});
window.LTW.setSel=setSel;window.LTW.upgradeAll=upgradeAll;window.LTW.sellAll=sellAll;
// ======== v7: per-tower impact effects, creep status visuals, death effects, damage numbers ========
const FXQ={low:localStorage.getItem('ltw_fxlow')==='1',nums:localStorage.getItem('ltw_nums')!=='0'};
const COLS3={wood:[.55,.36,.18],blood:[.75,.08,.06],fire:[1,.55,.12],fire2:[1,.85,.35],smoke:[.32,.3,.28],dirt:[.36,.27,.18],ice:[.75,.95,1],ice2:[.45,.75,1],
 bone:[.92,.9,.82],purple:[.65,.35,1],soul:[.75,.6,1],green:[.45,1,.25],gore:[.55,.08,.1],toxic:[.3,.9,.2],elec:[.6,.85,1],white:[1,1,1],steel:[.75,.78,.85],gold:[1,.85,.3],fur:[.45,.38,.3],feather:[.35,.6,1]};
const C=n=>COLS3[n];
// pooled ground decals (scorch / plague splat)
const DECALS=[];function decal(x,z,r,color,life){let o=DECALS.find(o=>!o.visible);if(!o){if(DECALS.length>(FXQ.low?20:45)){o=DECALS.reduce((a,b)=>a.userData.t>b.userData.t?a:b)}else{o=new T.Mesh(geo('decal',()=>new T.CircleGeometry(1,20).rotateX(-Math.PI/2)),new T.MeshBasicMaterial({transparent:true,depthWrite:false,opacity:.45}));o.renderOrder=0;DECALS.push(o);scene.add(o)}}
 o.material.color.set(color);o.position.set(x,.035+Math.random()*.004,z);o.scale.setScalar(r);o.rotation.y=Math.random()*6;o.visible=true;o.userData={t:0,life:life||4}}
// stuck arrows / spears / bones following a creep
const STUCK=[];function stick(kind,c,i){if(FXQ.low&&Math.random()<.6)return;let e=STUCK.find(e=>!e.on);if(!e){if(STUCK.length>50)return;const o=makeProj(kind==='bone'?'bone':kind==='spear'?'spear':'arrow');scene.add(o);e={o,kind};STUCK.push(e)}
 if(e.kind!==kind){scene.remove(e.o);e.s0=0;e.o=makeProj(kind==='bone'?'bone':kind==='spear'?'spear':'arrow');scene.add(e.o);e.kind=kind}
 e.on=true;e.c=c;e.i=i;e.t=0;e.ox=(Math.random()-.5)*.25;e.oy=.5+Math.random()*.4;e.ang=Math.random()*6;e.o.visible=true;if(!e.s0)e.s0=e.o.scale.x;e.o.scale.setScalar(e.s0*.8)}
// lingering clouds that keep emitting
const CLOUDS=[];function cloud(x,z,r,col,dur){if(CLOUDS.length>(FXQ.low?6:16))CLOUDS.shift();CLOUDS.push({x,z,r,col,t:dur})}
function shake(i,amt){if(i===0&&cam.dist<60)cam.shake=Math.min(.9,Math.max(cam.shake||0,amt))}
function updateImpacts(dt){const now=performance.now()/1000;
 for(const o of DECALS)if(o.visible){const u=o.userData;u.t+=dt;if(u.t>=u.life)o.visible=false;else o.material.opacity=.45*Math.min(1,(u.life-u.t)/1.2)}
 for(const e of STUCK)if(e.on){e.t+=dt;const c=e.c;if(e.t>.7||c.dead||!G.players[e.i].creeps.includes(c)){e.on=false;e.o.visible=false;continue}
  const h=c.fly?1.6:0;e.o.position.set(OX(e.i)+c.x+e.ox,h+e.oy,c.y);e.o.rotation.set(.5,e.ang,0)}
 for(let k=CLOUDS.length-1;k>=0;k--){const q=CLOUDS[k];q.t-=dt;if(q.t<=0){CLOUDS.splice(k,1);continue}if(Math.random()<dt*(FXQ.low?8:22)){const a=Math.random()*TAU,r=Math.random()*q.r;emit(q.x+Math.cos(a)*r,.2,q.z+Math.sin(a)*r,(Math.random()-.5)*.3,.35,(Math.random()-.5)*.3,1.6,.7,q.col[0],q.col[1],q.col[2],-.05)}}
 // war drums: rhythmic pulse rings on the drums and the towers they buff
 if(G&&!G.inLobby)G.players.forEach((p,i)=>{if(!(i===0||laneNear(i)))return;for(const d of p.towers){if(!d.def.support)continue;const beat=Math.floor((now+d.x*.07)*1.25);if(d._beat===beat)continue;d._beat=beat;
  ringFx(OX(i)+d.x+.5,d.y+.5,d.def.range,0xff7030,.6,.08);if(i===0)sfx('drum');if(FXQ.low)continue;let n=0;for(const t of p.towers)if(t!==d&&!t.def.support&&Math.hypot(d.x-t.x,d.y-t.y)<=d.def.range+.01&&n++<8)ringFx(OX(i)+t.x+.5,t.y+.5,.75,0xffa040,.45,.1)}})}
// creep status: frozen crystals, burning embers, poison bubbles, flinch
function creepStatus(v,c,i,h,near,dt){if(!near)return;const x=OX(i)+c.x,z=c.y,lo=FXQ.low?.4:1;
 if(c.slowT>0){if(!v.ice){v.ice=new T.Group();for(let k=0;k<3;k++){const m=new T.Mesh(geo('icec',()=>new T.OctahedronGeometry(.11)),new T.MeshBasicMaterial({color:0xbff0ff,transparent:true,opacity:.85}));m.position.set(Math.cos(k*2.1)*.28,.25+k*.18,Math.sin(k*2.1)*.28);m.scale.y=1.8;v.ice.add(m)}v.o.add(v.ice)}v.ice.visible=true;v.ice.rotation.y+=dt*.8}else if(v.ice)v.ice.visible=false;
 if(c.burnT>0){c.burnT-=dt;if(Math.random()<dt*14*lo)emit(x+(Math.random()-.5)*.35,h+.4+Math.random()*.5,z+(Math.random()-.5)*.35,0,1.1,0,.45,.25,1,.5+Math.random()*.3,.1,-.6)}
 if(c.dotT>0&&Math.random()<dt*10*lo){const g=c.dotCol||C('toxic');emit(x+(Math.random()-.5)*.4,h+.9,z+(Math.random()-.5)*.4,0,-.4-Math.random()*.4,0,.7,.2,g[0],g[1],g[2],2.5);if(Math.random()<.4)emit(x,h+.5,z,(Math.random()-.5)*.3,.7,(Math.random()-.5)*.3,.6,.18,.6,1,.4,-.3)}
 if(c.flinch>0){c.flinch-=dt;const f=Math.sin(c.flinch/.18*Math.PI)*.22;v.o.position.x-=Math.cos(c.dir||0)*f;v.o.position.z-=Math.sin(c.dir||0)*f}}
Object.assign(SFX,{
 thunk:()=>{noise(.06,.12,1800);tone(180,.07,'triangle',.06,90)},splinter:()=>{noise(.05,.08,5000,0,4);tone(900,.04,'square',.02,300)},
 blast:()=>{noise(.6,.32,380);tone(70,.45,'sine',.3,30);noise(.25,.12,2500,.05)},ice:()=>{tone(2400,.12,'triangle',.05,3200);tone(3100,.15,'sine',.03,null,.03);noise(.1,.05,7000,0,6)},
 pierce:()=>{noise(.12,.14,3000,0,3);tone(520,.1,'sawtooth',.05,140)},shatter:()=>{noise(.18,.12,4500,0,5);tone(1200,.08,'square',.03,500);tone(700,.1,'square',.02,null,.04)},
 critS:()=>{tone(180,.18,'sawtooth',.09,60);noise(.15,.16,1400)},sizzle:()=>{noise(.35,.1,6000,0,1)},stunS:()=>{[1568,1976,2349].forEach((f,k)=>tone(f,.08,'triangle',.03,null,k*.05))},
 zap:()=>{noise(.12,.12,6000,0,8);tone(900,.1,'sawtooth',.05,2400);tone(1800,.06,'square',.02,null,.04)},drum:()=>{tone(95,.18,'sine',.12,55);noise(.05,.05,300)},
 bubble:()=>{tone(400,.08,'sine',.04,800);tone(600,.06,'sine',.03,1100,.05)},wisp:()=>{tone(700,.3,'sine',.04,1400);tone(1050,.25,'sine',.02,null,.06)},
 splat:()=>{noise(.2,.2,700);tone(120,.15,'sine',.1,60)},toxic:()=>{noise(.3,.08,900,0,2);tone(160,.25,'sine',.04,110)},breath:()=>{noise(.35,.12,3500,0,1);tone(1700,.25,'sine',.03,900)},
 dieBone:()=>{noise(.1,.08,3500,0,4);tone(500,.08,'square',.03,200)},dieMetal:()=>{tone(1300,.2,'square',.03,900);noise(.12,.08,2500)},dieWolf:()=>{tone(700,.25,'sawtooth',.04,250)},
 dieWyv:()=>{tone(900,.35,'sawtooth',.04,180);noise(.2,.05,1500)},dieBoss:()=>{tone(90,.8,'sawtooth',.12,30);noise(.7,.25,300)}});
function impactFx(type,p,i,wx,wz,o,m,near){const I=G._imp,me=i===0,snd=n=>{if(me)sfx(n)};
 if(type==='dmgnum'){if(!FXQ.nums||!near||(FXQ.low&&!o.crit&&Math.random()<.5))return true;const v=Math.round(o.v);if(v<1&&!o.crit)return true;
  floatText(wx+(Math.random()-.5)*.4,(o.fly?2.3:1.5)+Math.random()*.2,wz,o.crit?v+'!':''+v,false,o.crit?'#ff3a2a':o.dot?'#9cff6a':'#fff4d0',o.crit?'24px':o.dot?'11px':'12px');return true}
 if(type==='death'){const y=o.fly?1.6:.5,n=x=>Math.max(1,Math.round(x*m));
  switch(o.type){case 'fast':burst(wx,y,wz,n(18),2.4,.7,.28,[C('blood'),C('fur'),C('gore')],4);decal(wx,wz,.45,0x5a0a08,3);snd('dieWolf');break;
   case 'armored':burst(wx,.8,wz,n(16),3,.6,.22,[C('steel'),C('white'),C('gold')],5);burst(wx,.5,wz,n(8),1.8,1,.35,[C('steel'),[.4,.4,.45]],6);burst(wx,.8,wz,n(6),.5,1.4,.45,[C('purple')],-1.5,3);snd('dieMetal');break;
   case 'flying':for(let k=0;k<n(22);k++)emit(wx+(Math.random()-.5)*.6,y,wz+(Math.random()-.5)*.6,(Math.random()-.5)*2,Math.random()*1.5,(Math.random()-.5)*2,1.8,.3,...(k%3?C('feather'):C('white')),.6);burst(wx,y,wz,n(10),2,.5,.3,[C('blood')],3);snd('dieWyv');break;
   case 'boss':burst(wx,.8,wz,n(50),4,1,.5,[C('gore'),C('blood'),C('dirt')],5);ringFx(wx,wz,3,0xff4010,.8);ringFx(wx,wz,2,0xffffff,.5);flashFx(wx,1,wz,0xff6020,6,.5);decal(wx,wz,1.6,0x3a0806,6);shake(i,.8);snd('dieBoss');break;
   default:burst(wx,.6,wz,n(18),2.2,.8,.26,[C('bone'),C('bone'),[.6,.58,.5]],5);for(let k=0;k<n(8);k++)emit(wx,.7,wz,(Math.random()-.5)*.4,1+Math.random(),(Math.random()-.5)*.4,1.4,.4,...C('soul'),-.6);snd('dieBone')}
  return true}
 if(type==='chain'&&!o.thin){const pts=o.pts.map((q,k)=>[OX(i)+q[0],k===0?1.9:(q[2]||.8),q[1]]);for(let k=1;k<pts.length&&!FXQ.low;k++){const q=pts[k];for(let b=0;b<2;b++){const a=Math.random()*TAU;chainFx([q,[q[0]+Math.cos(a)*.7,q[1]+.3+Math.random()*.5,q[2]+Math.sin(a)*.7],[q[0]+Math.cos(a)*1.1,q[1]+Math.random()*.6,q[2]+Math.sin(a)*1.2]],0xc0e8ff,false)}
  burst(q[0],q[1],q[2],Math.max(2,Math.round(8*m)),3,.3,.15,[C('elec'),C('white')],2)}flashFx(pts[0][0],pts[0][1],pts[0][2],0x80c0ff,3,.25);snd('zap');return false}
 if(type==='pulse'){const r=o.r||1.8;for(let k=0;k<Math.round(26*m);k++){const a=k/26*TAU;emit(wx+Math.cos(a)*.3,.15,wz+Math.sin(a)*.3,Math.cos(a)*r*1.6,.25,Math.sin(a)*r*1.6,.6,.4,...C('toxic'),0)}ringFx(wx,wz,r,0x60ff30,.7,.08);ringFx(wx,wz,r*.6,0xb0ff60,.45,.12);snd('toxic');return true}
 if(!I||!(type==='boom'||type==='spark'||type==='frosthit'))return false;
 const k=I.k,c=I.tgt,y=I.air?1.6:.7,n=x=>Math.max(1,Math.round(x*m)),r=o.r||I.splash||1;
 switch(k){
 case 'arrow':burst(wx,y,wz,n(7),1.6,.35,.13,[C('wood'),C('wood'),C('blood')],5);if(c&&!c.dead)stick('arrow',c,i);snd('splinter');break;
 case 'spear':burst(wx,y,wz,n(9),1.4,.4,.2,[C('wood'),C('dirt'),C('blood')],5);flashFx(wx,y,wz,0xffe0a0,.9,.12);if(c&&!c.dead){stick('spear',c,i);c.flinch=.18}
  if(I.stun){for(let q=0;q<n(10);q++){const a=q/10*TAU;emit(wx+Math.cos(a)*.35,y+.8,wz+Math.sin(a)*.35,-Math.sin(a)*1.2,.2,Math.cos(a)*1.2,.7,.25,...C('gold'),0)}floatText(wx,y+1.2,wz,'stun!',false,'#ffe040','13px');snd('stunS')}else snd('thunk');break;
 case 'cannon':case 'rock':{const big=r>=1.3||I.lvl>=3;burst(wx,.4,wz,n(26),3.4,.55,.42,[C('fire'),C('fire2'),[1,.35,.05]],3);burst(wx,.3,wz,n(14),1,1.5,.75,[C('smoke'),[.22,.2,.19]],-.4,2);
  burst(wx,.3,wz,n(10),3,1,.2,[k==='rock'?[.5,.45,.4]:C('dirt'),[.25,.2,.15]],9,2);ringFx(wx,wz,r*1.1,0xff8030,.45);flashFx(wx,.8,wz,0xff7020,3.4,.3);decal(wx,wz,r*.5,0x1a120c,4.5);if(big)shake(i,.35);snd('blast');break}
 case 'meat':burst(wx,.4,wz,n(22),2.6,.6,.3,[C('gore'),C('green'),C('toxic')],5);decal(wx,wz,r*.55,0x3a6a10,5);ringFx(wx,wz,r,0x70e030,.5);cloud(wx,wz,r*.8,C('toxic'),2.5);snd('splat');
  if(c)c.dotCol=C('toxic');break;
 case 'frost':burst(wx,y,wz,n(18),2.6,.5,.2,[C('ice'),C('ice2'),C('white')],2.5);ringFx(wx,wz,.95,0x9ff0ff,.45,y-.4);flashFx(wx,y,wz,0xc0f4ff,1.6,.2);snd('ice');break;
 case 'wyrm':{const a=(I.a||0)+Math.PI;for(let q=0;q<n(26);q++){const s=(Math.random()-.5)*.9,sp=2+Math.random()*2.5;emit(wx,y,wz,Math.cos(a+s)*sp,(Math.random()-.5)*1.2,Math.sin(a+s)*sp,.55,.35,...(q%2?C('ice'):C('ice2')),.2)}
  burst(wx,y,wz,n(14),2.2,.5,.25,[C('white'),C('ice')],.5);ringFx(wx,wz,r*1.2,0x9fe0ff,.5,y-.3);flashFx(wx,y,wz,0xb0e8ff,2.4,.25);snd('breath');break}
 case 'sniper':case 'bone':{const a=I.a||0,cr=I.crit;chainFx([[wx-Math.cos(a)*2.2,y+.15,wz-Math.sin(a)*2.2],[wx+Math.cos(a)*.6,y,wz+Math.sin(a)*.6]],k==='bone'?0xe8f0d0:0xfff0c0,true);
  burst(wx,y,wz,n(10),2.2,.4,.18,k==='bone'?[C('bone'),C('white')]:[C('steel'),C('blood')],4);if(c&&!c.dead){c.flinch=.18;if(k==='bone')stick('bone',c,i)}
  if(cr){burst(wx,y,wz,n(24),3.5,.6,.26,[C('bone'),C('white'),C('blood')],5);ringFx(wx,wz,1.1,0xff3020,.4,y-.3);flashFx(wx,y,wz,0xff4030,2.2,.25);snd('critS');snd('shatter')}else snd('pierce');break}
 case 'flak':burst(wx,y,wz,n(20),2.6,.45,.3,[C('fire'),C('fire2'),[1,.3,.05]],1);flashFx(wx,y,wz,0xff7020,2.6,.25);ringFx(wx,wz,r,0xff9030,.4,y-.3);
  if(o.r)for(const cc of G.players[i].creeps)if(!cc.dead&&Math.hypot(cc.x-(wx-OX(i)),cc.y-wz)<=r)cc.burnT=1.6;snd('sizzle');break;
 case 'poison':burst(wx,y,wz,n(12),1.6,.5,.2,[C('toxic'),C('green'),[.2,.5,.1]],3);if(c){c.dotCol=C('toxic')}snd('bubble');break;
 case 'spirit':{burst(wx,y,wz,n(14),2,.45,.24,[C('purple'),C('soul'),C('white')],0);for(let q=0;q<n(6);q++){const a=Math.random()*TAU;emit(wx+Math.cos(a)*.2,y,wz+Math.sin(a)*.2,Math.cos(a)*.4,1.2+Math.random()*.6,Math.sin(a)*.4,1.2,.32,...C('soul'),-.3)}
  flashFx(wx,y,wz,0xa060ff,1.6,.2);if(I.crit){ringFx(wx,wz,1,0xff40ff,.4,y-.3);snd('critS')}else snd('wisp');break}
 default:return false}
 return true}
// settings buttons
{const pane=document.getElementById('mute').parentNode;const b1=document.createElement('button'),b2=document.createElement('button');b1.id='fxq';b2.id='nums';pane.append(b1,b2);
 const lab=()=>{b1.textContent='✨ Effects: '+(FXQ.low?'Low':'High');b2.textContent='🔢 Dmg numbers: '+(FXQ.nums?'On':'Off')};lab();
 b1.onclick=()=>{FXQ.low=!FXQ.low;localStorage.setItem('ltw_fxlow',FXQ.low?'1':'0');lab()};b2.onclick=()=>{FXQ.nums=!FXQ.nums;localStorage.setItem('ltw_nums',FXQ.nums?'1':'0');lab()};window.LTW.FXQ=FXQ}
