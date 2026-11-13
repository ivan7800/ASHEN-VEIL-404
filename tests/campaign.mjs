import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const scripts = ['art', 'lighting', 'audio', 'expedition', 'game'].map(name => read('src/' + name + '.js'));
const standalone=read('JUGAR-SIN-INSTALAR.html');
const inline=[...standalone.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match=>match[1]);
assert.deepEqual(inline,scripts,'Regenerate the standalone build after changing source');
assert(!/<script\s+src|<link[^>]+rel="stylesheet"/.test(standalone));
const saveKey = 'ashen-veil-rebirth-v2';
const stub = new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
const mockCanvas = () => ({ getContext: () => ({
  ...Object.fromEntries(['drawImage','fillRect','strokeRect','save','restore','translate','rotate',
    'beginPath','closePath','moveTo','lineTo','ellipse','arc','stroke','fill','putImageData',
    'clearRect','bezierCurveTo','quadraticCurveTo','scale','setTransform'].map(method => [method, stub[method]])),
  createRadialGradient: stub.gradient, createLinearGradient: stub.gradient,
  getImageData: (x,y,w,h) => ({data: new Uint8ClampedArray(w*h*4)}),
  createImageData: (w,h) => ({data: new Uint8ClampedArray(w*h*4)}),
}) });

