"""Browser regression against release HTML with test-only in-memory inspection hook."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'JUGAR-SIN-INSTALAR.html').read_text(encoding='utf-8')
hook='window.__test26={player,objects,enemies,interact,save,load,resetEnemies,getEchoes:()=>echoesCollected.slice(),getReward:()=>echoReward};'
assert 'window.__ashenDiagnostics=()=>(' in html
html=html.replace('window.__ashenDiagnostics=()=>(',hook+'\nwindow.__ashenDiagnostics=()=>(')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu'])
 page=browser.new_page(viewport={'width':1280,'height':720})
 errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content(html,wait_until='load')
 page.locator('#play').click()
 page.wait_for_timeout(250)
 d=page.evaluate('window.__ashenDiagnostics()')
 assert d['version']=='3.1.0' and d['enemiesAlive']==9 and d['echoLocations']==3,d
 assert d['sceneryCount']==42,d
 page.keyboard.press('KeyM');assert page.locator('#map').is_visible();page.keyboard.press('KeyM')
 page.keyboard.press('Tab');assert page.locator('#inventory').is_visible();assert 'ECOS DEL VELO (0/3)' in page.locator('#items').inner_text();page.keyboard.press('Tab')
 quest=page.evaluate('''() => {const t=window.__test26;const results=[];
  for(const id of ['echo1','echo2','echo3']){
   const o=t.objects.find(o=>o.id===id);t.player.x=o.x;t.player.y=o.y;t.interact();
   const before=t.player.ashes;t.interact();results.push({id,ashes:before,duplicateBlocked:before===t.player.ashes,collected:!o.active});
  }
  return {results,echoes:t.getEchoes(),reward:t.getReward(),maxflasks:t.player.maxflasks,flasks:t.player.flasks};}''')
 assert quest['echoes']==['echo1','echo2','echo3'],quest
 assert quest['reward'] and quest['maxflasks']==4 and quest['flasks']==4,quest
 assert [v['ashes'] for v in quest['results']]==[90,180,270],quest
 assert all(v['duplicateBlocked'] and v['collected'] for v in quest['results']),quest
 state=page.evaluate('window.__ashenDiagnostics()')
 assert state['echoes']==3 and state['echoReward'] and state['echoLocations']==0,state
 # Screenshot from a stable position, no debug modifications included in output release.
 page.evaluate('''() => {const t=window.__test26;t.player.x=5.4;t.player.y=19;t.player.ang=-Math.PI/2;}''')
 page.wait_for_timeout(250)
 page.screenshot(path=str(root/'tests/captura_v26.png'))
 assert not errors,errors
 print('PASS v2.6: 8 enemies, 3 echoes, unique pickups, 270 ashes, +1 flask once, inventory/minimap, no JS errors')
 browser.close()
