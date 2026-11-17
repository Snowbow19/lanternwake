import {$,text,formatTime} from './ui.js';
import {chartOf,voyageScore} from './simulation.js';
import {UPGRADE_CATALOG} from './upgrades.js';
import {shipProfile} from './ships.js';
export function updateHud(game,run,renderer,saved={}){
  const level=chartOf(game),hull=Math.ceil(game.hull),playing=game.mode==='playing';
  text('location',`${level.number} · ${level.name.toUpperCase()}`);text('weather',game.mode==='won'?'The harbor light is safe.':level.subtitle);
  text('voyage-label',run?run.endless?`STORMWATCH · WATCH ${run.watch+1}`:`${run.practice?'CHART PRACTICE':'NORTHREACH VOYAGE'} · ${level.number} / IV`:'FOUR WATERS. ONE LAST LIGHT.');
  const lit=game.beacons.filter(b=>b.lit).length;
  text('mission-copy',game.monster?'Dodge the surges. Light both towers. Bring the last crews home.':`Bring ${level.target} stranded crews home.\n${game.beacons.length?'Light the signal towers with E.':'Take their lines. Follow the harbor light.'}`);
  text('objective-line',game.beacons.length?`${game.rescued} / ${level.target} CREWS HOME   ·   ${lit} / ${game.beacons.length} SIGNALS LIT`:`${game.rescued} / ${level.target} CREWS HOME   ·   ${game.tow.length} IN TOW`);
  const near=game.boats.filter(b=>b.state==='waiting'&&Math.hypot(b.x-game.tug.x,b.y-game.tug.y)<82).sort((a,b)=>Math.hypot(a.x-game.tug.x,a.y-game.tug.y)-Math.hypot(b.x-game.tug.x,b.y-game.tug.y))[0];
  const signal=game.beacons.find(b=>!b.lit&&Math.hypot(b.x-game.tug.x,b.y-game.tug.y)<115);
  text('action-hint',playing?signal?`E · LIGHT ${signal.name.toUpperCase()}`:near&&game.tow.length<game.ship.towCapacity?`SPACE · TAKE ${near.name.toUpperCase()} IN TOW`:game.rescued>=level.target&&!game.beacons.every(b=>b.lit)?'LIGHT THE REMAINING SIGNAL TOWERS · E':game.refillTime>0?'HARBOR TENDER · REPLENISHING FLARES':'':'');
  $('action-hint').classList.toggle('visible',!!$('action-hint').textContent);
  text('rescued',String(game.rescued).padStart(2,'0'));text('goal-count',String(level.target).padStart(2,'0'));
  text('hull-label',`${hull} / ${game.ship.maxHull}`);$('hull-fill').style.width=`${game.hull/game.ship.maxHull*100}%`;$('hull-fill').style.background=game.hull/game.ship.maxHull<.35?'#e1846c':'#9bc5a7';
  text('clock',formatTime(Math.ceil(level.seconds-game.elapsed)));text('convoy',`${game.tow.length} / ${game.ship.towCapacity} IN TOW`);
  text('flare-count',`✷ ${game.flares} FLARES`);text('salvage-count',`${game.salvaged} SUPPLIES`);
  text('brass-value',(run?.brass||0)+(game.mode==='won'&&!run?.practice?0:game.brassEarned));text('lost-value',game.lost);text('strain-value',`${Math.round(game.maxStrain*100)}%`);
  const partial=game.mode==='playing'?voyageScore(game):game.mode==='lost'||run?.practice?game.score:0,score=(run?.score||0)+partial;
  text('score-strip',run?run.endless?`WATCH SCORE ${score.toLocaleString('en-US')} · BEST ${(saved.stormBest||0).toLocaleString('en-US')}`:`VOYAGE SCORE ${score.toLocaleString('en-US')}`:`CAMPAIGN BEST ${(saved.campaignBest||0).toLocaleString('en-US')}`);
  $('strain-value').classList.toggle('danger',game.maxStrain>.9);text('ship-name',shipProfile(game.ship.type).name);
  text('camera-toggle',renderer.isOverview()?'C · NEAR VIEW':'C · CHART VIEW');$('camera-toggle').disabled=!playing;$('camera-toggle').classList.toggle('hidden',!playing);
  const upgrades=game.ship.type+':'+game.ship.upgrades.join(',');
  if($('ship-upgrades').dataset.value!==upgrades){$('ship-upgrades').dataset.value=upgrades;$('ship-upgrades').innerHTML=game.ship.upgrades.length?game.ship.upgrades.map(id=>`<span title="${UPGRADE_CATALOG[id].description}">${UPGRADE_CATALOG[id].mark} ${UPGRADE_CATALOG[id].name}</span>`).join(''):`<span>${game.ship.towCapacity} TOW BERTHS · STANDARD FITTINGS</span>`;}
}