function game(storage = new Map(), canvasFactory = mockCanvas, isolated = false) {
  const nodes = new Map(), events = new Map();
  const add = (name, handler) => events.set(name, [...(events.get(name)||[]), handler]);
  const emit = (name, event = {}) => {
    for (const handler of events.get(name)||[]) handler(event);
  };
  const make = id => {
    const classes = new Set(['inventory','ending','death'].includes(id)?['hidden']:[]);
    return Object.assign(canvasFactory(), {
      classList: { contains: x=>classes.has(x), add: x=>classes.add(x), remove: x=>classes.delete(x) },
      style:{}, hidden:false, textContent:'', addEventListener:(name,fn)=>add(id+':'+name,fn),
      appendChild(){}, setAttribute(){}, focus(){},
      requestPointerLock(){ context.document.pointerLockElement=this; },
    });
  };
  const node = id => {
    if(!nodes.has(id)) nodes.set(id,make(id));
    return nodes.get(id);
  };
  let frame, elapsed=0, pad;
  const isolatedHook=isolated?`
    window.probe={player,enemies,objects,los,canMove,attack,spell,trapPhase,startEnemyAttack,
      resolvesEnemyAttack,damagePlayer,interact,settings,swordPose,
      setTick:value=>{tick=value},stats:()=>({dropped,saveBlocked})};
  `:'';
  const context = vm.createContext({
    console, document: {getElementById:node, createElement:()=>make('canvas'),
      addEventListener:add, exitPointerLock(){this.pointerLockElement=null;}},
    navigator:{getGamepads:()=>[pad]}, localStorage:{
      getItem:key=>storage.get(key)??null, setItem:(key,value)=>storage.set(key,value),
      removeItem:key=>storage.delete(key),
    }, requestAnimationFrame:callback=>{frame=callback;},
    addEventListener:add,
  });
  context.window=context;
  for (const source of scripts.slice(0, -1)) vm.runInContext(source,context);
  // The harness reads private encounter data to steer its player. It never sets game state.
  vm.runInContext(scripts.at(-1).replace('window.__ashenDiagnostics=',
    isolatedHook+'window.observe=()=>({enemies:enemies.map(({id,x,y,hp,alive})=>({id,x,y,hp,alive})),render,grid,objects});window.__ashenDiagnostics=')
    .replace('    render();',''),context);
  const step=(seconds=.02)=>{
    for(let i=0;i<Math.max(1,Math.round(seconds/.02));i++){elapsed+=20;frame(elapsed);}
  };
  const key=(code, down)=>emit(down?'keydown':'keyup',{code,target:{tagName:'BODY'},preventDefault(){}});
  const tap=code=>{key(code,true);key(code,false);step();};
  const state=context.__ashenDiagnostics;
  const aim=(x,y)=>{
    const {position:[px,py],heading}=state();
    const delta=Math.atan2(y-py,x-px)-heading;
    emit('mousemove',{movementX:Math.atan2(Math.sin(delta),Math.cos(delta))/.0029});
  };
  const walk=(x,y)=>{
    for(let i=0;i<280;i++){
      const [px,py]=state().position;
      if(Math.hypot(x-px,y-py)<.11)return;
      aim(x,y);key('KeyW',true);step(.02);key('KeyW',false);
    }
    assert.fail('Bloqueado al caminar hacia '+[x,y]+' desde '+state().position);
  };
  // Discover a walkable route using the current map and normal movement events.
  const navigate=(x,y)=>{
    const grid=context.observe().grid;
    const [px,py]=state().position;
    const start=[Math.floor(px),Math.floor(py)],goal=[Math.floor(x),Math.floor(y)];
    const id=([x,y])=>x+','+y;
    const previous=new Map([[id(start),null]]), queue=[start];
    for(let i=0;i<queue.length&&!previous.has(id(goal));i++){
      const [cx,cy]=queue[i];
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const next=[cx+dx,cy+dy];
        if(grid[next[1]]?.[next[0]]!==0||previous.has(id(next)))continue;
        previous.set(id(next),queue[i]);queue.push(next);
      }
    }
    assert(previous.has(id(goal)),'Destino inaccesible: '+goal);
    const path=[];
    for(let at=goal;id(at)!==id(start);at=previous.get(id(at)))path.push(at);
    for(const [cx,cy] of path.reverse())walk(cx+.5,cy+.5);
    walk(x,y);
  };
  const use=id=>{
    const object=context.observe().objects.find(object=>object.id===id);
    assert(object,'Falta el objeto '+id);
    navigate(object.x,object.y);
    tap('KeyE');
  };
  const interact=(x,y)=>{walk(x,y);tap('KeyE');};
  const enemies=()=>context.observe().enemies;
  const fight=(id,approach)=>{
    if(approach)walk(...approach);
    for(let i=0;i<30;i++){
      const enemy=enemies().find(entry=>entry.id===id);
      if(!enemy.alive)return;
      aim(enemy.x,enemy.y);
      tap('KeyQ');tap('KeyJ');tap('KeyH');tap('KeyF');
      step(1.14);
    }
    assert.fail('Enemigo pendiente: '+JSON.stringify(enemies().find(entry=>entry.id===id))+' '+JSON.stringify(state()));
  };
  const start=()=>{emit('play:click');step();};
  const draw=()=>{context.observe().render();return node('screen');};
  return {elapsed:()=>elapsed/1000,start,step,key,tap,walk,navigate,use,interact,fight,state,storage,node,draw,emit,aim,probe:context.probe,setPad:value=>{pad=value;}};
}

function annex(g,id,actions,capture){
  g.use(id+'In');
  if(id==='sky'){g.use('skyLens');assert(!g.state().discoveries.includes('skyLens'));}
  for(const action of actions)g.use(action);
  assert(g.state().discoveries.includes(actions.at(-1)));
  const aimPoints={salt:[46.1,14.4],archive:[58.5,9.5],garden:[39.45,27.7],soundings:[68.25,27.6],sky:[42.3,53.45]};
  g.aim(...aimPoints[id]);
  capture(g,id);
  g.tap('KeyM');
  assert(g.state().mapVisible);
  g.tap('KeyM');
  g.use(id+'Out');
}

