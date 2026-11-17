import { getLevel } from './levels.js';
import {crewBrass,salvageBrass} from './economy.js';
import {createEncounter,signalFlare,tickEncounter,signalsReady} from './encounters.js';

export const WIDTH=1040, HEIGHT=480;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const event=(state,type,data={})=>state.events.push({type,...data});

export const chartOf=state=>state.chart||getLevel(state.levelIndex);
export function createVoyage(levelIndex,ship,options={}) {
  const level=options.chart||getLevel(levelIndex);
  return {levelIndex,chart:level,watch:options.watch,ship:{...ship,upgrades:[...ship.upgrades]},mode:'playing',elapsed:0,hull:clamp(options.hull??ship.maxHull,1,ship.maxHull),
    ...createEncounter(level),signalScore:0,rescueChain:0,lastRescue:-100,chainScore:0,refillTime:0,
    rescued:0,lost:0,brassEarned:0,urgencyBonus:0,maxStrain:0,score:0,boost:1,flares:ship.flareCapacity,flare:null,damageCooldown:0,
    tug:{...level.spawn,vx:0,vy:0,angle:level.harbor.x>520?Math.PI:0,target:null},
    boats:level.boats.map((b,i)=>{const distress=b.urgency??100+levelIndex*12+(i%3)*18;return{...b,ox:b.x,oy:b.y,vx:0,vy:0,angle:i*.4,state:'waiting',discovered:!level.fog,distress,initialDistress:distress,strain:0,tension:0};}),
    tow:[],maxConvoy:0,salvaged:0,salvage:level.salvage.map(s=>({...s,taken:false})),
    hazards:level.hazards.map(h=>({...h,calmedUntil:0})),events:[],wakeTick:0};
}

export function hazardsAt(state) {
  return state.hazards.map(h=>({...h,
    x:h.x+(h.kind==='squall'?Math.sin(state.elapsed*.045+h.phase)*55:0),
    y:h.y+(h.kind==='squall'?Math.sin(state.elapsed*.06+h.phase)*28:0),
    calm:h.calmedUntil>state.elapsed}));
}

export function attachTow(state) {
  if(state.mode!=='playing')return;
  const boat=state.boats.filter(b=>b.state==='waiting'&&distance(b,state.tug)<82).sort((a,b)=>distance(a,state.tug)-distance(b,state.tug))[0];
  if(!boat){event(state,'message',{text:'Close on an orange lantern, then take its line.'});return;}
  if(state.tow.length>=state.ship.towCapacity){event(state,'message',{text:'Your tow berths are full. Bring this convoy home.'});return;}
  boat.state='towing';state.tow.push(boat);state.maxConvoy=Math.max(state.maxConvoy,state.tow.length);
  event(state,'tow',{text:`${boat.name} is on your line.`,x:boat.x,y:boat.y});
}

export function launchFlare(state) {
  if(state.mode!=='playing')return;
  if(state.flares<=0){event(state,'message',{text:'No flares left. Rescue a crew or wait at the harbor to resupply.'});return;}
  state.flares--;state.flare={x:state.tug.x,y:state.tug.y,until:state.elapsed+9,r:state.ship.visibility+160};
  signalFlare(state,state.flare);
  for(const [i,h] of hazardsAt(state).entries())if(distance(h,state.tug)<220)state.hazards[i].calmedUntil=state.elapsed+8;
  for(const boat of state.boats)if(boat.state==='waiting'&&distance(boat,state.flare)<state.flare.r)boat.distress=Math.min(180,boat.distress+18);
  event(state,'flare',{x:state.tug.x,y:state.tug.y,text:'Signal burning. Crews have more time; nearby squalls are calm.'});
}

export function voyageScore(state,won=false){const level=chartOf(state);return state.rescued*300+state.salvaged*100+state.maxConvoy*100+(state.rescued?Math.ceil(state.hull)*3:0)+Math.round(state.urgencyBonus)+state.signalScore+state.chainScore+(won?Math.max(0,Math.ceil(level.seconds-state.elapsed))*2:0);}
function settle(state,won) {
  const level=chartOf(state);
  state.mode=won?'won':'lost';state.tug.target=null;state.maxStrain=0;
  state.score=voyageScore(state,won);
  state.medal=won?(state.hull/state.ship.maxHull>=.75&&state.elapsed<level.seconds*.7?3:state.hull/state.ship.maxHull>=.4?2:1):0;
  event(state,won?'won':'lost',{score:state.score,medal:state.medal,x:level.harbor.x,y:level.harbor.y});
}

