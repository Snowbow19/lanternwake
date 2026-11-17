export function baseShip() {
  return {speed:155,maxHull:100,towCapacity:3,ropeLength:43,armor:0,flareCapacity:2,visibility:220,boostRecovery:.14,upgrades:[]};
}

export const UPGRADE_CATALOG = {
  engine:{id:'engine',name:'Copper engine',mark:'↗',description:'18% faster cruise. Boost returns sooner.'},
  plating:{id:'plating',name:'Harbor plating',mark:'▣',description:'25 more hull. Leave the dock fully repaired.'},
  winch:{id:'winch',name:'Swift winch',mark:'⌁',description:'One extra tow berth. Shorter, tighter lines.'},
  shield:{id:'shield',name:'Storm bell',mark:'✧',description:'Take 30% less damage from squalls and whirlpools.'},
  lantern:{id:'lantern',name:'Signal lantern',mark:'✷',description:'An extra flare. See farther through the fog.'},
};

export function choicesFor(levelIndex) {
  return [['engine','plating','winch'],['lantern','shield','engine'],['winch','shield','plating']][Math.min(2,levelIndex)].map(id=>UPGRADE_CATALOG[id]);
}

export function applyUpgrade(ship,id) {
  if(!UPGRADE_CATALOG[id])return {...ship,upgrades:[...ship.upgrades]};
  const next={...ship,upgrades:[...ship.upgrades,id]};
  if(id==='engine'){next.speed=Math.min(245,next.speed*1.18);next.boostRecovery+=.035;}
  if(id==='plating')next.maxHull+=25;
  if(id==='winch'){next.towCapacity=Math.min(5,next.towCapacity+1);next.ropeLength=Math.max(29,next.ropeLength-6);}
  if(id==='shield')next.armor=Math.min(.7,next.armor+.3);
  if(id==='lantern'){next.flareCapacity++;next.visibility+=50;}
  return next;
}

export function restoreShip(value) {
  let ship=baseShip();
  for(const id of (Array.isArray(value?.upgrades)?value.upgrades:[]).slice(0,3))ship=applyUpgrade(ship,id);
  return ship;
}