function route(restored, capture=()=>{}, makeGame=game, expanded=false) {
  let g=makeGame();g.start();
  let beforeReload=0;
  capture(g,'cripta');
  g.interact(4.8,17.3);
  if(expanded)annex(g,'salt',['saltMason','saltEye','saltLow','saltCrane','saltPrint'],capture);
  if(restored){
    g.interact(3.3,21.4);
    g.interact(7.4,20.4);
    g.interact(6.5,14.5);
    g.walk(6.5,10.5);
    g.fight('w5',[7.1,10]);
    g.fight('ambush2',[8.4,9.4]);
    g.interact(5.2,8.8);
    g.interact(8,8.4);
    g.aim(12,8.35);capture(g,'capilla');
    if(expanded){
      annex(g,'garden',['gardenKeeper','gardenWhite','gardenHollow','gardenChair','gardenFruit'],capture);
      g.navigate(8,8.4);
    }
    g.interact(9,7.7);
    g.interact(10.5,12.5);
    assert(g.state().shortcutOpen);
    g.walk(10.5,14.5);
    g.walk(9.5,15.5);g.walk(8.5,16.5);
    g.walk(8.5,17.5);
  }
  if(restored){
    g.walk(10.3,18.4);
    const penitent=g.state().enemyAttackPatterns.find(entry=>entry.id==='w1');
    assert(penitent);
    g.aim(11.7,17.7);capture(g,'penitente');
  }
  g.fight('w1',[9.6,17.6]);
  g.walk(15.6,17.6);
  g.fight('w2',[16.2,17.6]);
  if(restored){g.aim(21.5,19.6);capture(g,'catacumbas');}
  g.fight('w3',[21.6,16.7]);
  g.interact(23,18);
  assert(g.state().key);
  if(restored){
    g.fight('ambush1',[21.2,19.7]);
    g.interact(22.6,21);
    if(expanded){
      annex(g,'archive',['archiveClerk','archiveName','archiveBody','archiveKeep','archiveSeal'],capture);
      assert.equal(g.state().archiveChoice,'archiveKeep');
      g.navigate(22.6,21);
    }
    assert.equal(g.state().echoes,3);
    g.interact(17.4,19.3);
    assert.equal(JSON.parse(g.storage.get(saveKey)).maxflasks,5);
    g.walk(25.5,17.5);
    g.walk(27.5,17.5);
    g.aim(27.9,16.1);capture(g,'nave');
    g.fight('bellKeeper',[27.7,17.3]);
    g.interact(28.35,14.4);
    assert(g.state().bellRung);
    if(expanded)annex(g,'soundings',['soundingsGauge','soundingsIntake','soundingsBell','soundingsWeight','soundingsChart'],capture);
    g.walk(27.5,17.5);g.walk(25.5,17.5);
  }
  g.walk(19.5,14);
  g.fight('w4',[19.5,13.1]);
  g.interact(19.5,11.5);
  assert(g.state().gate);
  g.interact(19.5,9.5);
  for(let i=0;i<3;i++)g.tap('KeyL');
  g.tap('KeyK');
  beforeReload=g.elapsed();
  g=makeGame(g.storage);g.start();
  assert(g.state().gate&&g.state().key);
  if(restored)assert(g.state().bellRung&&g.state().shortcutOpen);
  if(restored){g.walk(19.5,7.45);g.aim(19.5,5.3);capture(g,'santuario');}
  g.fight('boss',[19.5,7.45]);
  assert(g.state().bossDefeated);
  if(expanded){
    annex(g,'sky',['skyWatcher','skyDark','skyDark','skyLight','skyStar','skyLens'],capture);
    g.navigate(19.5,3.2);
  }
  g.interact(19.5,3.2);
  assert.equal(g.state().ending,restored?'restored':'first-light');
  const reload=makeGame(g.storage);reload.start();
  assert.equal(reload.state().ending,g.state().ending);
  assert.equal(reload.node('ending-title').textContent,g.node('ending-title').textContent);
  if(expanded){
    assert.equal(reload.state().discoveries.length,25);
    assert.equal(reload.state().archiveChoice,'archiveKeep');
    assert.match(reload.node('ending-story').textContent,/estrella sigue clavada/);
    assert.equal(reload.state().mirrorPositions.skyDark,2);
    assert.equal(reload.state().mirrorPositions.skyLight,1);
    console.log('Campaña ampliada: 25 hallazgos, cinco ramales, regreso y restauración del guardado');
  }
  console.log('Tiempo simulado de la ruta '+g.state().ending+': '+(beforeReload+g.elapsed()).toFixed(1)+' s');
  return g.state().ending;
}

