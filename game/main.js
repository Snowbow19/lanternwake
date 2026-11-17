const canvas = document.querySelector('#sea');
const ctx = canvas.getContext('2d', { alpha: false });
const W = 1040, H = 480, PI = Math.PI, TAU = PI * 2;
const $ = id => document.getElementById(id);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const harbor = { x: 150, y: 245, r: 82 };
const rocks = [{x:510,y:125,r:31},{x:570,y:332,r:34},{x:830,y:123,r:25},{x:780,y:391,r:19}];
const starts = [{x:350,y:172},{x:415,y:300},{x:610,y:230},{x:700,y:119},{x:822,y:316},{x:935,y:217},{x:642,y:397}];
const names = ['Lark','Morrow','Minnow','Plover','Solace','Little Fern','Sunday'];
const keys = new Set();
let game, worldTime = 0, accumulator = 0, previousTime = 0, muted = true, audio;
let wake = [], sparks = [], toastUntil = 0, cameraShake = 0, masterVolume;
let lastHull = -1, lastRescued = -1, lastClock = '', lastConvoy = -1;
let seed = 9987;
const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const seaMarks = Array.from({length:150}, () => ({x:rand()*W,y:rand()*H,w:3+rand()*15,a:rand()}));
const islandEdge = Array.from({length:32},(_,i)=>{const a=i/32*TAU;return{x:Math.cos(a)*(40+rand()*9),y:Math.sin(a)*(30+rand()*7)}});

function reset() {
  game = {mode:'ready',elapsed:0,hull:100,rescued:0,score:0,boost:1,paused:false,damageCooldown:0,
    tug:{x:260,y:250,vx:0,vy:0,angle:-.4,target:null},
    boats:starts.map((p,i)=>({...p,ox:p.x,oy:p.y,vx:0,vy:0,angle:.1+i*.4,name:names[i],state:'waiting',line:0})),
    tow:[],maxConvoy:0,dockCount:0};
  wake=[];sparks=[];lastHull=-1;lastRescued=-1;lastClock='';lastConvoy=-1;
  document.body.classList.remove('finished');
  $('overlay').classList.remove('hidden');$('pause-overlay').classList.add('hidden');
  $('overline').textContent='ONE BOAT CAN CHANGE THE NIGHT.';
  $('headline').innerHTML='Bring them<br><em>home.</em>';
  $('message').innerHTML='The tide is turning. Crews are waiting for a light.<br>Take their lines. Find the harbor. Beat the storm.';
  $('launch').innerHTML='LIGHT THE ENGINE <span>↗</span>';
  $('start-note').textContent='CLICK TO SET A COURSE · SPACE TO TAKE A TOW';
  $('weather').textContent='A storm is coming.';
  $('toast').style.opacity='0';toastUntil=worldTime;
  updateHud();
}

function start() {
  if(game.mode!=='ready')reset();
  game.mode='playing';$('overlay').classList.add('hidden');
  canvas.focus({preventScroll:true});
  toast('Find the orange lanterns. SPACE takes a tow.',7);
  tone([196,293.66,392],.25);
}

function toast(text, duration=3) {
  $('toast').textContent=text;$('toast').style.opacity='1';toastUntil=worldTime+duration;
}

function tone(notes,duration=.16) {
  if(muted)return;
  if(!audio){audio=new AudioContext();masterVolume=audio.createGain();masterVolume.gain.value=.07;masterVolume.connect(audio.destination);}
  if(audio.state==='suspended')audio.resume();
  notes.forEach((note,i)=>{
    const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=note;
    g.gain.setValueAtTime(0,audio.currentTime+i*.07);g.gain.linearRampToValueAtTime(1,audio.currentTime+i*.07+.01);
    g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+i*.07+duration);
    o.connect(g);g.connect(masterVolume);o.start(audio.currentTime+i*.07);o.stop(audio.currentTime+i*.07+duration+.01);
  });
}

function takeTow() {
  if(game.mode!=='playing'||game.paused)return;
  const closest=game.boats.filter(b=>b.state==='waiting').sort((a,b)=>distance(a,game.tug)-distance(b,game.tug))[0];
  if(closest&&distance(closest,game.tug)<82){
    if(game.tow.length===3){toast('Three in tow. Bring this convoy home.');return;}
    closest.state='towing';game.tow.push(closest);game.maxConvoy=Math.max(game.maxConvoy,game.tow.length);
    toast(`${closest.name} is on your line. Return to the golden harbor.`,4);tone([440,660]);
  }else toast('Get close to an orange lantern, then press SPACE.');
}

