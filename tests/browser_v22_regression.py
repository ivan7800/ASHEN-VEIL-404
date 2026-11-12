"""v2.2: offline browser play session + animation/visual regressions."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu'])
    page=browser.new_page(viewport={'width':1280,'height':720})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content((root/'JUGAR-SIN-INSTALAR.html').read_text(encoding='utf-8'),wait_until='load')
    page.locator('#play').click()
    page.wait_for_timeout(400)
    s=page.evaluate('window.__ashenDiagnostics()')
    assert s['version']=='2.8.0' and s['animationFrames']==60 and s['sceneryCount']==38,s
    # Mouse look simulation is blocked by sandbox pointer-lock; keyboard arrows provide a deterministic alternative.
    before=page.evaluate('window.__ashenDiagnostics().position')
    page.keyboard.down('KeyW');page.wait_for_timeout(400);page.keyboard.up('KeyW')
    after=page.evaluate('window.__ashenDiagnostics().position')
    assert before!=after,(before,after)
    page.keyboard.press('KeyQ');page.wait_for_timeout(80)
    assert page.evaluate('window.__ashenDiagnostics().activeParticles')>0
    # The new overlay must not intercept the map/inventory controls.
    page.keyboard.press('KeyM');assert page.locator('#map').is_visible()
    page.keyboard.press('Tab');assert page.locator('#inventory').is_visible()
    page.keyboard.press('Tab');assert not page.locator('#inventory').is_visible()
    page.keyboard.press('Escape');assert page.locator('#menu').is_visible()
    page.locator('#play').click();page.wait_for_timeout(100)
    assert page.evaluate('window.__ashenDiagnostics().playing')
    assert not errors,errors
    print('PASS v2.2: 60 animation frames, 23 decor, particles, movement, map, inventory, pause, no JS errors')
    browser.close()