console.log('Recorridos completos por teclado y ratón:',route(false),route(true,undefined,game,true));
const legacy=new Map([[saveKey,JSON.stringify({version:2,x:5.4,y:19,lv:5,hp:130,maxflasks:4,echoReward:true})]]);
const migrated=game(legacy);migrated.start();
assert.equal(migrated.state().hp,130);
migrated.tap('Escape');assert(migrated.state().paused);
migrated.emit('save-game:click');assert.equal(migrated.node('save-status').textContent,'Partida guardada.');
migrated.emit('play:click');migrated.tap('Tab');assert(migrated.state().paused);
migrated.emit('inventory-close:click');assert(!migrated.state().paused);

const pad=game(),buttons=Array.from({length:17},()=>({pressed:false}));
pad.setPad({mapping:'standard',axes:[0,0,0,0],buttons});
buttons[0].pressed=true;pad.step();buttons[0].pressed=false;pad.step();
assert(pad.state().playing);
const before=pad.state();
pad.setPad({mapping:'standard',axes:[0,-.8,.6,0],buttons});pad.step(.4);
assert.notDeepEqual(pad.state().position,before.position);
assert.notEqual(pad.state().heading,before.heading);
buttons[9].pressed=true;pad.step();assert(pad.state().paused);
console.log('Guardado v2, pausa, inventario y entrada Gamepad estándar: OK');

const brokenStorage=new Map([[saveKey,'{progreso']]);
const broken=game(brokenStorage);broken.start();broken.tap('KeyK');
assert.equal(brokenStorage.get(saveKey),'{progreso');
assert.match(broken.node('toast').textContent,/conserva el archivo anterior/);
const blockedPosition=JSON.stringify({version:2,x:0,y:0,checkpoint:[5.4,19],key:true,relic:true,
  dropped:{x:5.4,y:19,amount:'999'},sealsBroken:['seal1','bad','seal1'],zonesVisited:['NAVE INUNDADA']});
const recovery=game(new Map([[saveKey,blockedPosition]]));
assert.deepEqual(Array.from(recovery.state().position),[5.4,19]);
assert.equal(recovery.storage.get(saveKey+'-backup'),blockedPosition);
assert(recovery.state().key&&recovery.state().relic);
assert.equal(recovery.state().sealsBroken,1);
assert.equal(recovery.state().zonesVisited,1);
recovery.start();recovery.tap('KeyE');
assert.equal(JSON.parse(recovery.storage.get(saveKey)).dropped,null);
console.log('Guardados parciales, inválidos y recuperación con copia: OK');

const check=game(new Map(),mockCanvas,true);
check.start();
const {player:p,enemies,los,canMove,attack,spell,trapPhase,startEnemyAttack,resolvesEnemyAttack,
  damagePlayer,interact,settings,setTick,stats,swordPose}=check.probe;
