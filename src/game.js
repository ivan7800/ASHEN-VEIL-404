(()=>{'use strict';
const W=480,H=270,PI=Math.PI,TAU=PI*2,FOV=.73,SAVE='ashen-veil-rebirth-v2';
const $=id=>document.getElementById(id),screen=$('screen'),ctx=screen.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;
let tick=0,last=0,playing=false,paused=true,toastUntil=0,shake=0,attackAnim=0,spellAnim=0,injury=0,walkTime=0,mapOn=false;
const keys=Object.create(null),rand=(x,y,s=0)=>{let n=Math.sin(x*127.1+y*311.7+s*81.3)*43758.5453;return n-Math.floor(n)},clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const grid=Array.from({length:25},()=>Array(30).fill(1));const carve=(x1,y1,x2,y2)=>{for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)grid[y][x]=0};
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
const zones=['CRIPTA DEL DESPERTAR','CATACUMBAS DE LOS OLVIDADOS','CAPILLA OCULTA','SANTUARIO DEL VIGÍA','NAVE INUNDADA'];
const objects=[{id:'altar',kind:'altar',x:4.8,y:17.2,label:'Altar de ceniza',active:true},{id:'key',kind:'key',x:23,y:18,label:'Llave de hueso',active:true},{id:'relic',kind:'relic',x:8,y:8.4,label:'Corazón del vacío',active:true},{id:'exit',kind:'exit',x:19.5,y:3.2,label:'Sello del amanecer',active:true},{id:'flask',kind:'loot',x:17.4,y:19.3,label:'Frasco carmesí',active:true},{id:'lever',kind:'lever',x:24.3,y:20.3,label:'Palanca del osario',active:true},{id:'cache',kind:'cache',x:16.3,y:13.5,label:'Osario oculto',active:false},{id:'tablet',kind:'tablet',x:5.4,y:21.1,label:'Inscripción erosionada',active:true},{id:'tablet2',kind:'tablet',x:22.7,y:6.1,label:'Última plegaria',active:true},{id:'echo1',kind:'echo',x:7.4,y:20.4,label:'Eco de la Sepultura',active:true},{id:'echo2',kind:'echo',x:22.6,y:21.0,label:'Eco del Diluvio',active:true},{id:'echo3',kind:'echo',x:9.0,y:7.7,label:'Eco de la Herejía',active:true},{id:'seal1',kind:'seal',x:3.3,y:21.4,label:'Sello de la Sepultura',active:true},{id:'seal2',kind:'seal',x:5.2,y:8.8,label:'Sello de la Herejía',active:true}];
objects.push(
  {id:'chapelShortcut',kind:'shortcut',x:10.5,y:12.5,label:'Cadena del pasadizo',active:true},
  {id:'floodBell',kind:'bell',x:28.35,y:14.4,label:'Campana sumergida',active:true},
  {id:'sanctuaryAltar',kind:'altar',x:19.5,y:9.5,label:'Altar del umbral',active:true},
);
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
  {x:7.6,y:6.4,type:'idol',scale:.98},{x:24.9,y:20.8,type:'idol',scale:1.06},
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
  {x:9.6,y:7.6,type:'roots',scale:1.6},{x:4.6,y:9.6,type:'roots',scale:1.4},
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
let bossDefeated=false;let enemies=[];function resetEnemies(){enemies=defs.map((d,i)=>({...d,maxhp:d.hp,alive:true,cool:i*.21,stun:0,flash:0,alert:false,windup:0,attackPose:0,phase:1,strafeSign:i%2?1:-1,facing:Math.PI/2,attackKind:'slash',attackReach:1.5,attackArc:.85,attackDamage:d.damage,attacksMade:0,attackMin:0,route:[],nextRoute:0,guard:0,originX:d.x,originY:d.y}));}
resetEnemies();let dropped=null;
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
const poses=['idle','walk','windup','strike','hurt'];
const framesFor=(type,phase)=>Object.fromEntries(poses.map(pose=>[
  pose,Array.from({length:3},(_,frame)=>VeilArt.creature(type,pose,frame,phase))
]));
const enemyFrames=Object.fromEntries(Object.keys(creatureNames).map(type=>[type,framesFor(type,1)]));
const watcherAwake=framesFor('boss',2);
let bladeSparks=[];
function sparkBurst(x,y,tint='#e8b5a7',count=10){for(let i=0;i<count;i++)bladeSparks.push({x,y,vx:(rand(i,tick,2)-.5)*2.9,vy:(rand(i,tick,4)-.5)*2.9,life:.25+rand(i,tick,3)*.35,color:tint});if(bladeSparks.length>100)bladeSparks.splice(0,bladeSparks.length-100);}
function enemyPose(e){if(e.flash>0)return 'hurt';if(e.attackPose>0)return 'strike';if(e.windup>0)return 'windup';if(e.alert&&e.stun<=0)return 'walk';return 'idle';}
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
      tabletsRead,echoesCollected,echoReward,sealsBroken,zonesVisited,shortcutOpen,bellRung,crimsonTaken,
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
let block=player.block&&facing&&player.st>=15;if(block){d=Math.ceil(d*.22);player.st=Math.max(0,player.st-15);note('BLOQUEO');VeilAudio.cue('block');}player.hp=Math.max(0,player.hp-d);player.hurt=.65;injury=.9;shake=.12;sparkBurst(player.x,player.y,'#bd5775',12);beep(96,.18,'sawtooth',.04);if(player.hp<=0){showDeath();dropped={x:player.x,y:player.y,amount:player.ashes};player.ashes=0;player.hp=player.maxhp;player.st=100;player.mp=60;player.flasks=player.maxflasks;player.x=player.checkpoint[0];player.y=player.checkpoint[1];player.ang=-PI/2;resetEnemies();if(player.won||bossDefeated)enemies.find(e=>e.id==='boss').alive=false;note('HAS MUERTO — LAS CENIZAS ESPERAN EN TU TUMBA',5);save();}}
const beep=VeilAudio.tone;
let heavySwing=false;
function attack(heavy=false){if(!playing||paused||player.attackCd>0||player.st<(heavy?38:21)||player.roll>0)return;player.st-=heavy?38:21;player.attackCd=heavy?.94:.52;attackAnim=.46;heavySwing=heavy;shake=.025;VeilAudio.cue(heavy?'heavy':'light');let hits=0;for(let e of enemies){if(!e.alive)continue;let d=dist(player,e),a=Math.atan2(e.y-player.y,e.x-player.x)-player.ang;let delta=Math.atan2(Math.sin(a),Math.cos(a));if(d<(heavy?2.45:2.15)&&Math.abs(delta)<(heavy?.48:.62)&&los(player.x,player.y,e.x,e.y)){hit(e,(heavy?49:26)+player.lv*(heavy?8:6),heavy);hits++;}}if(hits)VeilAudio.cue('impact');}
function hit(e,damage,heavy=false,magic=false){if(!heavy&&e.type==='knight'&&e.guard>0){damage=Math.ceil(damage*.45);note('EL CABALLERO RESISTE TU GOLPE',1.1);}if(e.type==='wraith'&&magic){
  const lit=(bakedLight[Math.floor(e.y)]?.[Math.floor(e.x)]||0)>.26;
  damage=Math.round(damage*(lit||e.windup>0?1.28:.82));
}
e.hp=Math.max(0,e.hp-damage);e.flash=.24;const braced=e.type==='boss'&&e.phase===2&&e.windup>0&&!heavy;
if(!braced){e.stun=heavy?.68:.3;e.windup=0;}e.guard=0;e.alert=true;shake=.055;sparkBurst(e.x,e.y,e.type==='wraith'?'#bba2e8':'#e4b29d',14);if(e.hp<=0){e.alive=false;player.ashes+=e.ashes;note(`+ ${e.ashes} CENIZAS`);beep(120,.33,'triangle',.035);save();if(e.type==='boss'){bossDefeated=true;save();note('EL VIGÍA HA CAÍDO — EL SELLO TE ESPERA',5)}}else if(e.type==='boss'&&e.phase===1&&e.hp<e.maxhp*.5){e.phase=2;e.attacksMade=0;e.cool=1.3;VeilAudio.cue('boss');note('EL VIGÍA ABRE EL OJO DEL UMBRAL',4);}}
function spell(){if(!playing||paused||player.spellCd>0||player.mp<25||player.roll>0)return;player.mp-=25;player.spellCd=1.3;spellAnim=.65;sparkBurst(player.x+Math.cos(player.ang)*1.1,player.y+Math.sin(player.ang)*1.1,'#b78ffe',17);beep(490,.36,'sine',.06);let hitCount=0;for(let e of enemies){if(!e.alive||dist(player,e)>6.6)continue;let a=Math.atan2(e.y-player.y,e.x-player.x)-player.ang;if(Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.22&&los(player.x,player.y,e.x,e.y)){hit(e,38+player.lv*5,false,true);hitCount++;}}if(!hitCount)note('EL ÉTER SE DISIPA');}
function levelUp(){if(!objects.some(o=>o.kind==='altar'&&dist(player,o)<1.65&&los(player.x,player.y,o.x,o.y))){note('DEBES ESTAR JUNTO A UN ALTAR');return;}if(player.lv>=99)return;let cost=80*player.lv;if(player.ashes<cost){note(`NECESITAS ${cost} CENIZAS PARA ASCENDER`);return;}player.ashes-=cost;player.lv++;player.maxhp+=8;player.hp=player.maxhp;note(`EL ALMA SE FORTALECE — NIVEL ${player.lv}`,4);beep(680,.5,'sine',.04);save();}
function heal(){if(!playing||paused||player.flasks<=0||player.hp>=player.maxhp)return;player.flasks--;player.hp=Math.min(player.maxhp,player.hp+55);note('LA SANGRE VUELVE A CALENTARSE');beep(600,.4,'sine',.025);save();}
function nearObject(){let opts=objects.filter(o=>o.active&&dist(player,o)<1.55&&los(player.x,player.y,o.x,o.y)).map(o=>o);if(!player.gate&&player.y>=10.5&&Math.hypot(player.x-19.5,player.y-10.5)<1.75)opts.push({kind:'gate',label:'Puerta de hueso',d:Math.hypot(player.x-19.5,player.y-10.5)});if(!player.secret&&player.y>=13.5&&Math.hypot(player.x-6.5,player.y-13.5)<1.7)opts.push({kind:'secret',label:'Muro agrietado',d:Math.hypot(player.x-6.5,player.y-13.5)});if(dropped&&dist(player,dropped)<1.3&&los(player.x,player.y,dropped.x,dropped.y))opts.push({kind:'drop',label:`Recuperar ${dropped.amount} cenizas`,d:dist(player,dropped)});opts.sort((a,b)=>(a.d??dist(player,a))-(b.d??dist(player,b)));return opts[0]||null;}
function interact(){let o=nearObject();if(!o)return;if(o.kind==='altar'){player.hp=player.maxhp;player.st=100;player.mp=60;player.flasks=player.maxflasks;player.checkpoint=[o.x,o.y];resetEnemies();if(player.won||bossDefeated)enemies.find(e=>e.id==='boss').alive=false;note('ALTAR ENCENDIDO — PULSA L PARA SUBIR DE NIVEL',4);save();}else if(o.kind==='key'){player.key=true;o.active=false;note('HAS OBTENIDO: LLAVE DE HUESO',4);save();}else if(o.kind==='gate'){if(!player.key){note('SELLADA — NECESITAS LA LLAVE DE HUESO');beep(75,.12);return;}player.gate=true;grid[10][19]=0;note('LA PUERTA CEDE CON UN GEMIDO',4);save();}else if(o.kind==='secret'){player.secret=true;grid[13][6]=0;note('LA PIEDRA OCULTABA UN PASADIZO',4);save();}else if(o.kind==='relic'){player.relic=true;o.active=false;player.maxhp=maxHealth();player.hp=player.maxhp;note('CORAZÓN DEL VACÍO — VIDA MÁXIMA +30',4);beep(730,.6,'sine',.04);save();}else if(o.kind==='loot'){crimsonTaken=true;o.active=false;player.maxflasks=Math.min(9,player.maxflasks+1);player.flasks=Math.min(player.maxflasks,player.flasks+1);note('FRASCO CARMESÍ — CAPACIDAD +1',4);save();}else if(o.kind==='lever'){if(leverUsed)return;leverUsed=true;o.active=false;objects.find(p=>p.id==='cache').active=true;note('LA PIEDRA GIME: UN OSARIO SE HA ABIERTO',4);beep(210,.6,'sawtooth',.03);save();}else if(o.kind==='cache'){if(!leverUsed||cacheOpened)return;cacheOpened=true;o.active=false;player.ashes+=160;note('160 CENIZAS RECUPERADAS DEL OSARIO',4);beep(540,.4,'triangle',.04);save();}else if(o.kind==='echo'){if(echoesCollected.includes(o.id))return;echoesCollected.push(o.id);o.active=false;player.ashes+=90;sparkBurst(o.x,o.y,'#b6a0e9',22);beep(620,.5,'sine',.05);if(echoesCollected.length===3&&!echoReward){echoReward=true;player.maxflasks=Math.min(9,player.maxflasks+1);player.flasks=Math.min(player.maxflasks,player.flasks+1);note('TRES ECOS REUNIDOS — +1 FRASCO PERMANENTE',5);}else note(`ECO RECUPERADO (${echoesCollected.length}/3) — +90 CENIZAS`,4);save();}else if(o.kind==='seal'){if(sealsBroken.includes(o.id))return;sealsBroken.push(o.id);o.active=false;player.ashes+=60;sparkBurst(o.x,o.y,'#c9b3ec',24);beep(720,.65,'triangle',.042);note(`RITO DESHECHO (${sealsBroken.length}/2) — EL VIGÍA PIERDE FUERZA`,5);save();}else if(o.kind==='shortcut'){
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
}else if(o.kind==='tablet'){if(!tabletsRead.includes(o.id))tabletsRead.push(o.id);note(o.id==='tablet'?'LOS MUERTOS NO TEMEN A LA NOCHE. TEMEN A LA CAMPANA.':'EL VIGÍA SELLÓ LA PUERTA DESDE EL OTRO LADO.',5);save();}else if(o.kind==='drop'){player.ashes+=dropped.amount;dropped=null;note('HAS RECUPERADO TUS CENIZAS');save();}else if(o.kind==='exit'){let boss=enemies.find(e=>e.id==='boss');if(boss.alive){note('EL SELLO RESISTE — SU GUARDIÁN SIGUE VIVO');return;}player.won=true;save();showEnding();}}
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
    const warning={lunge:'EL VIGÍA FIJA SU ESTOCADA',cleave:'EL VIGÍA PREPARA UN BARRIDO',ring:'ONDA DEL UMBRAL · ACÉRCATE O RETROCEDE'};
    note(warning[e.attackKind],1.12);
  }else if(e.type==='knight'){
    e.attackKind=odd?'cleave':'thrust';e.windup=odd?.9:.7;
    e.attackReach=odd?1.78:2.12;e.attackArc=odd?.95:.34;
    e.attackDamage=e.damage;e.guard=.52;
    note(odd?'EL CARCELERO ALZA SU ESPADA':'EL CARCELERO APUNTA UNA ESTOCADA',1);
  }else if(e.type==='wraith'){
    e.attackKind='lunge';e.windup=.56;e.attackReach=1.83;e.attackArc=.58;e.attackDamage=e.damage;
    note('EL TESTIGO ABRE SUS OJOS',.8);
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
}
function resolvesEnemyAttack(e){
  const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy);
  const facingDelta=turnDelta(Math.atan2(dy,dx)-e.facing);
  const valid=d>=e.attackMin&&d<e.attackReach+.08&&Math.abs(facingDelta)<=e.attackArc&&los(e.x,e.y,player.x,player.y);
  if(valid)damagePlayer(e.type==='boss'?Math.max(1,Math.ceil(e.attackDamage*(1-.15*sealsBroken.length))):e.attackDamage,e);
  return valid;
}
function routeAroundWall(e){
  const start=Math.floor(e.x)+Math.floor(e.y)*30;
  const finish=Math.floor(player.x)+Math.floor(player.y)*30;
  const cells=[start], previous=new Map([[start,-1]]);
  for(let i=0;i<cells.length&&!previous.has(finish);i++){
    const cell=cells[i],x=cell%30,y=Math.floor(cell/30);
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
      const next=cell+dx+dy*30;
      if(solid(x+dx,y+dy)||previous.has(next))continue;
      cells.push(next);previous.set(next,cell);
    }
  }
  const route=[];
  if(previous.has(finish)){
    for(let cell=finish;cell!==start;cell=previous.get(cell)){
      route.push([cell%30+.5,Math.floor(cell/30)+.5]);
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
    const d=dist(e,player),visible=los(e.x,e.y,player.x,player.y);
    if(d<9&&visible){
      if(!e.alert&&e.type==='boss'){note('ALGO SE DESPRENDE DEL ALTAR',3);VeilAudio.cue('boss');}
      e.alert=true;
    }
    if(!e.alert||d>13||e.stun>0){e.windup=0;continue;}
    const dx=(player.x-e.x)/Math.max(.01,d),dy=(player.y-e.y)/Math.max(.01,d);
    const speed=e.type==='wraith'?1.16:e.type==='boss'?(e.phase===2?1.02:.75):e.type==='knight'?.67:
      e.type==='drowned'?.87+Math.sin(tick*5)*.28:.82;
    if(e.windup<=0&&e.attackPose<=0&&d<9){
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
        e.windup=0;e.attackPose=.34;resolvesEnemyAttack(e);
        if(paused)return;
        e.cool=e.type==='wraith'?1.45:e.type==='boss'?(e.phase===2?1.5:1.75):e.type==='knight'?1.9:1.55;
      }
    }else if(d<(e.type==='boss'?2.75:e.type==='drowned'?2.3:e.type==='knight'?2.08:1.74)&&visible&&e.cool<=0&&e.attackPose<=0){
      startEnemyAttack(e,dx,dy);
    }
  }
}
function regionAt(x,y){
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
const areaLights = [
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
};
const zBuffer=new Float32Array(W);const floorImage=ctx.createImageData(W,H);const fc=floorImage.data;
function drawBase(){
const stride=settings.low?2:1, planeStride=settings.low?4:2;
const watching=enemies.some(e=>e.type==='boss'&&e.alive&&e.phase===2);
const sn=Math.sin(player.ang),cs=Math.cos(player.ang),px=-sn*FOV,py=cs*FOV;
// Cast both planes at half resolution and shade against the baked fixtures.
for(let y=0;y<H;y+=planeStride){
  const floor=y>=H/2, depth=Math.min(44,H*.315/(Math.abs(y-H/2)+.5));
  const stepX=depth*px*2*planeStride/W, stepY=depth*py*2*planeStride/W;
  let worldX=player.x+depth*(cs-px), worldY=player.y+depth*(sn-py);
  const distanceLight=clamp(1.12-depth*.058,.10,1);
  for(let x=0;x<W;x+=planeStride){
    const ix=Math.floor(worldX), iy=Math.floor(worldY);
    const area=renderRegions[iy]?.[ix]??'crypt';
    const layer=VeilLighting.surfaceColors[area][floor?0:1];
    const texel=((Math.floor(worldY*32)&31)*32+(Math.floor(worldX*32)&31))*3;
    const light=distanceLight*(.57+(bakedLight[iy]?.[ix]||0)*.58);
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
  const eyeOpen=kind==='wall'&&watcherWalls.has(mx+','+my)&&
    (area==='chapel'&&player.relic||area==='sanctuary'&&(watching||bellRung));
  const tex=eyeOpen?openedPixels[area]:wallPixels[area][kind];
  let texX=(wallX*64)|0;
  if(side===0&&rx>0||side===1&&ry<0)texX=63-texX;
  const fixture=bakedLight[my-(side===1?Math.sign(ry):0)]?.[mx-(side===0?Math.sign(rx):0)]||0;
  const fog=clamp(Math.round(4+wd*1.08+side*2-fixture*10),1,24)/28;
  const pulse=settings.quiet?.94:.9+Math.sin(tick*2.6+mx*.7+my*.45)*.1;
  const lamp=Math.max(0,fixture-.23)*.31*pulse;
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
 else {g.fillStyle='#8b8190';g.fillRect(24,22,27,43);g.fillStyle='#d3bba1';g.fillRect(29,29,16,3);g.fillRect(29,37,13,3);g.fillRect(29,45,16,3);}
 return c;}
for(const k of ['lever','cache','tablet','seal'])sprite[k]=markerSprite(k);
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
function worldSprite(x,y,type,scale=1,flash=0,frameImage=null){
  const dx=x-player.x,dy=y-player.y,cs=Math.cos(player.ang),sn=Math.sin(player.ang);
  const side=-sn*dx+cs*dy,forward=cs*dx+sn*dy;
  if(forward<=.18||forward>24)return;
  const center=W/2+side/forward*W/(2*FOV),height=H*scale/forward,width=height*.72;
  const left=center-width/2,right=center+width/2,top=H/2+H*.43/forward-height;
  const tex=frameImage||sprite[type];
  if(!tex||right<0||left>W||top+height<0||top>H)return;
  const minX=Math.max(0,Math.ceil(left)),maxX=Math.min(W,Math.floor(right));
  const sampling=tex.width/width;
  const glow=flash&&!settings.quiet&&!settings.low;
  if(glow)ctx.filter='brightness(1.35)';
  let run=minX;
  while(run<maxX){
    while(run<maxX&&forward>=zBuffer[run]-.08)run++;
    const from=run;
    while(run<maxX&&forward<zBuffer[run]-.08)run++;
    if(from<run)ctx.drawImage(tex,(from-left)*sampling,0,(run-from)*sampling,tex.height,from,top,run-from,height);
  }
  if(glow)ctx.filter='none';
}
const cryptWitness={x:3.05,y:16.2,type:'idol',scale:1.08};
function drawSprites(){let v=[...scenery,player.relic?{...cryptWitness,x:5.9,y:17.15}:cryptWitness];
if(bellRung)v.push({x:28.35,y:14.4,type:'bell',scale:.7});for(const t of traps){const phase=trapPhase(t);if(phase!=='idle')v.push({...t,type:phase==='warning'?'trapWarning':'trapActive',scale:.28});}for(let e of enemies)if(e.alive)v.push({x:e.x,y:e.y,type:e.type,scale:e.type==='boss'?1.83:1.12,flash:e.flash,enemy:e});for(let o of objects)if(o.active&&!((o.kind==='key'&&player.key)||(o.kind==='relic'&&player.relic)||(o.kind==='loot'&&crimsonTaken)))v.push({...o,type:o.kind,scale:o.kind==='exit'?1.35:.7});if(dropped)v.push({...dropped,type:'relic',scale:.5});v.sort((a,b)=>dist(player,b)-dist(player,a));for(let s of v){let wobble=s.enemy?Math.sin(tick*(s.enemy.type==='wraith'?5.3:2.4)+s.enemy.x)*.033:0;
  let bob=s.enemy?(s.enemy.windup>0?-.09:Math.sin(tick*5+s.enemy.y)*.016):s.type==='torch'?Math.sin(tick*7+s.x)*.03:0;
  const art=s.enemy?.phase===2?watcherAwake:enemyFrames[s.type];
  const frames=s.enemy?art?.[enemyPose(s.enemy)]:null;
  const chosen=frames?frames[Math.floor(tick*(s.enemy.windup>0?8:5)+s.enemy.originX)%frames.length]:null;
  worldSprite(s.x,s.y+bob,s.type,s.scale*(1+wobble),s.flash,chosen);
}}
function drawCombatParticles(){
 for(const p of bladeSparks){if(p.life<=0)continue;const dx=p.x-player.x,dy=p.y-player.y,forward=dx*Math.cos(player.ang)+dy*Math.sin(player.ang);if(forward<=.2)continue;
 const side=-dx*Math.sin(player.ang)+dy*Math.cos(player.ang),x=W/2+(side/forward)*W/(2*FOV),y=H/2-14/forward;
 if(x>=0&&x<W&&forward<zBuffer[Math.floor(x)]+.35){ctx.globalAlpha=clamp(p.life*2,0,.9);ctx.fillStyle=p.color;const size=clamp(9/forward,1,5);ctx.fillRect(x,y,size,size);}
 }ctx.globalAlpha=1;
}
function drawThreatIndicator(){
  const imminent=enemies.filter(e=>e.alive&&e.windup>0&&dist(player,e)<4&&los(player.x,player.y,e.x,e.y))
    .sort((a,b)=>dist(player,a)-dist(player,b))[0];
  if(!imminent)return;
  const strength=Math.min(1,imminent.windup*1.6),pulse=settings.quiet?.75:.64+.15*Math.sin(tick*14);
  const radial=['ring','chime'].includes(imminent.attackKind);
  ctx.strokeStyle=radial?`rgba(250,199,126,${pulse})`:`rgba(246,123,117,${pulse})`;
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.arc(W/2,H/2,(radial?19:12)+strength*5,radial?0:-PI*.78,radial?TAU:PI*.78);
  ctx.stroke();
  ctx.fillStyle='rgba(250,181,151,.8)';ctx.fillRect(W/2-1,H/2-20,2,5);
}
function swordPose(progress,heavy){
  const strike=clamp(progress/.52,0,1),recovery=clamp((progress-.52)/.48,0,1);
  const cut=strike*strike*(3-2*strike),reset=recovery*recovery*(3-2*recovery);
  const reach=heavy?136:101;
  return {x:-reach*cut+reach*.9*reset,y:10*cut+38*reset,
    rotation:-.18-(heavy?.82:.68)*cut+(heavy?1.04:.9)*reset};
}
function drawEffects(){let bob=settings.quiet?0:Math.sin(walkTime*11)*Math.min(3.8,player.step*10);
const progress=1-attackAnim/.46;
const pose=attackAnim>0?swordPose(progress,heavySwing):{x:0,y:0,rotation:-.18};
const slash=attackAnim>0?Math.sin(progress*PI)*(settings.quiet?.22:.47):0;
ctx.save();ctx.translate(W*.76+pose.x,H*.81+bob+pose.y);
ctx.rotate(pose.rotation);ctx.fillStyle='#14121e';ctx.beginPath();ctx.ellipse(30,75,80,61,0,0,TAU);ctx.fill();ctx.fillStyle='#4a3b4b';ctx.fillRect(8,15,28,55);ctx.fillStyle='#8c7180';ctx.fillRect(17,12,12,47);ctx.beginPath();ctx.moveTo(10,5);ctx.lineTo(10,-126);ctx.lineTo(18,-153);
ctx.lineTo(25,-126);ctx.lineTo(25,5);ctx.closePath();
const steel=ctx.createLinearGradient(10,0,25,0);
steel.addColorStop(0,'#e7d8ce');steel.addColorStop(.28,'#8d8495');
steel.addColorStop(.58,'#50485e');steel.addColorStop(1,'#bdb2b9');
ctx.fillStyle=steel;ctx.fill();
ctx.fillStyle='#a78992';ctx.fillRect(16,-126,2,115);
ctx.fillStyle='#6e515f';ctx.fillRect(1,1,33,7);
ctx.fillStyle='#c9a38a';ctx.fillRect(8,0,20,2);
ctx.fillStyle='#887180';ctx.fillRect(15,8,7,40);ctx.restore();if(slash>0){ctx.strokeStyle=`rgba(236,206,208,${slash})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(W*.53,H*.64,heavySwing?127:102,-2.83+progress*.9,-.65+progress*.65);ctx.stroke();}if(player.block){ctx.fillStyle='rgba(32,29,42,.9)';ctx.beginPath();ctx.moveTo(0,H*.47);ctx.lineTo(85,H*.38);ctx.lineTo(126,H*.71);ctx.lineTo(65,H);ctx.lineTo(0,H);ctx.fill();ctx.strokeStyle='#8a7785';ctx.lineWidth=6;ctx.stroke();}if(spellAnim>0){let r=28+(1-spellAnim/.65)*55;ctx.strokeStyle=`rgba(176,131,244,${spellAnim/.65*.7})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(W*.5,H*.5,r,0,TAU);ctx.stroke();}if(injury>0){ctx.fillStyle=`rgba(105,15,31,${injury*(settings.quiet?.075:.24)})`;ctx.fillRect(0,0,W,H);} }
const moteField=Array.from({length:65},(_,i)=>({x:rand(i,3)*W,y:rand(i,4)*H,s:.5+rand(i,6)*2.4,z:rand(i,8)}));
function drawAtmosphere(){
  // A subtle animated veil: dust and drifting sparks, rendered below the weapon.
  for(const p of settings.low||settings.quiet?[]:moteField){let x=(p.x+tick*(p.z*3+1.7))%W,y=(p.y+Math.sin(tick*.7+p.x)*4+tick*(p.z*1.1))%H;
    ctx.fillStyle=p.z>.8?'rgba(209,137,134,.31)':'rgba(161,175,196,.18)';ctx.fillRect(x|0,y|0,p.s,p.s);
  }
  const area=regionAt(player.x,player.y),tone=area==='nave'?'14,109,101':area==='catacomb'?'20,93,104':area==='chapel'?'96,49,123':area==='sanctuary'?'139,50,80':'69,62,90';
  const glow=ctx.createRadialGradient(W/2,H*.42,20,W/2,H*.42,W*.65);glow.addColorStop(0,'rgba(0,0,0,0)');glow.addColorStop(1,`rgba(${tone},.15)`);ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  const danger=clamp(1-player.hp/player.maxhp,0,.65);
  if(danger){ctx.fillStyle=`rgba(54,8,19,${danger*.10})`;ctx.fillRect(0,0,W,H);}
}
function render(){
  drawBase();
  ctx.save();
  if(!settings.quiet&&shake>.005)ctx.translate((Math.random()-.5)*shake*24,(Math.random()-.5)*shake*16);
  drawSprites();
  drawCombatParticles();
  drawAtmosphere();
  drawEffects();
  drawThreatIndicator();
  ctx.restore();
}
let mapCanvas=document.createElement('canvas');mapCanvas.width=240;mapCanvas.height=200;mapCanvas.setAttribute('aria-label','Plano de la cripta, la capilla, las catacumbas, la nave y el santuario');$('map').appendChild(mapCanvas);let mc=mapCanvas.getContext('2d');function drawMap(){mc.fillStyle='#0c0e16';mc.fillRect(0,0,240,200);let s=6.5,ox=18,oy=19;for(let y=0;y<25;y++)for(let x=0;x<30;x++){let v=grid[y][x];mc.fillStyle=v===0?'#33333f':v===3?'#a7855c':v===4?'#735274':'#10121c';mc.fillRect(ox+x*s,oy+y*s,s-.6,s-.6);}for(const t of traps){const active=trapPhase(t);mc.fillStyle=active==='active'?'#d36f6d':active==='warning'?'#d7ae78':'#796b68';mc.fillRect(ox+t.x*s-2,oy+t.y*s-2,4,4);}for(let e of enemies)if(e.alive){mc.fillStyle=e.type==='boss'?'#d8a2a0':'#ae6c83';mc.fillRect(ox+e.x*s-2,oy+e.y*s-2,4,4);}for(let o of objects)if(o.active){mc.fillStyle='#e5c78e';mc.fillRect(ox+o.x*s-1.5,oy+o.y*s-1.5,3,3);}mc.fillStyle='#efe6ca';mc.beginPath();mc.arc(ox+player.x*s,oy+player.y*s,3.8,0,TAU);mc.fill();mc.strokeStyle='#f7dbac';mc.beginPath();mc.moveTo(ox+player.x*s,oy+player.y*s);mc.lineTo(ox+(player.x+Math.cos(player.ang)*2)*s,oy+(player.y+Math.sin(player.ang)*2)*s);mc.stroke();}
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
  if(regionAt(x,y)==='nave')return zones[4];
  if(y<9&&x>12)return zones[3];
  if(x<12&&y<13)return zones[2];
  return x>14?zones[1]:zones[0];
}
function objectiveText(){if(player.won)return 'MAZMORRA COMPLETADA';if(!player.key)return 'OBJETIVO: ENCUENTRA LA LLAVE DE HUESO';if(!player.gate)return 'OBJETIVO: ABRE LA PUERTA DEL SANTUARIO';if(!bossDefeated)return `OBJETIVO: DERROTA AL VIGÍA · SELLOS ${sealsBroken.length}/2 (OPCIONALES)`;return 'OBJETIVO: ALCANZA EL SELLO DEL AMANECER · ECOS '+echoesCollected.length+'/3';}
function hud(){
  const nearest=enemies.filter(e=>e.alive&&dist(player,e)<5&&
    Math.abs(turnDelta(Math.atan2(e.y-player.y,e.x-player.x)-player.ang))<.62&&los(player.x,player.y,e.x,e.y))
    .sort((a,b)=>dist(player,a)-dist(player,b))[0];$('target').hidden=!nearest;if(nearest){$('targetname').textContent=creatureNames[nearest.type];$('targetbar').style.width=100*nearest.hp/nearest.maxhp+'%';}$('hpbar').style.width=100*player.hp/player.maxhp+'%';$('stbar').style.width=player.st+'%';$('mpbar').style.width=player.mp/60*100+'%';$('ashes').textContent=player.ashes;$('flasks').textContent=player.flasks;$('spellcount').textContent=Math.floor(player.mp/25);$('location').textContent=getZone();$('objective').textContent=objectiveText();let b=enemies.find(e=>e.type==='boss');$('bossbar').hidden=!(b.alive&&b.alert&&getZone()===zones[3]);$('bossfill').style.width=100*b.hp/b.maxhp+'%';let o=nearObject();$('interact').hidden=!o;$('interact').textContent=o?`[ E ]  ${o.label.toUpperCase()}`:'';if(toastUntil<tick)$('toast').style.opacity='0';if(mapOn)drawMap();}
let stepBeat=0,nextDrip=6;
function update(dt){tick+=dt;player.attackCd=Math.max(0,player.attackCd-dt);player.spellCd=Math.max(0,player.spellCd-dt);player.hurt=Math.max(0,player.hurt-dt);player.roll=Math.max(0,player.roll-dt);attackAnim=Math.max(0,attackAnim-dt);spellAnim=Math.max(0,spellAnim-dt);injury=Math.max(0,injury-dt*2);shake=Math.max(0,shake-dt*.7);let fx=Math.cos(player.ang),fy=Math.sin(player.ang),sx=-fy,sy=fx;let [forward,strafe]=moveInput(),mag=Math.hypot(forward,strafe);player.block=!!keys.MouseRight||padBlock;if(keys.ArrowLeft)player.ang-=dt*1.75;if(keys.ArrowRight)player.ang+=dt*1.75;player.ang=turnDelta(player.ang);let sprint=(keys.ShiftLeft||keys.ShiftRight||padSprint)&&player.st>3&&mag>0&&!player.block,spd=player.roll>0?5.7:sprint?3.8:player.block?1.05:2.4;if(player.roll>0){forward=player.rollDir?.[0]??forward;strafe=player.rollDir?.[1]??strafe;mag=Math.hypot(forward,strafe);}if(mag>0){let dx=(fx*forward+sx*strafe)/Math.max(1,mag)*spd*dt,dy=(fy*forward+sy*strafe)/Math.max(1,mag)*spd*dt;const ox=player.x,oy=player.y;
move(player,dx,dy);
stepBeat+=Math.hypot(player.x-ox,player.y-oy);
if(stepBeat>(sprint?.94:.81)){
  VeilAudio.cue(regionAt(player.x,player.y)==='nave'?'wetStep':'step');stepBeat=0;
}
walkTime+=dt*(sprint?1.7:1);player.step=Math.min(1,player.step+dt*6);}else player.step=Math.max(0,player.step-dt*6);if(sprint)player.st=Math.max(0,player.st-19*dt);else if(!player.block&&player.attackCd<.38)player.st=Math.min(100,player.st+24*dt);player.mp=Math.min(60,player.mp+3*dt);for(const p of bladeSparks){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.max(.1,1-dt*4);p.vy*=Math.max(.1,1-dt*4);}
 bladeSparks=bladeSparks.filter(p=>p.life>0);
 updateTraps(dt);
 if(!paused)enemyLogic(dt);
 if(!paused)discoverZone();
 const area=regionAt(player.x,player.y);
 if(tick>=nextDrip){
   if(area==='catacomb'||area==='nave')VeilAudio.cue('drip');
   nextDrip=tick+5+rand(Math.floor(tick),player.x)*5;
 }
 hud();
}
let nextDraw=0, needsDraw=true;
function frame(time){
  const dt=clamp((time-last)/1000||.016,0,.05);
  last=time;
  pollPad(dt);
  if(playing&&!paused)update(dt);
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
  if(padActive||document.pointerLockElement===screen)return;
  try{screen.requestPointerLock?.()?.catch(()=>{});}catch{}
}
function showDeath(){
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
  $('ending').classList.remove('hidden');document.exitPointerLock?.();$('again').focus();
}
function begin(){VeilAudio.begin();if(!playing){playing=true;paused=false;if(player.won){$('menu').classList.add('hidden');showEnding();return;}$('menu').classList.add('hidden');note('ENCUENTRA LA LLAVE DE HUESO. DESPIERTA AL VIGÍA.',5);}else{paused=false;$('menu').classList.add('hidden');}needsDraw=true;lockPointer();}
function togglePause(){if(!playing||player.won||!$('death').classList.contains('hidden'))return;if(!$('inventory').classList.contains('hidden')){$('inventory').classList.add('hidden');paused=false;lockPointer();return;}paused=!paused;if(paused){save();$('save-game').hidden=false;$('save-status').textContent='';$('menu').classList.add('is-paused');$('menu').classList.remove('hidden');$('play').textContent='REGRESAR A LA OSCURIDAD';document.exitPointerLock?.();$('play').focus();}else{$('menu').classList.add('hidden');lockPointer();}}
function toggleInventory(){if(!playing||player.won||!$('death').classList.contains('hidden')||(!$('menu').classList.contains('hidden')))return;let inv=$('inventory');if(inv.classList.contains('hidden')){inv.classList.remove('hidden');paused=true;document.exitPointerLock?.();$('items').innerHTML=[`<div class="item"><b>ESPADA DE CENIZA</b><small>Hoja oxidada, todavía capaz de abrir carne y piedra.</small></div>`,`<div class="item"><b>LLAVE DE HUESO</b><small>${player.key?'Una llave recuperada de la cripta.':'Aún no encontrada.'}</small></div>`,`<div class="item"><b>CORAZÓN DEL VACÍO</b><small>${player.relic?'El pulso de lo imposible recorre tus venas.':'Se oculta tras un muro quebradizo.'}</small></div>`,`<div class="item"><b>ECOS DEL VELO (${echoesCollected.length}/3)</b><small>Busca las tres memorias perdidas entre la cripta, las catacumbas y la capilla. Reunirlas refuerza permanentemente tus frascos.</small></div>`,`<div class="item"><b>RITOS DEL VIGÍA (${sealsBroken.length}/2)</b><small>Dos sellos opcionales: Sepultura, en la cripta; Herejía, tras el pasadizo de la capilla. Cada uno reduce el daño del Vigía un 15 % y concede 60 cenizas. No son necesarios para completar el juego.</small></div>`,`<div class="item"><b>REGIONES EXPLORADAS (${zonesVisited.length}/${zones.length})</b><small>${zonesVisited.join(' · ')||'Aún no hay registros.'}</small></div>`,`<div class="item"><b>OSARIO</b><small>${leverUsed?'La palanca ha revelado un escondite.':'Un mecanismo olvidado espera en las catacumbas.'} ${cacheOpened?'Recompensa recogida.':''}</small></div>`,`<div class="item"><b>NIVEL ${player.lv} · ${player.ashes} CENIZAS</b><small>Vida máxima: ${player.maxhp} · Frascos: ${player.maxflasks}</small></div>`,`<div class="item"><b>INSCRIPCIONES</b><small>${[
  tabletsRead.includes('tablet')?'Los muertos no temen a la noche. Temen a la campana.':'',
  tabletsRead.includes('tablet2')?'El Vigía selló la puerta desde el otro lado.':'',
].filter(Boolean).join(' · ')||'Aún no has descifrado ninguna.'}</small></div>`,`<div class="item"><b>CAMPANA SUMERGIDA</b><small>${bellRung?'La campana ha vuelto a sonar.':'Busca una nave inundada al este de las catacumbas.'}</small></div>`].join('');$('inventory-close').focus();}else{inv.classList.add('hidden');paused=false;lockPointer();}}
$('play').addEventListener('click',begin);$('again').addEventListener('click',restart);screen.addEventListener('click',()=>{VeilAudio.begin();if(!playing||paused)return;if(document.pointerLockElement!==screen)lockPointer();attack();});screen.addEventListener('contextmenu',e=>e.preventDefault());screen.addEventListener('mousedown',e=>{if(e.button===2)keys.MouseRight=true;});window.addEventListener('mouseup',e=>{if(e.button===2)keys.MouseRight=false;});document.addEventListener('mousemove',e=>{if(document.pointerLockElement===screen&&playing&&!paused)player.ang+=e.movementX*.0029;});
window.addEventListener('keydown',e=>{if(playing&&!player.won&&['Space','Tab','ArrowLeft','ArrowRight'].includes(e.code)&&(!paused||!$('inventory').classList.contains('hidden')))e.preventDefault();if(e.repeat)return;keys[e.code]=true;if(!playing&&e.code!=='Enter')return;if(e.code==='Escape'){if(!$('inventory').classList.contains('hidden'))toggleInventory();else togglePause();return;}if(e.code==='Tab'&&playing&&$('menu').classList.contains('hidden')&&!player.won){toggleInventory();return;}if(!playing||paused){if(e.code==='Enter'&&!playing&&!['BUTTON','INPUT','SUMMARY'].includes(e.target.tagName))begin();return;}if(e.code==='Space')dodge();if(e.code==='KeyE')interact();if(e.code==='KeyF')heal();if(e.code==='KeyL')levelUp();if(e.code==='KeyQ')spell();if(e.code==='KeyJ')attack(true);if(e.code==='KeyH')attack();if(e.code==='KeyM')toggleMap();if(e.code==='KeyR'&&nearObject()?.kind==='altar')interact();if(e.code==='KeyK')manualSave();if(e.code==='KeyU')toggleMute();});window.addEventListener('keyup',e=>{keys[e.code]=false;});window.addEventListener('blur',()=>{for(let k of Object.keys(keys))keys[k]=false;});document.addEventListener('pointerlockchange',()=>{
  if(!document.pointerLockElement)keys.MouseRight=false;
});
function moveInput(){
  return [(keys.KeyW?1:0)-(keys.KeyS?1:0)-padY,(keys.KeyD?1:0)-(keys.KeyA?1:0)+padX];
}
function dodge(){
  if(!playing||paused||player.roll>0||player.st<27)return;
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
      [5,spell],[7,attack],[12,toggleMap],[13,levelUp]]){
      if(edge(button))action();
    }
  }
  padButtons=pressed;
}

