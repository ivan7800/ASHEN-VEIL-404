(()=>{'use strict';
const W=480,H=270,PI=Math.PI,TAU=PI*2,FOV=.73,SAVE='ashen-veil-rebirth-v2';
const VERSION='3.7.0';
const $=id=>document.getElementById(id),screen=$('screen'),ctx=screen.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;
let warningUntil=0,hitFlashUntil=0;
let contactKind='hit';
let tick=0,last=0,playing=false,paused=true,toastUntil=0,shake=0,spellAnim=0,injury=0,walkTime=0,mapOn=false;
const keys=Object.create(null),rand=(x,y,s=0)=>{let n=Math.sin(x*127.1+y*311.7+s*81.3)*43758.5453;return n-Math.floor(n)},clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const MAP_WIDTH=72, MAP_HEIGHT=66;
const grid=Array.from({length:MAP_HEIGHT},()=>Array(MAP_WIDTH).fill(1));const carve=(x1,y1,x2,y2)=>{for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)grid[y][x]=0};
carve(2,14,9,22);carve(9,17,17,18);carve(15,12,25,22);carve(19,8,19,12);carve(13,2,26,8);carve(3,5,11,11);carve(6,11,6,14);
// The flooded nave is a side route off the catacombs. The chapel shortcut opens from inside.
carve(26,16,26,17);
carve(27,13,28,21);
carve(10,12,10,15);
grid[13][10]=5;
// Gate and a suspicious sealed stone on the route to the secret chapel.
grid[10][19]=3;grid[13][6]=4;
// Stonework and pillars in large rooms.
for(const [x,y] of [[15,3],[24,3],[15,7],[24,7],[17,14],[23,14],[17,20],[23,20],[4,7],[10,7]])grid[y][x]=2;
for(const wing of VeilExpedition.wings){
  for(const [x1,y1,x2,y2] of wing.rooms)carve(wing.x+x1,wing.y+y1,wing.x+x2,wing.y+y2);
  grid[Math.floor(wing.entry[1])][Math.floor(wing.entry[0])]=0;
  grid[Math.floor(wing.y+18.5)][Math.floor(wing.x+9.5)]=0;
}
let discoveries=[], archiveChoice=null;
const mirrorDirections=['borde','arriba','fondo'];
const mirrorTargets={skyDark:2,skyLight:1};
const mirrorPositions={skyDark:0,skyLight:0};
const isMirror=id=>Object.hasOwn(mirrorTargets,id);
function updateAnnexBarriers(){
  for(const {id,x,y} of VeilExpedition.barriers)grid[y][x]=discoveries.includes(id)?0:5;
}
updateAnnexBarriers();
const zones=['CRIPTA DEL DESPERTAR','CATACUMBAS DE LOS OLVIDADOS','CAPILLA OCULTA','SANTUARIO DEL VIGÍA','NAVE INUNDADA',...Object.values(VeilExpedition.areas)];
const objects=[{id:'altar',kind:'altar',x:4.8,y:17.2,label:'Altar de ceniza',active:true},{id:'key',kind:'key',x:23,y:18,label:'Llave de hueso',active:true},{id:'relic',kind:'relic',x:8,y:8.4,label:'Corazón del vacío',active:true},{id:'exit',kind:'exit',x:19.5,y:3.2,label:'Sello del amanecer',active:true},{id:'flask',kind:'loot',x:17.4,y:19.3,label:'Frasco carmesí',active:true},{id:'lever',kind:'lever',x:24.3,y:20.3,label:'Palanca del osario',active:true},{id:'cache',kind:'cache',x:16.3,y:13.5,label:'Osario oculto',active:false},{id:'tablet',kind:'tablet',x:5.4,y:21.1,label:'Inscripción erosionada',active:true},{id:'tablet2',kind:'tablet',x:22.7,y:6.1,label:'Última plegaria',active:true},{id:'echo1',kind:'echo',x:7.4,y:20.4,label:'Eco de la Sepultura',active:true},{id:'echo2',kind:'echo',x:22.6,y:21.0,label:'Eco del Diluvio',active:true},{id:'echo3',kind:'echo',x:9.0,y:7.7,label:'Eco de la Herejía',active:true},{id:'seal1',kind:'seal',x:3.3,y:21.4,label:'Sello de la Sepultura',active:true},{id:'seal2',kind:'seal',x:5.2,y:8.8,label:'Sello de la Herejía',active:true}];
objects.push(
  {id:'chapelShortcut',kind:'shortcut',x:10.5,y:12.5,label:'Cadena del pasadizo',active:true},
  {id:'floodBell',kind:'bell',x:28.35,y:14.4,label:'Campana sumergida',active:true},
  {id:'sanctuaryAltar',kind:'altar',x:19.5,y:9.5,label:'Altar del umbral',active:true},
);
objects.push(...VeilExpedition.stations,...VeilExpedition.doors);
const weapons={
 sword:{name:'ESPADA DE CENIZA',short:'ESPADA',reach:2.15,heavyReach:2.45,damage:26,heavyDamage:49,stamina:21,heavyStamina:38,cool:.52,heavyCool:.94,arc:.62,heavyArc:.48,color:'#e4c4b6',lore:'Una hoja que sobrevivió al dueño.'},
 spear:{name:'LANZA DEL CANTERO',short:'LANZA',reach:3.2,heavyReach:3.5,damage:23,heavyDamage:43,stamina:25,heavyStamina:39,cool:.64,heavyCool:1.05,arc:.34,heavyArc:.26,color:'#d3c2a5',lore:'La punta conserva sal en las ranuras. Llega lejos, exige precisión.'},
 axe:{name:'HACHA DE RAÍZ',short:'HACHA',reach:1.9,heavyReach:2.1,damage:37,heavyDamage:68,stamina:30,heavyStamina:47,cool:.79,heavyCool:1.25,arc:.72,heavyArc:.62,color:'#b48c7b',lore:'Una raíz atraviesa el hierro. Golpea despacio y rompe guardias.'},
 needle:{name:'AGUJA DE MAREA',short:'AGUJA',reach:3.85,heavyReach:4.15,damage:20,heavyDamage:37,stamina:28,heavyStamina:43,cool:.76,heavyCool:1.12,arc:.19,heavyArc:.16,color:'#a4c8c9',lore:'Instrumento de sondeo usado para medir distancias imposibles.'},
};
const weaponFinds=[
 {id:'spear',x:38.5,y:14.5,label:'Lanza del Cantero',kind:'weapon',active:true},
 {id:'axe',x:45.5,y:37.5,label:'Hacha de Raíz',kind:'weapon',active:true},
 {id:'needle',x:58.5,y:26.5,label:'Aguja de Marea',kind:'weapon',active:true},
];
objects.push(...weaponFinds);
let ownedWeapons=['sword'],equippedWeapon='sword';
function equipNext(){if(!playing||paused||swing)return;const i=ownedWeapons.indexOf(equippedWeapon);equippedWeapon=ownedWeapons[(i+1)%ownedWeapons.length];note('EQUIPADA: '+weapons[equippedWeapon].name,2.5);updateWeaponHud();save();}
function updateWeaponHud(){
  $('weapon-slot').textContent=weapons[equippedWeapon].short;
  $('weapon-icon').setAttribute('data-weapon',equippedWeapon);
}

const encounterSigns={
  w1:[6.2,1.25,'La figura del corredor levanta lentamente la cabeza.'],
  w2:[6,1.2,'Unas uñas raspan la piedra del osario.'],
  w3:[6.6,1.55,'Un arrastre de hierro viene de las catacumbas.'],
  w4:[6.2,1.4,'El polvo gira alrededor del Testigo.'],
  w5:[6.4,1.55,'Una sombra se separa de las raíces.'],
  ambush1:[5,1.8,'Los huesos del nicho empiezan a moverse.'],
  ambush2:[4.8,1.65,'Algo al otro lado del altar contiene el aliento.'],
  bellKeeper:[6.5,1.8,'La cadena del Campanero se tensa bajo el agua.'],
  boss:[8,2.1,'Los ojos del altar se abren uno a uno.'],
};
const defs=[{id:'w1',type:'hollow',x:11.7,y:17.7,hp:64,damage:12,ashes:35},{id:'w2',type:'hollow',x:17.4,y:16.2,hp:64,damage:12,ashes:35},{id:'w3',type:'knight',x:22.1,y:15.3,hp:112,damage:19,ashes:80},{id:'w4',type:'wraith',x:19.5,y:12.9,hp:85,damage:13,ashes:60},{id:'w5',type:'wraith',x:7.5,y:9.5,hp:85,damage:13,ashes:60},{id:'ambush1',type:'knight',x:20.7,y:21.0,hp:120,damage:17,ashes:85},{id:'ambush2',type:'wraith',x:8.5,y:8.1,hp:90,damage:14,ashes:65},{id:'boss',type:'boss',x:19.5,y:5.3,hp:450,damage:24,ashes:400}];
defs.push({id:'bellKeeper',type:'drowned',x:27.9,y:16.6,hp:108,damage:18,ashes:95});
const traps=[{x:13.2,y:17.6,r:.63,damage:15,period:3.6,activeTime:.9,offset:0},{x:19.5,y:11.7,r:.55,damage:19,period:4.2,activeTime:1.0,offset:1.8},{x:7.6,y:9.3,r:.62,damage:12,period:3.3,activeTime:.85,offset:1.1}];
let witnessedAfterRite=false;
let trapCooldown=0,leverUsed=false,cacheOpened=false,tabletsRead=[],echoesCollected=[],echoReward=false;
// Optional exploration: ritual seals ease the final fight without gating victory.
let sealsBroken=[],zonesVisited=[],lastZone='';
let shortcutOpen=false, bellRung=false, crimsonTaken=false, saveReady=false;
const PREFS='ashen-veil-remaster-options';
const defaults={volume:70,muted:false,quiet:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false,low:false};
let settings={...defaults};
try{
  const saved=JSON.parse(localStorage.getItem(PREFS));
  if(saved){
    for(const key of ['muted','quiet','low'])if(typeof saved[key]==='boolean')settings[key]=saved[key];
    if(Number.isFinite(saved.volume))settings.volume=clamp(saved.volume,0,100);
  }
}catch{}
const creatureNames={hollow:'PENITENTE HUECO',knight:'CARCELERO DEL OSARIO',wraith:'TESTIGO CIEGO',drowned:'CAMPANERO AHOGADO',boss:'EL VIGÍA'};

const maxHealth=()=>100+(player.lv-1)*8+(player.relic?30:0);
const restoredEnding=()=>bellRung&&sealsBroken.length===2&&echoReward;
const player={x:5.4,y:19,ang:-PI/2,hp:100,maxhp:100,st:100,mp:60,flasks:3,maxflasks:3,ashes:0,lv:1,key:false,relic:false,gate:false,secret:false,won:false,checkpoint:[5.4,19],hurt:0,roll:0,attackCd:0,spellCd:0,block:false,step:0,poise:0};
// Artistic props are deliberately non-interactive and do not alter collision or save format.
const scenery=[
  {x:5.0,y:15.1,type:'torch',scale:.68},{x:9.4,y:17.45,type:'torch',scale:.62},
  {x:15.6,y:17.45,type:'torch',scale:.62},{x:20.6,y:13.3,type:'torch',scale:.73},
  {x:21.8,y:8.4,type:'torch',scale:.7},{x:13.7,y:5.4,type:'torch',scale:.68},
  {x:5.2,y:6.05,type:'idol',scale:.82},{x:24.9,y:20.8,type:'idol',scale:1.06},
  {x:16.1,y:5.8,type:'urn',scale:.5},{x:22.8,y:5.8,type:'urn',scale:.5},
  {x:3.1,y:20.8,type:'urn',scale:.54},{x:24.5,y:15.8,type:'urn',scale:.52},
  {x:8.8,y:18.1,type:'arch',scale:1.42},{x:15.8,y:17.65,type:'arch',scale:1.32},
  {x:19.6,y:8.5,type:'arch',scale:1.6},{x:7.0,y:10.6,type:'arch',scale:1.24},
  {x:23.7,y:18.1,type:'banner',scale:.87},{x:25.2,y:5.6,type:'banner',scale:.95},
  {x:4.0,y:16.1,type:'chains',scale:.85},{x:23.8,y:6.1,type:'chains',scale:.92},{x:12.9,y:17.5,type:'idol',scale:.5},{x:18.9,y:11.6,type:'urn',scale:.53},{x:6.9,y:9.2,type:'chains',scale:.75},
  // Deliberate room silhouettes, decorative only: memorable landmarks without changing navigation.
  {x:3.7,y:19.7,type:'coffin',scale:1.16},{x:8.2,y:20.7,type:'coffin',scale:.92},
  {x:16.3,y:21.2,type:'bonepile',scale:.71},{x:23.4,y:17.5,type:'bonepile',scale:.66},
  {x:21.5,y:19.8,type:'fungus',scale:.7},{x:17.5,y:15.8,type:'fungus',scale:.53},
  {x:10.45,y:6.1,type:'roots',scale:1.45},{x:4.6,y:9.6,type:'roots',scale:1.4},
  {x:8.8,y:6.6,type:'stainedglass',scale:1.32},
  {x:17.1,y:4.5,type:'brazier',scale:.85},{x:22.9,y:4.5,type:'brazier',scale:.85},
  {x:19.5,y:2.7,type:'stainedglass',scale:1.7},
  {x:7.4,y:19.8,type:'bonepile',scale:.55},{x:23.6,y:21.3,type:'fungus',scale:.78},{x:9.2,y:8.8,type:'roots',scale:1.1},
];
scenery.push(
  {x:27.7,y:20.2,type:'fungus',scale:.95},
  {x:27.4,y:15.4,type:'chains',scale:1.2},
  {x:27.2,y:13.8,type:'urn',scale:.65},
  {x:10.3,y:12.4,type:'torch',scale:.55},
);
const routeLandmarks=[
  {x:24.5,y:12.5,type:'ledger',scale:1.25},
  {x:27.25,y:20.9,type:'gauge',scale:1.3},
];
const annexScenery=VeilExpedition.wings.flatMap(wing=>wing.props.map(([x,y,type,scale])=>({x:wing.x+x,y:wing.y+y,type,scale})));
let bossDefeated=false;let enemies=[];function resetEnemies(){enemies=defs.map((d,i)=>({...d,maxhp:d.hp,alive:true,cool:i*.21,stun:0,flash:0,alert:false,waking:0,windup:0,attackPose:0,phase:1,strafeSign:i%2?1:-1,facing:Math.PI/2,attackKind:'slash',windupDuration:0,defeatedAt:null,attackReach:1.5,attackArc:.85,attackDamage:d.damage,attacksMade:0,attackMin:0,route:[],nextRoute:0,guard:0,originX:d.x,originY:d.y}));}
resetEnemies();let dropped=null;
function restoreAfterDeath(){
  const defeated=new Set(enemies.filter(enemy=>!enemy.alive).map(enemy=>enemy.id));
  resetEnemies();
  for(const enemy of enemies)if(defeated.has(enemy.id))enemy.alive=false;
}
const textures=Object.fromEntries(Object.keys(VeilLighting.materials).map(region=>[
  region,Object.fromEntries(['wall','pillar','gate','secret'].map(kind=>[kind,VeilArt.wall(region,kind)]))
]));
const awakeWall={
  chapel: VeilArt.wall('chapel','wall',true),
  sanctuary: VeilArt.wall('sanctuary','wall',true),
};
const watcherWalls=new Set(['5,4','7,4','12,8','12,9','18,1','19,1','20,1','27,5']);
const sprite={};function drawSprite(type){let c=document.createElement('canvas');c.width=72;c.height=100;let s=c.getContext('2d');s.imageSmoothingEnabled=false;const rect=(x,y,w,h,col)=>{s.fillStyle=col;s.fillRect(x,y,w,h)};const poly=(points,col)=>{s.fillStyle=col;s.beginPath();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();s.fill()};
if(type==='altar'){poly([[9,88],[63,88],[55,68],[17,68]],'#4c4857');rect(14,79,44,15,'#726b70');rect(23,56,26,24,'#393440');rect(29,40,13,20,'#9d8190');poly([[36,8],[21,45],[35,43],[42,53],[54,43]],'#915971');poly([[36,17],[29,44],[42,42]],'#f1bf9c');rect(34,40,5,14,'#f8dfb6')}
if(type==='echo'){s.shadowColor='#ae8eff';s.shadowBlur=18;poly([[36,9],[49,32],[43,67],[36,90],[28,67],[23,32]],'#302a4f');poly([[36,16],[43,36],[39,66],[36,79],[32,63],[29,35]],'#9f85cf');rect(33,31,7,31,'#e0c5f4');rect(22,47,28,3,'#7e689d');}
if(type==='key'){s.shadowColor='#e1c581';s.shadowBlur=16;s.strokeStyle='#e2c891';s.lineWidth=6;s.beginPath();s.arc(36,30,14,0,TAU);s.moveTo(36,44);s.lineTo(36,81);s.lineTo(49,81);s.moveTo(36,67);s.lineTo(49,67);s.stroke()}
if(type==='relic'){s.shadowColor='#b997ff';s.shadowBlur=20;poly([[36,15],[57,32],[48,65],[36,85],[24,65],[15,32]],'#65579a');poly([[36,17],[40,55],[36,80],[31,55]],'#c4a4ef');rect(31,42,10,6,'#f8d8ff')}
if(type==='loot'){rect(27,55,19,33,'#7b323d');rect(24,53,24,9,'#d7b18f');rect(28,44,16,10,'#aaaaa5');rect(31,31,10,13,'#c5afb4')}
if(type==='torch'){
  rect(32,52,9,45,'#272833');rect(29,50,15,7,'#958876');rect(26,42,20,12,'#5c5356');
  poly([[26,43],[30,23],[36,11],[43,23],[47,43],[37,49]],'#7f4255');
  poly([[30,42],[33,24],[39,17],[42,33],[39,44]],'#e18b73');
  poly([[34,39],[36,25],[40,37]],'#fbe2aa');
  rect(26,49,21,3,'#d2ac83');
}
if(type==='idol'){
  poly([[13,94],[13,80],[58,80],[61,94]],'#525365');rect(19,72,35,11,'#747481');
  poly([[20,73],[17,40],[26,30],[30,18],[42,18],[48,31],[55,41],[51,73]],'#514b60');
  poly([[28,35],[23,48],[29,64],[43,64],[49,48],[44,35]],'#82778a');
  rect(28,41,6,3,'#aa7186');rect(40,41,6,3,'#aa7186');
  rect(33,48,8,3,'#29212f');rect(26,69,24,3,'#312d3b');
  poly([[28,22],[19,6],[36,20],[50,3],[44,27]],'#777083');
}
if(type==='urn'){
  poly([[24,25],[48,25],[51,34],[47,76],[54,84],[17,84],[24,76],[21,34]],'#655863');
  rect(22,24,29,6,'#9b7d7b');rect(23,43,25,4,'#3b333e');rect(27,54,18,11,'#86727b');
  rect(24,79,25,5,'#4b404e');
}
if(type==='arch'){
  rect(5,17,12,83,'#252630');rect(55,17,12,83,'#252630');
  rect(9,12,54,15,'#615563');rect(14,8,44,11,'#777181');
  poly([[10,30],[13,18],[23,6],[35,2],[49,6],[60,18],[63,30],[51,30],[46,19],[36,14],[27,19],[21,30]],'#5e576b');
  poly([[21,30],[27,18],[36,13],[46,18],[51,30],[47,30],[42,23],[35,20],[30,23],[26,30]],'#1c1b29');
  for(let i=0;i<4;i++){rect(6,37+i*17,10,2,'#79727f');rect(56,37+i*17,10,2,'#79727f');}
  rect(29,4,14,6,'#aa8490');
}
if(type==='banner'){
  rect(14,9,46,5,'#988d9b');rect(18,13,4,7,'#aaa0a8');rect(54,13,4,7,'#aaa0a8');
  poly([[21,17],[54,17],[51,85],[37,70],[24,85]],'#46334b');
  rect(27,24,23,4,'#806078');rect(34,29,7,35,'#b39396');rect(27,46,21,5,'#aa9295');
  poly([[29,69],[37,61],[45,69],[37,74]],'#c2a8a3');
}
if(type==='chains'){
  for(let i=0;i<3;i++){let x=19+i*15;rect(x,8,4,67,'#747383');for(let y=14;y<74;y+=10){rect(x-2,y,8,3,'#aba4a3');rect(x,y+3,4,4,'#373543');}}
  rect(12,5,49,7,'#77717d');rect(28,77,21,8,'#403949');
}
// Original 72x100 pixel silhouettes built from layered primitives. No external assets.
if(type==='coffin'){
 poly([[9,74],[18,43],[55,43],[65,74],[54,93],[18,93]],'#1b1a26');poly([[16,68],[22,36],[49,36],[57,68],[49,84],[23,84]],'#777080');
 poly([[19,66],[25,40],[46,40],[53,66],[46,78],[25,78]],'#34313f');rect(33,43,6,30,'#ac8f91');rect(26,51,20,5,'#ac8f91');
 rect(14,82,45,6,'#24212e');rect(22,34,27,5,'#b2a49a');
}
if(type==='bonepile'){
 poly([[5,86],[12,75],[25,72],[32,62],[43,68],[54,75],[65,87]],'#514a4c');
 for(let i=0;i<13;i++){const x=9+(rand(i,9)*51)|0,y=62+(rand(i,5)*23)|0;rect(x,y,8,3,i%3?'#ad9d91':'#756c70');}
 rect(23,60,22,15,'#c2b0a0');rect(27,63,5,5,'#28242d');rect(37,63,5,5,'#28242d');rect(32,71,5,2,'#51464b');
}
if(type==='fungus'){
 rect(26,62,10,26,'#53686b');rect(42,66,8,22,'#6c7c77');
 poly([[13,62],[22,41],[37,33],[50,43],[57,62]],'#244b5c');poly([[22,50],[32,35],[45,45],[49,55]],'#61b1aa');
 poly([[35,68],[44,55],[52,53],[62,69]],'#416781');rect(27,47,5,3,'#a0e6c9');rect(44,59,5,3,'#b2e6dc');
}
if(type==='roots'){
 for(let i=0;i<8;i++){const xx=6+i*8;s.strokeStyle=i%2?'#503950':'#39424b';s.lineWidth=3+i%3;s.beginPath();s.moveTo(xx,-6);s.bezierCurveTo(xx-17,35,xx+18,48,xx+(i%2?14:-10),100);s.stroke();}
 rect(26,40,16,3,'#8a5b75');rect(29,43,5,4,'#bd779b');
}
if(type==='stainedglass'){
 poly([[10,92],[10,28],[18,13],[36,3],[54,13],[63,28],[63,92]],'#171622');
 poly([[17,85],[17,31],[24,19],[36,13],[48,19],[56,31],[56,85]],'#665277');
 poly([[23,76],[23,32],[36,20],[49,32],[49,76]],'#303750');rect(33,21,6,55,'#a57a9c');rect(23,45,26,5,'#a57a9c');
 poly([[25,38],[33,28],[33,45]],'#b66d80');poly([[40,28],[48,38],[40,45]],'#599397');rect(27,54,5,17,'#87568b');rect(42,54,5,17,'#a9936d');
}
if(type==='brazier'){
 rect(14,69,44,8,'#756c78');rect(23,76,8,19,'#413b49');rect(43,76,8,19,'#413b49');rect(19,54,36,14,'#4c3b4d');
 poly([[24,53],[20,33],[31,37],[35,12],[43,36],[52,29],[49,54]],'#85556d');poly([[28,54],[30,32],[36,22],[40,44],[45,38],[43,55]],'#d79b83');
 poly([[34,50],[36,32],[39,48]],'#ffe2ab');rect(18,64,39,4,'#a88a87');
}
if(type==='exit'){poly([[14,93],[14,43],[36,9],[58,43],[58,93]],'#89748f');poly([[22,90],[22,45],[36,23],[50,45],[50,90]],'#282333');rect(33,40,6,43,'#d7b68c');rect(23,62,26,4,'#c3a0a9')}
return c;}
for(let t of ['altar','key','echo','relic','loot','exit','torch','idol','urn','arch','banner','chains','coffin','bonepile','fungus','roots','stainedglass','brazier'])sprite[t]=drawSprite(t);
const enemyAttackKinds={
  hollow:['slash','neck'], knight:['cleave','thrust'], wraith:['lunge','feint'],
  drowned:['chime','lunge'], boss:['cleave','lunge','ring'],
};
function framesFor(type,phase){
  const frames=(pose,kind)=>Array.from({length:3},(_,frame)=>VeilArt.creature(type,pose,frame,phase,kind));
  const poses=['idle','walk','wake','hurt','fall'];
  if(type==='knight')poses.push('guard');
  const cels=Object.fromEntries(poses.map(pose=>[
    pose, (pose==='walk'||pose==='wake'||pose==='fall')?frames(pose):[VeilArt.creature(type,pose,1,phase)],
  ]));
  for(const kind of enemyAttackKinds[type]){
    cels['windup-'+kind]=frames('windup',kind);
    cels['strike-'+kind]=frames('strike',kind);
  }
  return cels;
}
const enemyFrames=Object.fromEntries(Object.keys(creatureNames).map(type=>[type,framesFor(type,1)]));
const watcherAwake=framesFor('boss',2);
const weaponArt=Object.fromEntries(Object.keys(weapons).map(id=>[id,VeilArt.firstPersonWeapon(id)]));
const fallTime=.52, strikeTime=.34;

function enemyCel(enemy){
  const cels=enemy.phase===2?watcherAwake:enemyFrames[enemy.type];
  if(!enemy.alive){
    const elapsed=tick-(enemy.defeatedAt??-Infinity);
    if(elapsed>=fallTime)return null;
    return cels.fall[settings.quiet?2:Math.min(2,Math.floor(elapsed/fallTime*3))];
  }
  if(enemy.flash>0&&enemy.stun>0&&enemy.waking<=0)return cels.hurt[0];
  if(enemy.waking>0){
    const fraction=1-enemy.waking/encounterSigns[enemy.id][1];
    return cels.wake[settings.quiet?2:clamp(Math.floor(fraction*3),0,2)];
  }
  if(enemy.attackPose>0){
    const frame=Math.min(2,Math.floor((1-enemy.attackPose/strikeTime)*3));
    return cels['strike-'+enemy.attackKind][settings.quiet?0:Math.max(0,frame)];
  }
  if(enemy.windup>0){
    const frame=1-enemy.windup/Math.max(enemy.windup,enemy.windupDuration);
    return cels['windup-'+enemy.attackKind][settings.quiet?2:Math.min(2,Math.floor(frame*3))];
  }
  if(enemy.type==='knight'&&enemy.guard>0)return cels.guard[0];
  if(enemy.alert&&enemy.stun<=0&&!settings.quiet)return cels.walk[Math.floor(tick*5+enemy.originX)%3];
  return cels.idle[0];
}

let bladeSparks=[];
function sparkBurst(x,y,tint='#e8b5a7',count=10,style='mote'){
  for(let i=0;i<count;i++){
    const life=.24+rand(i,tick,3)*.28;
    const long=style==='spear'||style==='needle';
    bladeSparks.push({x,y,vx:(rand(i,tick,2)-.5)*(long?1.15:2.9),
      vy:(rand(i,tick,4)-.5)*(long?1.15:2.9),z:.35+rand(i,tick,7)*.32,
      vz:(rand(i,tick,9)-.24)*1.05,life,color:tint,style});
  }
  if(bladeSparks.length>100)bladeSparks.splice(0,bladeSparks.length-100);
}
function solid(x,y){const ix=Math.floor(x),iy=Math.floor(y);if(iy<0||ix<0||iy>=grid.length||ix>=grid[0].length)return true;return grid[iy][ix]!==0;}
function canMove(x,y,r=.23){return !solid(x-r,y-r)&&!solid(x+r,y-r)&&!solid(x-r,y+r)&&!solid(x+r,y+r);}
function move(entity,dx,dy,r=.23){if(canMove(entity.x+dx,entity.y,r))entity.x+=dx;if(canMove(entity.x,entity.y+dy,r))entity.y+=dy;}
function castRay(x,y,dx,dy,limit){
  let ix=Math.floor(x),iy=Math.floor(y);
  const sx=Math.sign(dx),sy=Math.sign(dy);
  const stepX=Math.abs(1/dx),stepY=Math.abs(1/dy);
  let tx=sx?(sx>0?ix+1-x:x-ix)*stepX:Infinity;
  let ty=sy?(sy>0?iy+1-y:y-iy)*stepY:Infinity;
  while(Math.min(tx,ty)<=limit){
    if(Math.abs(tx-ty)<1e-9){
      // Adjacent walls touching at a corner also block a line of attack.
      if(solid(ix+sx,iy))return {hit:true,depth:tx,x:ix+sx,y:iy,side:0};
      if(solid(ix,iy+sy))return {hit:true,depth:ty,x:ix,y:iy+sy,side:1};
    }
    if(tx<ty){
      ix+=sx;
      if(solid(ix,iy))return {hit:true,depth:tx,x:ix,y:iy,side:0};
      tx+=stepX;
    }else{
      iy+=sy;
      if(solid(ix,iy))return {hit:true,depth:ty,x:ix,y:iy,side:1};
      ty+=stepY;
    }
  }
  return {hit:false,depth:limit};
}
function los(x1,y1,x2,y2){return !castRay(x1,y1,x2-x1,y2-y1,1-1e-7).hit;}
const turnDelta=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
function note(msg,time=2.7){$('toast').textContent=msg;$('toast').style.opacity='1';toastUntil=tick+time;}
const saveNumbers=['hp','ashes','lv','flasks','maxflasks','mp'];
const saveFlags=['key','relic','gate','secret','won'];
const backupKey=SAVE+'-backup';
let saveBlocked=false,saveWarning='';
function save(){
  if(saveBlocked)return;
  try{
    const d={
      version:2,x:player.x,y:player.y,ang:player.ang,checkpoint:player.checkpoint,dropped,
      dead:enemies.filter(e=>!e.alive).map(e=>e.id),bossDefeated,leverUsed,cacheOpened,
      tabletsRead,echoesCollected,echoReward,sealsBroken,zonesVisited,shortcutOpen,bellRung,crimsonTaken,discoveries,mirrorPositions,ownedWeapons,equippedWeapon,
    };
    for(const key of [...saveNumbers,...saveFlags])d[key]=player[key];
    localStorage.setItem(SAVE,JSON.stringify(d));
    saveReady=true;
  }catch{saveReady=false;}
}
function pairsAreValid(pair){
  return Array.isArray(pair)&&pair.length===2&&pair.every(Number.isFinite)&&canMove(...pair);
}
function uniqueIds(values,allowed){
  return Array.isArray(values)?[...new Set(values.filter(value=>allowed.includes(value)))]:[];
}
function load(){
  let raw;
  try{raw=localStorage.getItem(SAVE);}catch{return;}
  if(raw===null)return;
  let d;
  try{d=JSON.parse(raw);}catch{}
  if(!d||d.version!==2||!Number.isFinite(d.x)||!Number.isFinite(d.y)){
    // An unknown format can belong to a newer build. Preserve the original bytes.
    saveBlocked=true;
    saveWarning='Hay un guardado ilegible o de otra versión. Puedes jugar en esta sesión sin sobrescribirlo.';
    return;
  }
  for(const key of saveFlags)if(typeof d[key]==='boolean')player[key]=d[key];
  for(const key of saveNumbers)if(Number.isFinite(d[key]))player[key]=d[key];
  shortcutOpen=d.shortcutOpen===true;
  if(shortcutOpen)grid[13][10]=0;
  if(player.gate)grid[10][19]=0;
  if(player.secret)grid[13][6]=0;
  discoveries=uniqueIds(d.discoveries,VeilExpedition.stations.map(station=>station.id));
  ownedWeapons=['sword',...uniqueIds(d.ownedWeapons,Object.keys(weapons)).filter(id=>id!=='sword')];
  equippedWeapon=ownedWeapons.includes(d.equippedWeapon)?d.equippedWeapon:'sword';
  updateWeaponHud();
  for(const id of Object.keys(mirrorPositions)){
    const direction=d.mirrorPositions?.[id];
    mirrorPositions[id]=Number.isInteger(direction)&&direction>=0&&direction<mirrorDirections.length?direction:0;
  }
  archiveChoice=['archiveKeep','archiveErase'].find(id=>discoveries.includes(id))??null;
  discoveries=discoveries.filter(id=>id!==(archiveChoice==='archiveKeep'?'archiveErase':'archiveKeep'));
  updateAnnexBarriers();
  if(pairsAreValid(d.checkpoint))player.checkpoint=d.checkpoint;
  if(canMove(d.x,d.y)){
    player.x=d.x;player.y=d.y;
  }else{
    try{
      if(localStorage.getItem(backupKey)===null)localStorage.setItem(backupKey,raw);
    }catch{saveBlocked=true;}
    [player.x,player.y]=player.checkpoint;
    saveWarning='La posición guardada era inaccesible. El descenso continuará desde el último altar.';
  }
  if(Number.isFinite(d.ang))player.ang=turnDelta(d.ang);
  player.lv=clamp(Math.floor(player.lv),1,99);
  player.maxhp=maxHealth();
  player.hp=clamp(player.hp,1,player.maxhp);
  player.ashes=clamp(Math.floor(player.ashes),0,1e7);
  player.maxflasks=clamp(Math.floor(player.maxflasks),3,9);
  player.flasks=clamp(Math.floor(player.flasks),0,player.maxflasks);
  player.mp=clamp(player.mp,0,60);
  const drop=d.dropped;
  if(drop&&pairsAreValid([drop.x,drop.y])&&Number.isFinite(drop.amount)&&drop.amount>0){
    dropped={x:drop.x,y:drop.y,amount:clamp(Math.floor(drop.amount),1,1e7)};
  }
  leverUsed=d.leverUsed===true;
  cacheOpened=d.cacheOpened===true;
  tabletsRead=uniqueIds(d.tabletsRead,['tablet','tablet2']);
  echoesCollected=uniqueIds(d.echoesCollected,['echo1','echo2','echo3']);
  echoReward=d.echoReward===true;
  bellRung=d.bellRung===true;
  crimsonTaken=typeof d.crimsonTaken==='boolean'?d.crimsonTaken:player.maxflasks>(echoReward?4:3);
  sealsBroken=uniqueIds(d.sealsBroken,['seal1','seal2']);
  zonesVisited=uniqueIds(d.zonesVisited,zones);
  const spent={
    chapelShortcut:shortcutOpen,floodBell:bellRung,lever:leverUsed,
    cache:!leverUsed||cacheOpened,key:player.key,relic:player.relic,flask:crimsonTaken,
    ...Object.fromEntries(weaponFinds.map(find=>[find.id,ownedWeapons.includes(find.id)])),
  };
  for(const o of objects){
    o.active=!(spent[o.id]||echoesCollected.includes(o.id)||sealsBroken.includes(o.id));
  }
  const dead=uniqueIds(d.dead,defs.map(enemy=>enemy.id));
  bossDefeated=d.bossDefeated===true||player.won||dead.includes('boss');
  for(const enemy of enemies){
    if(dead.includes(enemy.id)||enemy.id==='boss'&&bossDefeated)enemy.alive=false;
  }
  saveReady=!saveBlocked;
}
load();
function damagePlayer(d,source=null){if(player.roll>0||player.hurt>0)return;const facing=source&&Math.abs(turnDelta(Math.atan2(source.y-player.y,source.x-player.x)-player.ang))<1.19;
let block=player.block&&facing&&player.st>=15;if(block){d=Math.ceil(d*.22);player.st=Math.max(0,player.st-15);note('BLOQUEO');VeilAudio.cue('block');}player.hp=Math.max(0,player.hp-d);player.hurt=.65;injury=.9;shake=.12;sparkBurst(player.x,player.y,'#bd5775',12);beep(96,.18,'sawtooth',.04);if(player.hp<=0){showDeath();dropped={x:player.x,y:player.y,amount:player.ashes};player.ashes=0;player.hp=player.maxhp;player.st=100;player.mp=60;player.flasks=player.maxflasks;player.x=player.checkpoint[0];player.y=player.checkpoint[1];player.ang=-PI/2;restoreAfterDeath();note('HAS MUERTO — LAS CENIZAS ESPERAN EN TU TUMBA',5);save();}}
const beep=VeilAudio.tone;
// Impact time is shared by the damage check, the pose and the contact sound.
const weaponTiming={
 sword:{light:[.13,.39],heavy:[.25,.66]},
 spear:{light:[.19,.48],heavy:[.29,.67]},
 axe:{light:[.28,.61],heavy:[.43,.88]},
 needle:{light:[.22,.51],heavy:[.34,.76]},
};
let swing=null;
function attack(heavy=false){
 const id=equippedWeapon,w=weapons[id],cost=heavy?w.heavyStamina:w.stamina;
 if(!playing||paused||swing||player.attackCd>0||player.st<cost||player.roll>0)return;
 player.st-=cost;
 player.attackCd=heavy?w.heavyCool:w.cool;
 const [contact,duration]=weaponTiming[id][heavy?'heavy':'light'];
 swing={id,heavy,age:0,contact,duration};
 VeilAudio.weapon(id,heavy);
}

function advanceSwing(dt){
 if(!swing)return;
 const before=swing.age;
 swing.age+=dt;
 if(before<swing.contact&&swing.age>=swing.contact)resolveSwing(swing);
 if(swing&&swing.age>=swing.duration)swing=null;
}

function cancelSwing(){
 swing=null;
}

function resolveSwing({id,heavy}){
 const w=weapons[id],reach=heavy?w.heavyReach:w.reach,arc=heavy?w.heavyArc:w.arc;
 const targets=enemies.filter(e=>{
   if(!e.alive||dist(player,e)>=reach)return false;
   const direction=Math.atan2(e.y-player.y,e.x-player.x)-player.ang;
   return Math.abs(turnDelta(direction))<arc&&los(player.x,player.y,e.x,e.y);
 }).sort((a,b)=>dist(player,a)-dist(player,b));
 // The thrust and the needle pick a single target. The axe commits to a broad sweep.
 const cleaves=id==='axe'||id==='sword';
 for(const [index,e] of (cleaves?targets:targets.slice(0,1)).entries()){
   let damage=(heavy?w.heavyDamage:w.damage)+player.lv*(heavy?8:6);
   const spearTip=id==='spear'&&dist(player,e)>reach*.68;
   const resonance=id==='needle'&&e.windup>0;
   if(spearTip)damage+=8;
   if(resonance)damage+=12;
   const blocked=hit(e,Math.round(damage*(index>0?.72:1)),heavy||id==='axe'||spearTip,id==='needle',
     resonance?'resonance':id);
   if(index===0)contactKind=blocked?'guard':resonance?'resonance':'hit';
   if(resonance)note('LA AGUJA ENCUENTRA LA RESONANCIA',1.2);
 }
 if(targets.length){VeilAudio.weapon(id,heavy,true);hitFlashUntil=tick+.17;}
}

function hit(e,damage,heavy=false,magic=false,impact='mote'){if(!heavy&&e.type==='knight'&&e.guard>0&&!magic&&Math.abs(turnDelta(Math.atan2(player.y-e.y,player.x-e.x)-e.facing))<1.05){
  e.hp=Math.max(1,e.hp-Math.ceil(damage*.35));
  e.flash=.12;
  sparkBurst(e.x,e.y,'#dec197',8,'guard');
  VeilAudio.cue('block');
  note('EL CARCELERO AGUANTA · BUSCA SU COSTADO O ROMPE LA GUARDIA',1.5);
  return true;
}if(e.type==='wraith'&&magic){
  const lit=(bakedLight[Math.floor(e.y)]?.[Math.floor(e.x)]||0)>.26;
  damage=Math.round(damage*(lit||e.windup>0?1.28:.82));
}
e.hp=Math.max(0,e.hp-damage);e.flash=.24;const braced=e.type==='boss'&&e.phase===2&&e.windup>0&&!heavy;
if(!braced){e.stun=heavy?.68:.3;e.windup=0;}e.guard=0;if(!e.alert&&!e.waking)e.waking=encounterSigns[e.id][1];shake=.055;
const tint=impact==='resonance'||e.type==='wraith'?'#c4a5ea':weapons[impact]?.color??'#e4b29d';
sparkBurst(e.x,e.y,tint,impact==='axe'?17:impact==='spear'?8:12,impact);
if(e.hp<=0){e.alive=false;e.defeatedAt=tick;player.ashes+=e.ashes;note(`+ ${e.ashes} CENIZAS`);beep(120,.33,'triangle',.035);save();if(e.type==='boss'){bossDefeated=true;save();note('EL VIGÍA HA CAÍDO — EL SELLO TE ESPERA',5)}}else if(e.type==='boss'&&e.phase===1&&e.hp<e.maxhp*.5){e.phase=2;e.attacksMade=0;e.cool=1.3;VeilAudio.cue('boss');note('EL VIGÍA ABRE EL OJO DEL UMBRAL',4);}
return false;
}
function spell(){if(!playing||paused||player.spellCd>0||player.mp<25||player.roll>0)return;player.mp-=25;player.spellCd=1.3;spellAnim=.65;sparkBurst(player.x+Math.cos(player.ang)*1.1,player.y+Math.sin(player.ang)*1.1,'#b78ffe',17);beep(490,.36,'sine',.06);let hitCount=0;for(let e of enemies){if(!e.alive||dist(player,e)>6.6)continue;let a=Math.atan2(e.y-player.y,e.x-player.x)-player.ang;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.22&&los(player.x,player.y,e.x,e.y)){hit(e,38+player.lv*5,false,true);hitCount++;}}if(!hitCount)note('EL ÉTER SE DISIPA');}
function levelUp(){if(!objects.some(o=>o.kind==='altar'&&dist(player,o)<1.65&&los(player.x,player.y,o.x,o.y))){note('DEBES ESTAR JUNTO A UN ALTAR');return;}if(player.lv>=99)return;let cost=80*player.lv;if(player.ashes<cost){note(`NECESITAS ${cost} CENIZAS PARA ASCENDER`);return;}player.ashes-=cost;player.lv++;player.maxhp+=8;player.hp=player.maxhp;note(`EL ALMA SE FORTALECE — NIVEL ${player.lv}`,4);beep(680,.5,'sine',.04);save();}
function heal(){if(!playing||paused||player.flasks<=0||player.hp>=player.maxhp)return;player.flasks--;player.hp=Math.min(player.maxhp,player.hp+55);note('LA SANGRE VUELVE A CALENTARSE');beep(600,.4,'sine',.025);save();}
function nearObject(){let opts=objects.filter(o=>o.active&&o.kind!=='passage'&&dist(player,o)<1.55&&los(player.x,player.y,o.x,o.y)).map(o=>o);if(!player.gate&&player.y>=10.5&&Math.hypot(player.x-19.5,player.y-10.5)<1.75)opts.push({kind:'gate',label:'Puerta de hueso',d:Math.hypot(player.x-19.5,player.y-10.5)});if(!player.secret&&player.y>=13.5&&Math.hypot(player.x-6.5,player.y-13.5)<1.7)opts.push({kind:'secret',label:'Muro agrietado',d:Math.hypot(player.x-6.5,player.y-13.5)});if(dropped&&dist(player,dropped)<1.3&&los(player.x,player.y,dropped.x,dropped.y))opts.push({kind:'drop',label:`Recuperar ${dropped.amount} cenizas`,d:dist(player,dropped)});opts.sort((a,b)=>(a.d??dist(player,a))-(b.d??dist(player,b)));return opts[0]||null;}
function interact(){let o=nearObject();if(!o)return;if(o.kind==='passage'){enterPassage(o);return;}if(o.kind==='discovery'){readDiscovery(o);return;}if(o.kind==='weapon'){ownedWeapons.push(o.id);equippedWeapon=o.id;o.active=false;updateWeaponHud();note('HAS ENCONTRADO: '+weapons[o.id].name+' — C CAMBIA DE ARMA',5);VeilAudio.cue('threshold');save();return;}if(o.kind==='altar'){player.hp=player.maxhp;player.st=100;player.mp=60;player.flasks=player.maxflasks;player.checkpoint=[o.x,o.y];note('ALTAR ENCENDIDO — PULSA L PARA SUBIR DE NIVEL',4);save();}else if(o.kind==='key'){player.key=true;o.active=false;note('HAS OBTENIDO: LLAVE DE HUESO',4);save();}else if(o.kind==='gate'){if(!player.key){note('SELLADA — NECESITAS LA LLAVE DE HUESO');beep(75,.12);return;}player.gate=true;grid[10][19]=0;note('LA PUERTA CEDE CON UN GEMIDO',4);save();}else if(o.kind==='secret'){player.secret=true;grid[13][6]=0;note('LA PIEDRA OCULTABA UN PASADIZO',4);save();}else if(o.kind==='relic'){player.relic=true;o.active=false;player.maxhp=maxHealth();player.hp=player.maxhp;note('CORAZÓN DEL VACÍO — VIDA MÁXIMA +30',4);beep(730,.6,'sine',.04);save();}else if(o.kind==='loot'){crimsonTaken=true;o.active=false;player.maxflasks=Math.min(9,player.maxflasks+1);player.flasks=Math.min(player.maxflasks,player.flasks+1);note('FRASCO CARMESÍ — CAPACIDAD +1',4);save();}else if(o.kind==='lever'){if(leverUsed)return;leverUsed=true;o.active=false;objects.find(p=>p.id==='cache').active=true;note('LA PIEDRA GIME: UN OSARIO SE HA ABIERTO',4);beep(210,.6,'sawtooth',.03);save();}else if(o.kind==='cache'){if(!leverUsed||cacheOpened)return;cacheOpened=true;o.active=false;player.ashes+=160;note('160 CENIZAS RECUPERADAS DEL OSARIO',4);beep(540,.4,'triangle',.04);save();}else if(o.kind==='echo'){if(echoesCollected.includes(o.id))return;echoesCollected.push(o.id);o.active=false;player.ashes+=90;sparkBurst(o.x,o.y,'#b6a0e9',22);beep(620,.5,'sine',.05);if(echoesCollected.length===3&&!echoReward){echoReward=true;player.maxflasks=Math.min(9,player.maxflasks+1);player.flasks=Math.min(player.maxflasks,player.flasks+1);note('TRES ECOS REUNIDOS — +1 FRASCO PERMANENTE',5);}else note(`ECO RECUPERADO (${echoesCollected.length}/3) — +90 CENIZAS`,4);save();}else if(o.kind==='seal'){if(sealsBroken.includes(o.id))return;sealsBroken.push(o.id);o.active=false;player.ashes+=60;sparkBurst(o.x,o.y,'#c9b3ec',24);beep(720,.65,'triangle',.042);note(`RITO DESHECHO (${sealsBroken.length}/2) — EL VIGÍA PIERDE FUERZA`,5);save();}else if(o.kind==='shortcut'){
  shortcutOpen=true;o.active=false;grid[13][10]=0;
  note('LA CADENA ABRE UN ATAJO HACIA LA CRIPTA',4);save();
}else if(o.kind==='bell'){
  if(enemies.some(enemy=>enemy.id==='bellKeeper'&&enemy.alive)){
    note('EL CAMPANERO TODAVÍA GUARDA SU VOTO',3);return;
  }
  bellRung=true;o.active=false;player.ashes+=120;
  note('LA CAMPANA RESPONDE. EN EL SANTUARIO ALGO HA ABIERTO LOS OJOS · +120 CENIZAS',6);
  VeilAudio.cue('drowned');
  beep(144,1.15,'sine',.09);beep(216,.83,'triangle',.018);save();
}else if(o.kind==='tablet'){if(!tabletsRead.includes(o.id))tabletsRead.push(o.id);note(o.id==='tablet'?'LOS MUERTOS NO TEMEN A LA NOCHE. TEMEN A LA CAMPANA. LA PARED AGRIETADA QUEDA AL NORTE DEL ALTAR.':'EL VIGÍA SELLÓ LA PUERTA DESDE EL OTRO LADO.',5);save();}else if(o.kind==='drop'){player.ashes+=dropped.amount;dropped=null;note('HAS RECUPERADO TUS CENIZAS');save();}else if(o.kind==='exit'){let boss=enemies.find(e=>e.id==='boss');if(boss.alive){note('EL SELLO RESISTE — SU GUARDIÁN SIGUE VIVO');return;}player.won=true;save();showEnding();}}
let autoPassageLock=null;
function enterPassage(passage){
  if(!canMove(...passage.to))return false;
  [player.x,player.y]=passage.to;
  player.ang=passage.angle;
  player.roll=0;
  cancelSwing();
  autoPassageLock=VeilExpedition.doors.filter(door=>door.id!==passage.id).sort((a,b)=>dist(player,a)-dist(player,b))[0]?.id??null;
  VeilAudio.cue('threshold');
  discoverZone();
  save();
  return true;
}
function autoTraversePassage(){
  if(autoPassageLock){
    const locked=VeilExpedition.doors.find(door=>door.id===autoPassageLock);
    if(locked&&dist(player,locked)<1.15)return;
    autoPassageLock=null;
  }
  const door=VeilExpedition.doors.filter(item=>item.active&&dist(player,item)<.32).sort((a,b)=>dist(player,a)-dist(player,b))[0];
  if(door)enterPassage(door);
}

