import {LEVELS,getLevel} from './levels.js';
import {baseShip,applyUpgrade,UPGRADE_CATALOG,choicesFor} from './upgrades.js';
import {loadSave,saveProgress} from './save.js';
import {createVoyage,tickVoyage,attachTow,launchFlare,clamp} from './simulation.js';
import {createRenderer} from './render.js';
import {createParticles} from './particles.js';
import {createAudio} from './audio.js';
import {bindInput} from './input.js';

const $=id=>document.getElementById(id),canvas=$('sea');
const render=createRenderer(canvas),particles=createParticles();
let saved=loadSave(),run=null,game,screen='room',clock=0,lastTime=0,accumulator=0,toastUntil=0;
const audio=createAudio(saved.sound);
const input=bindInput(canvas,{
  tow:()=>{if(screen==='play')attachTow(game);},
  flare:()=>{if(screen==='play')launchFlare(game);},
  pause:()=>togglePause(),retry:()=>{if(['play','pause','lost'].includes(screen))beginVoyage();},
  blur:()=>{if(screen==='play')togglePause();},
  waypoint:p=>{if(screen==='play')game.tug.target={x:clamp(p.x,30,1010),y:clamp(p.y,78,435)};},
});
const formatTime=n=>`${Math.floor(Math.max(0,n)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,n)%60).toString().padStart(2,'0')}`;
const medalName=n=>['Uncharted','Bronze','Silver','Gold'][n]||'Uncharted';
const persist=()=>{saved=saveProgress(saved);};

