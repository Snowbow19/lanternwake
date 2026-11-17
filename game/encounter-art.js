const TAU=Math.PI*2;
export function drawBeacons(ctx,s,time){
  for(const b of s.beacons){
    const near=Math.hypot(b.x-s.tug.x,b.y-s.tug.y)<115;
    ctx.save();ctx.translate(b.x,b.y);
    ctx.fillStyle='#092e4d';ctx.beginPath();ctx.ellipse(0,13,23,12,0,0,TAU);ctx.fill();
    ctx.fillStyle=b.lit?'#d5c393':'#6f92a1';ctx.beginPath();ctx.moveTo(-14,8);ctx.lineTo(-8,-27);ctx.lineTo(8,-27);ctx.lineTo(14,8);ctx.closePath();ctx.fill();
    ctx.fillStyle='#233f52';ctx.fillRect(-11,-31,22,7);ctx.fillStyle=b.lit?'#ffde7b':'#537384';ctx.fillRect(-7,-48,14,17);
    ctx.fillStyle='#244457';ctx.beginPath();ctx.moveTo(-14,-49);ctx.lineTo(0,-61);ctx.lineTo(14,-49);ctx.fill();
    if(b.lit){
      const g=ctx.createRadialGradient(0,-39,1,0,-39,85);g.addColorStop(0,'#ffeaa7c0');g.addColorStop(.18,'#ffcb5360');g.addColorStop(1,'#ffe19400');ctx.fillStyle=g;ctx.fillRect(-85,-124,170,170);
      ctx.strokeStyle='#ffdb7b90';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,9,30+(time*12)%30,15+(time*6)%15,0,0,TAU);ctx.stroke();
      ctx.fillStyle='#fae7aa';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('SIGNAL LIT',0,29);
    }else{
      ctx.setLineDash([3,4]);ctx.strokeStyle=near?'#ffe79b':'#83d6e5a0';ctx.beginPath();ctx.ellipse(0,10,36,19,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=near?'#ffe79b':'#c1deea';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText(near?'E · LIGHT SIGNAL':b.name.toUpperCase(),0,36);
    }
    ctx.restore();
  }
}

export function drawMonster(ctx,s,time){
  const m=s.monster;if(!m)return;
  const gone=m.phase==='retreating',fade=gone?Math.max(0,1-(s.elapsed-m.retreatAt)/4):1;
  if(!fade)return;
  const stunned=s.elapsed<m.stunnedUntil,beat=Math.sin(time*1.8),x=m.x,y=m.y;
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=fade;
  const g=ctx.createRadialGradient(0,12,10,0,12,160);g.addColorStop(0,'#061d36da');g.addColorStop(1,'#061d3600');ctx.fillStyle=g;ctx.fillRect(-160,-148,320,320);
  for(let i=0;i<4;i++){ctx.strokeStyle=`rgba(114,204,209,${.14-i*.025})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,18,90+i*20+beat*3,34+i*8,0,0,TAU);ctx.stroke();}
  for(let i=0;i<8;i++){
    const a=i/8*TAU,tx=Math.cos(a)*(110+Math.sin(time*1.1+i)*20),ty=Math.sin(a)*65+24;
    ctx.lineCap='round';ctx.beginPath();ctx.moveTo(Math.cos(a)*24,Math.sin(a)*14+10);ctx.bezierCurveTo(tx*.5,ty-45-Math.sin(time+i)*20,tx*1.2,ty+37,tx,ty);
    ctx.strokeStyle='#102d48';ctx.lineWidth=21;ctx.stroke();ctx.strokeStyle=stunned?'#86cdc9':'#317f89';ctx.lineWidth=13;ctx.stroke();ctx.strokeStyle='#71b9b480';ctx.lineWidth=2;ctx.stroke();
    for(let j=1;j<5;j++){const p=j/5;ctx.fillStyle=stunned?'#d9d59c':'#a2c5b1';ctx.beginPath();ctx.ellipse(tx*p,ty*p+9,2.8-p,2,0,0,TAU);ctx.fill();}
  }
  ctx.fillStyle='#113d50';ctx.beginPath();ctx.ellipse(0,-4+beat*2,42,51,0,0,TAU);ctx.fill();ctx.strokeStyle='#65ada9';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#2c6770';ctx.beginPath();ctx.ellipse(-8,-21+beat*2,29,30,-.2,0,TAU);ctx.fill();
  for(const side of [-1,1]){
    ctx.save();ctx.translate(side*22,-1+beat*2);ctx.rotate(side*.22);
    ctx.fillStyle='#08263c';ctx.beginPath();ctx.ellipse(0,0,13,11,0,0,TAU);ctx.fill();
    ctx.fillStyle=stunned?'#eae6ac':'#ffb05c';ctx.beginPath();ctx.ellipse(0,0,9,6,0,0,TAU);ctx.fill();
    ctx.fillStyle='#152a3e';ctx.fillRect(-2,-6,4,12);ctx.fillStyle='#fff2c1';ctx.fillRect(3,-3,2,2);ctx.restore();
  }
  ctx.strokeStyle='#8accb890';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-10,18);ctx.quadraticCurveTo(0,26,10,18);ctx.stroke();
  ctx.fillStyle='#e5d3a0';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText(stunned?'THE DEEP · REPELLED':'THE DEEP IS WAKING',0,-77);
  ctx.restore();
}

export function drawStrikes(ctx,s,time){
  for(const a of s.monster?.strikes||[]){
    const remaining=a.at-s.elapsed,hit=remaining<=0;
    ctx.save();ctx.translate(a.x,a.y);
    ctx.fillStyle=hit?'#b2e6df60':'#e05d4530';ctx.beginPath();ctx.ellipse(0,0,a.r,a.r*.72,0,0,TAU);ctx.fill();
    ctx.strokeStyle=hit?'#e5fff0':'#ffb97f';ctx.lineWidth=hit?4:2;ctx.setLineDash(hit?[]:[7,5]);ctx.beginPath();ctx.ellipse(0,0,a.r,a.r*.72,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
    if(hit){
      for(let i=0;i<7;i++){const x=(i-3)*10;ctx.strokeStyle='#c4f4efc0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,15);ctx.quadraticCurveTo(x-14,-18,x+Math.sin(time*7+i)*8,-40-i%3*8);ctx.stroke();}
    }else{
      ctx.strokeStyle='#ffcf99';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,10+remaining*12,-Math.PI/2,-Math.PI/2+TAU*Math.max(0,1-remaining/1.65));ctx.stroke();
      ctx.fillStyle='#ffe6bf';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText('SURGE',0,a.r*.72+14);
    }
    ctx.restore();
  }
}