function readDiscovery(station){
  if(isMirror(station.id)){
    const id=station.id;
    const direction=(mirrorPositions[id]+1)%mirrorDirections.length;
    mirrorPositions[id]=direction;
    if(!discoveries.includes(id))discoveries.push(id);
    note('Ahora mira hacia '+mirrorDirections[direction]+'. '+station.text,7);
    VeilAudio.cue('star');
    save();
    return;
  }
  if(station.id==='skyLens'&&Object.keys(mirrorTargets).some(id=>mirrorPositions[id]!==mirrorTargets[id])){
    note('La lente no recibe ambos reflejos. Revisa las indicaciones del Astrónomo.',6);
    return;
  }
  if(station.choice&&archiveChoice&&archiveChoice!==station.id){
    note('El acta ya está cerrada. La otra copia se ha deshecho.',5);
    return;
  }
  const missing=station.requires.find(id=>!discoveries.includes(id));
  if(station.id==='gardenTestimony'&&!archiveChoice){note('La silla espera el acta del Archivo de los Ausentes.',6);return;}
  if(missing){
    const clue=VeilExpedition.stations.find(entry=>entry.id===missing);
    note('Queda algo por hacer cerca de «'+clue.label.toLowerCase()+'».',6);
    return;
  }
  if(station.id==='archiveClerk'&&archiveChoice){
    note(archiveChoice==='archiveKeep'?'La Archivera saluda por tu nombre. El sello quedó en la sala de poniente.':'La silla está vacía. La copia sin nombre espera en la sala de levante.',8);
    return;
  }
  note(station.id==='skyWitness'&&archiveChoice==='archiveErase'?'La lente reconoce el hueco del acta. El Vigía tarda más en cerrar el ojo.':station.text,8);
  if(discoveries.includes(station.id))return;
  discoveries.push(station.id);
  updateAnnexBarriers();
  if(station.choice)archiveChoice=station.id;
  if(station.id==='soundingsSignal')VeilAudio.cue('drowned');
  if(station.id==='skyWitness')VeilAudio.cue('star');
  player.ashes+=station.reward;
  VeilAudio.cue(station.reward?'threshold':'whisper');
  save();
}

