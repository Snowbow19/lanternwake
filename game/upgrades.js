import {shipProfile} from './ships.js';
export function baseShip(type='tug') {
  const {id,name,mark,tag,unlock,...stats}=shipProfile(type);
  return {...stats,type:id,upgrades:[]};
}
export const UPGRADE_CATALOG={
  engine:{id:'engine',name:'Copper engine',mark:'↗',cost:12,description:'18% faster cruise. Boost returns sooner.'},
  plating:{id:'plating',name:'Harbor plating',mark:'▣',cost:10,description:'25 more hull. Leave fully repaired.'},
  winch:{id:'winch',name:'Swift winch',mark:'⌁',cost:14,description:'One extra berth. Stronger, tighter tow lines.'},
  shield:{id:'shield',name:'Storm bell',mark:'✧',cost:12,description:'30% less damage from squalls and whirlpools.'},
  lantern:{id:'lantern',name:'Signal lantern',mark:'✷',cost:9,description:'An extra flare. See farther through fog.'},
};
export function choicesFor(levelIndex){return [['engine','plating','winch'],['lantern','shield','engine'],['winch','shield','plating']][Math.max(0,levelIndex)%3].map(id=>UPGRADE_CATALOG[id]);}
export function applyUpgrade(ship,id){
  if(!UPGRADE_CATALOG[id])return {...ship,upgrades:[...ship.upgrades]};
  const next={...ship,upgrades:[...ship.upgrades,id]};
  if(id==='engine'){next.speed=Math.min(245,next.speed*1.18);next.boostRecovery=Math.min(.35,next.boostRecovery+.035);}
  if(id==='plating')next.maxHull=Math.min(220,next.maxHull+25);
  if(id==='winch'){next.towCapacity=Math.min(5,next.towCapacity+1);next.ropeLength=Math.max(29,next.ropeLength-6);next.lineStrength=Math.min(210,next.lineStrength+22);}
  if(id==='shield')next.armor=Math.min(.7,next.armor+.3);
  if(id==='lantern'){next.flareCapacity=Math.min(5,next.flareCapacity+1);next.visibility=Math.min(400,next.visibility+50);}
  return next;
}
export function restoreShip(value){let ship=baseShip(value?.type);for(const id of (Array.isArray(value?.upgrades)?value.upgrades:[]).slice(0,24))ship=applyUpgrade(ship,id);return ship;}
