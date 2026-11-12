"""Targeted browser mechanics checks with a test-only injection, not included in release script."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'JUGAR-SIN-INSTALAR.html').read_text()
# Browser set_content runs on a restricted opaque origin. Test-only hook is never written to the release.
hook='window.__test23={player,objects,traps,interact,updateTraps,save,load,dist,enemies,grid,nearObject,damagePlayer,get lever(){return leverUsed},get cache(){return cacheOpened},setTick(v){tick=v},resetCooldown(){trapCooldown=0}};'
html=html.replace('window.__ashenDiagnostics=()=>(',hook+'\nwindow.__ashenDiagnostics=()=>(')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu'])
 page=b.new_page(viewport={'width':1280,'height':720}); errs=[]
 page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content(html,wait_until='load');page.locator('#play').click()
 # Lever progression and one-time reward: teleport only in test fixture.
 result=page.evaluate('''() => {const t=window.__test23;t.player.x=24.3;t.player.y=20.3;t.interact();let opened=t.lever;let avail=t.objects.find(o=>o.id==='cache').active;t.player.x=16.3;t.player.y=13.5;t.interact();let ashes=t.player.ashes;t.interact();return {opened,avail,ashes,unchanged:ashes===t.player.ashes,claimed:t.cache}}''')
 assert result=={'opened':True,'avail':True,'ashes':160,'unchanged':True,'claimed':True},result
 # Tablet: no duplicate record; trap warning/damage and dodge protection.
 out=page.evaluate('''() => {const t=window.__test23;t.player.x=5.4;t.player.y=21.1;t.interact();t.interact();const tablets=window.__ashenDiagnostics().tabletsRead;t.player.x=13.2;t.player.y=17.6;t.player.hurt=0;t.player.roll=0;t.setTick(0);t.resetCooldown();const before=t.player.hp;t.updateTraps(.016);const damaged=t.player.hp<before;t.player.hurt=0;t.player.roll=.3;t.resetCooldown();t.setTick(0);const after=t.player.hp;t.updateTraps(.016);return {tablets,damaged,dodgeProtected:t.player.hp===after}}''')
 assert out=={'tablets':1,'damaged':True,'dodgeProtected':True},out
 state=page.evaluate('window.__ashenDiagnostics()');assert state['trapCount']==3 and state['animationFrames']==60,state
 assert not errs,errs
 print('PASS v2.3: lever unlock, unique reward, lore tablet single read, trap damage, roll immunity, no JS errors')
 print('mechanics:',result,out)
 b.close()