function flowAt(level,point) {
  const flow={x:0,y:0};
  for(const c of level.currents)if(point.x>c.x&&point.x<c.x+c.w&&point.y>c.y&&point.y<c.y+c.h){flow.x+=c.vx;flow.y+=c.vy;}
  return flow;
}

export function tickVoyage(state,input,dt) {
  if(state.mode!=='playing')return;
  const level=chartOf(state),tug=state.tug;
  state.elapsed+=dt;state.damageCooldown=Math.max(0,state.damageCooldown-dt);
  if(state.flare&&state.flare.until<=state.elapsed)state.flare=null;
  tickEncounter(state,dt);
  if(state.hull<=0){settle(state,false);return;}
  let mx=(input.right?1:0)-(input.left?1:0),my=(input.down?1:0)-(input.up?1:0),arrival=1;
  if(mx||my)tug.target=null;
  else if(tug.target){const d=distance(tug,tug.target);arrival=clamp(d/55,0,1);if(d>1){mx=(tug.target.x-tug.x)/d;my=(tug.target.y-tug.y)/d;}else arrival=0;}
  const magnitude=Math.hypot(mx,my);if(magnitude){mx/=magnitude;my/=magnitude;}
  const boosting=input.boost&&state.boost>.015&&magnitude>0;
  state.boost=clamp(state.boost+(boosting?-.32:state.ship.boostRecovery)*dt,0,1);
  const speed=state.ship.speed*(boosting?1.52:1)*(1-state.tow.length*.1)*arrival;
  const current=flowAt(level,tug),drift=tug.target?arrival:1;
  current.x+=Math.sin(tug.y*.013+state.elapsed*.2)*7*drift;
  current.y+=Math.cos(tug.x*.01+state.elapsed*.16)*5*drift;
  const hazards=hazardsAt(state);
  for(const h of hazards){
    const d=distance(h,tug);
    if(h.kind==='whirlpool'&&d<h.r*2&&!h.calm){
      const pull=42*(1-d/(h.r*2));current.x+=(h.x-tug.x)/(d||1)*pull;current.y+=(h.y-tug.y)/(d||1)*pull;
      current.x-=(h.y-tug.y)/(d||1)*16;current.y+=(h.x-tug.x)/(d||1)*16;
    }
    if(d<h.r&&!h.calm){state.hull=Math.max(0,state.hull-dt*(h.kind==='whirlpool'?10:7)*(1-state.ship.armor)*(level.damageScale||1));}
  }
  if(state.hull<=0){settle(state,false);return;}
  const blend=1-Math.exp(-dt*5);
  tug.vx+=(mx*speed+current.x-tug.vx)*blend;tug.vy+=(my*speed+current.y-tug.vy)*blend;
  tug.x=clamp(tug.x+tug.vx*dt,30,WIDTH-30);tug.y=clamp(tug.y+tug.vy*dt,78,HEIGHT-45);
  const velocity=Math.hypot(tug.vx,tug.vy);
  if(distance(tug,level.harbor)<level.harbor.r+15&&velocity<28&&state.flares<state.ship.flareCapacity){
    state.refillTime+=dt;
    if(state.refillTime>=2.5){state.refillTime=0;state.flares++;event(state,'salvage',{x:tug.x,y:tug.y,text:'Harbor tender: one signal flare supplied.'});}
  }else state.refillTime=0;
  if(velocity>5){const angle=Math.atan2(tug.vy,tug.vx),diff=(angle-tug.angle+Math.PI*3)%(Math.PI*2)-Math.PI;tug.angle+=diff*Math.min(1,dt*7);}
  for(const rock of level.reefs){
    const d=distance(rock,tug),limit=rock.r+14;
    if(d<limit){const nx=(tug.x-rock.x)/(d||1),ny=(tug.y-rock.y)/(d||1);tug.x=rock.x+nx*limit;tug.y=rock.y+ny*limit;tug.vx*=.35;tug.vy*=.35;
      if(state.damageCooldown===0){state.hull=Math.max(0,state.hull-17);state.damageCooldown=1.1;event(state,'damage',{text:'Reef strike. Find open water.',x:tug.x,y:tug.y});}}
  }
  if(state.hull<=0){settle(state,false);return;}
  for(const item of state.salvage)if(!item.taken&&distance(item,tug)<24){item.taken=true;state.salvaged++;state.boost=1;state.brassEarned+=salvageBrass;event(state,'salvage',{text:`Supplies aboard. Boost restored. +${salvageBrass} brass`,x:item.x,y:item.y});}
  state.wakeTick+=dt;
  if(state.wakeTick>1/18&&velocity>20){state.wakeTick=0;event(state,'wake',{x:tug.x-Math.cos(tug.angle)*15,y:tug.y-Math.sin(tug.angle)*15,angle:tug.angle,size:boosting?1.7:1});}
  let leader=tug,breakAt=-1;state.maxStrain=0;
  for(const [index,b] of state.tow.entries()){
    const d=distance(b,leader);
    if(d>state.ship.ropeLength){const pull=(d-state.ship.ropeLength)*14;b.vx+=(leader.x-b.x)/(d||1)*pull*dt;b.vy+=(leader.y-b.y)/(d||1)*pull*dt;}
    const flow=flowAt(level,b);
    b.vx*=Math.exp(-dt*4);b.vy*=Math.exp(-dt*4);b.x+=(b.vx+flow.x*.15)*dt;b.y+=(b.vy+flow.y*.15)*dt;
    for(const rock of level.reefs){const gap=distance(rock,b),limit=rock.r+11;if(gap<limit){const nx=gap?(b.x-rock.x)/gap:1,ny=gap?(b.y-rock.y)/gap:0;b.x=rock.x+nx*limit;b.y=rock.y+ny*limit;b.vx*=.4;b.vy*=.4;}}
    b.tension=Math.min(1,d/state.ship.lineStrength);state.maxStrain=Math.max(state.maxStrain,b.tension);
    if(d>state.ship.lineStrength){if(b.strain===0)event(state,'message',{text:'Tow line straining. Ease the engine or steer around the reef.'});b.strain+=dt;}else b.strain=Math.max(0,b.strain-dt*2);
    if(b.strain>1.8&&breakAt<0)breakAt=index;
    if(d>1)b.angle=Math.atan2(leader.y-b.y,leader.x-b.x);leader=b;
  }
  if(breakAt>=0){const loose=state.tow.slice(breakAt);for(const boat of loose){boat.state='waiting';boat.strain=0;boat.distress=Math.max(35,boat.distress);}state.tow=state.tow.slice(0,breakAt);event(state,'damage',{text:`Line parted. ${loose.length} ${loose.length===1?'crew is':'crews are'} adrift.`,x:loose[0].x,y:loose[0].y});}
  for(const boat of state.boats)if(boat.state==='waiting'){
    boat.distress=Math.max(0,boat.distress-dt);
    if(boat.distress===0){boat.state='lost';state.lost++;event(state,'crewLost',{text:`${boat.name}'s light went out.`,x:boat.x,y:boat.y});}
  }
  for(const boat of state.boats)if(!boat.discovered&&(distance(boat,tug)<state.ship.visibility||(state.flare&&distance(boat,state.flare)<state.flare.r))){boat.discovered=true;event(state,'discovery',{text:`${boat.name}: lantern sighted.`,x:boat.x,y:boat.y});}
  const delivered=state.tow.filter(b=>distance(b,level.harbor)<level.harbor.r-10&&distance(tug,level.harbor)<level.harbor.r+15);
  for(const b of delivered){
    b.state='safe';state.rescued++;b.x=level.harbor.x-50+(state.rescued%3)*22;b.y=300+Math.floor((state.rescued-1)/3)*19;b.angle=-.18;
    state.rescueChain=state.elapsed-state.lastRescue<8?state.rescueChain+1:1;state.lastRescue=state.elapsed;
    const chain=50*Math.max(0,state.rescueChain-1);state.chainScore+=chain;
    state.urgencyBonus+=b.distress;state.brassEarned+=crewBrass(state.watch??state.levelIndex);
    state.hull=Math.min(state.ship.maxHull,state.hull+7);state.flares=Math.min(state.ship.flareCapacity,state.flares+1);
    event(state,'rescue',{text:`${b.name} is home. ${state.rescueChain>1?`${state.rescueChain} CREW CHAIN · `:''}+${crewBrass(state.watch??state.levelIndex)} brass`,points:300+chain,x:b.x,y:b.y});
  }
  if(delivered.length)state.tow=state.tow.filter(b=>b.state!=='safe');
  if(state.rescued>=level.target&&signalsReady(state))settle(state,true);
  else if(state.elapsed>=level.seconds||state.hull<=0||state.rescued+state.boats.filter(b=>b.state==='waiting'||b.state==='towing').length<level.target)settle(state,false);
}