function trapPhase(trap){
  const cycle=(tick+trap.offset)%trap.period;
  return cycle<trap.activeTime?'active':cycle>=trap.period-.65?'warning':'idle';
}
function updateTraps(dt){
  trapCooldown=Math.max(0,trapCooldown-dt);
  for(const t of traps){
    if(dist(player,t)>=t.r||trapCooldown>0)continue;
    const phase=trapPhase(t);
    if(phase==='warning')note('LAS LOSAS TIEMBLAN BAJO TUS PIES',.6);
    if(phase==='active'&&player.roll<=0&&player.hurt<=0){
      trapCooldown=1.15;damagePlayer(t.damage);
      sparkBurst(t.x,t.y,'#e9a7a0',10);
      if(!paused)note('¡TRAMPA DE ESPINAS!',1.5);
    }
  }
}
// Range and facing lock during the telegraph.
function startEnemyAttack(e,dx,dy){
  e.facing=Math.atan2(dy,dx);
  const pattern=e.attacksMade++;
  const odd=pattern%2===0;
  e.attackMin=0;
  VeilAudio.cue(e.type);
  if(e.type==='boss'){
    const index=e.phase===2||sealsBroken.length>0?pattern%3:0;
    e.attackKind=index===1?'lunge':index===2?'ring':'cleave';
    e.windup=e.attackKind==='ring'?1.12:e.attackKind==='lunge'?.78:e.phase===2?.86:1.08;
    e.attackReach=e.attackKind==='ring'?3.28:e.attackKind==='lunge'?3.15:2.28;
    e.attackArc=e.attackKind==='ring'?PI:e.attackKind==='lunge'?.42:1.05;
    e.attackMin=e.attackKind==='ring'?1.35:0;
    e.attackDamage=e.damage*(e.phase===2?1.26:1);
    if(e.attackKind==='ring'&&discoveries.includes('skyWitness')){
      e.windup+=.28;
      VeilAudio.cue('star');
    }
    const warning={lunge:'EL VIGÍA FIJA SU ESTOCADA',cleave:'EL VIGÍA PREPARA UN BARRIDO',ring:'ONDA DEL UMBRAL · ACÉRCATE O RETROCEDE'};
    note(warning[e.attackKind],1.12);
  }else if(e.type==='knight'){
    e.attackKind=odd?'cleave':'thrust';e.windup=odd?.9:.7;
    e.attackReach=odd?1.78:2.12;e.attackArc=odd?.95:.34;
    e.attackDamage=e.damage;e.guard=.52;
    note(odd?'EL CARCELERO ALZA SU ESPADA':'EL CARCELERO APUNTA UNA ESTOCADA',1);
  }else if(e.type==='wraith'){
    e.attackKind=odd?'lunge':'feint';
    e.windup=odd?.60:.91;e.attackReach=odd?1.83:2.36;e.attackArc=odd?.58:.34;e.attackDamage=e.damage;
    note(odd?'EL TESTIGO ABRE SUS OJOS':'EL TESTIGO SE REPLIEGA ANTES DE LANZARSE',1);
  }else if(e.type==='drowned'){
    e.attackKind=odd?'chime':'lunge';e.windup=odd?1.09:.72;
    e.attackReach=odd?2.7:1.88;e.attackArc=odd?PI:.5;
    e.attackDamage=odd?e.damage-4:e.damage;
    note(odd?'LA CAMPANA DEL GUARDIÁN VA A SONAR':'EL CAMPANERO TIRA DE LA CADENA',1.2);
  }else{
    e.attackKind=odd?'slash':'neck';e.windup=odd?.68:.94;
    e.attackReach=odd?1.61:2.18;e.attackArc=odd?.82:.38;e.attackDamage=e.damage;
    note(odd?'EL PENITENTE SE RETUERCE':'EL PENITENTE ESTIRA EL CUELLO',1);
  }
  e.windupDuration=e.windup;
}
function resolvesEnemyAttack(e){
  const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy);
  const facingDelta=turnDelta(Math.atan2(dy,dx)-e.facing);
  const valid=d>=e.attackMin&&d<e.attackReach+.08&&Math.abs(facingDelta)<=e.attackArc&&los(e.x,e.y,player.x,player.y);
  if(valid)damagePlayer(e.type==='boss'?Math.max(1,Math.ceil(e.attackDamage*(1-.15*sealsBroken.length))):e.attackDamage,e);
  return valid;
}
function routeAroundWall(e){
  const start=Math.floor(e.x)+Math.floor(e.y)*MAP_WIDTH;
  const finish=Math.floor(player.x)+Math.floor(player.y)*MAP_WIDTH;
  const cells=[start], previous=new Map([[start,-1]]);
  for(let i=0;i<cells.length&&!previous.has(finish);i++){
    const cell=cells[i],x=cell%MAP_WIDTH,y=Math.floor(cell/MAP_WIDTH);
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
      const next=cell+dx+dy*MAP_WIDTH;
      if(solid(x+dx,y+dy)||previous.has(next))continue;
      cells.push(next);previous.set(next,cell);
    }
  }
  const route=[];
  if(previous.has(finish)){
    for(let cell=finish;cell!==start;cell=previous.get(cell)){
      route.push([cell%MAP_WIDTH+.5,Math.floor(cell/MAP_WIDTH)+.5]);
    }
  }
  return route;
}
function pursueAroundWall(e,dt,speed){
  if(tick>=e.nextRoute){
    e.route=routeAroundWall(e);
    e.nextRoute=tick+.65;
  }
  const goal=e.route.at(-1);
  if(!goal)return;
  const dx=goal[0]-e.x,dy=goal[1]-e.y,d=Math.hypot(dx,dy);
  if(d<.15){e.route.pop();return;}
  move(e,dx/d*dt*speed,dy/d*dt*speed,.24);
}
function enemyLogic(dt){
  for(const e of enemies){
    if(!e.alive)continue;
    e.flash=Math.max(0,e.flash-dt);e.stun=Math.max(0,e.stun-dt);
    e.cool=Math.max(0,e.cool-dt);e.attackPose=Math.max(0,e.attackPose-dt);e.guard=Math.max(0,e.guard-dt);
    const d=dist(e,player);
    if(d>14){e.windup=0;if(e.waking>0)e.waking=0;continue;}
    const visible=los(e.x,e.y,player.x,player.y);
    const [warningRange,leadTime,warning]=encounterSigns[e.id];
    if(!e.alert&&!e.waking&&d<warningRange&&visible&&
      (e.type!=='boss'||regionAt(player.x,player.y)==='sanctuary')&&
      (e.type!=='drowned'||regionAt(player.x,player.y)==='nave')){
      e.waking=leadTime;
      const bearing=turnDelta(Math.atan2(e.y-player.y,e.x-player.x)-player.ang);
      VeilAudio.warning(e.type,Math.sin(bearing));
      $('encounter-warning').textContent=warning;
      $('encounter-warning').hidden=false;
      warningUntil=tick+leadTime+1.5;
    }
    if(e.waking>0){
      e.waking=Math.max(0,e.waking-dt);
      if(!e.waking){e.alert=true;e.cool=Math.max(e.cool,.45);}
      continue;
    }
    if(!e.alert||e.stun>0){e.windup=0;continue;}
    const dx=(player.x-e.x)/Math.max(.01,d),dy=(player.y-e.y)/Math.max(.01,d);
    const speed=e.type==='wraith'?1.16:e.type==='boss'?(e.phase===2?1.02:.75):e.type==='knight'?.67:
      e.type==='drowned'?.87+Math.sin(tick*5)*.28:.82;
    if(e.windup<=0&&e.attackPose<=0&&d<9){
      if(visible)e.facing=Math.atan2(dy,dx);
      if(!visible){
        if(e.type!=='boss'&&e.type!=='drowned')pursueAroundWall(e,dt,speed);
      }else if(e.type==='wraith'&&d<3.4){
        const x=e.x,y=e.y;
        move(e,(dx*.37-dy*.7*e.strafeSign)*dt*speed,(dy*.37+dx*.7*e.strafeSign)*dt*speed,.24);
        if(Math.hypot(e.x-x,e.y-y)<.25*speed*dt)e.strafeSign*=-1;
      }else if(e.type==='knight'&&d<2.8&&e.cool>.2){
        e.guard=Math.max(e.guard,.12);
      }else if(d>(e.type==='knight'?1.7:1.2)&&
        (e.type!=='drowned'||regionAt(player.x,player.y)==='nave')&&
        (e.type!=='boss'||player.y<9.6))move(e,dx*dt*speed,dy*dt*speed,.24);
    }
    if(e.windup>0){
      e.windup-=dt;
      if(e.windup<=0){
        e.windup=0;e.attackPose=strikeTime;resolvesEnemyAttack(e);
        if(paused)return;
        e.cool=e.type==='wraith'?1.45:e.type==='boss'?(e.phase===2?1.5:1.75):e.type==='knight'?1.9:1.55;
      }
    }else if(d<(e.type==='boss'?2.75:e.type==='drowned'?2.3:e.type==='knight'?2.08:1.74)&&visible&&e.cool<=0&&e.attackPose<=0){
      startEnemyAttack(e,dx,dy);
    }
  }
}
function regionAt(x,y){
  const wing=VeilExpedition.at(x,y);
  if(wing)return wing.material;
  if(x>=26&&y>=12)return 'nave';
  if(x<=12&&y<14)return 'chapel';
  if(x>12&&y<10)return 'sanctuary';
  if(x>14)return 'catacomb';
  return 'crypt';
}
function tileType(ix,iy){
  const value=grid[iy]?.[ix];
  return value===2?'pillar':value===3||value===5?'gate':value===4?'secret':'wall';
}
const renderRegions=grid.map((row,y)=>row.map((_,x)=>regionAt(x,y)));
const architecturalFaces = Array(MAP_WIDTH*MAP_HEIGHT*4);
const wallFaceIndex = {w:0,e:1,n:2,s:3};
const floorDetails = grid.map(row => row.map(() => null));
for (const [area, design] of Object.entries(VeilLighting.architecture)) {
  const reliefs = new Map();
  for (const [x, y, face, feature] of design.faces) {
    if (!reliefs.has(feature)) {
      const canvas = VeilArt.masonry(area, feature);
      reliefs.set(feature, canvas.getContext('2d').getImageData(0,0,64,64).data);
    }
    architecturalFaces[(y*MAP_WIDTH+x)*4+wallFaceIndex[face]] = reliefs.get(feature);
  }
  for (const [left, top, right, bottom, style] of design.strips) {
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) floorDetails[y][x] = VeilLighting.architecturalFloor(area, style, x-left, y-top, right-left+1, bottom-top+1);
    }
  }
}

