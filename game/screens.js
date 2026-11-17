import {$,button,formatTime,medalName} from './ui.js';
import {LEVELS} from './levels.js';
import {SHIPS,shipUnlocked,shipProfile} from './ships.js';
import {choicesFor} from './upgrades.js';
import {fittingPrice,fittingUseful,REPAIR_COST} from './economy.js';
import {runChart} from './voyage.js';
function miniMap(level){return `<svg viewBox="0 0 1040 480" aria-hidden="true"><path d="M0 120H1040M0 240H1040M0 360H1040" stroke="#7faca419"/>${level.reefs.map(r=>`<circle cx="${r.x}" cy="${r.y}" r="${r.r}" fill="#7a8d77"/>`).join('')}${level.boats.map(b=>`<circle cx="${b.x}" cy="${b.y}" r="9" fill="#e3a16e"/>`).join('')}<circle cx="${level.harbor.x}" cy="${level.harbor.y}" r="42" fill="#e8c37a"/></svg>`;}
export function roomScreen(saved,cb){
  $('screen-content').className='screen-content room-screen';
  $('screen-content').innerHTML=`<div class="eyebrow">TIDEBOUND · THE NORTHREACH CHARTS</div><h2>Bring them <em>home.</em></h2><p class="screen-copy">Take their lines. Light the signals. Outrun the deep.</p><div class="ship-picker" id="ship-picker" aria-label="Starting ship"></div><div id="chart-grid" class="chart-grid"></div><div id="room-actions" class="room-actions"></div><div id="storm-actions" class="storm-actions"></div><div class="room-record">CAMPAIGN ${saved.campaignBest.toLocaleString('en-US')} · STORMWATCH ${saved.stormBest.toLocaleString('en-US')} · BEST WATCH ${saved.stormWatch}</div>`;
  for(const profile of SHIPS){
    const open=shipUnlocked(profile.id,saved),b=document.createElement('button');b.className='ship-card'+(saved.selectedShip===profile.id?' selected':'');b.disabled=!open;b.setAttribute('aria-label',`Select ${profile.name}`);
    b.innerHTML=`<span>${profile.mark}</span><strong>${profile.name}</strong><small>${open?profile.tag:profile.unlock==='medal'?'Earn a harbor medal':'Finish the campaign'}</small>`;b.addEventListener('click',()=>cb.ship(profile.id));$('ship-picker').append(b);
  }
  LEVELS.forEach((level,i)=>{
    const best=saved.bests[i],open=i<=saved.unlocked,b=document.createElement('button');b.className='chart-card'+(open?' open':' locked');b.disabled=!open;b.setAttribute('aria-label',`${level.name} — ${open?'Replay chart':'Locked'}`);
    b.innerHTML=`${miniMap(level)}<span class="chart-card-top"><b>${level.number}</b><small>${open?medalName(best.medal):'LOCKED'}</small></span><strong>${level.name}</strong><span class="chart-card-bottom">${open?best.score?`BEST ${best.score.toLocaleString('en-US')}`:level.subtitle:'Complete the previous chart'}<i>${open?'↗':'◇'}</i></span>`;
    b.addEventListener('click',()=>cb.practice(i));$('chart-grid').append(b);
  });
  $('room-actions').append(button(saved.checkpoint?`CONTINUE ${shipProfile(saved.checkpoint.ship.type).name.toUpperCase()} ↗`:'SAIL THE FOUR CHARTS ↗',saved.checkpoint?cb.continue:cb.new));
  if(saved.checkpoint)$('room-actions').append(button('NEW VOYAGE',cb.new,'text-button'));
  const storm=button(saved.campaignBest>0?saved.stormCheckpoint?`RESUME STORMWATCH · WATCH ${saved.stormCheckpoint.watch+1} ↗`:'STORMWATCH · ENDLESS RESCUE ↗':'STORMWATCH · COMPLETE THE CAMPAIGN TO UNLOCK',saved.stormCheckpoint?cb.continueStorm:cb.storm,'storm-launch');storm.disabled=saved.campaignBest<=0;$('storm-actions').append(storm);if(saved.stormCheckpoint)$('storm-actions').append(button('NEW WATCH',cb.storm,'text-button'));
}
export function resultStats(game,hullLabel='HULL LEFT'){return `<div class="result-stats"><div><strong>${game.rescued}</strong><span>CREWS HOME</span></div><div><strong>${Math.ceil(game.hull)}</strong><span>${hullLabel}</span></div><div><strong>${game.maxConvoy}</strong><span>LONGEST TOW</span></div><div><strong>${game.lost}</strong><span>LIGHTS LOST</span></div></div>`;}
export function portScreen(run,game,cb){
  const next=runChart(run.endless?{...run,watch:run.watch+1,level:(run.watch+1)%4}:{...run,level:run.level+1});
  $('screen-content').className='screen-content port-screen';
  $('screen-content').innerHTML=`<div class="eyebrow">${run.endless?`WATCH ${run.watch+1}`:`CHART ${runChart(run).number}`} COMPLETE · ${medalName(game.medal).toUpperCase()} VOYAGE</div><h2>Fit for <em>farther waters.</em></h2>${resultStats(game,'ARRIVAL HULL')}<div class="port-wallet"><span><strong>${run.brass}</strong> BRASS ABOARD</span><span>SAILING HULL ${Math.ceil(run.hull)} / ${run.ship.maxHull}</span></div><div class="next-chart"><span>NEXT · ${next.number}</span><strong>${next.name}</strong><small>${next.description}</small></div><div id="upgrade-grid" class="upgrade-grid"></div><div id="port-actions" class="port-actions"></div>`;
  for(const upgrade of choicesFor(run.endless?run.watch:run.level)){
    const price=fittingPrice(upgrade.id,run.ship),useful=fittingUseful(upgrade.id,run.ship),b=document.createElement('button');b.className='upgrade-card';b.disabled=run.brass<price||!useful;b.setAttribute('aria-label',`Fit ${upgrade.name} for ${price} brass`);
    b.innerHTML=`<span>${upgrade.mark}</span><strong>${upgrade.name}</strong><small>${upgrade.description}</small><i>${useful?`${price} BRASS · FIT & SAIL ↗`:'FULLY FITTED'}</i>`;b.addEventListener('click',()=>cb.fit(upgrade.id));$('upgrade-grid').append(b);
  }
  const repair=button(`PATCH HULL · ${REPAIR_COST} BRASS`,cb.repair,'text-button');repair.disabled=run.brass<REPAIR_COST||run.hull>=run.ship.maxHull;
  $('port-actions').append(repair,button('KEEP BRASS & SAIL ↗',cb.depart,'text-button'));
}
export function outcomeScreen(kind,run,game,saved,cb){
  $('screen-content').className='screen-content outcome-screen';
  let overline,heading,body;
  if(kind==='won'){
    overline='ALL FOUR CHARTS · EVERY HARBOR LIT';heading='You brought<br><em>the dawn.</em>';
    body=`<div class="campaign-tally"><strong>${(run.score+run.brass*10).toLocaleString('en-US')}</strong><span>CAMPAIGN SCORE</span></div><p class="screen-copy">${run.rescued} crews home · ${formatTime(run.elapsed)} at sea<br>${run.brass} brass brought ashore. The Northreach is awake.</p><div class="eyebrow">CHART BESTS</div><div class="medal-row">${saved.bests.map((b,i)=>`<span>${LEVELS[i].number} <b>${medalName(b.medal)}</b></span>`).join('')}</div>`;
  }else if(kind==='practice-won'){
    overline=`${runChart(run).name.toUpperCase()} · ${medalName(game.medal).toUpperCase()} VOYAGE`;heading='A harbor<br><em>remembers.</em>';body=resultStats(game)+`<p class="screen-copy">Chart score <strong>${game.score.toLocaleString('en-US')}</strong><br>Return for a cleaner run, or sail the full Northreach.</p>`;
  }else{
    overline=run.endless?`STORMWATCH · WATCH ${run.watch+1}`:`${runChart(run).name.toUpperCase()} · THE LIGHT STILL WAITS`;heading='The sea<br><em>took its toll.</em>';
    body=resultStats(game)+`<p class="screen-copy">${game.rescued} of ${runChart(run).target} crews home. ${game.lost} lights lost.<br>${run.endless?`Watch score <strong>${(run.score+game.score).toLocaleString('en-US')}</strong>. How far can your next ship go?`:"Your ship's fittings are ready for another attempt."}</p>`;
  }
  $('screen-content').innerHTML=`<div class="eyebrow">${overline}</div><h2>${heading}</h2>${body}<div id="result-actions" class="result-actions"></div>`;
  $('result-actions').append(button(kind==='won'?'SAIL AGAIN ↗':kind==='practice-won'?'REPLAY THIS CHART ↗':run.endless?'START A NEW WATCH ↗':'RETRY THIS CHART ↗',cb.retry),button('CHART ROOM',cb.room,'text-button'));
}
