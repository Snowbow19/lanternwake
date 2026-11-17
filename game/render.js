import { hazardsAt, distance } from './simulation.js';
import {createCamera,MINIMAP} from './camera.js';
import {shipProfile} from './ships.js';
import {drawBeacons,drawMonster,drawStrikes} from './encounter-art.js';

export function createRenderer(canvas) {
  const ctx=canvas.getContext('2d',{alpha:false}),W=1040,H=480,PI=Math.PI,TAU=PI*2;
  const camera=createCamera(),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let game,level,harbor,rocks,worldTime=0,seed=9987;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const seaMarks=Array.from({length:150},()=>({x:rand()*W,y:rand()*H,w:3+rand()*15,a:rand()}));
  const islandEdge=Array.from({length:32},(_,i)=>{const a=i/32*TAU;return{x:Math.cos(a)*(40+rand()*9),y:Math.sin(a)*(30+rand()*7)}});
  const fog=document.createElement('canvas');fog.width=W;fog.height=H;const fogCtx=fog.getContext('2d');
function ellipse(x,y,rx,ry,color) {ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
function line(points,color,width=1) {ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}

function drawWater() {
  const dawn=game.mode==='won';
  const sea=ctx.createLinearGradient(0,0,W,H);sea.addColorStop(0,dawn?'#285753':level.palette[0]);sea.addColorStop(.45,dawn?'#285a5e':level.palette[1]);sea.addColorStop(1,dawn?'#234652':level.palette[2]);ctx.fillStyle=sea;ctx.fillRect(0,0,W,H);
  const light=ctx.createRadialGradient(170,235,0,170,235,650);light.addColorStop(0,'#426b5926');light.addColorStop(1,'transparent');ctx.fillStyle=light;ctx.fillRect(0,0,W,H);
  for(const m of seaMarks){const x=(m.x+worldTime*(4+m.a*3))%W;const y=m.y+Math.sin(worldTime*.7+m.x)*2;ctx.strokeStyle=`rgba(177,225,215,${.08+m.a*.17})`;ctx.lineWidth=m.a>.8?1.5:1;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+m.w*.5,y-2,x+m.w,y);ctx.stroke();}
  if(level.biome==='dawn'){
    const sky=ctx.createLinearGradient(0,0,0,220);sky.addColorStop(0,'#f2a05d35');sky.addColorStop(1,'#f2a05d00');ctx.fillStyle=sky;ctx.fillRect(0,0,W,220);
    for(let i=0;i<17;i++){const y=40+i*8;line([{x:760-i*7,y},{x:880+i*7,y}],`rgba(255,199,139,${.1-i*.004})`,2);}
  }
  for(let i=0;i<5;i++){
    const x=((worldTime*11+i*213)%1200)-80,y=80+Math.sin(worldTime*.17+i*2)*22;
    line([{x:x-4,y:y+2},{x,y},{x:x+4,y:y+2}],'#e4ebd870',1.2);
  }
}

function drawIsland(rock,index) {
  ctx.save();ctx.translate(rock.x,rock.y);
  ellipse(0,10,rock.r+12,rock.r*.7+10,'#061b2870');
  for(let j=3;j>0;j--){ctx.strokeStyle=`rgba(109,161,142,${.08+j*.025})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,3,rock.r+j*9,rock.r*.66+j*6,0,0,TAU);ctx.stroke();}
  ctx.fillStyle='#1b3437';ctx.beginPath();islandEdge.forEach((p,i)=>{const x=p.x*rock.r/45,y=p.y*rock.r/45+12;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fill();
  const ice=level.biome==='ice',coral=level.biome==='coral';
  ctx.fillStyle=ice?'#a6d4d4':coral?'#b7b17d':'#68947c';ctx.beginPath();islandEdge.forEach((p,i)=>{const x=p.x*rock.r/45,y=p.y*rock.r/45-3;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fill();
  ctx.fillStyle=ice?'#e0eee0':coral?'#d8cea1':'#94b68b';ctx.beginPath();ctx.moveTo(-rock.r*.7,-3);ctx.lineTo(-rock.r*.16,-rock.r*.72);ctx.lineTo(rock.r*.6,-rock.r*.1);ctx.lineTo(rock.r*.2,rock.r*.3);ctx.closePath();ctx.fill();
  ctx.strokeStyle=ice?'#ecfff29e':'#a3dbc480';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,9,rock.r+7+Math.sin(worldTime+index)*2,rock.r*.7+4,0,.1,Math.PI*1.7);ctx.stroke();
  for(let i=0;i<3;i++){const x=(i-1)*rock.r*.33,y=-rock.r*.12-Math.sin(i*2+index)*5;ctx.fillStyle=ice?'#b1d7da':coral?'#527f71':'#264f48';ctx.beginPath();ctx.moveTo(x,y-15);ctx.lineTo(x+6,y+2);ctx.lineTo(x-6,y+2);ctx.closePath();ctx.fill();if(!ice){ctx.fillStyle=coral?'#eaad8b':'#4c7e65';ctx.beginPath();ctx.moveTo(x,y-21);ctx.lineTo(x+5,y-6);ctx.lineTo(x-5,y-6);ctx.fill();}}
  ctx.restore();
}

function drawHarbor() {
  const {x,y,r}=harbor;
  glow(x,y,155,'#d8bc5330');
  for(let i=0;i<4;i++){ctx.strokeStyle=`rgba(216,190,111,${.11-i*.02})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,r+i*13,r*.7+i*9,0,0,TAU);ctx.stroke();}
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#183b3b';ctx.beginPath();ctx.moveTo(-130,-47);ctx.lineTo(-70,-42);ctx.lineTo(-22,-62);ctx.lineTo(16,-32);ctx.lineTo(5,12);ctx.lineTo(-30,48);ctx.lineTo(-80,58);ctx.lineTo(-134,35);ctx.closePath();ctx.fill();
  ctx.fillStyle=level.biome==='ice'?'#a4c8c2':'#8caa7d';ctx.beginPath();ctx.moveTo(-134,-51);ctx.lineTo(-76,-49);ctx.lineTo(-27,-70);ctx.lineTo(16,-40);ctx.lineTo(4,-3);ctx.lineTo(-30,34);ctx.lineTo(-80,44);ctx.lineTo(-134,21);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#92a17d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-123,19);ctx.lineTo(-79,37);ctx.lineTo(-31,26);ctx.lineTo(3,-7);ctx.stroke();
  for(let i=0;i<3;i++){ctx.fillStyle='#866e50';ctx.fillRect(-18+i*13,36,9,55);ctx.fillStyle='#b29969';ctx.fillRect(-18+i*13,36,2,55);}
  ctx.fillStyle='#ded5ac';ctx.beginPath();ctx.moveTo(-49,-34);ctx.lineTo(-43,-117);ctx.lineTo(-24,-117);ctx.lineTo(-17,-34);ctx.closePath();ctx.fill();
  ctx.fillStyle='#9da285';ctx.beginPath();ctx.moveTo(-35,-34);ctx.lineTo(-33,-117);ctx.lineTo(-24,-117);ctx.lineTo(-17,-34);ctx.closePath();ctx.fill();
  ctx.fillStyle='#6f5a41';ctx.fillRect(-51,-122,33,7);ctx.fillStyle='#f6df9e';ctx.fillRect(-45,-139,22,17);ctx.fillStyle='#435148';ctx.beginPath();ctx.moveTo(-53,-140);ctx.lineTo(-34,-153);ctx.lineTo(-15,-140);ctx.closePath();ctx.fill();
  ctx.fillStyle='#263d3d';ctx.fillRect(-39,-63,9,22);ctx.fillStyle='#c8b77b';ctx.fillRect(-38,-94,7,10);
  for(let i=0;i<2;i++){ctx.save();ctx.translate(-85+i*31,-1+i*14);ctx.fillStyle='#c8bb8f';ctx.fillRect(-10,-14,22,18);ctx.fillStyle='#575a43';ctx.beginPath();ctx.moveTo(-14,-14);ctx.lineTo(0,-24);ctx.lineTo(15,-14);ctx.closePath();ctx.fill();ctx.fillStyle='#f1c975';ctx.fillRect(-4,-8,5,6);ctx.restore();}
  ctx.restore();
  const a=worldTime*.12-.5;ctx.save();ctx.translate(x-34,y-132);ctx.rotate(a);const beam=ctx.createLinearGradient(0,0,630,0);beam.addColorStop(0,'#f6dc8a50');beam.addColorStop(1,'#f6dc8a00');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(650,-140);ctx.lineTo(650,140);ctx.closePath();ctx.fill();ctx.restore();glow(x-34,y-132,38,'#f3d1788a');
  ctx.fillStyle='#c6c496a0';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(level.name.toUpperCase(),x-25,y+113);ctx.textAlign='left';
  if(game.mode==='playing'){
    ctx.strokeStyle='#ffe5a370';ctx.setLineDash([5,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x+18,y+30,r*.8,r*.48,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#ffe2a2';ctx.textAlign='center';ctx.font='bold 9px monospace';ctx.fillText('BRING CREWS HOME',x+18,y+86);ctx.textAlign='left';
  }
}

function drawStorm(s,index) {
  ctx.save();ctx.translate(s.x,s.y);
  glow(0,0,s.r*1.7,'#5c5c8c26');ctx.setLineDash([3,7]);ctx.strokeStyle='#9b9bc14c';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,10,s.r+9,s.r*.65+9,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
  for(let i=0;i<5;i++){const x=Math.sin(i*2.5+index)*s.r*.6,y=Math.cos(i*3)*s.r*.25-15;ellipse(x,y,25+i*2,16,'#1c354a');ellipse(x,y-5,23+i*2,14,i%2?'#455568':'#38495e');}
  for(let i=0;i<18;i++){const x=Math.sin(i*7.21+index)*s.r*.8,y=((worldTime*80+i*19)%80)-10;line([{x,y},{x:x-6,y:y+11}],'#98b4cb40',1);}
  if(Math.sin(worldTime*1.9+index*6)>0.985){line([{x:5,y:-15},{x:-4,y:8},{x:8,y:6},{x:-2,y:32}],'#e0dcba',2);glow(0,5,70,'#e6dccb25');}
  ctx.fillStyle='#a6afc183';ctx.font='7px monospace';ctx.fillText('SQUALL '+String(index+1).padStart(2,'0'),-22,s.r*.7+18);ctx.restore();
}

function drawBoat(b,tug=false) {
  if(!tug&&b.state==='lost'){line([{x:b.x-5,y:b.y-5},{x:b.x+5,y:b.y+5}],'#ba786c');line([{x:b.x+5,y:b.y-5},{x:b.x-5,y:b.y+5}],'#ba786c');return;}
  if(!tug&&level.fog&&!b.discovered&&b.state==='waiting')return;
  const bob=Math.sin(worldTime*2+b.x*.1)*1.1;
  ctx.save();ctx.translate(b.x,b.y+bob);ctx.rotate(b.angle);if(tug){const size=game.ship.type==='cutter'?1.13:game.ship.type==='skiff'?.86:1;ctx.scale(size,size);}
  ellipse(-1,5,tug?23:18,tug?10:8,'#02172190');
  ctx.fillStyle=tug?game.ship.color:b.state==='safe'?'#a0cfad':['#d98e62','#c69775','#d7b06c'][Math.floor(b.ox||0)%3];
  ctx.beginPath();ctx.moveTo(tug?25:19,0);ctx.quadraticCurveTo(6,-13,-18,-9);ctx.lineTo(-21,7);ctx.quadraticCurveTo(7,14,tug?25:19,0);ctx.closePath();ctx.fill();
  ctx.strokeStyle=tug?'#fcdda0':'#e4b58c';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle='#20434a';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(5,-6);ctx.lineTo(-13,-5);ctx.lineTo(-14,5);ctx.lineTo(5,6);ctx.closePath();ctx.fill();
  ctx.fillStyle=tug?'#e5ddbc':'#d6b894';ctx.fillRect(-7,-6,tug?13:10,12);ctx.fillStyle='#476773';ctx.fillRect(1,-4,4,8);
  if(tug){ctx.fillStyle='#433e35';ctx.fillRect(-15,-3,4,6);ctx.fillStyle='#e8c17b';ctx.fillRect(10,-2,6,4);}
  else{ctx.fillStyle=b.state==='safe'?'#d6e7b9':'#f2af70';ctx.beginPath();ctx.arc(9,0,2,0,TAU);ctx.fill();}
  ctx.restore();
  if(tug&&game.mode==='playing'&&Math.hypot(b.vx,b.vy)>25){
    const dx=Math.cos(b.angle),dy=Math.sin(b.angle);line([{x:b.x-dx*25-dy*7,y:b.y-dy*25+dx*7},{x:b.x-dx*46-dy*14,y:b.y-dy*46+dx*14}],'#c4f2dc90',2);line([{x:b.x-dx*25+dy*7,y:b.y-dy*25-dx*7},{x:b.x-dx*46+dy*14,y:b.y-dy*46-dx*14}],'#c4f2dc90',2);
  }
  if(!tug&&b.state==='waiting'){
    glow(b.x+8,b.y,23,'#ed9b4d26');
    const pulse=(worldTime*.4+b.ox*.01)%1;ctx.strokeStyle=`rgba(238,164,104,${(1-pulse)*.5})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(b.x,b.y,20+pulse*20,12+pulse*12,0,0,TAU);ctx.stroke();
    const urgent=b.distress<35;ctx.font='8px monospace';ctx.textAlign='center';ctx.fillStyle=urgent?'#ffb19b':'#f0d6ac';ctx.fillText(b.name.toUpperCase(),b.x,b.y-32);
    if(game.mode==='playing'){ctx.font='9px monospace';ctx.fillText(`${Math.floor(b.distress/60).toString().padStart(2,'0')}:${Math.floor(b.distress%60).toString().padStart(2,'0')}`,b.x,b.y-21);ctx.fillStyle='#1e3b42';ctx.fillRect(b.x-18,b.y-16,36,2);ctx.fillStyle=urgent?'#ee9279':'#dfbb7c';ctx.fillRect(b.x-18,b.y-16,36*Math.min(1,b.distress/b.initialDistress),2);}
    ctx.textAlign='left';
    if(game.mode==='playing'&&distance(b,game.tug)<82){ctx.fillStyle='#e8c07d';ctx.fillRect(b.x-24,b.y+20,48,15);ctx.fillStyle='#173b40';ctx.font='8px monospace';ctx.fillText('SPACE',b.x-15,b.y+31);}
  }
  if(tug&&game.mode==='playing'){ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillStyle='#ffedb4';ctx.fillText('YOU',b.x,b.y+39);ctx.textAlign='left';}
}

function drawWake() {
  if(game.tug.target&&game.mode==='playing'){const p=game.tug.target;ctx.strokeStyle='#d2cc8b99';ctx.setLineDash([2,6]);line([game.tug,p],'#b5d0ad44');ctx.setLineDash([]);ctx.beginPath();ctx.arc(p.x,p.y,8+Math.sin(worldTime*4)*2,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,2,0,TAU);ctx.fillStyle='#e9c886';ctx.fill();}
  let leader=game.tug;
  for(const b of game.tow){ctx.strokeStyle=b.strain>0?'#ff9478':'#f0d59b';ctx.lineWidth=b.strain>0?2:1.6;ctx.beginPath();ctx.moveTo(leader.x,leader.y);ctx.quadraticCurveTo((leader.x+b.x)/2,(leader.y+b.y)/2+7,b.x,b.y);ctx.stroke();leader=b;}
}

function drawCurrents() {
  for(const c of level.currents){
    ctx.fillStyle='#83b7a20b';ctx.fillRect(c.x,c.y,c.w,c.h);
    ctx.strokeStyle='#a6d2b530';ctx.setLineDash([3,8]);ctx.strokeRect(c.x,c.y,c.w,c.h);ctx.setLineDash([]);
    for(let i=0;i<12;i++){
      const direction=Math.sign(c.vx),x=c.x+((i*71+worldTime*22*direction)%c.w+c.w)%c.w,y=c.y+c.h*.5+Math.sin(i*2)*11;
      line([{x:x-direction*11,y:y-4},{x,y},{x:x-direction*11,y:y+4}],'#91c6b466');
    }
    ctx.fillStyle='#a1c8b8';ctx.font='7px monospace';ctx.fillText('TIDE '+(c.vx>0?'E →':'← W'),c.x+12,c.y+12);
  }
}
function drawWhirlpool(h) {
  ctx.save();ctx.translate(h.x,h.y);ctx.rotate(-worldTime*.6);ctx.globalAlpha=h.calm?.3:1;
  glow(0,0,h.r*1.7,'#174c6c50');
  for(let ring=0;ring<5;ring++){
    ctx.strokeStyle=`rgba(104,171,188,${.25-ring*.025})`;ctx.lineWidth=1.4;ctx.beginPath();
    for(let i=0;i<80;i++){const a=i/80*TAU,r=5+ring*10+i*.1,x=Math.cos(a)*r,y=Math.sin(a)*r*.64;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.stroke();
  }
  ctx.restore();ctx.fillStyle='#90b8c4';ctx.font='7px monospace';ctx.fillText(h.calm?'CALM WATER':'TURNING WATER',h.x-30,h.y+h.r*.8+10);
}
function drawSalvage() {
  for(const s of game.salvage){if(s.taken)continue;ctx.save();ctx.translate(s.x,s.y+Math.sin(worldTime*2+s.x)*2);glow(0,0,22,'#bcba5633');ctx.rotate(.2);ctx.fillStyle='#957c50';ctx.fillRect(-6,-6,12,12);ctx.strokeStyle='#d0b67a';ctx.strokeRect(-6,-6,12,12);line([{x:-5,y:-5},{x:5,y:5}],'#d0b67a');line([{x:5,y:-5},{x:-5,y:5}],'#d0b67a');ctx.restore();}
}
function eraseFog(x,y,r) {
  fogCtx.globalCompositeOperation='destination-out';const g=fogCtx.createRadialGradient(x,y,r*.4,x,y,r);g.addColorStop(0,'#000');g.addColorStop(1,'transparent');fogCtx.fillStyle=g;fogCtx.fillRect(x-r,y-r,r*2,r*2);
}
function drawFog() {
  if(!level.fog||game.mode==='won')return;
  fogCtx.globalCompositeOperation='source-over';fogCtx.clearRect(0,0,W,H);fogCtx.fillStyle='#294c65d5';fogCtx.fillRect(0,0,W,H);
  eraseFog(game.tug.x,game.tug.y,game.ship.visibility);eraseFog(harbor.x,harbor.y,150);
  if(game.flare)eraseFog(game.flare.x,game.flare.y,game.flare.r);
  for(const b of game.beacons)if(b.lit)eraseFog(b.x,b.y,180);
  fogCtx.globalCompositeOperation='source-over';ctx.drawImage(fog,0,0);
  ctx.fillStyle='#96b6b59a';ctx.font='8px monospace';ctx.fillText('MURMUR BANKS · LISTEN FOR THE LANTERNS',28,432);
}
function drawMinimap(){
  const m=MINIMAP;ctx.save();ctx.fillStyle='#071d27ed';ctx.fillRect(m.x-5,m.y-18,m.w+10,m.h+24);ctx.strokeStyle='#7e9b8880';ctx.lineWidth=1;ctx.strokeRect(m.x,m.y,m.w,m.h);
  ctx.fillStyle='#c2caae';ctx.font='7px monospace';ctx.fillText('CHART · CLICK TO SET COURSE',m.x,m.y-7);
  const px=x=>m.x+x/W*m.w,py=y=>m.y+y/H*m.h;
  for(const r of rocks)ellipse(px(r.x),py(r.y),r.r/W*m.w,r.r/H*m.h,'#638577');
  for(const h of hazardsAt(game))ellipse(px(h.x),py(h.y),h.r/W*m.w,h.r/H*m.h,h.calm?'#4e8c8c':'#6c6d96');
  for(const b of game.boats)if(b.state==='waiting'&&b.discovered)ellipse(px(b.x),py(b.y),b.distress<35?2.6:1.8,b.distress<35?2.6:1.8,b.distress<35?'#fb9e80':'#e0ae77');
  for(const b of game.beacons){ctx.fillStyle=b.lit?'#ffe394':'#b7dce5';ctx.fillRect(px(b.x)-2,py(b.y)-2,4,4);}
  if(game.monster?.phase==='hunting')ellipse(px(game.monster.x),py(game.monster.y),6,4,'#a0d7c4');
  ellipse(px(harbor.x),py(harbor.y),3.3,3.3,'#e7d099');
  let lead=game.tug;for(const b of game.tow){line([{x:px(lead.x),y:py(lead.y)},{x:px(b.x),y:py(b.y)}],'#e1c68d');lead=b;}
  ellipse(px(game.tug.x),py(game.tug.y),2.7,2.7,'#f4efc1');
  const view=camera.bounds();ctx.strokeStyle='#d8ddbd80';ctx.lineWidth=.7;ctx.strokeRect(px(view.x),py(view.y),view.w/W*m.w,view.h/H*m.h);ctx.restore();
}
function renderScene(state,chart,clock,particles) {
  game=state;level=chart;harbor=chart.harbor;rocks=chart.reefs;worldTime=clock;
  camera.update(game.tug,game.mode==='playing');
  ctx.save();camera.apply(ctx);if(!reducedMotion&&particles.shock)ctx.translate(Math.sin(clock*71)*particles.shock*2,Math.cos(clock*81)*particles.shock*2);
  drawWater();drawCurrents();drawHarbor();rocks.forEach(drawIsland);drawSalvage();drawMonster(ctx,game,clock);
  particles.draw(ctx);drawWake();game.boats.forEach(b=>drawBoat(b));drawBoat(game.tug,true);
  for(const [i,h] of hazardsAt(game).entries()){
    ctx.save();ctx.globalAlpha=game.mode==='won'?.2:h.calm?.3:1;
    h.kind==='whirlpool'?drawWhirlpool(h):drawStorm(h,i);ctx.restore();
  }
  drawFog();
  drawBeacons(ctx,game,clock);drawStrikes(ctx,game,clock);
  if(game.flare){const f=game.flare;glow(f.x,f.y,75,'#f9c46f88');ctx.strokeStyle='#f4d39866';ctx.lineWidth=1;ctx.beginPath();ctx.arc(f.x,f.y,30+(9-(f.until-game.elapsed))*20,0,TAU);ctx.stroke();}
  const vignette=ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,W*.63);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#02121d28');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
  if(game.mode==='playing'){ctx.strokeStyle='#e6ba7080';ctx.lineWidth=2;ctx.beginPath();ctx.arc(game.tug.x,game.tug.y,29,-PI/2,-PI/2+TAU*game.boost);ctx.stroke();}
  ctx.restore();
  if(game.mode==='playing')drawMinimap();
  if(particles.shock){ctx.fillStyle=`rgba(155,58,40,${particles.shock*.12})`;ctx.fillRect(0,0,W,H);}
}
return{draw:renderScene,worldPoint:p=>camera.mapPoint(p)||camera.worldPoint(p),toggle:()=>camera.toggle(),isOverview:()=>camera.isOverview()};
}