const areaLights = [
  ...Object.values(VeilLighting.architecture).flatMap(design => design.lights),
  ...VeilExpedition.wings.flatMap(wing=>wing.props
    .filter(([, ,kind])=>kind==='brazier'||kind==='stainedglass'||kind==='fungus')
    .map(([x,y])=>[wing.x+x,wing.y+y,4.8,1.08])),
  [6.5,22.45,3,.66],[24.6,12.55,3,.85],[3.5,5.5,3,.85],[28.45,21.45,3,.72],[25.5,8.45,3,.72],
  [4.8,17.2,5.8,1.2],[5.0,15.1,5,1],[8.8,18,4,.85],[15.8,17.5,4,.8],
  [21.5,19.8,5,1.1],[20,13.5,4,.8],[27.5,16.5,4,1.3],[27.8,20.2,4,.85],
  [8.7,7,6,1.2],[5.4,9.5,4,.85],[17.1,4.5,5,1],[22.9,4.5,5,1],[19.5,3.2,4,.95],
];
const bakedLight=VeilLighting.bake(grid,areaLights.map(
  ([x,y,radius,power])=>({x,y,radius,power})
));
const texturePixels=canvas=>canvas.getContext('2d').getImageData(0,0,64,64).data;
const wallPixels=Object.fromEntries(Object.entries(textures).map(([area,kinds])=>
  [area,Object.fromEntries(Object.entries(kinds).map(([kind,canvas])=>[kind,texturePixels(canvas)]))]
));
const openedPixels=Object.fromEntries(Object.entries(awakeWall).map(([region,canvas])=>[region,texturePixels(canvas)]));
const fixtureTints={
  crypt:[245,177,118],sanctuary:[245,177,118],chapel:[213,126,189],
  nave:[104,229,196],catacomb:[104,229,196],
  salt:[229,207,159],archive:[210,175,137],garden:[143,204,166],soundings:[119,194,204],sky:[157,168,234],
};
const planeTextures=[0,1].map(plane=>renderRegions.map((row,y)=>row.map((area,x)=>
  (plane===0&&floorDetails[y][x]) || VeilLighting.surfaceColors[area][plane]
)));
const planeLight=bakedLight.map(row=>row.map(fixture=>.57+fixture*.58));
const waterTile=VeilLighting.surfaceColors.nave[0];
const eyeWalls = grid.map((row,y)=>row.map((_,x)=>watcherWalls.has(x+','+y)));
const zBuffer=new Float32Array(W);const floorImage=ctx.createImageData(W,H);const fc=floorImage.data;
function drawBase({sn,cs}){
const rippleFrame=settings.quiet||settings.low?0:Math.floor(tick*5)&31;
const stride=settings.low?2:1, planeStride=settings.low?4:2;
const watching=enemies.some(e=>e.type==='boss'&&e.alive&&e.phase===2);
const px=-sn*FOV,py=cs*FOV;
// Cast both planes at half resolution and shade against the baked fixtures.
for(let y=0;y<H;y+=planeStride){
  const plane=y>=H/2?0:1, depth=Math.min(44,H*.315/(Math.abs(y-H/2)+.5));
  const planeTiles=planeTextures[plane],defaultTile=VeilLighting.surfaceColors.crypt[plane];
  const stepX=depth*px*2*planeStride/W, stepY=depth*py*2*planeStride/W;
  let worldX=player.x+depth*(cs-px), worldY=player.y+depth*(sn-py);
  const distanceLight=clamp(1.12-depth*.058,.10,1);
  for(let x=0;x<W;x+=planeStride){
    const ix=Math.floor(worldX), iy=Math.floor(worldY);
    const layer=planeTiles[iy]?.[ix]??defaultTile;
    const textureX=Math.floor(worldX*32)&31;
    const textureY=Math.floor(worldY*32)+(layer===waterTile?rippleFrame:0);
    const texel=((textureY&31)*32+textureX)*3;
    const light=distanceLight*(planeLight[iy]?.[ix]??.57);
    const r=layer[texel]*light, g=layer[texel+1]*light, b=layer[texel+2]*light;
    const offset=(y*W+x)*4;
    for(let row=0;row<planeStride&&y+row<H;row++){
      const pixel=offset+row*W*4;
      for(let col=0;col<planeStride;col++){
        const i=pixel+col*4;
        fc[i]=r;fc[i+1]=g;fc[i+2]=b;fc[i+3]=255;
      }
    }
    worldX+=stepX; worldY+=stepY;
  }
}
// Pixel-accurate DDA raycasting.
for(let x=0;x<W;x+=stride){
  const cameraX=2*x/W-1,rx=cs+px*cameraX,ry=sn+py*cameraX;
  const ray=castRay(player.x,player.y,rx,ry,30);
  const wd=Math.max(.01,ray.depth);
  for(let col=0;col<stride;col++)zBuffer[x+col]=wd;
  if(!ray.hit)continue;
  const {x:mx,y:my,side}=ray;
  const wh=Math.min(H*4,H/wd),top=Math.floor((H-wh)/2);
  let wallX=side===0?player.y+wd*ry:player.x+wd*rx;
  wallX-=Math.floor(wallX);
  const area=renderRegions[my]?.[mx]??regionAt(mx,my), kind=tileType(mx,my);
  const eyeOpen=kind==='wall'&&eyeWalls[my]?.[mx]&&
    (area==='chapel'&&player.relic||area==='sanctuary'&&(watching||bellRung));
  const face=side===0?(rx>0?0:1):(ry>0?2:3);
  const relief=kind==='wall'&&architecturalFaces[(my*MAP_WIDTH+mx)*4+face];
  const tex=eyeOpen?openedPixels[area]:relief||wallPixels[area][kind];
  let texX=(wallX*64)|0;
  if(side===0&&rx>0||side===1&&ry<0)texX=63-texX;
  const fixture=bakedLight[my-(side===1?Math.sign(ry):0)]?.[mx-(side===0?Math.sign(rx):0)]||0;
  const fog=clamp(Math.round(4+wd*1.08+side*2-fixture*10),1,24)/28;
  const pulse=settings.quiet||settings.low ? .94 : .94+Math.sin(tick*2.1+mx*.7+my*.45)*.06;
  const lamp=Math.max(0,fixture-.23)*.23*pulse;
  const shade=(1-fog)*(1-lamp);
  const mist=VeilLighting.materials[area].fog,tint=fixtureTints[area];
  const rBias=mist[0]*fog*(1-lamp)+tint[0]*lamp;
  const gBias=mist[1]*fog*(1-lamp)+tint[1]*lamp;
  const bBias=mist[2]*fog*(1-lamp)+tint[2]*lamp;
  const end=Math.min(H,Math.ceil(top+wh)),advance=64/wh;
  for(let y=Math.max(0,top);y<end;y++){
    const sample=(Math.min(63,((y-top)*advance)|0)*64+texX)*4;
    const r=tex[sample]*shade+rBias,g=tex[sample+1]*shade+gBias,b=tex[sample+2]*shade+bBias;
    for(let col=0;col<stride;col++){
      const pixel=(y*W+x+col)*4;
      fc[pixel]=r;fc[pixel+1]=g;fc[pixel+2]=b;
    }
  }
}
ctx.putImageData(floorImage,0,0);
}
// Unique procedural markers for interactive mechanisms and unread inscriptions.
function markerSprite(kind){const c=document.createElement('canvas');c.width=72;c.height=100;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 g.fillStyle='#31303a';g.fillRect(16,58,42,36);g.fillStyle='#777081';g.fillRect(12,56,49,8);g.fillStyle='#b99779';g.fillRect(31,20,9,42);
 if(kind==='seal'){g.fillStyle='#25192f';g.fillRect(15,42,43,35);g.fillStyle='#bca4df';g.fillRect(22,45,29,4);g.fillRect(31,30,9,29);g.fillStyle='#e9c2ba';g.fillRect(29,32,13,7);g.fillStyle='#65336c';g.fillRect(28,54,16,8);}
 else if(kind==='lever'){g.fillStyle='#9a5e64';g.fillRect(36,22,7,10);g.fillStyle='#d7a498';g.fillRect(28,12,24,12);}
 else if(kind==='cache'){g.fillStyle='#9c80ba';g.fillRect(21,49,31,29);g.fillStyle='#d7b9f0';g.fillRect(27,54,18,5);}
 else if(kind==='discovery'){
   g.clearRect(0,0,72,100);
   g.fillStyle='#3d3544';g.fillRect(16,75,42,24);
   g.fillStyle='#63545c';g.fillRect(20,56,34,22);
   g.fillStyle='#a08a78';g.fillRect(16,55,42,4);
   g.fillStyle='#b9a38b';g.fillRect(25,59,23,3);
   g.fillStyle='#887069';g.fillRect(24,65,19,2);
   g.fillStyle='#291f2a';g.fillRect(22,93,32,6);
 }
 else {g.fillStyle='#8b8190';g.fillRect(24,22,27,43);g.fillStyle='#d3bba1';g.fillRect(29,29,16,3);g.fillRect(29,37,13,3);g.fillRect(29,45,16,3);}
 return c;}