function safeSavePresent(){return saveReady;}
if(saveWarning)$('save-status').textContent=saveWarning;
if(saveReady)$('play').textContent=player.won?'VER EL DESENLACE':'CONTINUAR EL DESCENSO';
// Read-only diagnostics for reproducible browser tests; no game-state mutation hooks.
window.__ashenDiagnostics=()=>({version:'3.1.1',playing,paused,objective:objectiveText(),bossDefeated,won:player.won,position:[+player.x.toFixed(2),+player.y.toFixed(2)],heading:player.ang,ending:player.won?(restoredEnding()?'restored':'first-light'):null, bellRung,shortcutOpen, hp:player.hp,stamina:+player.st.toFixed(1),mana:+player.mp.toFixed(1),zone:getZone(),enemiesAlive:enemies.filter(e=>e.alive).length,key:player.key,relic:player.relic,gate:player.gate,secret:player.secret,renderSize:[W,H],sceneryCount:scenery.length,echoes:echoesCollected.length,echoReward,sealsBroken:sealsBroken.length,sealsRemaining:objects.filter(o=>o.kind==='seal'&&o.active).length,zonesVisited:zonesVisited.length,echoLocations:objects.filter(o=>o.kind==='echo'&&o.active).length,textureCount:Object.values(textures).reduce((n,v)=>n+Object.keys(v).length,0)+Object.keys(awakeWall).length,region:regionAt(player.x,player.y),themedProps:scenery.filter(o=>['coffin','bonepile','fungus','roots','stainedglass','brazier'].includes(o.type)).length,animationFrames:[...Object.values(enemyFrames),watcherAwake].reduce((n,v)=>n+Object.values(v).reduce((m,a)=>m+a.length,0),0),enemyWindups:enemies.filter(e=>e.windup>0).length,enemyAttackPatterns:enemies.filter(e=>e.alive).map(e=>({id:e.id,kind:e.attackKind,attacks:e.attacksMade})),activeParticles:bladeSparks.filter(p=>p.life>0).length,trapCount:traps.length,activeTraps:traps.filter(t=>trapPhase(t)==='active').length,leverUsed,cacheOpened,tabletsRead:tabletsRead.length,artStyle:'retro-raycast-pixel',mapVisible:mapOn,savePresent:safeSavePresent()});
})();
