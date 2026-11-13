from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=root/'JUGAR-SIN-INSTALAR.html'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu','--use-gl=swiftshader'])
    page=browser.new_page(viewport={'width':1280,'height':720},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    try:
        page.goto(html.as_uri(),wait_until='load')
    except Exception as exc:
        print('file navigation failure; using set_content:',repr(exc))
        page=browser.new_page(viewport={'width':1280,'height':720},device_scale_factor=1)
        page.on('pageerror',lambda error: errors.append(str(error)))
        page.set_content(html.read_text(encoding='utf-8'),wait_until='load')
    page.wait_for_timeout(900)
    assert page.locator('#menu').is_visible()
    page.locator('#play').click()
    page.wait_for_timeout(900)
    before=page.evaluate('window.__ashenDiagnostics()')
    assert before['playing'] and before['enemiesAlive']==9, before
    assert before['renderSize']==[480,270], before
    page.keyboard.down('KeyW')
    page.wait_for_timeout(650)
    page.keyboard.up('KeyW')
    after=page.evaluate('window.__ashenDiagnostics()')
    assert before['position']!=after['position'],(before,after)
    page.keyboard.press('KeyM')
    assert page.evaluate('window.__ashenDiagnostics().mapVisible')
    page.keyboard.press('KeyQ')
    page.wait_for_timeout(200)
    afterspell=page.evaluate('window.__ashenDiagnostics()')
    assert afterspell['mana']<before['mana'],(afterspell,before)
    page.keyboard.press('Space')
    page.wait_for_timeout(80)
    assert page.evaluate('window.__ashenDiagnostics().stamina')<before['stamina']
    page.screenshot(path=str(root/'tests/captura_rebirth.png'))
    page.keyboard.press('Tab')
    assert page.locator('#inventory').is_visible()
    page.keyboard.press('Tab')
    assert not page.locator('#inventory').is_visible()
    assert not errors,errors
    print('PASS: startup, 9 enemies, movement, spell, stamina, map, inventory, no JS errors')
    print('state:',afterspell)
    print('screenshot:',root/'tests/captura_rebirth.png')
    browser.close()