for(const k of ['lever','cache','tablet','seal'])sprite[k]=markerSprite(k);
sprite.discovery=markerSprite('discovery');
sprite.passage=sprite.arch;
sprite.workmark=document.createElement('canvas');
sprite.workmark.width=72;sprite.workmark.height=100;
{
  const stone=sprite.workmark.getContext('2d');
  stone.fillStyle='#3b3339';stone.fillRect(14,83,44,17);
  stone.fillStyle='#826c64';stone.fillRect(10,79,52,6);
  stone.fillStyle='#c3a680';stone.fillRect(23,79,25,2);
  stone.fillStyle='#c3a680';stone.fillRect(34,72,4,9);
}
for(const [kind,color] of Object.entries({
  saltPillar:'#d3c0a2',ledger:'#c49a6d',tree:'#b3ccb1',gauge:'#80bac0',orrery:'#9ea9dd'
})){
  const canvas=document.createElement('canvas');
  canvas.width=72;canvas.height=100;
  const g=canvas.getContext('2d');
  g.fillStyle='#2b2533';g.fillRect(6,82,60,13);
  g.fillStyle='#574b5d';g.fillRect(15,78,42,10);
  g.fillStyle=color;g.strokeStyle=color;g.lineWidth=2;
  if(kind==='saltPillar'){
    for(const [x,y,w,h] of [[14,51,12,27],[28,19,14,60],[44,39,11,39]]){
      g.fillRect(x,y,w,h);g.fillRect(x+3,y-4,w-5,5);
    }
  }else if(kind==='ledger'){
    g.fillRect(21,39,30,42);g.fillRect(15,38,43,6);
    g.fillStyle='#392832';
    for(let y=50;y<77;y+=6)g.fillRect(26,y,19,2);
  }else if(kind==='tree'){
    g.fillRect(32,37,8,45);
    g.beginPath();g.moveTo(35,54);g.lineTo(16,34);g.lineTo(12,14);
    g.moveTo(37,63);g.lineTo(54,43);g.lineTo(62,17);
    g.moveTo(37,54);g.lineTo(34,28);g.lineTo(42,9);g.stroke();
  }else{
    g.fillRect(31,52,10,30);
    g.beginPath();g.ellipse(36,40,23,22,0,0,TAU);g.stroke();
    g.beginPath();g.ellipse(36,40,12,24,kind==='orrery'?1:0,0,TAU);g.stroke();
    g.beginPath();g.moveTo(36,40);g.lineTo(48,23);g.stroke();
    g.fillRect(34,38,5,5);
  }
  sprite[kind]=canvas;
}
const architectureScenery = VeilLighting.landmarks.map(([x, y, region, kind, scale]) => {
  const type = `architecture-${region}-${kind}`;
  if (!sprite[type]) sprite[type] = VeilArt.landmark(region, kind);
  return {x, y, type, scale};
});
const stationArt={
  saltCrane:{type:'workmark',scale:.57,shadow:true},
  saltLow:{type:'architecture-salt-basin',scale:.78,shadow:true},
  saltPrint:{type:'discovery',scale:.66,shadow:true},
  gardenChair:{type:'garden-seat',scale:.82,shadow:true},
  soundingsGauge:{type:'station-gauge',scale:1,shadow:true},
  soundingsWeight:{type:'station-weight',scale:1.31,shadow:true},
};
sprite['garden-seat']=VeilArt.landmark('garden','chair');
sprite['station-gauge']=VeilArt.landmark('soundings','gauge');
sprite['station-weight']=VeilArt.landmark('soundings','weight');
for(const finish of ['dark','light']){
  for(let direction=0;direction<mirrorDirections.length;direction++){
    const type='mirror-'+finish+'-'+direction;
    sprite[type]=VeilArt.landmark('sky',type);
  }
}
const mirrorArt={
  skyDark:mirrorDirections.map((_,i)=>({type:'mirror-dark-'+i,scale:.97,shadow:true})),
  skyLight:mirrorDirections.map((_,i)=>({type:'mirror-light-'+i,scale:.97,shadow:true})),
};
function objectArt(object){
  if(isMirror(object.id))return mirrorArt[object.id][mirrorPositions[object.id]];
  return stationArt[object.id]??{
    type:object.kind==='weapon'?'relic':object.kind,
    scale:object.kind==='passage'?1.42:object.kind==='exit'?1.35:.7,
    shadow:object.kind==='altar'||object.kind==='discovery'||object.kind==='tablet',
  };
}
sprite.bell=document.createElement('canvas');
sprite.bell.width=72;sprite.bell.height=100;
{
  const bell=sprite.bell.getContext('2d');
  bell.fillStyle='#65585d';bell.fillRect(33,1,7,31);
  bell.fillStyle='#332f3e';bell.fillRect(13,24,46,8);
  bell.fillStyle='#4c686a';bell.beginPath();bell.moveTo(25,31);bell.lineTo(48,31);
  bell.lineTo(55,65);bell.lineTo(66,76);bell.lineTo(8,76);
  bell.lineTo(20,65);bell.closePath();bell.fill();
  bell.fillStyle='#a4c1ac';bell.fillRect(15,69,44,3);bell.fillRect(27,35,3,23);
  bell.fillStyle='#243538';bell.fillRect(9,76,56,6);
  bell.fillStyle='#856f6b';bell.fillRect(33,82,8,8);
}
sprite.shortcut=sprite.lever;
for(const type of ['trapWarning','trapActive']){
  const image=document.createElement('canvas');image.width=72;image.height=100;
  const paint=image.getContext('2d');
  for(let i=0;i<5;i++){
    const x=5+i*14;
    paint.fillStyle='#e7a878';
    paint.fillRect(x,92,10,3);
    if(type==='trapActive'){
      paint.beginPath();paint.moveTo(x,92);paint.lineTo(x+6,37+i%2*18);paint.lineTo(x+11,92);paint.fill();
    }
  }
  sprite[type]=image;
}
function worldSprite(camera,x,y,type,scale=1,frameImage=null,opacity=1){
  const dx=x-player.x,dy=y-player.y;
  const forward=camera.cs*dx+camera.sn*dy;
  if(forward<=.18||forward>24)return;
  const center=W/2+(-camera.sn*dx+camera.cs*dy)/forward*W/(2*FOV);
  const height=H*scale/forward;
  const texture=frameImage??sprite[type];
  if(!texture)return;
  const width=height*texture.width/texture.height;
  const ground=H/2+H*.43/forward;
  drawVisibleImage(texture,center-width/2,ground-height,width,height,forward,opacity);
}
function drawVisibleImage(texture,left,top,width,height,forward,opacity){
  const right=left+width;
  if(right<=0||left>=W||top+height<=0||top>=H)return;
  const maxX=Math.min(W,Math.ceil(right));
  const sampling=texture.width/width;
  ctx.globalAlpha=opacity;
  for(let run=Math.max(0,Math.ceil(left));run<maxX;){
    while(run<maxX&&forward>=zBuffer[run])run++;
    const from=run;
    while(run<maxX&&forward<zBuffer[run])run++;
    if(from<run){
      const band=Math.min(run,right)-from;
      ctx.drawImage(texture,(from-left)*sampling,0,band*sampling,texture.height,from,top,band,height);
    }
  }
  ctx.globalAlpha=1;
}
const footprint=document.createElement('canvas');
footprint.width=32;footprint.height=8;
{
  const shadow=footprint.getContext('2d');
  shadow.fillStyle='#100e18';
  shadow.fillRect(4,1,24,6);
  shadow.fillRect(1,3,30,2);
}
const cryptWitness={x:3.05,y:16.2,type:'idol',scale:1.08};
const movedWitness={...cryptWitness,x:5.9,y:17.15};
const scenerySprites=[...scenery,...routeLandmarks,...annexScenery,...architectureScenery];
const groundedProps=new Set(['altar','coffin','idol','arch','urn','bell','ledger','tree','gauge']);
const rungBell={x:28.35,y:14.4,type:'bell',scale:.7};

