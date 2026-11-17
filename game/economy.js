import {UPGRADE_CATALOG,applyUpgrade} from './upgrades.js';
export const REPAIR_COST=5;
export const REPAIR_HULL=35;
export function fittingPrice(id,ship){const item=UPGRADE_CATALOG[id];return item?item.cost+ship.upgrades.length*8+ship.upgrades.filter(x=>x===id).length*6:Infinity;}
export function fittingUseful(id,ship){if(!UPGRADE_CATALOG[id])return false;const next=applyUpgrade(ship,id);return Object.keys(next).some(k=>k!=='upgrades'&&next[k]!==ship[k]);}
export const crewBrass=levelIndex=>4+Math.floor(Math.max(0,levelIndex)/2);
export const salvageBrass=3;
export function buyRepair(hull,ship,brass){if(brass<REPAIR_COST||hull>=ship.maxHull)return null;return{hull:Math.min(ship.maxHull,hull+REPAIR_HULL),brass:brass-REPAIR_COST};}
