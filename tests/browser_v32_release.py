"""Exercise the public HTML and touch UI in fresh browser contexts."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_runtime import launch

root = Path(__file__).resolve().parent.parent
site = "https://ashen-veil.test/ASHEN-VEIL-404/"
mime = {".html":"text/html", ".js":"text/javascript", ".css":"text/css"}

def serve(route):
    name = route.request.url.removeprefix(site).split("?",1)[0] or "index.html"
    file = (root / name).resolve()
    if root not in file.parents or file.suffix not in mime or not file.is_file():
        route.fulfill(status=404)
        return
    route.fulfill(status=200, content_type=mime[file.suffix], body=file.read_bytes())

with sync_playwright() as playwright:
    browser = launch(playwright.chromium)
    desktop = browser.new_page()
    errors = []
    desktop.on("pageerror", lambda error: errors.append(str(error)))
    desktop.on("response", lambda response: errors.append(response.url) if response.status >= 400 else None)
    desktop.route(site + "**", serve)
    desktop.goto(site)
    desktop.locator("#play").click()
    assert desktop.evaluate("window.__ashenDiagnostics().version") == "3.5.0"
    desktop.keyboard.press("KeyK")
    assert desktop.evaluate("window.__ashenDiagnostics().savePresent")
    desktop.reload()
    assert desktop.get_by_role("button", name="CONTINUAR EL DESCENSO").is_visible()
    desktop.close()

    phone = browser.new_page(has_touch=True, is_mobile=True, viewport={"width":390,"height":844})
    phone.on("pageerror", lambda error: errors.append(str(error)))
    phone.goto((root / "JUGAR-SIN-INSTALAR.html").as_uri())
    phone.locator("#play").tap()
    controls = phone.locator("#touch-controls")
    assert controls.is_visible()
    forward = phone.get_by_role("button", name="Avanzar")
    before = phone.evaluate("window.__ashenDiagnostics().position")
    # Emulate a held touch with real CDP touch events.
    session = phone.context.new_cdp_session(phone)
    bounds = forward.bounding_box()
    session.send("Input.dispatchTouchEvent", {"type":"touchStart", "touchPoints":[
        {"x":bounds["x"] + bounds["width"]/2, "y":bounds["y"] + bounds["height"]/2}
    ]})
    phone.wait_for_function("before => JSON.stringify(window.__ashenDiagnostics().position) !== JSON.stringify(before)", arg=before)
    session.send("Input.dispatchTouchEvent", {"type":"touchEnd", "touchPoints":[]})
    phone.get_by_role("button", name="Mapa", exact=True).tap()
    assert phone.locator("#map").is_visible()
    phone.get_by_role("button", name="Diario", exact=True).tap()
    assert phone.locator("#inventory").is_visible() and not controls.is_visible()
    phone.get_by_role("button", name="Cerrar inventario").tap()
    phone.get_by_role("button", name="Tajo", exact=True).tap()
    assert phone.evaluate("window.__ashenDiagnostics().stamina") < 100
    phone.get_by_role("button", name="Pausa", exact=True).tap()
    assert phone.evaluate("window.__ashenDiagnostics().paused")
    assert not errors, errors
    print("PASS: web en subdirectorio, guardado real, file:// y acciones táctiles en Chromium emulado")
    browser.close()