function finish(won) {
  if(game.mode!=='playing')return;
  game.mode=won?'won':'lost';game.tug.target=null;game.paused=false;
  game.score=game.rescued*250+Math.round(game.hull)*5+(won?Math.round(180-game.elapsed)*3:0)+game.maxConvoy*100;
  document.body.classList.add('finished');$('overlay').classList.remove('hidden');$('pause-overlay').classList.add('hidden');
  $('overline').textContent=won?'THE LIGHT HELD. THE CREWS ARE HOME.':'A LIGHT STILL WAITS IN THE HARBOR.';
  $('headline').innerHTML=won?'You brought<br><em>the dawn.</em>':'The sea<br><em>took its toll.</em>';
  $('message').innerHTML=`${game.rescued} boats home · ${Math.ceil(game.hull)}% hull · convoy record ${game.maxConvoy}<br>Voyage score <strong>${game.score.toLocaleString('en-US')}</strong>`;
  $('launch').innerHTML='SAIL AGAIN <span>↗</span>';
  $('start-note').textContent=won?'ANOTHER NIGHT. ANOTHER CHANCE TO BRING THEM HOME.':'SHORTER LINES. SAFER WATER. ONE MORE VOYAGE.';
  $('weather').textContent=won?'The first light of morning.':'The storm has reached the coast.';
  tone(won?[261.63,329.63,392,523.25]:[196,164.81,130.81],.4);
  if(won)for(let i=0;i<90;i++)sparks.push({x:harbor.x,y:harbor.y,vx:(rand()-.5)*150,vy:(rand()-.5)*150,life:2+rand()*2});
}

function pause() {
  if(game.mode!=='playing')return;
  game.paused=!game.paused;$('pause-overlay').classList.toggle('hidden',!game.paused);
  keys.clear();if(!game.paused)canvas.focus({preventScroll:true});
}

function stormPosition(i) {
  const t=game.elapsed;
  return i===0?{x:710+Math.sin(t*.045)*140,y:230+Math.sin(t*.06)*90,r:57}:{x:465+Math.sin(t*.035+2)*130,y:380+Math.cos(t*.04)*26,r:42};
}

