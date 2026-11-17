import {getLevel} from './levels.js';
export function createWatch(watch){
  const wave=Math.max(0,watch|0),base=getLevel(wave%4);let seed=1979+wave*997;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const boats=base.boats.map((b,i)=>({...b,x:Math.max(75,Math.min(965,b.x+(rand()-.5)*24)),y:Math.max(100,Math.min(415,b.y+(rand()-.5)*20)),urgency:Math.max(52,154-wave*6)+i*7}));
  const hazards=base.hazards.map(h=>({...h,r:h.r*Math.min(1.45,1+wave*.045)}));
  if(wave>=2){
    const extra={kind:'whirlpool',x:700+Math.sin(wave)*80,y:255,r:35+Math.min(15,wave),phase:0};
    if([base.spawn,base.harbor].some(p=>Math.hypot(p.x-extra.x,p.y-extra.y)<extra.r+65))extra.x=base.harbor.x>520?520:760;
    hazards.push(extra);
  }
  return {...base,id:'watch-'+wave,name:'Stormwatch',number:String(wave+1).padStart(2,'0'),subtitle:['The first watch','The tide turns','No quiet water','Hold the light'][wave%4],
    target:Math.min(boats.length-1,2+Math.floor(wave/2)),seconds:Math.max(90,150-wave*3),boats,hazards,
    damageScale:1+wave*.07,watch:wave,
    briefing:`Watch ${wave+1}. Secure the most urgent crews; keep your hull and brass for the next crossing.`};
}
