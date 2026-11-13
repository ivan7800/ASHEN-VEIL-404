from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_runtime import launch
root=Path(__file__).resolve().parent.parent
html=(root/'JUGAR-SIN-INSTALAR.html').read_text(encoding='utf-8')
with sync_playwright() as p:
    browser=launch(p.chromium)
    page=browser.new_page(viewport={'width':1200,'height':720})
    errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.route('https://ashen-rebirth.test/**',lambda route:route.fulfill(status=200,content_type='text/html',body=html))
    page.goto('https://ashen-rebirth.test/game',wait_until='load')
    page.get_by_role('button',name='DESPERTAR EN LA CRIPTA').click()
    page.wait_for_timeout(200)
    # Walk from spawn (5.4,19) toward altar at (4.8,17.2).
    page.keyboard.down('KeyW');page.wait_for_timeout(650);page.keyboard.up('KeyW')
    page.keyboard.press('KeyE')
    state=page.evaluate('window.__ashenDiagnostics()')
    assert state['savePresent'],state
    xy=state['position']
    page.reload(wait_until='load')
    page.wait_for_timeout(100)
    restored=page.evaluate('window.__ashenDiagnostics()')
    assert restored['position']==xy,(state,restored)
    assert not errors,errors
    print('PASS save persists across reload:',restored)
    browser.close()
