import { restoreShip } from './upgrades.js';

const KEY='lanternwake.northreach.v2';
const number=(v,max)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(max,v)):0;
const fresh=()=>({unlocked:0,bests:Array.from({length:4},()=>({score:0,medal:0,time:0})),campaignBest:0,checkpoint:null,sound:false});
let memory=fresh();
let memoryIsNewer=false;

function normalize(value) {
  const data=fresh();
  if(!value||typeof value!=='object')return data;
  data.unlocked=Math.floor(number(value.unlocked,3));
  data.campaignBest=Math.round(number(value.campaignBest,1000000));
  data.sound=value.sound===true;
  data.bests=data.bests.map((b,i)=>({score:Math.round(number(value.bests?.[i]?.score,1000000)),medal:Math.floor(number(value.bests?.[i]?.medal,3)),time:number(value.bests?.[i]?.time,1000)}));
  const cp=value.checkpoint;
  if(cp&&Number.isInteger(cp.level)&&cp.level>=1&&cp.level<=3){
    data.checkpoint={level:cp.level,ship:restoreShip(cp.ship),score:number(cp.score,1000000),rescued:Math.floor(number(cp.rescued,100)),elapsed:number(cp.elapsed,10000)};
  }
  return data;
}

export function loadSave() {
  try {if(!memoryIsNewer){const saved=localStorage.getItem(KEY);if(saved)memory=normalize(JSON.parse(saved));}}
  catch { /* The voyage still works when storage is unavailable or damaged. */ }
  return structuredClone(memory);
}

export function saveProgress(value) {
  memory=normalize(value);
  try {localStorage.setItem(KEY,JSON.stringify(memory));memoryIsNewer=false;}
  catch {memoryIsNewer=true;}
  return structuredClone(memory);
}
