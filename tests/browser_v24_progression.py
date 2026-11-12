"""Tests route geometry, full progression state machine and save/restore; test-only hooks stay out of distributed JS."""
from pathlib import Path
from collections import deque
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
js=(root/'src/game.js').read_text()
html=(root/'JUGAR-SIN-INSTALAR.html').read_text()
# Calculate actual grid by querying page, with test-only internal references.
hook="window.__test24={player,objects,enemies,grid,interact,save,load,hit,resetEnemies,get bossDefeated(){return bossDefeated},get near(){return nearObject()},get objective(){return objectiveText()},moveTo(x,y){player.x=x;player.y=y;},get deadBoss(){return !enemies.find(e=>e.id==='boss').alive}};"
assert 'window.__ashenDiagnostics=()=>(' in html
html=html.replace('window.__ashenDiagnostics=()=>(',hook+'\nwindow.__ashenDiagnostics=()=>(')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu'])
 page=b.new_page(viewport={'width':1280,'height':720});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 # Stable fake storage, enough to test JSON save/load, not actual browser persistence.
 page.evaluate("""() => { window.__memoryStorage={};Object.defineProperty(window,'localStorage',{configurable:true,value:{setItem(k,v){window.__memoryStorage[k]=v},getItem(k){return window.__memoryStorage[k]??null},removeItem(k){delete window.__memoryStorage[k]}}}) }""")
 page.set_content(html,wait_until='load');page.locator('#play').click()
 state=page.evaluate('''() => {const t=window.__test24;return {grid:t.grid,positions:t.objects.map(o=>({id:o.id,x:o.x,y:o.y})),enemies:t.enemies.map(e=>({id:e.id,x:e.x,y:e.y})),p:[t.player.x,t.player.y]}}''')
 grid=state['grid'];H=len(grid);W=len(grid[0]);assert H==25 and W==30
 def reachable(walls):
  start=(int(state['p'][0]),int(state['p'][1]));q=deque([start]);seen={start}
  while q:
   x,y=q.popleft()
   for xx,yy in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
    if 0<=xx<W and 0<=yy<H and (xx,yy) not in seen and (grid[yy][xx] not in walls):seen.add((xx,yy));q.append((xx,yy))
  return seen
 closed=reachable({1,2,3,4});gate=reachable({1,2,4});both=reachable({1,2})
 obj={o['id']:(int(o['x']),int(o['y'])) for o in state['positions']}
 assert obj['key'] in closed,('key inaccessible',obj['key'])
 assert obj['lever'] in closed and obj['tablet'] in closed
 assert obj['exit'] not in closed and obj['exit'] in gate,('gate does not block/open correctly')
 assert obj['relic'] not in gate and obj['relic'] in both,('secret wall not controlling relic access')
 assert (int(19.5),int(5.3)) in gate
 # 1. Complete actual interactions in order using test-only teleport (not claimed as human playthrough).
 assert 'LLAVE' in page.evaluate('window.__test24.objective')
 result=page.evaluate('''() => {const t=window.__test24;t.moveTo(23,18);t.interact();const k=t.player.key;t.moveTo(19.5,10.5);t.interact();const g=t.player.gate;t.moveTo(6.5,13.5);t.interact();const s=t.player.secret;t.moveTo(8,8.4);t.interact();const r=t.player.relic;return {k,g,s,r,objective:t.objective,maxhp:t.player.maxhp}}''')
 assert result['k'] and result['g'] and result['s'] and result['r'],result
 assert result['maxhp']==130,result
 # Boss defeat and altar rest must preserve boss death; exit must trigger victory.
 progress=page.evaluate('''() => {const t=window.__test24;const boss=t.enemies.find(e=>e.id==='boss');t.hit(boss,9999);const deadBefore=t.deadBoss;t.moveTo(4.8,17.2);t.interact();const deadAfter=t.deadBoss;t.moveTo(19.5,3.2);t.interact();return {deadBefore,deadAfter,won:t.player.won,objective:t.objective,ending:!document.getElementById('ending').classList.contains('hidden'),save:window.__memoryStorage['ashen-veil-rebirth-v2']}}''')
 assert progress['deadBefore'] and progress['deadAfter'] and progress['won'] and progress['ending'],progress
 assert 'COMPLETADA' in progress['objective']
 # Simulate refresh by constructing fresh page / JS with saved storage.
 saved=progress['save'];page2=b.new_page(viewport={'width':1280,'height':720});err2=[];page2.on('pageerror',lambda e:err2.append(str(e)))
 page2.evaluate('''s => {window.__memoryStorage={'ashen-veil-rebirth-v2':s};Object.defineProperty(window,'localStorage',{configurable:true,value:{setItem(k,v){window.__memoryStorage[k]=v},getItem(k){return window.__memoryStorage[k]??null},removeItem(k){delete window.__memoryStorage[k]}}})}''',saved)
 page2.set_content(html,wait_until='load')
 restored=page2.evaluate('''() => {const t=window.__test24;return {key:t.player.key,gate:t.player.gate,secret:t.player.secret,relic:t.player.relic,won:t.player.won,boss:t.deadBoss,wall:t.grid[10][19],objective:t.objective}}''')
 assert restored=={'key':True,'gate':True,'secret':True,'relic':True,'won':True,'boss':True,'wall':0,'objective':'MAZMORRA COMPLETADA'},restored
 # Corrupt saved coordinates should not change gate wall state at load.
 page3=b.new_page();page3.evaluate('''s=>{const d=JSON.parse(s);d.x=-99;d.y=-99;window.__memoryStorage={'ashen-veil-rebirth-v2':JSON.stringify(d)};Object.defineProperty(window,'localStorage',{configurable:true,value:{setItem(k,v){window.__memoryStorage[k]=v},getItem(k){return window.__memoryStorage[k]??null},removeItem(k){delete window.__memoryStorage[k]}}})}''',saved)
 page3.set_content(html,wait_until='load')
 assert page3.evaluate('window.__test24.grid[10][19]')==3
 assert not errors and not err2,(errors,err2)
 print('PASS: reachable key/lever; gate blocks exit; secret wall blocks relic; unlock/defeat/altar/ending; memory-storage save roundtrip; invalid coordinate rollback; no JS errors')
 print('route:',len(closed),len(gate),len(both),'cells')
 print('restored:',restored)
 b.close()
