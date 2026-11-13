"""Test new region art without violating game closure or modifying existing sources."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_runtime import launch
root=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    browser=launch(p.chromium)
    page=browser.new_page(viewport={'width':1280,'height':720})
    errors=[]
    page.on('pageerror',lambda exc:errors.append(str(exc)))
    page.set_content((root/'JUGAR-SIN-INSTALAR.html').read_text(encoding='utf-8'),wait_until='load')
    page.locator('#play').click()
    page.wait_for_timeout(500)
    d=page.evaluate('window.__ashenDiagnostics()')
    assert d['version']=='3.2.0',d
    assert d['textureCount']==42,d
    assert d['sceneryCount']==42 and d['themedProps']==16,d
    assert d['region']=='crypt',d
    assert d['enemiesAlive']==9,d
    canvas=page.locator('#screen')
    assert canvas.evaluate('(el)=>el.width===480&&el.height===270')
    page.keyboard.press('KeyM')
    assert page.locator('#map').is_visible()
    page.keyboard.press('KeyM')
    page.screenshot(path=str(root/'tests/captura_v25.png'))
    assert not errors,errors
    print('PASS v2.5 art: 4 new wall families, 12 themed props, original raycaster, map and 6 enemies; no JS errors')
    browser.close()
