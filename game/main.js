import {baseShip} from './upgrades.js';
import {loadSave,saveProgress} from './save.js';
import {createVoyage,tickVoyage,attachTow,launchFlare,chartOf,voyageScore,clamp} from './simulation.js';
import {createRenderer} from './render.js';
import {createParticles} from './particles.js';
import {createAudio} from './audio.js';
import {bindInput} from './input.js';
import {newRun,runChart,completedChart,purchaseFitting,patchHull,depart,checkpointOf} from './voyage.js';
import {roomScreen,portScreen,outcomeScreen} from './screens.js';
import {updateHud} from './hud.js';
import {shipUnlocked} from './ships.js';
import {$} from './ui.js';

const canvas=$('sea'),renderer=createRenderer(canvas),particles=createParticles();
let saved=loadSave(),run=null,game,screen='room',clock=0,lastTime=0,accumulator=0,toastUntil=0,hudClock=0;
const audio=createAudio(saved.sound),persist=()=>{saved=saveProgress(saved);};
const input=bindInput(canvas,{
  tow:()=>{if(screen==='play')attachTow(game);},flare:()=>{if(screen==='play')launchFlare(game);},
  pause:()=>togglePause(),retry:()=>{if(['play','pause','lost'].includes(screen))retryVoyage();},
  camera:()=>toggleCamera(),blur:()=>{if(screen==='play')togglePause();},
  waypoint:p=>{if(screen==='play'){const world=renderer.worldPoint(p);game.tug.target={x:clamp(world.x,30,1010),y:clamp(world.y,78,435)};}},
});
function toast(text,seconds=4){$('toast').textContent=text;$('toast').style.opacity='1';toastUntil=clock+seconds;}
function setScreen(kind){screen=kind;input.clear();$('pause-overlay').classList.add('hidden');$('overlay').classList.remove('hidden');$('toast').style.opacity='0';document.body.classList.toggle('finished',kind!=='room');}
function recordStorm(){
  if(!run?.endless)return;
  const partial=game.mode==='playing'?voyageScore(game):game.mode==='lost'?game.score:0;
  saved.stormBest=Math.max(saved.stormBest,run.score+partial);saved.stormWatch=Math.max(saved.stormWatch,run.watch+1);persist();
}
function showRoom(){
  if(run?.endless)recordStorm();run=null;saved=loadSave();
  game=createVoyage(0,baseShip(saved.selectedShip));game.mode='preview';particles.clear();setScreen('room');
  roomScreen(saved,{
    ship:id=>{if(!shipUnlocked(id,saved))return;saved.selectedShip=id;persist();showRoom();},
    practice:launchPractice,new:newCampaign,continue:continueCampaign,storm:startStormwatch,continueStorm:continueStormwatch,
  });updateHud(game,run,renderer,saved);
}
function newCampaign(){saved.checkpoint=null;persist();run=newRun('campaign',saved.selectedShip);beginVoyage();}
function continueCampaign(){if(!saved.checkpoint){newCampaign();return;}run={practice:false,endless:false,watch:0,...structuredClone(saved.checkpoint)};beginVoyage();}
function launchPractice(index){run=newRun('practice',saved.selectedShip,index);beginVoyage();}
function startStormwatch(){if(saved.campaignBest<=0)return;saved.stormCheckpoint=null;persist();run=newRun('storm',saved.selectedShip);beginVoyage();}
function continueStormwatch(){if(!saved.stormCheckpoint){startStormwatch();return;}run={practice:false,endless:true,...structuredClone(saved.stormCheckpoint)};beginVoyage();}
function beginVoyage(){
  if(!run)return;screen='play';game=createVoyage(run.level,run.ship,{chart:runChart(run),watch:run.endless?run.watch:undefined,hull:run.hull});particles.clear();input.clear();
  $('overlay').classList.add('hidden');$('pause-overlay').classList.add('hidden');document.body.classList.remove('finished');input.focus();audio.play('start');toast(chartOf(game).briefing,7);updateHud(game,run,renderer,saved);
}
function retryVoyage(){if(run?.endless){recordStorm();startStormwatch();}else beginVoyage();}
function togglePause(){if(screen==='play'){screen='pause';input.clear();$('pause-overlay').classList.remove('hidden');}else if(screen==='pause'){screen='play';$('pause-overlay').classList.add('hidden');input.focus();}}
function toggleCamera(){if(screen==='play'||screen==='pause'){renderer.toggle();updateHud(game,run,renderer,saved);}}
function markChartComplete(){const best=saved.bests[run.level];if(game.score>best.score){best.score=game.score;best.time=game.elapsed;}best.medal=Math.max(best.medal,game.medal);saved.unlocked=Math.max(saved.unlocked,Math.min(3,run.level+1));persist();}
function saveCheckpoint(){if(run.endless)saved.stormCheckpoint=checkpointOf(run);else saved.checkpoint=checkpointOf(run);persist();}
function leavePort(){run=depart(run);saveCheckpoint();beginVoyage();}
function showPort(){
  setScreen('port');portScreen(run,game,{
    fit:id=>{const bought=purchaseFitting(run,id);if(!bought)return;run=bought;audio.play('upgrade');leavePort();},
    repair:()=>{const patched=patchHull(run);if(!patched)return;run=patched;audio.play('upgrade');showPort();},
    depart:leavePort,
  });updateHud(game,run,renderer,saved);
}
function showOutcome(kind){setScreen(kind);outcomeScreen(kind,run,game,saved,{retry:kind==='won'?newCampaign:retryVoyage,room:showRoom});}
function onWon(){
  if(!run.endless)markChartComplete();
  if(run.practice){showOutcome('practice-won');return;}
  run=completedChart(run,game);
  if(run.endless){recordStorm();showPort();return;}
  if(run.level===3){saved.campaignBest=Math.max(saved.campaignBest,run.score+run.brass*10);saved.checkpoint=null;persist();showOutcome('won');}
  else showPort();
}
function onLost(){if(run.endless){saved.stormCheckpoint=null;recordStorm();}showOutcome('lost');}
function processEvents(){for(const e of game.events.splice(0)){particles.event(e);audio.play(e.type);if(e.text)toast(e.text);if(e.type==='won')onWon();if(e.type==='lost')onLost();}}
function frame(time){
  accumulator+=Math.min((time-lastTime)/1000,.08);lastTime=time;
  while(accumulator>=1/60){clock+=1/60;if(screen==='play'){tickVoyage(game,input.snapshot(),1/60);processEvents();}particles.update(1/60);accumulator-=1/60;hudClock+=1/60;}
  if(clock>toastUntil)$('toast').style.opacity='0';renderer.draw(game,chartOf(game),clock,particles);
  if(hudClock>=.1){updateHud(game,run,renderer,saved);hudClock=0;}
  requestAnimationFrame(frame);
}
$('room-button').addEventListener('click',showRoom);$('pause-room').addEventListener('click',showRoom);$('resume').addEventListener('click',togglePause);$('camera-toggle').addEventListener('click',toggleCamera);
$('sound').textContent=saved.sound?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-label',saved.sound?'Turn sound off':'Turn sound on');
$('sound').addEventListener('click',()=>{saved.sound=!audio.enabled();audio.setEnabled(saved.sound);persist();$('sound').textContent=saved.sound?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-label',saved.sound?'Turn sound off':'Turn sound on');});
showRoom();requestAnimationFrame(frame);
