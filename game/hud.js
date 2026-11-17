import {$,text,formatTime} from './ui.js';
import {chartOf,voyageScore} from './simulation.js';
import {UPGRADE_CATALOG} from './upgrades.js';
import {shipProfile} from './ships.js';
export function updateHud(game,run,renderer,saved={}){
  const level=chartOf(game),hull=Math.ceil(game.hull),playing=game.mode==='playing';
  text('location',`${level.number} · ${level.name.toUpperCase()}`);text('weather',game.mode==='won'?'The harbor light is safe.':level.subtitle);
  text('voyage-label',run?run.endless?`STORMWATCH · WATCH ${run.watch+1}`:`${run.practice?'CHART PRACTICE':'NORTHREACH VOYAGE'} · ${level.number} / IV`:'FOUR WATERS. ONE LAST LIGHT.');
  text('mission-copy',`Bring ${level.target} stranded crews home.\n${level.fog?'Flares buy time and reveal the fog.':'Secure the fading lights first.'}`);
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
