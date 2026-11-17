export function createParticles() {
  let wakes=[],sparks=[],seed=731,shock=0;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  return {
    clear(){wakes=[];sparks=[];shock=0;},
    get shock(){return shock;},
    event(e){
      if(e.type==='wake')wakes.push({...e,life:1.6});
      if(['damage','crewLost'].includes(e.type)){shock=.8;for(let i=0;i<15;i++)sparks.push({x:e.x,y:e.y,vx:(rand()-.5)*110,vy:(rand()-.5)*110,life:.5+rand(),danger:true});}
      if(['rescue','won','flare','salvage'].includes(e.type))for(let i=0;i<(e.type==='won'?80:24);i++)sparks.push({x:e.x,y:e.y,vx:(rand()-.5)*120,vy:(rand()-.5)*120,life:.6+rand()*1.4});
    },
    update(dt){shock=Math.max(0,shock-dt);wakes=wakes.filter(w=>(w.life-=dt)>0);sparks=sparks.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;p.vy*=.98;return p.life>0;});},
    draw(ctx){
      for(const w of wakes){ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.angle);ctx.strokeStyle=`rgba(155,205,187,${w.life*.18})`;ctx.lineWidth=1.1;const age=1.6-w.life;ctx.beginPath();ctx.moveTo(-age*11,-(3+age*8)*w.size);ctx.quadraticCurveTo(-age*15,0,-age*11,(3+age*8)*w.size);ctx.stroke();ctx.restore();}
      for(const p of sparks){ctx.fillStyle=p.danger?`rgba(237,134,94,${Math.min(1,p.life)})`:`rgba(246,210,130,${Math.min(1,p.life)})`;ctx.beginPath();ctx.arc(p.x,p.y,1.6,0,Math.PI*2);ctx.fill();}
    },
  };
}
