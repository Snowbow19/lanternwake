const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const emit=(s,type,data={})=>s.events.push({type,...data});

export function createEncounter(chart){
  return {
    beacons:(chart.beacons||[]).map(b=>({...b,lit:false})),
    monster:chart.monster?{...chart.monster,phase:'hunting',stunnedUntil:0,nextAttack:7,strikes:[],attacks:0,retreatAt:0}:null,
  };
}
export const signalsReady=s=>s.beacons.every(b=>b.lit);
export function signalFlare(s,flare){
  for(const b of s.beacons)if(!b.lit&&gap(b,flare)<115){
    b.lit=true;
    emit(s,'beacon',{x:b.x,y:b.y,points:250,text:`${b.name} is alight. +250`});
    s.signalScore+=250;
  }
  const m=s.monster;
  if(!m||m.phase==='retreating')return;
  if(gap(m,flare)<260||m.strikes.some(a=>gap(a,flare)<150)){
    m.stunnedUntil=s.elapsed+8;m.strikes=[];m.nextAttack=s.elapsed+9;
    emit(s,'stun',{x:m.x,y:m.y,text:'The light drives it back. Eight seconds of clear water.'});
  }
  if(signalsReady(s)){
    m.phase='retreating';m.retreatAt=s.elapsed;m.strikes=[];s.signalScore+=600;
    emit(s,'banish',{x:m.x,y:m.y,points:600,text:'Both signals are burning. The deep lets go. +600'});
  }
}
export function tickEncounter(s,dt){
  const m=s.monster;if(!m||m.phase==='retreating'||s.elapsed<m.stunnedUntil)return;
  if(s.elapsed>=m.nextAttack){
    const lit=s.beacons.filter(b=>b.lit).length;
    // Each strike stays where it was announced: steering is always a way out.
    const x=Math.max(45,Math.min(995,s.tug.x+s.tug.vx*.3)),y=Math.max(90,Math.min(425,s.tug.y+s.tug.vy*.3));
    m.strikes.push({x,y,r:lit?49:43,at:s.elapsed+1.65,hit:false,until:s.elapsed+2.4});
    if(lit)m.strikes.push({x:Math.max(45,Math.min(995,x+Math.sin(m.attacks*2.4)*110)),y:Math.max(90,Math.min(425,y+90)),r:38,at:s.elapsed+2.15,hit:false,until:s.elapsed+2.9});
    m.attacks++;m.nextAttack=s.elapsed+(lit?4.4:5.8);
    emit(s,'warning',{x,y,text:'Deep surge. Clear the marked water.'});
  }
  for(const a of m.strikes){
    if(!a.hit&&s.elapsed>=a.at){
      a.hit=true;emit(s,'surge',{x:a.x,y:a.y});
      const hit=Math.hypot((a.x-s.tug.x)/(a.r+13),(a.y-s.tug.y)/(a.r*.72+10))<1;
      if(hit&&s.damageCooldown<=0){
        s.hull=Math.max(0,s.hull-23*(1-s.ship.armor));s.damageCooldown=1.1;
        emit(s,'damage',{x:s.tug.x,y:s.tug.y,text:'The deep struck your hull. Move before the next surge.'});
      }
    }
  }
  m.strikes=m.strikes.filter(a=>s.elapsed<a.until);
}
