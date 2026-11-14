"""Exercise standard Gamepad API input and menu focus in Chromium emulation."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_runtime import launch

html=(Path(__file__).resolve().parent.parent/'JUGAR-SIN-INSTALAR.html').as_uri()
with sync_playwright() as playwright:
    browser=launch(playwright.chromium)
    page=browser.new_page(viewport={'width':1280,'height':720})
    errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.add_init_script('''(() => {
      const buttons=Array.from({length:17},()=>({pressed:false}));
      const pad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons};
      window.testPad={
        button(index,pressed){buttons[index].pressed=pressed;},
        axes(x,y,look){pad.axes=[x,y,look,0];},
        disconnect(){pad.connected=false;},
        reconnect(){pad.connected=true;}
      };
      Object.defineProperty(navigator,'getGamepads',{value:()=>pad.connected?[pad]:[]});
      HTMLCanvasElement.prototype.requestPointerLock=undefined;
    })();''')
    page.goto(html)
    page.wait_for_function("document.querySelector('#pad-status').textContent.includes('conectado ·')")
    def button(index):
        page.evaluate('i=>testPad.button(i,true)',index)
        page.wait_for_timeout(90)
        page.evaluate('i=>testPad.button(i,false)',index)
        page.wait_for_timeout(90)
    button(13)
    assert page.evaluate('document.activeElement.id')=='play'
    button(13)
    assert page.evaluate('document.activeElement.id')=='mute'
    button(13)
    assert page.evaluate('document.activeElement.tagName')=='SUMMARY'
    button(0)
    assert page.locator('details.settings').get_attribute('open') is not None
    button(13)
    assert page.evaluate('document.activeElement.id')=='volume'
    button(13)
    assert page.evaluate('document.activeElement.id')=='quiet-effects'
    button(13)
    button(13)
    assert page.evaluate('document.activeElement.id')=='pad-sensitivity'
    button(15)
    assert page.locator('#pad-sensitivity').input_value()=='110'
    assert '110' in page.locator('#pad-sensitivity-value').text_content(), page.evaluate("({v:document.querySelector('#pad-sensitivity').value,t:document.querySelector('#pad-sensitivity-value').textContent})")
    button(13)
    button(15)
    assert page.locator('#pad-deadzone').input_value()=='19'
    page.reload()
    assert page.locator('#pad-deadzone').input_value()=='19'
    assert page.locator('#pad-sensitivity').input_value()=='110'
    button(0)
    assert page.evaluate('window.__ashenDiagnostics().playing')
    initial=page.evaluate('window.__ashenDiagnostics()')
    page.evaluate('testPad.axes(.1,.1,.1)')
    page.wait_for_timeout(300)
    steady=page.evaluate('window.__ashenDiagnostics()')
    assert initial['position']==steady['position'] and initial['heading']==steady['heading']
    page.evaluate('testPad.axes(0,-.75,.5)')
    before=page.evaluate('window.__ashenDiagnostics()')
    page.wait_for_timeout(400)
    after=page.evaluate('window.__ashenDiagnostics()')
    assert before['position']!=after['position'] and before['heading']!=after['heading']
    page.evaluate('testPad.axes(0,0,0)')
    button(9)
    assert page.evaluate('window.__ashenDiagnostics().paused')
    button(12)
    assert page.evaluate('document.activeElement.id')!='play'
    button(1)
    assert not page.evaluate('window.__ashenDiagnostics().paused')
    button(8)
    assert page.locator('#inventory').is_visible()
    button(1)
    assert not page.locator('#inventory').is_visible()
    page.evaluate('testPad.disconnect()')
    page.wait_for_function("document.querySelector('#pad-status').textContent==='Mando desconectado'")
    page.evaluate('testPad.reconnect()')
    page.wait_for_function("document.querySelector('#pad-status').textContent.includes('conectado ·')")
    before=page.evaluate('window.__ashenDiagnostics().position')
    page.keyboard.down('KeyW');page.wait_for_timeout(250);page.keyboard.up('KeyW')
    assert before!=page.evaluate('window.__ashenDiagnostics().position')
    assert not errors,errors
    browser.close()
print('PASS: Gamepad emulado, ajustes persistentes, menú, partida, pausa, diario, reconexión y teclado')
