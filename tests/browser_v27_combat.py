"""Focused browser tests: enemy telegraph direction, distinct patterns and heavy attack."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_runtime import launch
root=Path(__file__).resolve().parent.parent
html=(root/'JUGAR-SIN-INSTALAR.html').read_text()
hook='window.__test27={player,enemies,startEnemyAttack,resolvesEnemyAttack,attack,advanceSwing,hit,resetEnemies,los,damagePlayer};'
assert 'window.__ashenDiagnostics=()=>(' in html
html=html.replace('window.__ashenDiagnostics=()=>(',hook+'\nwindow.__ashenDiagnostics=()=>(')
with sync_playwright() as p:
    browser=launch(p.chromium)
    page=browser.new_page(viewport={'width':1280,'height':720})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='load')
    page.locator('#play').click()
    page.wait_for_timeout(200)
    assert page.evaluate('window.__ashenDiagnostics().enemiesAlive')==9
    result=page.evaluate('''() => {
      const t=window.__test27,p=t.player,e=t.enemies.find(x=>x.type==='knight');
      e.x=10;e.y=17;p.x=11;p.y=17;p.hp=p.maxhp;p.hurt=0;p.roll=0;p.block=false;
      t.startEnemyAttack(e,1,0);const type1=e.attackKind;
      p.x=9.5;p.y=17;const before=p.hp;const behindHit=t.resolvesEnemyAttack(e);
      const avoided=p.hp===before&&!behindHit;
      p.x=11;p.y=17;p.hurt=0;const frontHit=t.resolvesEnemyAttack(e);
      const connected=frontHit&&p.hp<before;
      t.startEnemyAttack(e,1,0);const type2=e.attackKind;
      const boss=t.enemies.find(x=>x.type==='boss');boss.phase=2;
      t.startEnemyAttack(boss,1,0);const bossFirst=boss.attackKind;
      t.startEnemyAttack(boss,1,0);const bossSecond=boss.attackKind;
      // Heavy attack must spend 38 stamina and stagger an eligible target.
      p.x=10;p.y=17;p.ang=0;p.st=100;p.attackCd=0;p.roll=0;
      e.x=11.1;e.y=17;e.hp=e.maxhp;e.alive=true;e.stun=0;
      // Avoid test collision with other enemies.
      for(const other of t.enemies)if(other!==e&&other!==boss)other.alive=false;
      t.attack(true);
      if(e.hp!==e.maxhp)throw Error("El daño precede al contacto");
      t.advanceSwing(.25);
      return {avoided,connected,type1,type2,bossFirst,bossSecond,stamina:p.st,stun:e.stun,hp:e.hp};
    }''')
    print(result)
    assert result['avoided'] and result['connected'],result
    assert {result['type1'],result['type2']}=={'cleave','thrust'},result
    assert {result['bossFirst'],result['bossSecond']}=={'cleave','lunge'},result
    assert result['stamina']==62 and result['stun']>=.6 and result['hp']<112,result
    assert not errors,errors
    page.screenshot(path=str(root/'tests/captura_v27.png'))
    browser.close()
    print('PASS: 2.7 combat behavior, directional hit tests, phase 2 boss, heavy strike, no JS errors')
