from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_runtime import launch
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=launch(p.chromium)
    page=browser.new_page(viewport={'width':1280,'height':720})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content((root/'JUGAR-SIN-INSTALAR.html').read_text(encoding='utf-8'))
    page.locator('#play').click()
    page.wait_for_timeout(250)
    d=page.evaluate('window.__ashenDiagnostics()')
    assert d['version']=='3.7.1' and d['sceneryCount']==42 and d['enemiesAlive']==9,d
    # Verify that a 2D frame actually differs between different view headings.
    a=page.locator('#screen').evaluate('(el)=>el.toDataURL()')
    page.keyboard.down('ArrowRight')
    page.wait_for_timeout(320)
    page.keyboard.up('ArrowRight')
    b=page.locator('#screen').evaluate('(el)=>el.toDataURL()')
    assert a!=b,'render did not respond to turning'
    page.keyboard.press('Tab');assert page.locator('#inventory').is_visible()
    page.keyboard.press('Tab');assert not page.locator('#inventory').is_visible()
    page.keyboard.press('Escape');assert page.locator('#menu').is_visible()
    assert page.evaluate('window.__ashenDiagnostics().paused')
    page.locator('#play').click()
    assert not page.evaluate('window.__ashenDiagnostics().paused')
    page.wait_for_timeout(350)
    assert not errors,errors
    page.screenshot(path=str(root/'tests/captura_rebirth_v22.png'))
    print('PASS: 42 props, 9 encounters, frame changes on rotation, inventory, pause/resume, no JS errors')
    browser.close()