function drawSprites(camera){
  const visible=[];
  function add(source,type,scale,frameImage=undefined,opacity=1,shadow=false){
    const dx=source.x-player.x,dy=source.y-player.y;
    const depth=dx*camera.cs+dy*camera.sn;
    if(depth>.18&&depth<24)visible.push({x:source.x,y:source.y,type,scale,frameImage,opacity,shadow,depth});
  }
  for(const s of scenerySprites)add(s,s.type,s.scale,undefined,1,
    groundedProps.has(s.type)||s.type.startsWith('architecture-'));
  add(player.relic?movedWitness:cryptWitness,'idol',1.08,undefined,1,true);
  if(bellRung)add(rungBell,'bell',.7);
  for(const trap of traps){
    const phase=trapPhase(trap);
    if(phase!=='idle')add(trap,phase==='warning'?'trapWarning':'trapActive',.28);
  }
  for(const enemy of enemies){
    const image=enemyCel(enemy);
    if(!image)continue;
    const opacity=enemy.alive ? 1 : Math.max(.35,1-(tick-enemy.defeatedAt)/fallTime);
    add(enemy,enemy.type,enemy.type==='boss'?1.83:1.12,image,opacity,enemy.type!=='wraith');
  }
  for(const object of objects){
    if(!object.active)continue;
    if(object.kind==='key'&&player.key||object.kind==='relic'&&player.relic||object.kind==='loot'&&crimsonTaken)continue;
    const art=objectArt(object);
    add(object,art.type,art.scale,undefined,1,art.shadow);
  }
  if(dropped)add(dropped,'relic',.5);
  visible.sort((a,b)=>b.depth-a.depth);
  for(const s of visible){
    if(s.shadow){
      const side=-camera.sn*(s.x-player.x)+camera.cs*(s.y-player.y);
      const center=W/2+side/s.depth*W/(2*FOV);
      const ground=H/2+H*.43/s.depth;
      const width=H*.51*s.scale/s.depth;
      const height=H*.09/s.depth;
      drawVisibleImage(footprint,center-width/2,ground-height*.55,width,height,s.depth,s.opacity*.54);
    }
    worldSprite(camera,s.x,s.y,s.type,s.scale,s.frameImage,s.opacity);
  }
}

function drawCombatParticles(camera){
  for(const p of bladeSparks){
    const dx=p.x-player.x,dy=p.y-player.y;
    const forward=dx*camera.cs+dy*camera.sn;
    if(forward<=.2)continue;
    const x=W/2+(-dx*camera.sn+dy*camera.cs)/forward*W/(2*FOV);
    const y=H/2+H*(.43-p.z)/forward;
    if(x<0||x>=W||y<0||y>=H||forward>=zBuffer[x|0])continue;
    const size=Math.round(clamp(7/forward,1,5));
    ctx.globalAlpha=clamp(p.life*2,0,settings.quiet?.44:.88);
    ctx.fillStyle=p.color;
    if(p.style==='spear'||p.style==='needle')ctx.fillRect(x|0,y|0,1,size+1);
    else if(p.style==='axe')ctx.fillRect(x|0,y|0,size+2,size);
    else if(p.style==='resonance'){
      ctx.fillRect((x|0)-1,y|0,size+2,1);
      ctx.fillRect(x|0,(y|0)-1,1,size+2);
    }else ctx.fillRect(x|0,y|0,size,size);
  }
  ctx.globalAlpha=1;
}