function update(dt) {
  worldTime+=dt;
  if(worldTime>toastUntil)$('toast').style.opacity='0';
  sparks=sparks.filter(s=>{s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vx*=.98;s.vy*=.98;return s.life>0});
  wake=wake.filter(w=>{w.life-=dt;return w.life>0});
  cameraShake=Math.max(0,cameraShake-dt*12);
  if(game.mode!=='playing'||game.paused)return;
  game.elapsed+=dt;game.damageCooldown=Math.max(0,game.damageCooldown-dt);
  const tug=game.tug;let mx=0,my=0,arrival=1;
  if(keys.has('w')||keys.has('arrowup'))my--;
  if(keys.has('s')||keys.has('arrowdown'))my++;
  if(keys.has('a')||keys.has('arrowleft'))mx--;
  if(keys.has('d')||keys.has('arrowright'))mx++;
  if(mx||my)tug.target=null;
  else if(tug.target){const d=distance(tug,tug.target);arrival=clamp(d/55,0,1);if(d>1){mx=(tug.target.x-tug.x)/d;my=(tug.target.y-tug.y)/d;}else arrival=0;}
  const magnitude=Math.hypot(mx,my);if(magnitude){mx/=magnitude;my/=magnitude;}
  const boosting=keys.has('shift')&&game.boost>.015&&magnitude>0;
  game.boost=clamp(game.boost+(boosting?-.32:.14)*dt,0,1);
  const speed=(boosting?235:155)*(1-game.tow.length*.11)*arrival;
  const drift=tug.target?arrival:1;
  const current={x:Math.sin(tug.y*.013+game.elapsed*.2)*12*drift,y:Math.cos(tug.x*.01+game.elapsed*.16)*7*drift};
  const blend=1-Math.exp(-dt*5);
  tug.vx+=(mx*speed+current.x-tug.vx)*blend;tug.vy+=(my*speed+current.y-tug.vy)*blend;
  tug.x=clamp(tug.x+tug.vx*dt,30,W-30);tug.y=clamp(tug.y+tug.vy*dt,80,H-45);
  const v=Math.hypot(tug.vx,tug.vy);
  if(v>5){const target=Math.atan2(tug.vy,tug.vx);let diff=(target-tug.angle+PI*3)%TAU-PI;tug.angle+=diff*Math.min(1,dt*7);}
  for(const rock of rocks){
    const d=distance(rock,tug),limit=rock.r+14;
    if(d<limit){const nx=(tug.x-rock.x)/(d||1),ny=(tug.y-rock.y)/(d||1);tug.x=rock.x+nx*limit;tug.y=rock.y+ny*limit;tug.vx*=.35;tug.vy*=.35;
      if(game.damageCooldown===0){game.hull=Math.max(0,game.hull-17);game.damageCooldown=1.1;cameraShake=3;toast('Rocks ahead. Find open water.');tone([110],.2);}}
  }
  for(let i=0;i<2;i++){const storm=stormPosition(i);if(distance(storm,tug)<storm.r){game.hull=Math.max(0,game.hull-dt*7);tug.vx*=.98;tug.vy*=.98;}}
  if(Math.floor(game.elapsed*18)!==Math.floor((game.elapsed-dt)*18)&&v>20)wake.push({x:tug.x-Math.cos(tug.angle)*15,y:tug.y-Math.sin(tug.angle)*15,angle:tug.angle,life:1.6,size:boosting?1.7:1});
  let leader=tug;
  for(const b of game.tow){
    const d=distance(b,leader);const lineLength=43;
    if(d>lineLength){const pull=(d-lineLength)*9;b.vx+=(leader.x-b.x)/(d||1)*pull*dt;b.vy+=(leader.y-b.y)/(d||1)*pull*dt;}
    b.vx*=Math.exp(-dt*4);b.vy*=Math.exp(-dt*4);b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(d>1)b.angle=Math.atan2(leader.y-b.y,leader.x-b.x);
    b.line=d;leader=b;
  }
  const delivered=game.tow.filter(b=>distance(b,harbor)<harbor.r-10&&distance(tug,harbor)<harbor.r+15);
  for(const b of delivered){b.state='safe';game.rescued++;b.x=100+(game.rescued%3)*22;b.y=300+Math.floor((game.rescued-1)/3)*19;b.angle=-.18;game.hull=Math.min(100,game.hull+5);game.dockCount++;tone([392,523.25,659.25]);
    for(let i=0;i<18;i++)sparks.push({x:b.x,y:b.y,vx:(rand()-.5)*70,vy:(rand()-.5)*70,life:.7+rand()});
  }
  if(delivered.length){game.tow=game.tow.filter(b=>b.state!=='safe');toast(`${game.rescued} boats home. ${Math.max(0,5-game.rescued)} still need you.`,4);}
  if(game.rescued>=5)finish(true);
  else if(game.elapsed>=180||game.hull<=0)finish(false);
  updateHud();
}

function updateHud() {
  const hull=Math.ceil(game.hull),rescued=game.rescued,sec=Math.max(0,Math.ceil(180-game.elapsed));
  const clock=`${Math.floor(sec/60).toString().padStart(2,'0')}:${(sec%60).toString().padStart(2,'0')}`;
  if(hull!==lastHull){$('hull-label').textContent=`${hull}%`;$('hull-fill').style.width=`${hull}%`;$('hull-fill').style.background=hull<35?'#e1846c':'#8bb7a0';lastHull=hull;}
  if(rescued!==lastRescued){$('rescued').textContent=String(rescued).padStart(2,'0');lastRescued=rescued;}
  if(clock!==lastClock){$('clock').textContent=clock;lastClock=clock;}
  if(game.tow.length!==lastConvoy){$('convoy').textContent=`${game.tow.length} / 3 IN TOW`;lastConvoy=game.tow.length;}
}

