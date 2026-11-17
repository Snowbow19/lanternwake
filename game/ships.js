export const SHIPS=[
  {id:'tug',name:'Northreach Tug',mark:'◆',tag:'Balanced · 3 tows',unlock:'start',speed:155,maxHull:100,towCapacity:3,ropeLength:43,lineStrength:118,armor:0,flareCapacity:2,visibility:220,boostRecovery:.14,color:'#e0bd78'},
  {id:'skiff',name:'Cove Skiff',mark:'➤',tag:'Fast · light · 2 tows',unlock:'medal',speed:190,maxHull:75,towCapacity:2,ropeLength:39,lineStrength:110,armor:0,flareCapacity:3,visibility:250,boostRecovery:.18,color:'#8bc7b5'},
  {id:'cutter',name:'Harbor Cutter',mark:'▰',tag:'Armored · 4 tows',unlock:'campaign',speed:135,maxHull:145,towCapacity:4,ropeLength:46,lineStrength:140,armor:.1,flareCapacity:2,visibility:230,boostRecovery:.12,color:'#b6c7da'},
];
export const shipProfile=id=>SHIPS.find(s=>s.id===id)||SHIPS[0];
export function shipUnlocked(id,save){const s=shipProfile(id);return s.unlock==='start'||s.unlock==='medal'&&save.bests?.[0]?.medal>0||s.unlock==='campaign'&&save.campaignBest>0;}