function toast(text,seconds=4){$('toast').textContent=text;$('toast').style.opacity='1';toastUntil=clock+seconds;}
function button(label,action,className='launch'){
  const b=document.createElement('button');b.className=className;b.textContent=label;b.addEventListener('click',action);return b;
}
function setScreen(kind,markup){
  screen=kind;input.clear();$('pause-overlay').classList.add('hidden');$('screen-content').innerHTML=markup;
  $('overlay').classList.remove('hidden');$('toast').style.opacity='0';
  document.body.classList.toggle('finished',['upgrade','won','lost','practice-won'].includes(kind));
}
function miniMap(level){
  const reefs=level.reefs.map(r=>`<circle cx="${r.x}" cy="${r.y}" r="${r.r}" fill="#7a8d77"/>`).join('');
  const boats=level.boats.map(b=>`<circle cx="${b.x}" cy="${b.y}" r="9" fill="#e3a16e"/>`).join('');
  const flows=level.currents.map(c=>`<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="#88b5a633"/>`).join('');
  return `<svg viewBox="0 0 1040 480" aria-hidden="true"><path d="M0 120H1040M0 240H1040M0 360H1040" stroke="#7faca419"/>${flows}${reefs}${boats}<circle cx="${level.harbor.x}" cy="${level.harbor.y}" r="42" fill="#e8c37a"/></svg>`;
}
function showRoom(){
  run=null;saved=loadSave();game=createVoyage(saved.checkpoint?.level??0,saved.checkpoint?.ship??baseShip());game.mode='preview';particles.clear();
  setScreen('room',`<div class="eyebrow">THE NORTHREACH CHARTS</div><h2>Four waters.<br><em>One last light.</em></h2><p class="screen-copy">Rescue the crews. Fit your ship. Sail farther.<br>Every harbor remembers the light you brought.</p><div id="chart-grid" class="chart-grid"></div><div id="room-actions" class="room-actions"></div><div class="room-record" id="room-record"></div>`);
  LEVELS.forEach((level,i)=>{
    const best=saved.bests[i],open=i<=saved.unlocked;
    const b=document.createElement('button');b.className='chart-card'+(open?' open':' locked');b.disabled=!open;
    b.setAttribute('aria-label',`${level.name} — ${open?'Replay chart':'Locked'}`);
    b.innerHTML=`${miniMap(level)}<span class="chart-card-top"><b>${level.number}</b><small>${open?medalName(best.medal):'LOCKED'}</small></span><strong>${level.name}</strong><span class="chart-card-bottom">${open?best.score?`BEST ${best.score.toLocaleString('en-US')}`:level.subtitle:'Complete the previous chart'}<i>${open?'↗':'◇'}</i></span>`;
    b.addEventListener('click',()=>launchPractice(i));$('chart-grid').append(b);
  });
  $('room-actions').append(button(saved.checkpoint?'CONTINUE VOYAGE ↗':'SAIL THE CHARTS ↗',()=>saved.checkpoint?continueCampaign():newCampaign()));
  if(saved.checkpoint)$('room-actions').append(button('NEW VOYAGE',newCampaign,'text-button'));
  $('room-record').textContent=`${saved.unlocked+1} / 4 CHARTS OPEN · CAMPAIGN BEST ${saved.campaignBest.toLocaleString('en-US')}`;
  updateHud();
}
function newCampaign(){saved.checkpoint=null;persist();run={practice:false,level:0,ship:baseShip(),score:0,rescued:0,elapsed:0};beginVoyage();}
function continueCampaign(){const cp=saved.checkpoint;if(!cp){newCampaign();return;}run={practice:false,...structuredClone(cp)};beginVoyage();}
function launchPractice(index){run={practice:true,level:index,ship:baseShip(),score:0,rescued:0,elapsed:0};beginVoyage();}
function beginVoyage(){
  if(!run)return;screen='play';game=createVoyage(run.level,run.ship);particles.clear();input.clear();
  $('overlay').classList.add('hidden');$('pause-overlay').classList.add('hidden');document.body.classList.remove('finished');
  input.focus();audio.play('start');toast(getLevel(run.level).briefing,7);updateHud();
}
function togglePause(){
  if(screen==='play'){screen='pause';input.clear();$('pause-overlay').classList.remove('hidden');}
  else if(screen==='pause'){screen='play';$('pause-overlay').classList.add('hidden');input.focus();}
}
function markChartComplete(){
  const best=saved.bests[run.level];
  if(game.score>best.score){best.score=game.score;best.time=game.elapsed;}
  best.medal=Math.max(best.medal,game.medal);saved.unlocked=Math.max(saved.unlocked,Math.min(3,run.level+1));
  persist();
}
function resultStats(){
  return `<div class="result-stats"><div><strong>${game.rescued}</strong><span>CREWS HOME</span></div><div><strong>${Math.ceil(game.hull)}</strong><span>HULL LEFT</span></div><div><strong>${game.maxConvoy}</strong><span>LONGEST TOW</span></div><div><strong>${game.salvaged}</strong><span>SUPPLIES</span></div></div>`;
}
function onWon(){
  markChartComplete();
  if(run.practice){
    setScreen('practice-won',`<div class="eyebrow">${getLevel(run.level).name.toUpperCase()} · ${medalName(game.medal).toUpperCase()} VOYAGE</div><h2>A harbor<br><em>remembers.</em></h2>${resultStats()}<p class="screen-copy">Chart score <strong>${game.score.toLocaleString('en-US')}</strong><br>Return for a cleaner run, or sail the full Northreach.</p><div id="result-actions" class="result-actions"></div>`);
    $('result-actions').append(button('REPLAY THIS CHART ↗',beginVoyage),button('CHART ROOM',showRoom,'text-button'));return;
  }
  run.score+=game.score;run.rescued+=game.rescued;run.elapsed+=game.elapsed;
  if(run.level===LEVELS.length-1){
    saved.campaignBest=Math.max(saved.campaignBest,run.score);saved.checkpoint=null;persist();
    setScreen('won',`<div class="eyebrow">ALL FOUR CHARTS · EVERY HARBOR LIT</div><h2>You brought<br><em>the dawn.</em></h2><div class="campaign-tally"><strong>${run.score.toLocaleString('en-US')}</strong><span>CAMPAIGN SCORE</span></div><p class="screen-copy">${run.rescued} crews home · ${formatTime(run.elapsed)} at sea<br>Four waters behind you. The Northreach is awake.</p><div class="medal-row">${saved.bests.map((b,i)=>`<span>${LEVELS[i].number} <b>${medalName(b.medal)}</b></span>`).join('')}</div><div id="result-actions" class="result-actions"></div>`);
    $('result-actions').append(button('SAIL AGAIN ↗',newCampaign),button('CHART ROOM',showRoom,'text-button'));return;
  }
  const next=getLevel(run.level+1);
  setScreen('upgrade',`<div class="eyebrow">CHART ${getLevel(run.level).number} COMPLETE · ${medalName(game.medal).toUpperCase()} VOYAGE</div><h2>Fit for<br><em>farther waters.</em></h2>${resultStats()}<div class="next-chart"><span>NEXT · ${next.number}</span><strong>${next.name}</strong><small>${next.description}</small></div><div id="upgrade-grid" class="upgrade-grid"></div><div class="start-note">CHOOSE ONE FITTING. IT STAYS WITH YOU FOR THIS VOYAGE.</div>`);
  for(const upgrade of choicesFor(run.level)){
    const b=document.createElement('button');b.className='upgrade-card';b.setAttribute('aria-label',`Fit ${upgrade.name}`);
    b.innerHTML=`<span>${upgrade.mark}</span><strong>${upgrade.name}</strong><small>${upgrade.description}</small><i>FIT & SAIL ↗</i>`;
    b.addEventListener('click',()=>{
      run.ship=applyUpgrade(run.ship,upgrade.id);run.level++;saved.checkpoint={level:run.level,ship:run.ship,score:run.score,rescued:run.rescued,elapsed:run.elapsed};persist();audio.play('upgrade');beginVoyage();
    });$('upgrade-grid').append(b);
  }
}
function onLost(){
  setScreen('lost',`<div class="eyebrow">${getLevel(run.level).name.toUpperCase()} · THE LIGHT STILL WAITS</div><h2>The sea<br><em>took its toll.</em></h2>${resultStats()}<p class="screen-copy">${game.rescued} of ${getLevel(run.level).target} crews home.<br>Your ship's fittings are ready for another attempt.</p><div id="result-actions" class="result-actions"></div>`);
  $('result-actions').append(button('RETRY THIS CHART ↗',beginVoyage),button('CHART ROOM',showRoom,'text-button'));
}
function processEvents(){
  const events=game.events.splice(0);
  for(const e of events){particles.event(e);audio.play(e.type);if(e.text)toast(e.text);if(e.type==='won')onWon();if(e.type==='lost')onLost();}
}
function updateHud(){
  const level=getLevel(game.levelIndex),hull=Math.ceil(game.hull);
  $('location').textContent=`${level.number} · ${level.name.toUpperCase()}`;$('weather').textContent=game.mode==='won'?'The harbor light is safe.':level.subtitle;
  $('voyage-label').textContent=run?`${run.practice?'CHART PRACTICE':'NORTHREACH VOYAGE'} · ${level.number} / IV`:'FOUR WATERS. ONE LAST LIGHT.';
  $('mission-copy').textContent=`Bring ${level.target} stranded crews home.\n${level.fog?'E reveals the fog and calms storms.':level.currents.length?'Read the tide. Protect your convoy.':'Take their lines. Find the harbor.'}`;
  $('rescued').textContent=String(game.rescued).padStart(2,'0');$('goal-count').textContent=String(level.target).padStart(2,'0');
  $('hull-label').textContent=`${hull} / ${game.ship.maxHull}`;$('hull-fill').style.width=`${game.hull/game.ship.maxHull*100}%`;$('hull-fill').style.background=game.hull/game.ship.maxHull<.35?'#e1846c':'#8bb7a0';
  $('clock').textContent=formatTime(Math.ceil(level.seconds-game.elapsed));$('convoy').textContent=`${game.tow.length} / ${game.ship.towCapacity} IN TOW`;
  $('flare-count').textContent=`✷ ${game.flares} FLARES`;$('salvage-count').textContent=`${game.salvaged} SUPPLIES`;
  const upgrades=game.ship.upgrades.join(',');
  if($('ship-upgrades').dataset.value!==upgrades){$('ship-upgrades').dataset.value=upgrades;$('ship-upgrades').innerHTML=game.ship.upgrades.length?game.ship.upgrades.map(id=>`<span title="${UPGRADE_CATALOG[id].description}">${UPGRADE_CATALOG[id].mark} ${UPGRADE_CATALOG[id].name}</span>`).join(''):'<span>STANDARD HARBOR TUG · 3 TOW BERTHS</span>';}
}
function frame(time){
  accumulator+=Math.min((time-lastTime)/1000,.08);lastTime=time;
  while(accumulator>=1/60){clock+=1/60;if(screen==='play'){tickVoyage(game,input.snapshot(),1/60);processEvents();}particles.update(1/60);accumulator-=1/60;}
  if(clock>toastUntil)$('toast').style.opacity='0';
  render(game,getLevel(game.levelIndex),clock,particles);updateHud();requestAnimationFrame(frame);
}
$('room-button').addEventListener('click',showRoom);$('pause-room').addEventListener('click',showRoom);$('resume').addEventListener('click',togglePause);
$('sound').textContent=saved.sound?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-label',saved.sound?'Turn sound off':'Turn sound on');
$('sound').addEventListener('click',()=>{saved.sound=!audio.enabled();audio.setEnabled(saved.sound);persist();$('sound').textContent=saved.sound?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-label',saved.sound?'Turn sound off':'Turn sound on');});
showRoom();requestAnimationFrame(frame);