const ringPoints=Array.from({length:40},(_,index)=>{
  const angle=index*TAU/40;
  return [Math.cos(angle),Math.sin(angle)];
});
function drawWarningRings(camera){
  for(const enemy of enemies){
    if(!enemy.alive||!['ring','chime'].includes(enemy.attackKind)||
      !(enemy.windup>0||enemy.attackPose>0)||dist(enemy,player)>6||
      !los(player.x,player.y,enemy.x,enemy.y))continue;
    ctx.globalAlpha=settings.quiet||enemy.windup>0 ? .73 : .54;
    const ranges=[enemy.attackReach,enemy.attackMin];
    if(enemy.type==='drowned'){
      // Close ripples tie the warning to the bell in narrow parts of the nave.
      const wave=settings.quiet||enemy.windup>0 ? .48 : .48+1.25*(1-enemy.attackPose/strikeTime);
      ranges.push(wave);
    }
    for(const reach of ranges){
      if(!reach)continue;
      ctx.fillStyle=reach===enemy.attackMin?'#dfb7a0':enemy.type==='drowned'?'#b9d9bb':'#eab477';
      for(let index=0;index<ringPoints.length;index+=settings.low?2:1){
        const [cos,sin]=ringPoints[index],x=enemy.x+cos*reach,y=enemy.y+sin*reach;
        if(solid(x,y)||!los(enemy.x,enemy.y,x,y))continue;
        const dx=x-player.x,dy=y-player.y;
        const depth=camera.cs*dx+camera.sn*dy;
        if(depth<=.25)continue;
        const px=W/2+(-camera.sn*dx+camera.cs*dy)/depth*W/(2*FOV);
        const py=H/2+H*.43/depth;
        if(px<0||px>=W||py>=H||depth>=zBuffer[px|0])continue;
        ctx.fillRect(px|0,py|0,clamp(13/depth,2,8),depth<3?2:1);
      }
    }
  }
  ctx.globalAlpha=1;
}
function drawThreatIndicator(){
  const imminent=enemies.filter(e=>e.alive&&(e.windup>0||e.waking>0)&&dist(player,e)<4&&
    Math.abs(turnDelta(Math.atan2(e.y-player.y,e.x-player.x)-player.ang))<.65&&los(player.x,player.y,e.x,e.y))
    .sort((a,b)=>dist(player,a)-dist(player,b))[0];
  if(!imminent)return;
  const radial=!imminent.waking&&['ring','chime'].includes(imminent.attackKind);
  const pulse=settings.quiet?.8:.73+.08*Math.sin(tick*9);
  ctx.strokeStyle=radial?`rgba(250,199,126,${pulse})`:`rgba(246,151,131,${pulse})`;
  ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.arc(W/2,H/2,radial?16:12,radial?0:-PI*.78,radial?TAU:PI*.78);
  ctx.stroke();
}
function swordPose(progress,heavy){
  const strike=clamp(progress/.52,0,1),recovery=clamp((progress-.52)/.48,0,1);
  const cut=strike*strike*(3-2*strike),reset=recovery*recovery*(3-2*recovery);
  const reach=heavy?136:101;
  return {x:-reach*cut+reach*.9*reset,y:10*cut+38*reset,
    rotation:-.18-(heavy?.82:.68)*cut+(heavy?1.04:.9)*reset};
}
function weaponPose(id,progress,heavy){
  const base=swordPose(progress,heavy);
  const prepare=clamp(progress/.52,0,1);
  const extension=Math.sin(prepare*PI/2)*(1-clamp((progress-.52)/.48,0,1));
  let pose={x:base.x*.52,y:base.y,rotation:base.rotation+(heavy?.14:0)*extension,scaleY:1};
  if(id==='spear')pose={x:-(heavy?126:118)*extension,y:-5*extension,rotation:-.18-.08*extension,scaleY:1-.45*extension};
  if(id==='needle')pose={x:-106*extension,y:2*extension,rotation:-.18-.21*extension,scaleY:1-.50*extension};
  if(id==='axe'){
    const windup=Math.sin(prepare*PI)*(heavy?26:19);
    pose={x:base.x*(heavy?.28:.37)+windup,y:base.y-(heavy?20:10)*extension,
      rotation:base.rotation+.17*extension+windup*.018,scaleY:1};
  }
  // Complete the recovery at the idle pose so the next frame does not jump.
  const settle=clamp((progress-.82)/.18,0,1);
  return {x:pose.x*(1-settle),y:pose.y*(1-settle),
    rotation:pose.rotation*(1-settle)-.18*settle,scaleY:1+(pose.scaleY-1)*(1-settle)};
}
const restingWeapon={x:0,y:0,rotation:-.18,scaleY:1};
const weaponTip={sword:[17,21],spear:[18,14],axe:[-31,49],needle:[18,13]};
function drawWeaponSleeve(x,y,pose){
  const gripX=x+17*Math.cos(pose.rotation);
  const gripY=y+17*Math.sin(pose.rotation);
  ctx.fillStyle='#14121e';
  ctx.beginPath();ctx.moveTo(gripX-12,gripY+2);ctx.lineTo(gripX+9,gripY-2);
  ctx.lineTo(gripX+Math.max(12,(W*.95-gripX)*.51),H+8);
  ctx.lineTo(gripX+Math.max(0,(W*.78-gripX)*.37),H+8);
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='#5e4b59';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(gripX-8,gripY+6);
  ctx.lineTo(gripX+4,gripY+5);ctx.lineTo(gripX+Math.max(8,(W*.87-gripX)*.42),H);
  ctx.stroke();
}
function drawWeaponTrail(id,heavy,progress,bob){
  const strength=Math.max(0,1-Math.abs(progress-.52)*7);
  if(!strength||settings.quiet)return;
  const [tipX,tipY]=weaponTip[id];
  ctx.strokeStyle=weapons[id].color;
  ctx.globalAlpha=strength*(id==='axe'?.64:.48);
  ctx.lineWidth=id==='axe'?3:1.5;
  ctx.beginPath();
  for(let index=0;index<4;index++){
    const sample=clamp(Math.min(progress,.52)-(3-index)*.075,0,1);
    const pose=weaponPose(id,sample,heavy);
    const cos=Math.cos(pose.rotation),sin=Math.sin(pose.rotation),bladeY=(tipY-175)*pose.scaleY;
    const x=W*.76+pose.x+tipX*cos-bladeY*sin;
    const y=H*.81+bob+pose.y+tipX*sin+bladeY*cos;
    if(index===0)ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }
  ctx.stroke();ctx.globalAlpha=1;
}
function drawEffects(){
  const bob=settings.quiet?0:Math.sin(walkTime*11)*Math.min(3.8,player.step*10);
  const progress=swing?(swing.age<swing.contact
    ? .52*swing.age/swing.contact
    : .52+.48*(swing.age-swing.contact)/(swing.duration-swing.contact)):0;
  const id=swing?.id??equippedWeapon,heavy=swing?.heavy??false;
  const pose=swing?weaponPose(id,progress,heavy):restingWeapon;
  if(swing)drawWeaponTrail(id,heavy,progress,bob);
  const weaponX=Math.round(W*.76+pose.x),weaponY=Math.round(H*.81+bob+pose.y);
  drawWeaponSleeve(weaponX,weaponY,pose);
  ctx.save();
  ctx.translate(weaponX,weaponY);
  ctx.rotate(pose.rotation);
  ctx.drawImage(weaponArt[id],-41,-175*pose.scaleY,116,220*pose.scaleY);
  ctx.restore();
  if(player.block){
    ctx.fillStyle='rgba(32,29,42,.94)';
    ctx.beginPath();ctx.moveTo(0,H*.47);ctx.lineTo(85,H*.38);ctx.lineTo(126,H*.71);
    ctx.lineTo(65,H);ctx.lineTo(0,H);ctx.fill();
    ctx.strokeStyle='#8a7785';ctx.lineWidth=6;ctx.stroke();
  }
  if(spellAnim>0){
    const radius=settings.quiet?44:28+(1-spellAnim/.65)*55;
    ctx.strokeStyle=`rgba(176,131,244,${spellAnim/.65*(settings.quiet?.42:.7)})`;
    ctx.lineWidth=settings.quiet?2:4;
    ctx.beginPath();ctx.arc(W*.5,H*.5,radius,0,TAU);ctx.stroke();
  }
  if(injury>0){
    ctx.fillStyle=`rgba(105,15,31,${injury*(settings.quiet?.075:.24)})`;
    ctx.fillRect(0,0,W,H);
  }
}
const ambience={
  crypt:{color:'#bda086',x:5.15,y:15.6,count:8,lift:.16},
  catacomb:{color:'#8faea3',x:21.5,y:19.8,count:6,lift:-.11},
  chapel:{color:'#b38d9e',x:8.5,y:7.45,count:9,lift:.06},
  sanctuary:{color:'#bd8b76',x:19.5,y:3.9,count:9,lift:.13},
  nave:{color:'#8cb8ab',x:28.1,y:15.65,count:7,lift:-.12},
  salt:{color:'#c5b699',x:46.8,y:6.6,count:8,lift:.04},
  archive:{color:'#bba084',x:61.75,y:10.3,count:8,lift:-.06},
  garden:{color:'#a6b88d',x:48.2,y:33.35,count:10,lift:.09},
  soundings:{color:'#99bab9',x:67.7,y:27.1,count:6,lift:.12},
  sky:{color:'#aaaad0',x:41.5,y:53,count:7,lift:.02},
};
const motes=Object.fromEntries(Object.entries(ambience).map(([area,field])=>[
  area,Array.from({length:field.count},(_,i)=>({
    x:field.x+(rand(i,3)-.5)*2.2,y:field.y+(rand(i,4)-.5)*2.2,
    z:rand(i,6),phase:rand(i,8),size:i%4===0?2:1,
  })),
]));
function drawAtmosphere(camera){
  if(!settings.quiet&&!settings.low){
    const area=regionAt(player.x,player.y),field=ambience[area];
    ctx.fillStyle=field.color;ctx.globalAlpha=.52;
    for(const p of motes[area]){
      const time=tick*.62+p.phase*TAU;
      const dx=p.x+Math.sin(time)*.22-player.x,dy=p.y-player.y;
      const depth=dx*camera.cs+dy*camera.sn;
      if(depth<=.5||depth>10)continue;
      const z=.12+((p.z+(tick*field.lift)%1+1)%1)*.8;
      const x=W/2+(-dx*camera.sn+dy*camera.cs)/depth*W/(2*FOV),y=H/2+H*(.43-z)/depth;
      if(x>=0&&x<W&&y>=0&&y<H&&depth<zBuffer[x|0])ctx.fillRect(x|0,y|0,p.size,p.size);
    }
    ctx.globalAlpha=1;
  }
}
function render(){
  const camera={sn:Math.sin(player.ang),cs:Math.cos(player.ang)};
  drawBase(camera);
  drawWarningRings(camera);
  drawSprites(camera);
  drawAtmosphere(camera);
  drawCombatParticles(camera);
  ctx.save();
  if(!settings.quiet&&shake>.005)ctx.translate((Math.random()-.5)*shake*24,(Math.random()-.5)*shake*16);
  drawEffects();
  ctx.restore();
  drawThreatIndicator();
}
const mapCanvas=document.createElement('canvas');
mapCanvas.width=240;mapCanvas.height=200;
mapCanvas.setAttribute('aria-label','Plano local de la región');
$('map').appendChild(mapCanvas);
const mc=mapCanvas.getContext('2d');
function drawMap(){
  const wing=VeilExpedition.at(player.x,player.y);
  const offsetX=wing?wing.x:0,offsetY=wing?wing.y:0;
  const width=wing?19:30,height=wing?19:25,cell=wing?9:6.5;
  const xAt=x=>(240-width*cell)/2+(x-offsetX)*cell;
  const yAt=y=>(200-height*cell)/2+(y-offsetY)*cell;
  mc.fillStyle='#110f18';mc.fillRect(0,0,240,200);
  for(let y=offsetY;y<offsetY+height;y++)for(let x=offsetX;x<offsetX+width;x++){
    const value=grid[y][x];
    mc.fillStyle=value===0?'#544951':value===3||value===5?'#987b60':value===4?'#534354':'#15121d';
    mc.fillRect(xAt(x),yAt(y),cell-.6,cell-.6);
  }
  for(const object of [...objects,...traps]){
    if(object.active===false||object.x<offsetX||object.y<offsetY||object.x>=offsetX+width||object.y>=offsetY+height)continue;
    if(object.kind==='discovery'&&!discoveries.includes(object.id))continue;
    if(object.kind==='discovery'&&object.choice&&archiveChoice!==object.id)continue;
    const trap=object.period&&trapPhase(object);
    const x=xAt(object.x),y=yAt(object.y);
    mc.fillStyle=trap?(trap==='active'?'#d36f6d':trap==='warning'?'#d7ae78':'#796b68'):
      object.kind==='passage'?'#a7c9dc':object.kind==='altar'?'#9ad3b2':object.kind==='seal'?'#ce97dc':'#e5c78e';
    if(object.kind==='passage'||object.kind==='seal'){
      const mark=object.kind==='passage'?4:3;
      mc.beginPath();mc.moveTo(x,y-mark);mc.lineTo(x+mark,y);mc.lineTo(x,y+mark);
      if(object.kind==='seal')mc.lineTo(x-mark,y);
      mc.closePath();mc.fill();
    }else if(object.kind==='altar'){
      mc.fillRect(x-3,y-1,6,2);mc.fillRect(x-1,y-3,2,6);
    }else mc.fillRect(x-2,y-2,4,4);
  }
  const x=xAt(player.x),y=yAt(player.y);
  mc.fillStyle='#efe6ca';mc.beginPath();mc.arc(x,y,3.5,0,TAU);mc.fill();
  mc.strokeStyle='#f7dbab';mc.beginPath();mc.moveTo(x,y);
  mc.lineTo(x+Math.cos(player.ang)*8,y+Math.sin(player.ang)*8);mc.stroke();
}
function discoverZone(){
  const zone=getZone();
  if(zone===lastZone)return;
  lastZone=zone;
  if(zone===zones[0]&&player.relic&&!witnessedAfterRite){
    witnessedAfterRite=true;
    note('EL PENITENTE DE PIEDRA YA NO MIRA HACIA EL ALTAR',4);
    VeilAudio.cue('whisper');
  }
  if(zonesVisited.includes(zone))return;
  zonesVisited.push(zone);
  note(`REGIÓN DESCUBIERTA: ${zone}`,4);
  if(zone===zones[2]||zone===zones[4])VeilAudio.cue('whisper');
  save();
}
function getZone(){
  const {x,y}=player;
  const annex=VeilExpedition.areas[regionAt(x,y)];
  if(annex)return annex;
  if(regionAt(x,y)==='nave')return zones[4];
  if(y<9&&x>12)return zones[3];
  if(x<12&&y<13)return zones[2];
  return x>14?zones[1]:zones[0];
}
function objectiveText(){
 const area=regionAt(player.x,player.y);
 const trail={
   salt:['saltPrint','Busca la impronta. La grúa señala dónde dejó su carga.','Hay un torno al este que vuelve al patio.'],
   archive:['archiveKeep','Lee ambas copias antes de decidir qué queda en el acta.','La silla del Huerto espera el acta.'],
   garden:['gardenFruit','Escucha los dos árboles. El fruto responde a sus voces.','Lleva el acta a la silla.'],
   soundings:['soundingsChart','Equilibra el contrapeso para llegar a la carta.','El timbre puede devolver la voz de la silla.'],
   sky:['skyLens','Alinea los espejos y reúne la carta de mareas.','El visor puede revelar la respuesta de Sondas.'],
 }[area];
 if(trail&&!player.won){
   const done=discoveries.includes(trail[0])||(area==='archive'&&archiveChoice);
   return done?trail[2]:trail[1];
 }
if(player.won)return 'MAZMORRA COMPLETADA';if(!player.key)return 'OBJETIVO: ENCUENTRA LA LLAVE DE HUESO';if(!player.gate)return 'OBJETIVO: ABRE LA PUERTA DEL SANTUARIO';if(!bossDefeated)return `OBJETIVO: DERROTA AL VIGÍA · SELLOS ${sealsBroken.length}/2 (OPCIONALES)`;return 'OBJETIVO: ALCANZA EL SELLO DEL AMANECER · ECOS '+echoesCollected.length+'/3';}
function hud(){
  const nearest=enemies.filter(e=>e.alive&&dist(player,e)<5&&
    Math.abs(turnDelta(Math.atan2(e.y-player.y,e.x-player.x)-player.ang))<.62&&los(player.x,player.y,e.x,e.y))
    .sort((a,b)=>dist(player,a)-dist(player,b))[0];$('target').hidden=!nearest;if(nearest){$('targetname').textContent=creatureNames[nearest.type];$('targetbar').style.width=100*nearest.hp/nearest.maxhp+'%';}$('hpbar').style.width=100*player.hp/player.maxhp+'%';$('stbar').style.width=player.st+'%';$('mpbar').style.width=player.mp/60*100+'%';$('ashes').textContent=player.ashes;$('flasks').textContent=player.flasks;$('spellcount').textContent=Math.floor(player.mp/25);$('location').textContent=getZone();$('objective').textContent=objectiveText();let b=enemies.find(e=>e.type==='boss');$('bossbar').hidden=!(b.alive&&b.alert&&getZone()===zones[3]);$('bossfill').style.width=100*b.hp/b.maxhp+'%';let o=nearObject();$('interact').hidden=!o;$('interact').textContent=o?`${coarsePointer?.matches?'':'[ E ]  '}${o.label.toUpperCase()}`:'';if(toastUntil<tick)$('toast').style.opacity='0';if(warningUntil<tick)$('encounter-warning').hidden=true;if(mapOn)drawMap();}
