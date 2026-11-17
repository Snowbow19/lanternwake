const boat = (x,y,name) => ({x,y,name});
const reef = (x,y,r) => ({x,y,r});
const squall = (x,y,r,phase=0) => ({kind:'squall',x,y,r,phase});
const whirlpool = (x,y,r) => ({kind:'whirlpool',x,y,r,phase:0});

export const LEVELS = [
  {
    id:'harbor',name:'Lantern Harbor',number:'I',subtitle:'The first line',
    description:'Open water, stranded crews and a light to steer by.',
    target:3,seconds:120,harbor:{x:150,y:245,r:82},spawn:{x:260,y:250},
    palette:['#153f46','#0c303c','#081f30'],fog:false,
    reefs:[reef(510,125,31),reef(570,332,34),reef(830,123,25)],
    boats:[boat(350,172,'Lark'),boat(415,300,'Morrow'),boat(610,230,'Minnow'),boat(700,119,'Plover'),boat(822,316,'Solace')],
    hazards:[squall(760,260,53),squall(610,390,37,2)],currents:[],
    salvage:[{x:410,y:225},{x:650,y:320}],
    briefing:'Bring three crews home. Longer convoys earn more, but turn slowly.',
  },
  {
    id:'channel',name:'Glass Channel',number:'II',subtitle:'Against the current',
    description:'Thread the reef lanes. Read the tide before you commit.',
    target:4,seconds:150,harbor:{x:135,y:245,r:78},spawn:{x:235,y:245},
    palette:['#194a4c','#12404b','#102c43'],fog:false,
    reefs:[reef(340,175,30),reef(450,330,34),reef(610,130,33),reef(760,340,29)],
    boats:[boat(325,350,'Kestrel'),boat(490,235,'Fable'),boat(680,230,'Wren'),boat(805,155,'Aster'),boat(910,340,'Amity'),boat(920,255,'Dove')],
    hazards:[squall(805,220,47,1)],
    currents:[{x:260,y:205,w:740,h:65,vx:32,vy:0},{x:250,y:345,w:670,h:54,vx:-25,vy:-3}],
    salvage:[{x:390,y:230},{x:710,y:270},{x:870,y:350}],
    briefing:'Four crews need the harbor. The bright tide lanes push your whole convoy.',
  },
  {
    id:'banks',name:'Murmur Banks',number:'III',subtitle:'A voice in the fog',
    description:'Follow the lanterns. Spend your flares where they matter.',
    target:4,seconds:150,harbor:{x:890,y:245,r:80},spawn:{x:790,y:245},
    palette:['#29454b','#1c3647','#182b40'],fog:true,
    reefs:[reef(650,120,33),reef(440,330,35),reef(245,205,28)],
    boats:[boat(700,330,'Echo'),boat(570,220,'Clover'),boat(410,125,'Lumen'),boat(310,365,'Finch'),boat(145,250,'Mercy'),boat(510,390,'June')],
    hazards:[squall(560,180,49,2),whirlpool(320,240,46)],currents:[],
    salvage:[{x:660,y:255},{x:380,y:240},{x:170,y:340}],
    briefing:'Rescue four crews. E launches a flare: reveal the fog and calm nearby squalls.',
  },
  {
    id:'passage',name:'Dawn Passage',number:'IV',subtitle:'The last crossing',
    description:'Every lesson, one voyage. Bring the last crews home.',
    target:5,seconds:180,harbor:{x:140,y:245,r:80},spawn:{x:245,y:245},
    palette:['#283e46','#183445','#16283c'],fog:false,
    reefs:[reef(510,115,33),reef(570,345,34),reef(830,120,27),reef(790,390,19)],
    boats:[boat(350,150,'Haven'),boat(410,330,'Sable'),boat(590,225,'Oriole'),boat(715,125,'Morning'),boat(835,315,'Linnet'),boat(940,220,'Last Light'),boat(665,400,'Homeward')],
    hazards:[squall(600,185,51,1),squall(690,360,43,3),whirlpool(790,240,54)],
    currents:[{x:300,y:210,w:700,h:63,vx:27,vy:3}],
    salvage:[{x:430,y:235},{x:675,y:270},{x:900,y:360}],
    briefing:'Five crews remain. Use your ship and flares to cross the turning sea.',
  },
];

export function getLevel(index) { return LEVELS[Math.max(0,Math.min(LEVELS.length-1,index|0))]; }
