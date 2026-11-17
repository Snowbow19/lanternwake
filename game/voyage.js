import {getLevel} from './levels.js';
import {createWatch} from './stormwatch.js';
import {baseShip,applyUpgrade} from './upgrades.js';
import {fittingPrice,fittingUseful,buyRepair} from './economy.js';
export function newRun(kind,type='tug',level=0){const ship=baseShip(type);return{practice:kind==='practice',endless:kind==='storm',watch:0,level,ship,hull:ship.maxHull,brass:0,score:0,rescued:0,elapsed:0};}
export const runChart=run=>run.endless?createWatch(run.watch):getLevel(run.level);
export function completedChart(run,game){return{...run,hull:game.hull,brass:run.brass+game.brassEarned,score:run.score+game.score,rescued:run.rescued+game.rescued,elapsed:run.elapsed+game.elapsed};}
export function purchaseFitting(run,id){const price=fittingPrice(id,run.ship);if(run.brass<price||!fittingUseful(id,run.ship))return null;const ship=applyUpgrade(run.ship,id);return{...run,ship,brass:run.brass-price,hull:id==='plating'?ship.maxHull:Math.min(run.hull,ship.maxHull)};}
export function patchHull(run){const patch=buyRepair(run.hull,run.ship,run.brass);return patch?{...run,...patch}:null;}
export function depart(run){return run.endless?{...run,watch:run.watch+1,level:(run.watch+1)%4}:{...run,level:run.level+1};}
export function checkpointOf(run){const {level,ship,hull,brass,score,rescued,elapsed,watch}=run;return{level,ship:structuredClone(ship),hull,brass,score,rescued,elapsed,...(run.endless?{watch}:{})};}