let stepBeat=0,nextDrip=6;
function update(dt){tick+=dt;autoTraversePassage();
if(tick<hitFlashUntil){
  $('reticle').classList.add('hit');
  $('reticle').setAttribute('data-contact',contactKind);
}else $('reticle').classList.remove('hit');
player.attackCd=Math.max(0,player.attackCd-dt);player.spellCd=Math.max(0,player.spellCd-dt);player.hurt=Math.max(0,player.hurt-dt);player.roll=Math.max(0,player.roll-dt);spellAnim=Math.max(0,spellAnim-dt);injury=Math.max(0,injury-dt*2);shake=Math.max(0,shake-dt*.7);let fx=Math.cos(player.ang),fy=Math.sin(player.ang),sx=-fy,sy=fx;let [forward,strafe]=moveInput(),mag=Math.hypot(forward,strafe);player.block=!!keys.MouseRight||padBlock||touchBlock;player.ang+=touchLook*dt*1.95;if(keys.ArrowLeft)player.ang-=dt*1.75;if(keys.ArrowRight)player.ang+=dt*1.75;player.ang=turnDelta(player.ang);let sprint=(keys.ShiftLeft||keys.ShiftRight||padSprint)&&player.st>3&&mag>0&&!player.block,spd=player.roll>0?5.7:sprint?3.8:player.block?1.05:2.4;if(player.roll>0){forward=player.rollDir?.[0]??forward;strafe=player.rollDir?.[1]??strafe;mag=Math.hypot(forward,strafe);}if(mag>0){let dx=(fx*forward+sx*strafe)/Math.max(1,mag)*spd*dt,dy=(fy*forward+sy*strafe)/Math.max(1,mag)*spd*dt;const ox=player.x,oy=player.y;
move(player,dx,dy);
stepBeat+=Math.hypot(player.x-ox,player.y-oy);
if(stepBeat>(sprint?.94:.81)){
  VeilAudio.cue(['nave','soundings'].includes(regionAt(player.x,player.y))?'wetStep':'step');stepBeat=0;
}
walkTime+=dt*(sprint?1.7:1);player.step=Math.min(1,player.step+dt*6);}else player.step=Math.max(0,player.step-dt*6);if(sprint)player.st=Math.max(0,player.st-19*dt);else if(!player.block&&player.attackCd<.38)player.st=Math.min(100,player.st+24*dt);player.mp=Math.min(60,player.mp+(discoveries.includes('gardenFruit')?3.6:3)*dt);for(const p of bladeSparks){p.life-=dt;
  if(!settings.quiet){
    const drag=Math.max(.1,1-dt*4);
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.z=Math.max(.02,p.z+p.vz*dt);p.vz-=1.7*dt;
    p.vx*=drag;p.vy*=drag;
  }}
 advanceSwing(dt);
 bladeSparks=bladeSparks.filter(p=>p.life>0);
 updateTraps(dt);
 if(!paused)discoverZone();
 if(!paused)enemyLogic(dt);
 const area=regionAt(player.x,player.y);
 if(tick>=nextDrip){
   const motif={catacomb:'drip',nave:'drip',salt:'salt',archive:'paper',garden:'branch',soundings:'drip',sky:'star'}[area];
   if(motif)VeilAudio.cue(motif);
   nextDrip=tick+11+rand(Math.floor(tick),player.x)*16;
 }
 hud();
}
let nextDraw=0, needsDraw=true;
function frame(time){
  const dt=clamp((time-last)/1000||.016,0,.05);
  last=time;
  pollPad(dt);
  if(playing&&!paused)update(dt);
  else clearTouch();
  const bossAwake=enemies.some(e=>e.type==='boss'&&e.alive&&e.alert&&getZone()===zones[3]);
  VeilAudio.region(bossAwake?'watcher':regionAt(player.x,player.y),playing&&!paused);
  if(needsDraw||playing&&!paused&&time>=nextDraw-1){
    const interval=1000/(settings.low?30:60);
    nextDraw=Math.max(nextDraw+interval,time+1);
    render();
    needsDraw=false;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
function restart(){
  try{
    const raw=localStorage.getItem(SAVE);
    if(raw!==null)localStorage.setItem(backupKey,raw);
    localStorage.removeItem(SAVE);
  }catch{
    $('ending-story').textContent='El navegador no permite reiniciar el archivo de guardado.';
    return;
  }
  playing=false;location.reload();
}
function lockPointer(){
  if(padActive||coarsePointer?.matches||document.pointerLockElement===screen)return;
  try{screen.requestPointerLock?.()?.catch(()=>{});}catch{}
}
function showDeath(){
  cancelSwing();
  paused=true;
  $('death').classList.remove('hidden');
  document.exitPointerLock?.();
  $('respawn').focus();
}
function respawn(){
  $('death').classList.add('hidden');
  paused=false;
  needsDraw=true;
  lockPointer();
}
function showEnding(){
  paused=true;
  const good=restoredEnding();
  $('ending-title').textContent=good?'EL AMANECER RECOBRADO':'LA PRIMERA LUZ';
  $('ending-story').textContent=good
    ?'La campana devuelve sus nombres a los muertos. Los tres ecos cruzan el umbral y la luz regresa a las criptas.'
    :'El Vigía ha caído y el camino vuelve a abrirse. Bajo la piedra aún queda una voz que nadie ha llamado.';
  if(archiveChoice==='archiveKeep')$('ending-story').textContent+=' Sobre el acta queda tu nombre, junto a los de quienes regresaron.';
  if(archiveChoice==='archiveErase')$('ending-story').textContent+=' El acta deja un renglón en blanco. Por fin nadie puede llamarte desde abajo.';
  if(discoveries.includes('skyWitness'))$('ending-story').textContent+=' La Jardinera oye la respuesta y se levanta de su silla.';
  if(discoveries.includes('skyLens'))$('ending-story').textContent+=' Al otro lado, la estrella sigue clavada.';
  $('ending').classList.remove('hidden');document.exitPointerLock?.();$('again').focus();
}
function begin(){VeilAudio.begin();if(!playing){playing=true;paused=false;if(player.won){$('menu').classList.add('hidden');showEnding();return;}$('menu').classList.add('hidden');note('Sigue las luces del corredor hacia las catacumbas. Allí llevaron la llave.',6);}else{paused=false;$('menu').classList.add('hidden');}needsDraw=true;lockPointer();}
function togglePause(){if(!playing||player.won||!$('death').classList.contains('hidden'))return;if(!$('inventory').classList.contains('hidden')){$('inventory').classList.add('hidden');paused=false;lockPointer();return;}paused=!paused;if(paused){save();$('save-game').hidden=false;$('save-status').textContent='';$('menu').classList.add('is-paused');$('menu').classList.remove('hidden');$('play').textContent='REGRESAR A LA OSCURIDAD';document.exitPointerLock?.();$('play').focus();}else{$('menu').classList.add('hidden');lockPointer();}}
function toggleInventory(){if(!playing||player.won||!$('death').classList.contains('hidden')||(!$('menu').classList.contains('hidden')))return;let inv=$('inventory');if(inv.classList.contains('hidden')){inv.classList.remove('hidden');paused=true;document.exitPointerLock?.();$('items').innerHTML=[...ownedWeapons.map(id=>`<div class="item"><b>${weapons[id].name}${equippedWeapon===id?' · EQUIPADA':''}</b><small>${weapons[id].lore} Alcance ${weapons[id].reach.toFixed(1)} · daño ${weapons[id].damage} · coste ${weapons[id].stamina}. Al cerrar el diario: C, Arma o cruceta derecha.</small></div>`),`<div class="item"><b>LLAVE DE HUESO</b><small>${player.key?'Una llave recuperada de la cripta.':'Aún no encontrada.'}</small></div>`,`<div class="item"><b>CORAZÓN DEL VACÍO</b><small>${player.relic?'El pulso de lo imposible recorre tus venas.':'Se oculta tras un muro quebradizo.'}</small></div>`,`<div class="item"><b>ECOS DEL VELO (${echoesCollected.length}/3)</b><small>Busca las tres memorias perdidas entre la cripta, las catacumbas y la capilla. Reunirlas refuerza permanentemente tus frascos.</small></div>`,`<div class="item"><b>RITOS DEL VIGÍA (${sealsBroken.length}/2)</b><small>Dos sellos opcionales: Sepultura, en la cripta; Herejía, tras el pasadizo de la capilla. Cada uno reduce el daño del Vigía un 15 % y concede 60 cenizas. No son necesarios para completar el juego.</small></div>`,`<div class="item"><b>REGIONES EXPLORADAS (${zonesVisited.length}/${zones.length})</b><small>${zonesVisited.join(' · ')||'Aún no hay registros.'}</small></div>`,`<div class="item"><b>OSARIO</b><small>${leverUsed?'La palanca ha revelado un escondite.':'Un mecanismo olvidado espera en las catacumbas.'} ${cacheOpened?'Recompensa recogida.':''}</small></div>`,`<div class="item"><b>NIVEL ${player.lv} · ${player.ashes} CENIZAS</b><small>Vida máxima: ${player.maxhp} · Frascos: ${player.maxflasks}</small></div>`,`<div class="item"><b>INSCRIPCIONES</b><small>${[
  tabletsRead.includes('tablet')?'Los muertos no temen a la noche. Temen a la campana. La pared agrietada queda al norte del altar.':'',
  tabletsRead.includes('tablet2')?'El Vigía selló la puerta desde el otro lado.':'',
].filter(Boolean).join(' · ')||'Aún no has descifrado ninguna.'}</small></div>`,`<div class="item"><b>CAMPANA SUMERGIDA</b><small>${bellRung?'La campana ha vuelto a sonar.':'Busca una nave inundada al este de las catacumbas.'}</small></div>`,...additionalJournal()].join('');$('items').focus();}else{inv.classList.add('hidden');paused=false;lockPointer();}}
$('play').addEventListener('click',begin);$('again').addEventListener('click',restart);screen.addEventListener('click',()=>{VeilAudio.begin();if(!playing||paused)return;if(document.pointerLockElement!==screen)lockPointer();attack();});screen.addEventListener('contextmenu',e=>e.preventDefault());screen.addEventListener('mousedown',e=>{if(e.button===2)keys.MouseRight=true;});window.addEventListener('mouseup',e=>{if(e.button===2)keys.MouseRight=false;});document.addEventListener('mousemove',e=>{if(document.pointerLockElement===screen&&playing&&!paused)player.ang+=e.movementX*.0029;});
window.addEventListener('keydown',e=>{if(playing&&!player.won&&['Space','Tab','ArrowLeft','ArrowRight'].includes(e.code)&&(!paused||!$('inventory').classList.contains('hidden')))e.preventDefault();if(e.repeat)return;keys[e.code]=true;if(!playing&&e.code!=='Enter')return;if(e.code==='Escape'){if(!$('inventory').classList.contains('hidden'))toggleInventory();else togglePause();return;}if(e.code==='Tab'&&playing&&$('menu').classList.contains('hidden')&&!player.won){toggleInventory();return;}if(!playing||paused){if(e.code==='Enter'&&!playing&&!['BUTTON','INPUT','SUMMARY'].includes(e.target.tagName))begin();return;}if(e.code==='Space')dodge();if(e.code==='KeyE')interact();if(e.code==='KeyF')heal();if(e.code==='KeyL')levelUp();if(e.code==='KeyQ')spell();if(e.code==='KeyJ')attack(true);if(e.code==='KeyH')attack();if(e.code==='KeyM')toggleMap();if(e.code==='KeyC')equipNext();if(e.code==='KeyR'&&nearObject()?.kind==='altar')interact();if(e.code==='KeyK')manualSave();if(e.code==='KeyU')toggleMute();});window.addEventListener('keyup',e=>{keys[e.code]=false;});window.addEventListener('blur',()=>{for(let k of Object.keys(keys))keys[k]=false;});document.addEventListener('pointerlockchange',()=>{
  if(!document.pointerLockElement)keys.MouseRight=false;
});
function additionalJournal(){
  return VeilExpedition.stations
    .filter(station=>discoveries.includes(station.id))
    .map(station=>`<div class="item"><b>${station.label}</b><small>${station.text}${isMirror(station.id)?' Gira hacia '+mirrorDirections[mirrorPositions[station.id]]+'.':''}</small></div>`);
}
const coarsePointer=window.matchMedia?.('(pointer: coarse)');
const touchMovement=new Set();
let touchLook=0,touchBlock=false;
function moveInput(){
  return [(keys.KeyW||touchMovement.has('forward')?1:0)-(keys.KeyS||touchMovement.has('back')?1:0)-padY,
    (keys.KeyD||touchMovement.has('right')?1:0)-(keys.KeyA||touchMovement.has('left')?1:0)+padX];
}
function dodge(){
  if(!playing||paused||player.roll>0||player.st<27)return;
  cancelSwing();
  player.st-=27;player.roll=.33;
  player.rollDir=moveInput();
  const magnitude=Math.hypot(...player.rollDir);
  player.rollDir=magnitude?player.rollDir.map(value=>value/magnitude):[1,0];
  beep(160,.11,'triangle',.014);
}
function toggleMap(){mapOn=!mapOn;$('map').hidden=!mapOn;if(mapOn)drawMap();}
function applySettings(persist=false){
  VeilAudio.preferences(settings.volume/100,settings.muted);
  $('mute').textContent=settings.muted?'Activar sonido':'Silenciar';
  $('mute').setAttribute('aria-pressed',String(settings.muted));
  $('volume').value=settings.volume;
  $('quiet-effects').checked=settings.quiet;
  $('economy').checked=settings.low;
  $('game').setAttribute('data-effects',settings.quiet?'reduced':'normal');
  needsDraw=true;
  if(persist)try{localStorage.setItem(PREFS,JSON.stringify(settings));}catch{}
}
function toggleMute(){
  settings.muted=!settings.muted;
  if(!settings.muted)VeilAudio.begin();
  applySettings(true);
}
function saveMessage(){
  return saveBlocked?'Se conserva el archivo anterior. Esta sesión no se guarda.':
    saveReady?'Partida guardada.':'El navegador no permite guardar.';
}
function manualSave(){save();note(saveMessage(),3);}
$('mute').addEventListener('click',toggleMute);
$('respawn').addEventListener('click',respawn);
$('volume').addEventListener('input',e=>{settings.volume=Number(e.target.value);applySettings(true);});
$('quiet-effects').addEventListener('change',e=>{settings.quiet=e.target.checked;applySettings(true);});
$('economy').addEventListener('change',e=>{settings.low=e.target.checked;applySettings(true);});
applySettings();
$('save-game').addEventListener('click',()=>{
  save();$('save-status').textContent=saveMessage();
});
$('inventory-close').addEventListener('click',toggleInventory);
window.addEventListener('pagehide',()=>{if(playing)save();});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&playing){save();if(!paused)togglePause();}
});

function clearTouch(){touchMovement.clear();touchLook=0;touchBlock=false;}
function setUpTouch(){
  const controls=$('touch-controls');
  const pointer=coarsePointer;
  if(!controls.querySelectorAll)return;
  window.addEventListener('blur',clearTouch);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTouch();});
  const actions={use:interact,attack,heavy:()=>attack(true),dodge,heal,spell,
    map:toggleMap,journal:toggleInventory,pause:togglePause,level:levelUp,weapon:equipNext};
  for(const button of controls.querySelectorAll('button')){
    const action=button.dataset.action;
    if(actions[action]){
      button.addEventListener('click',()=>{if(playing&&(!paused||action==='pause'||action==='journal'))actions[action]();});
      continue;
    }
    button.addEventListener('pointerdown',event=>{
      if(paused)return;
      button.setPointerCapture?.(event.pointerId);
      if(action==='block')touchBlock=true;
      else if(action==='look-left'||action==='look-right')touchLook=action==='look-left'?-1:1;
      else touchMovement.add(action);
    });
    const release=()=>{
      touchMovement.delete(action);
      if(action==='block')touchBlock=false;
      if(action==='look-left'||action==='look-right')touchLook=0;
    };
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
  }
  function updateVisibility(){
    controls.hidden=!pointer?.matches;
    clearTouch();
  }
  pointer?.addEventListener?.('change',updateVisibility);
  updateVisibility();
}
setUpTouch();

let padActive=false,padX=0,padY=0,padBlock=false,padSprint=false,padButtons=[];
function pollPad(dt){
  const pad=Array.from(navigator.getGamepads?.()||[]).find(device=>device?.mapping==='standard');
  if(!pad){padActive=false;padX=0;padY=0;padBlock=false;padSprint=false;padButtons=[];return;}
  const deadzone=value=>Math.abs(value||0)<.18?0:value;
  padX=deadzone(pad.axes[0]);padY=deadzone(pad.axes[1]);
  const look=deadzone(pad.axes[2]);
  const pressed=pad.buttons.map(button=>button.pressed);
  const edge=index=>pressed[index]&&!padButtons[index];
  if(padX||padY||look||pressed.some(Boolean))padActive=true;
  if(edge(9)&&playing&&!player.won)togglePause();
  else if(edge(0)&&!$('menu').classList.contains('hidden'))begin();
  else if(edge(0)&&!$('death').classList.contains('hidden'))respawn();
  else if(edge(0)&&player.won&&!$('ending').classList.contains('hidden'))restart();
  else if(edge(8)&&playing)toggleInventory();
  else if(edge(1)&&!$('inventory').classList.contains('hidden'))toggleInventory();
  else if(playing&&!paused){
    player.ang+=look*dt*2.55;
    padBlock=pressed[6];padSprint=pressed[10];
    for(const [button,action] of [[0,interact],[1,dodge],[2,()=>attack(true)],[3,heal],
      [5,spell],[7,attack],[12,toggleMap],[13,levelUp],[15,equipNext]]){
      if(edge(button))action();
    }
  }
  padButtons=pressed;
}

function safeSavePresent(){return saveReady;}
if(saveWarning)$('save-status').textContent=saveWarning;
if(saveReady)$('play').textContent=player.won?'VER EL DESENLACE':'CONTINUAR EL DESCENSO';
// Read-only diagnostics for reproducible browser tests; no game-state mutation hooks.
window.__ashenDiagnostics=()=>({version:VERSION,ownedWeapons:[...ownedWeapons],equippedWeapon,playing,paused,discoveries:[...discoveries],archiveChoice,mirrorPositions:{...mirrorPositions},awakening:enemies.filter(e=>e.alive&&e.waking>0).map(e=>e.id),objective:objectiveText(),bossDefeated,won:player.won,position:[+player.x.toFixed(2),+player.y.toFixed(2)],heading:player.ang,ending:player.won?(restoredEnding()?'restored':'first-light'):null, bellRung,shortcutOpen, hp:player.hp,stamina:+player.st.toFixed(1),mana:+player.mp.toFixed(1),zone:getZone(),enemiesAlive:enemies.filter(e=>e.alive).length,key:player.key,relic:player.relic,gate:player.gate,secret:player.secret,renderSize:[W,H],sceneryCount:scenery.length,echoes:echoesCollected.length,echoReward,sealsBroken:sealsBroken.length,sealsRemaining:objects.filter(o=>o.kind==='seal'&&o.active).length,zonesVisited:zonesVisited.length,echoLocations:objects.filter(o=>o.kind==='echo'&&o.active).length,textureCount:Object.values(textures).reduce((n,v)=>n+Object.keys(v).length,0)+Object.keys(awakeWall).length,region:regionAt(player.x,player.y),themedProps:scenery.filter(o=>['coffin','bonepile','fungus','roots','stainedglass','brazier'].includes(o.type)).length,animationFrames:[...Object.values(enemyFrames),watcherAwake].reduce((n,v)=>n+Object.values(v).reduce((m,a)=>m+a.length,0),0),enemyWindups:enemies.filter(e=>e.windup>0).length,enemyAttackPatterns:enemies.filter(e=>e.alive).map(e=>({id:e.id,kind:e.attackKind,attacks:e.attacksMade})),activeParticles:bladeSparks.filter(p=>p.life>0).length,trapCount:traps.length,activeTraps:traps.filter(t=>trapPhase(t)==='active').length,leverUsed,cacheOpened,tabletsRead:tabletsRead.length,artStyle:'retro-raycast-pixel',mapVisible:mapOn,savePresent:safeSavePresent()});
})();
