import {restoreShip} from './upgrades.js';
import {shipUnlocked} from './ships.js';
const KEY='lanternwake.northreach.v2';
const number=(v,max)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(max,v)):0;
const fresh=()=>({unlocked:0,bests:Array.from({length:4},()=>({score:0,medal:0,time:0})),campaignBest:0,stormBest:0,stormWatch:0,selectedShip:'tug',checkpoint:null,stormCheckpoint:null,sound:false});
let memory=fresh(),memoryIsNewer=false;
function checkpoint(cp,endless=false){
  if(!cp||!Number.isInteger(cp.level)||cp.level<0||cp.level>3)return null;
  if(!endless&&cp.level===0)return null;
  if(endless&&(!Number.isInteger(cp.watch)||cp.watch<1||cp.watch>999))return null;
  const ship=restoreShip(cp.ship);
  return{level:cp.level,ship,hull:cp.hull===undefined?ship.maxHull:Math.max(1,number(cp.hull,ship.maxHull)),brass:Math.floor(number(cp.brass,100000)),score:number(cp.score,10000000),rescued:Math.floor(number(cp.rescued,10000)),elapsed:number(cp.elapsed,100000),...(endless?{watch:cp.watch}:{})};
}
function normalize(value){
  const data=fresh();if(!value||typeof value!=='object')return data;
  data.unlocked=Math.floor(number(value.unlocked,3));data.campaignBest=Math.round(number(value.campaignBest,10000000));data.sound=value.sound===true;
  data.bests=data.bests.map((b,i)=>({score:Math.round(number(value.bests?.[i]?.score,10000000)),medal:Math.floor(number(value.bests?.[i]?.medal,3)),time:number(value.bests?.[i]?.time,1000)}));
  data.stormBest=Math.round(number(value.stormBest,10000000));data.stormWatch=Math.floor(number(value.stormWatch,1000));
  data.selectedShip=['tug','skiff','cutter'].includes(value.selectedShip)&&shipUnlocked(value.selectedShip,data)?value.selectedShip:'tug';
  data.checkpoint=checkpoint(value.checkpoint);data.stormCheckpoint=checkpoint(value.stormCheckpoint,true);
  return data;
}
export function loadSave(){try{if(!memoryIsNewer){const saved=localStorage.getItem(KEY);if(saved)memory=normalize(JSON.parse(saved));}}catch{}return structuredClone(memory);}
export function saveProgress(value){memory=normalize(value);try{localStorage.setItem(KEY,JSON.stringify(memory));memoryIsNewer=false;}catch{memoryIsNewer=true;}return structuredClone(memory);}