for(const heavy of [false,true]){
  const approach=[0,.2,.4,.52].map(progress=>swordPose(progress,heavy));
  assert(approach[0].x>approach[1].x&&approach[1].x>approach[2].x&&approach[2].x>approach[3].x,
    `El tajo ${heavy?'fuerte':'ligero'} debe avanzar en un solo sentido`);
  const recovery=[.52,.7,.9,1].map(progress=>swordPose(progress,heavy));
  assert(recovery[0].y<recovery[1].y&&recovery[1].y<recovery[2].y&&recovery[2].y<recovery[3].y,
    `La recuperación ${heavy?'fuerte':'ligera'} debe seguir otro arco`);
  assert(recovery[3].x>recovery[0].x&&recovery[3].rotation>recovery[0].rotation);
}
console.log('Trayectoria del tajo ligero y fuerte, con recuperación independiente: OK');
const place=(x,y,ang=0)=>Object.assign(p,{x,y,ang,st:100,mp:60,attackCd:0,spellCd:0,hurt:0,roll:0,block:false,hp:100});
assert(!canMove(19.5,10.5));
assert(!los(19.5,9.7,19.5,11.3));
assert(!los(19.8,9.8,20.2,10.2));
assert(los(19.5,13,19.5,11.3));
const e=enemies.find(e=>e.id==='w1'),boss=enemies.find(e=>e.id==='boss');
const drowned=enemies.find(e=>e.id==='bellKeeper');
Object.assign(e,{x:19.5,y:11.3});
place(19.5,9.7,Math.PI/2);const opaqueHp=e.hp;attack(true);spell();
assert.equal(e.hp,opaqueHp);
Object.assign(e,{x:19.5,y:12.5});place(19.5,11.3,Math.PI/2);
attack(true);assert.equal(p.st,62);assert(e.hp<opaqueHp);assert(e.stun>=.6);
startEnemyAttack(e,0,-1);assert.equal(e.attackKind,'slash');
startEnemyAttack(e,0,-1);assert.equal(e.attackKind,'neck');
place(19.5,11.3,Math.PI/2);p.block=true;
assert(resolvesEnemyAttack(e));assert.equal(p.hp,97);assert.equal(p.st,85);
place(19.5,11.3,-Math.PI/2);p.block=true;
assert(resolvesEnemyAttack(e));assert.equal(p.hp,88);assert.equal(p.st,100);
place(19.5,11.3,Math.PI/2);p.roll=.25;
assert(resolvesEnemyAttack(e));assert.equal(p.hp,100);
startEnemyAttack(drowned,0,1);assert.equal(drowned.attackKind,'chime');
startEnemyAttack(drowned,0,1);assert.equal(drowned.attackKind,'lunge');
const awaken=game(new Map(),mockCanvas,true);awaken.start();
Object.assign(awaken.probe.player,{x:9.7,y:17.65});awaken.step();
const approaching=awaken.probe.enemies.find(enemy=>enemy.id==='w1');
assert(approaching.waking>0&&!approaching.alert);
assert.match(awaken.node('encounter-warning').textContent,/levanta/);
const startX=approaching.x;
awaken.step(.3);
assert.equal(approaching.x,startX);
assert.equal(approaching.windup,0);
awaken.step(1.4);
assert(approaching.alert);
approaching.alive=false;
const anchor=awaken.probe.enemies.find(enemy=>enemy.id==='w2');
anchor.hp=27;
awaken.navigate(4.8,17.2);awaken.tap('KeyE');
assert(!approaching.alive&&anchor.hp===27,'El altar conserva bajas y daño de enemigos vivos');
console.log('Aviso previo, periodo de despertar y descanso sin reaparición: OK');

const archive=game(new Map(),mockCanvas,true);
archive.start();
Object.assign(archive.probe.player,{x:24.6,y:12.55});archive.tap('KeyE');
archive.use('archiveErase');
assert.equal(archive.state().archiveChoice,null);
archive.use('archiveName');archive.use('archiveBody');archive.use('archiveErase');
assert.equal(archive.state().archiveChoice,'archiveErase');
archive.use('archiveKeep');
assert.equal(archive.state().archiveChoice,'archiveErase');
assert(!archive.state().discoveries.includes('archiveKeep'));
const archiveReload=game(archive.storage);archiveReload.start();
assert.equal(archiveReload.state().archiveChoice,'archiveErase');
assert.equal(archiveReload.state().zone,'ARCHIVO DE LOS AUSENTES');
archiveReload.use('archiveOut');
assert.equal(archiveReload.state().zone,'CATACUMBAS DE LOS OLVIDADOS');
console.log('Decisión del archivo, bloqueo previo y guardado dentro del ramal: OK');

