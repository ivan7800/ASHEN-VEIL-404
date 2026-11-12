import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const scripts = [read('src/lighting.js'), read('src/game.js')];
const saveKey = 'ashen-veil-rebirth-v2';
const stub = new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
const mockCanvas = () => ({ getContext: () => ({
  ...Object.fromEntries(['drawImage','fillRect','strokeRect','save','restore','translate','rotate',
    'beginPath','closePath','moveTo','lineTo','ellipse','arc','stroke','fill','putImageData',
    'clearRect','bezierCurveTo','quadraticCurveTo','scale','setTransform'].map(method => [method, stub[method]])),
  createRadialGradient: stub.gradient, createLinearGradient: stub.gradient,
  createImageData: (w,h) => ({data: new Uint8ClampedArray(w*h*4)}),
}) });

function game(storage = new Map(), canvasFactory = mockCanvas) {
  const nodes = new Map(), events = new Map();
  const add = (name, handler) => events.set(name, [...(events.get(name)||[]), handler]);
  const emit = (name, event = {}) => {
    for (const handler of events.get(name)||[]) handler(event);
  };
  const make = id => {
    const classes = new Set(['inventory','ending'].includes(id)?['hidden']:[]);
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
  const context = vm.createContext({
    console, document: {getElementById:node, createElement:()=>make('canvas'),
      addEventListener:add, exitPointerLock(){this.pointerLockElement=null;}},
    navigator:{getGamepads:()=>[pad]}, localStorage:{
      getItem:key=>storage.get(key)??null, setItem:(key,value)=>storage.set(key,value),
    }, requestAnimationFrame:callback=>{frame=callback;},
    addEventListener:add,
  });
  context.window=context;
  vm.runInContext(scripts[0],context);
  // The harness reads private encounter data to steer its player. It never sets game state.
  vm.runInContext(scripts[1].replace('window.__ashenDiagnostics=',
    'window.observe=()=>({enemies:enemies.map(({id,x,y,hp,alive})=>({id,x,y,hp,alive})),render});window.__ashenDiagnostics=')
    .replace('if(playing)render();',''),context);
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
  return {start,step,key,tap,walk,interact,fight,state,storage,node,draw,emit,setPad:value=>{pad=value;}};
}

function route(restored) {
  let g=game();g.start();
  g.interact(4.8,17.3);
  if(restored){
    g.interact(3.3,21.4);
    g.interact(7.4,20.4);
    g.interact(6.5,14.5);
    g.walk(6.5,10.5);
    g.fight('w5',[7.1,10]);
    g.fight('ambush2',[8.4,9.4]);
    g.interact(5.2,8.8);
    g.interact(8,8.4);
    g.interact(9,7.7);
    g.interact(10.5,12.5);
    assert(g.state().shortcutOpen);
    g.walk(10.5,14.5);
    g.walk(9.5,15.5);g.walk(8.5,16.5);
    g.walk(8.5,17.5);
  }
  g.fight('w1',[9.6,17.6]);
  g.walk(15.6,17.6);
  g.fight('w2',[16.2,17.6]);
  g.fight('w3',[21.6,16.7]);
  g.interact(23,18);
  assert(g.state().key);
  if(restored){
    g.fight('ambush1',[21.2,19.7]);
    g.interact(22.6,21);
    assert.equal(g.state().echoes,3);
    g.interact(17.4,19.3);
    assert.equal(JSON.parse(g.storage.get(saveKey)).maxflasks,5);
    g.walk(25.5,17.5);
    g.walk(27.5,17.5);
    g.fight('bellKeeper',[27.7,17.3]);
    g.interact(28.35,14.4);
    assert(g.state().bellRung);
    g.walk(27.5,17.5);g.walk(25.5,17.5);
  }
  g.walk(19.5,14);
  g.fight('w4',[19.5,13.1]);
  g.interact(19.5,11.5);
  assert(g.state().gate);
  g.interact(19.5,9.5);
  for(let i=0;i<3;i++)g.tap('KeyL');
  g.tap('KeyK');
  g=game(g.storage);g.start();
  assert(g.state().gate&&g.state().key);
  if(restored)assert(g.state().bellRung&&g.state().shortcutOpen);
  g.fight('boss',[19.5,7.45]);
  assert(g.state().bossDefeated);
  g.interact(19.5,3.2);
  assert.equal(g.state().ending,restored?'restored':'first-light');
  const reload=game(g.storage);reload.start();
  assert.equal(reload.state().ending,g.state().ending);
  assert.equal(reload.node('ending-title').textContent,g.node('ending-title').textContent);
  return g.state().ending;
}

console.log('Recorridos completos por teclado y ratón:',route(false),route(true));
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

if(process.env.ASHEN_CAPTURE){
  const require=createRequire(import.meta.url);
  const {createCanvas}=require(join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'));
  const view=game(new Map(),()=>createCanvas(480,270));
  view.start();
  writeFileSync(process.env.ASHEN_CAPTURE,view.draw().toBuffer('image/png'));
  console.log('Cripta renderizada en Canvas nativo');
}
