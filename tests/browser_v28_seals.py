"""Test optional rituals, reward uniqueness, boss damage mitigation, journal and save state."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'JUGAR-SIN-INSTALAR.html').read_text(encoding='utf-8')
hook="window.__test28={player,objects,enemies,interact,resolvesEnemyAttack,save,load,getSeals:()=>sealsBroken.slice(),getZones:()=>zonesVisited.slice()};"
assert 'window.__ashenDiagnostics=()=>(' in html
html=html.replace('window.__ashenDiagnostics=()=>(',hook+'\nwindow.__ashenDiagnostics=()=>(')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu'])
 page=browser.new_page(viewport={'width':1280,'height':720})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='load');page.locator('#play').click();page.wait_for_timeout(120)
 assert page.evaluate('window.__ashenDiagnostics().sealsRemaining')==2
 result=page.evaluate('''() => {
   const t=window.__test28,p=t.player,details=[];
   for(const id of ['seal1','seal2']){
    const o=t.objects.find(o=>o.id===id);p.x=o.x;p.y=o.y;t.interact();
    const cash=p.ashes;t.interact();details.push({id,active:o.active,unique:cash===p.ashes,ashes:p.ashes});
   }
   const b=t.enemies.find(e=>e.id==='boss');p.x=20.5;p.y=5.3;p.hp=p.maxhp;p.hurt=0;p.roll=0;p.block=false;
   b.x=19.5;b.y=5.3;b.facing=0;b.attackReach=2.4;b.attackArc=.9;b.attackDamage=40;
   const old=p.hp;const connected=t.resolvesEnemyAttack(b);
   return {details,seals:t.getSeals(),bossHit:old-p.hp,connected};
 }''')
 assert [x['ashes'] for x in result['details']]==[60,120],result
 assert all(not x['active'] and x['unique'] for x in result['details']),result
 assert result['seals']==['seal1','seal2'],result
 assert result['connected'] and result['bossHit']==28,result
 state=page.evaluate('window.__ashenDiagnostics()')
 assert state['sealsBroken']==2 and state['sealsRemaining']==0,state
 page.keyboard.press('Tab')
 assert 'RITOS DEL VIGÍA (2/2)' in page.locator('#items').inner_text()
 assert not errors,errors
 print('PASS v2.8: 2 optional rituals, one-time 120 ashes, 30% boss damage reduction, journal, no JS errors')
 browser.close()
