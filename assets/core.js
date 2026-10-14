// Small gameplay wrappers on top of logic.js (stuns, tower owners, AI tower upgrades). Heroes/base tiers were removed in v5.
"use strict";
function towerMax(t){return 4}
const _moveCreep=moveCreep;moveCreep=function(p,c,dt){if(c.stunT>0){c.stunT-=dt;return}_moveCreep(p,c,dt)};
const _hit=hit;hit=function(p,pr,tgt){_hit(p,pr,tgt);if(pr.stun&&tgt&&!tgt.dead)tgt.stunT=pr.stun};
const _aiStep=aiStep;aiStep=function(p,dt){_aiStep(p,dt);if(p.gold>90&&p.towers.length>20&&Math.random()<dt*2){const c=p.towers.filter(t=>upCost(t)!=null).sort((a,b)=>b.lvl-a.lvl||Math.abs(a.x-5)-Math.abs(b.x-5));if(c[0]&&p.gold-upCost(c[0])>30)upgrade(p,c[0])}};