boss.phase=2;
for(const kind of ['cleave','lunge','ring']){
  startEnemyAttack(boss,0,1);assert.equal(boss.attackKind,kind);
}
place(19.5,6.4);
assert(!resolvesEnemyAttack(boss));assert.equal(p.hp,100);
place(19.5,7.4);
assert(resolvesEnemyAttack(boss));assert(p.hp<100);
const trap={period:3.6,offset:0,activeTime:.9};
setTick(2.5);assert.equal(trapPhase(trap),'idle');
setTick(3.2);assert.equal(trapPhase(trap),'warning');
setTick(3.7);assert.equal(trapPhase(trap),'active');
place(24.3,20.3);interact();
place(16.3,13.5);interact();const cash=p.ashes;interact();
assert.equal(p.ashes,cash);assert.equal(cash,160);
place(5.4,21.1);interact();
check.tap('Tab');assert.match(check.node('items').innerHTML,/Temen a la campana/);
check.emit('inventory-close:click');
place(8.5,18.5);p.ashes=65;damagePlayer(1000);
assert(check.state().paused);assert.equal(stats().dropped.amount,65);
check.emit('respawn:click');assert(!check.state().paused);
place(8.5,18.5);interact();assert.equal(p.ashes,65);assert.equal(stats().dropped,null);
check.emit('quiet-effects:change',{target:{checked:true}});
check.emit('economy:change',{target:{checked:true}});
check.emit('volume:input',{target:{value:'35'}});
assert(settings.quiet&&settings.low&&settings.volume===35);
assert.equal(JSON.parse(check.storage.get('ashen-veil-remaster-options')).volume,35);
console.log('Colisiones, ataques, IA, trampas, osario, diario, muerte y ajustes: OK');

if(process.env.ASHEN_CAPTURE){
  const require=createRequire(import.meta.url);
  const {createCanvas}=require(join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'));
  const directory=process.env.ASHEN_CAPTURE;
  mkdirSync(directory,{recursive:true});
  const makeGame=(storage=new Map(),isolated=false)=>game(storage,()=>createCanvas(480,270),isolated);
  const capture=(g,name)=>writeFileSync(join(directory,name+'.png'),g.draw().toBuffer('image/png'));
  route(true,capture,makeGame,true);
  const approach=makeGame(new Map(),true);
  approach.start();
  Object.assign(approach.probe.player,{x:9.7,y:17.65});
  approach.aim(11.7,17.7);
  capture(approach,'penitente-reposo');
  approach.step(.2);capture(approach,'penitente-aviso');
  approach.step(1.35);capture(approach,'penitente-despierto');
  const view=makeGame(new Map(),true);
  view.start();
  for(const low of [false,true]){
    view.probe.settings.low=low;
    for(let i=0;i<16;i++)view.draw();
    const times=[];
    for(let i=0;i<120;i++){
      view.aim(5.3+Math.sin(i*.14)*5,16+Math.cos(i*.14)*3);
      const start=performance.now();view.draw();times.push(performance.now()-start);
    }
    times.sort((a,b)=>a-b);
    console.log(`Canvas nativo (${low?'ligero':'normal'}, 120 imágenes) mediana ${times[60].toFixed(2)} ms, p95 ${times[113].toFixed(2)} ms`);
  }
  console.log('Capturas del Canvas nativo durante el recorrido completo: '+directory);
}

if(process.env.ASHEN_SWING_CAPTURE){
  const require=createRequire(import.meta.url);
  const {createCanvas}=require(join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'));
  const directory=process.env.ASHEN_SWING_CAPTURE;
  mkdirSync(directory,{recursive:true});
  for(const [name,key] of [['ligero','KeyH'],['fuerte','KeyJ']]){
    const view=game(new Map(),()=>createCanvas(480,270));
    view.start();
    view.key(key,true);
    for(let frame=0;frame<=12;frame++){
      if(frame)view.step(.035);
      writeFileSync(join(directory,`${name}-${String(frame).padStart(2,'0')}.png`),view.draw().toBuffer('image/png'));
    }
    view.key(key,false);
  }
  console.log('Light and heavy sword swing frames captured.');
}