function ellipse(x,y,rx,ry,color) {ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
function line(points,color,width=1) {ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}

function drawWater() {
  const dawn=game.mode==='won';
  const sea=ctx.createLinearGradient(0,0,W,H);sea.addColorStop(0,dawn?'#18494d':'#153f46');sea.addColorStop(.45,dawn?'#20545a':'#0c303c');sea.addColorStop(1,dawn?'#163b4c':'#081f30');ctx.fillStyle=sea;ctx.fillRect(0,0,W,H);
  const light=ctx.createRadialGradient(170,235,0,170,235,650);light.addColorStop(0,'#426b5926');light.addColorStop(1,'transparent');ctx.fillStyle=light;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#7cb8b20a';ctx.lineWidth=1;
  for(let x=20;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=30;y<H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  for(const m of seaMarks){const x=(m.x+worldTime*(4+m.a*3))%W;const y=m.y+Math.sin(worldTime*.7+m.x)*2;ctx.strokeStyle=`rgba(126,181,169,${.08+m.a*.10})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+m.w*.5,y-2,x+m.w,y);ctx.stroke();}
  ctx.font='8px monospace';ctx.fillStyle='#5d929053';for(let i=1;i<9;i++)ctx.fillText(`${String(i*10).padStart(3,'0')}°`,i*112,463);
  ctx.save();ctx.translate(957,392);ctx.strokeStyle='#a5bdab60';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,22,0,TAU);ctx.moveTo(-28,0);ctx.lineTo(28,0);ctx.moveTo(0,-28);ctx.lineTo(0,28);ctx.stroke();ctx.fillStyle='#cfcca2';ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(5,5);ctx.lineTo(0,0);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.fillStyle='#8fa99a';ctx.font='8px monospace';ctx.fillText('N',-3,-33);ctx.restore();
}

function drawIsland(rock,index) {
  ctx.save();ctx.translate(rock.x,rock.y);
  ellipse(0,10,rock.r+12,rock.r*.7+10,'#061b2870');
  for(let j=3;j>0;j--){ctx.strokeStyle=`rgba(109,161,142,${.08+j*.025})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,3,rock.r+j*9,rock.r*.66+j*6,0,0,TAU);ctx.stroke();}
  ctx.fillStyle='#1b3437';ctx.beginPath();islandEdge.forEach((p,i)=>{const x=p.x*rock.r/45,y=p.y*rock.r/45+12;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fill();
  ctx.fillStyle='#536252';ctx.beginPath();islandEdge.forEach((p,i)=>{const x=p.x*rock.r/45,y=p.y*rock.r/45-3;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fill();
  ctx.fillStyle='#76866c';ctx.beginPath();ctx.moveTo(-rock.r*.7,-3);ctx.lineTo(-rock.r*.16,-rock.r*.72);ctx.lineTo(rock.r*.6,-rock.r*.1);ctx.lineTo(rock.r*.2,rock.r*.3);ctx.closePath();ctx.fill();
  for(let i=0;i<3;i++){const x=(i-1)*rock.r*.33,y=-rock.r*.12-Math.sin(i*2+index)*5;ctx.fillStyle='#233d3c';ctx.beginPath();ctx.moveTo(x,y-15);ctx.lineTo(x+6,y+2);ctx.lineTo(x-6,y+2);ctx.closePath();ctx.fill();}
  ctx.restore();
}

function drawHarbor() {
  const {x,y,r}=harbor;
  glow(x,y,155,'#d8bc5330');
  for(let i=0;i<4;i++){ctx.strokeStyle=`rgba(216,190,111,${.11-i*.02})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,r+i*13,r*.7+i*9,0,0,TAU);ctx.stroke();}
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#183b3b';ctx.beginPath();ctx.moveTo(-130,-47);ctx.lineTo(-70,-42);ctx.lineTo(-22,-62);ctx.lineTo(16,-32);ctx.lineTo(5,12);ctx.lineTo(-30,48);ctx.lineTo(-80,58);ctx.lineTo(-134,35);ctx.closePath();ctx.fill();
  ctx.fillStyle='#61715a';ctx.beginPath();ctx.moveTo(-134,-51);ctx.lineTo(-76,-49);ctx.lineTo(-27,-70);ctx.lineTo(16,-40);ctx.lineTo(4,-3);ctx.lineTo(-30,34);ctx.lineTo(-80,44);ctx.lineTo(-134,21);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#92a17d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-123,19);ctx.lineTo(-79,37);ctx.lineTo(-31,26);ctx.lineTo(3,-7);ctx.stroke();
  for(let i=0;i<3;i++){ctx.fillStyle='#866e50';ctx.fillRect(-18+i*13,36,9,55);ctx.fillStyle='#b29969';ctx.fillRect(-18+i*13,36,2,55);}
  ctx.fillStyle='#ded5ac';ctx.beginPath();ctx.moveTo(-49,-34);ctx.lineTo(-43,-117);ctx.lineTo(-24,-117);ctx.lineTo(-17,-34);ctx.closePath();ctx.fill();
  ctx.fillStyle='#9da285';ctx.beginPath();ctx.moveTo(-35,-34);ctx.lineTo(-33,-117);ctx.lineTo(-24,-117);ctx.lineTo(-17,-34);ctx.closePath();ctx.fill();
  ctx.fillStyle='#6f5a41';ctx.fillRect(-51,-122,33,7);ctx.fillStyle='#f6df9e';ctx.fillRect(-45,-139,22,17);ctx.fillStyle='#435148';ctx.beginPath();ctx.moveTo(-53,-140);ctx.lineTo(-34,-153);ctx.lineTo(-15,-140);ctx.closePath();ctx.fill();
  ctx.fillStyle='#263d3d';ctx.fillRect(-39,-63,9,22);ctx.fillStyle='#c8b77b';ctx.fillRect(-38,-94,7,10);
  for(let i=0;i<2;i++){ctx.save();ctx.translate(-85+i*31,-1+i*14);ctx.fillStyle='#c8bb8f';ctx.fillRect(-10,-14,22,18);ctx.fillStyle='#575a43';ctx.beginPath();ctx.moveTo(-14,-14);ctx.lineTo(0,-24);ctx.lineTo(15,-14);ctx.closePath();ctx.fill();ctx.fillStyle='#f1c975';ctx.fillRect(-4,-8,5,6);ctx.restore();}
  ctx.restore();
  const a=worldTime*.12-.5;ctx.save();ctx.translate(x-34,y-132);ctx.rotate(a);const beam=ctx.createLinearGradient(0,0,630,0);beam.addColorStop(0,'#f6dc8a50');beam.addColorStop(1,'#f6dc8a00');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(650,-140);ctx.lineTo(650,140);ctx.closePath();ctx.fill();ctx.restore();glow(x-34,y-132,38,'#f3d1788a');
  ctx.fillStyle='#c6c496a0';ctx.font='8px monospace';ctx.fillText('L A N T E R N  H A R B O R',x-85,y+113);
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
  const bob=Math.sin(worldTime*2+b.x*.1)*1.1;
  ctx.save();ctx.translate(b.x,b.y+bob);ctx.rotate(b.angle);
  ellipse(-1,5,tug?23:18,tug?10:8,'#02172190');
  ctx.fillStyle=tug?'#e0bd78':b.state==='safe'?'#90b4a1':'#ad725a';
  ctx.beginPath();ctx.moveTo(tug?25:19,0);ctx.quadraticCurveTo(6,-13,-18,-9);ctx.lineTo(-21,7);ctx.quadraticCurveTo(7,14,tug?25:19,0);ctx.closePath();ctx.fill();
  ctx.strokeStyle=tug?'#fcdda0':'#e4b58c';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle='#20434a';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(5,-6);ctx.lineTo(-13,-5);ctx.lineTo(-14,5);ctx.lineTo(5,6);ctx.closePath();ctx.fill();
  ctx.fillStyle=tug?'#e5ddbc':'#d6b894';ctx.fillRect(-7,-6,tug?13:10,12);ctx.fillStyle='#476773';ctx.fillRect(1,-4,4,8);
  if(tug){ctx.fillStyle='#433e35';ctx.fillRect(-15,-3,4,6);ctx.fillStyle='#e8c17b';ctx.fillRect(10,-2,6,4);}
  else{ctx.fillStyle=b.state==='safe'?'#d6e7b9':'#f2af70';ctx.beginPath();ctx.arc(9,0,2,0,TAU);ctx.fill();}
  ctx.restore();
  if(!tug&&b.state==='waiting'){
    glow(b.x+8,b.y,23,'#ed9b4d26');
    const pulse=(worldTime*.4+b.ox*.01)%1;ctx.strokeStyle=`rgba(238,164,104,${(1-pulse)*.5})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(b.x,b.y,20+pulse*20,12+pulse*12,0,0,TAU);ctx.stroke();
    ctx.font='8px monospace';ctx.textAlign='center';ctx.fillStyle='#e2bf96';ctx.fillText(b.name.toUpperCase(),b.x,b.y-25);ctx.textAlign='left';
    if(game.mode==='playing'&&distance(b,game.tug)<82){ctx.fillStyle='#e8c07d';ctx.fillRect(b.x-24,b.y+20,48,15);ctx.fillStyle='#173b40';ctx.font='8px monospace';ctx.fillText('SPACE',b.x-15,b.y+31);}
  }
}

function drawWake() {
  for(const w of wake){ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.angle);ctx.strokeStyle=`rgba(155,205,187,${w.life*.18})`;ctx.lineWidth=1.1;const age=1.6-w.life;ctx.beginPath();ctx.moveTo(-age*11,-(3+age*8)*w.size);ctx.quadraticCurveTo(-age*15,0,-age*11,(3+age*8)*w.size);ctx.stroke();ctx.restore();}
  if(game.tug.target&&game.mode==='playing'){const p=game.tug.target;ctx.strokeStyle='#d2cc8b99';ctx.setLineDash([2,6]);line([game.tug,p],'#b5d0ad44');ctx.setLineDash([]);ctx.beginPath();ctx.arc(p.x,p.y,8+Math.sin(worldTime*4)*2,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,2,0,TAU);ctx.fillStyle='#e9c886';ctx.fill();}
  let leader=game.tug;
  for(const b of game.tow){ctx.strokeStyle='#e3c78c';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(leader.x,leader.y);ctx.quadraticCurveTo((leader.x+b.x)/2,(leader.y+b.y)/2+7,b.x,b.y);ctx.stroke();leader=b;}
}

function render() {
  ctx.save();if(cameraShake){ctx.translate(Math.sin(worldTime*71)*cameraShake,Math.cos(worldTime*91)*cameraShake);}
  drawWater();drawHarbor();
  rocks.forEach(drawIsland);
  drawWake();game.boats.forEach(b=>drawBoat(b));drawBoat(game.tug,true);
  ctx.save();if(game.mode==='won')ctx.globalAlpha=.25;
  for(let i=0;i<2;i++)drawStorm(stormPosition(i),i);
  ctx.restore();
  for(const s of sparks)ellipse(s.x,s.y,1.6,1.6,`rgba(246,210,130,${Math.min(1,s.life)})`);
  const vignette=ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,W*.63);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#02121d80');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
  if(game.mode==='playing'){ctx.strokeStyle='#e6ba7060';ctx.lineWidth=2;ctx.beginPath();ctx.arc(game.tug.x,game.tug.y,29,-PI/2,-PI/2+TAU*game.boost);ctx.stroke();}
  ctx.restore();
}

function frame(ms) {
  const dt=Math.min((ms-previousTime)/1000,.08);previousTime=ms;
  accumulator+=dt;while(accumulator>=1/60){update(1/60);accumulator-=1/60;}
  render();requestAnimationFrame(frame);
}

window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if([' ','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k))e.preventDefault();
  if(!e.repeat){if(k===' '){if(game.mode==='ready')start();else takeTow();}if(k==='p')pause();if(k==='r'){reset();start();}if(k==='escape'&&game.mode==='playing')pause();if(k==='enter'&&game.mode!=='playing')start();}
  keys.add(k);
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();if(game.mode==='playing'&&!game.paused)pause();});
canvas.addEventListener('pointerdown',e=>{
  if(game.mode!=='playing'||game.paused)return;
  const box=canvas.getBoundingClientRect();game.tug.target={x:clamp((e.clientX-box.left)/box.width*W,25,W-25),y:clamp((e.clientY-box.top)/box.height*H,75,H-40)};
  canvas.focus({preventScroll:true});
});
$('launch').addEventListener('click',start);$('resume').addEventListener('click',pause);
$('sound').addEventListener('click',()=>{muted=!muted;$('sound').textContent=muted?'SOUND OFF':'SOUND ON';$('sound').setAttribute('aria-label',muted?'Turn sound on':'Turn sound off');if(!muted)tone([293.66,440]);});
reset();requestAnimationFrame(frame);
