"""Cross each doorway in Chromium through the normal movement loop."""
import json
from math import atan2
from os import environ
from pathlib import Path

from playwright.sync_api import sync_playwright

from browser_runtime import launch

root = Path(__file__).resolve().parent.parent
html = (root / "JUGAR-SIN-INSTALAR.html").read_text(encoding="utf-8")
site = "https://ashen-veil.test/game/"
key = "ashen-veil-rebirth-v2"
routes = [
    ("crypt", "salt", (6.5, 23.5, 0, 1), (41.5, 20.5, 0, 1)),
    ("catacomb", "archive", (24.5, 11.5, 0, -1), (61.5, 20.5, 0, 1)),
    ("chapel", "garden", (3.5, 4.5, 0, -1), (41.5, 42.5, 0, 1)),
    ("nave", "soundings", (28.5, 22.5, 0, 1), (61.5, 42.5, 0, 1)),
    ("sanctuary", "sky", (27.5, 8.5, 1, 0), (41.5, 64.5, 0, 1)),
]
capture = environ.get("ASHEN_DOOR_CAPTURE")

with sync_playwright() as p:
    browser = launch(p.chromium)
    for source, target, entry, exit_ in routes:
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.add_init_script("HTMLCanvasElement.prototype.requestPointerLock = undefined")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        page.route(site, lambda route: route.fulfill(content_type="text/html", body=html))
        page.goto(site)
        x, y, dx, dy = entry
        save = {"version": 2, "x": x - dx * 1.25, "y": y - dy * 1.25, "ang": atan2(dy, dx)}
        page.evaluate("([key, save]) => localStorage.setItem(key, save)", [key, json.dumps(save)])
        page.reload()
        page.locator("#play").click()
        assert page.evaluate("window.__ashenDiagnostics().region") == source
        page.wait_for_function("window.__ashenDiagnostics().playing && !window.__ashenDiagnostics().paused")
        page.evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))")
        if capture:
            folder = Path(capture)
            folder.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=folder / f"puerta-{target}.png")
        page.keyboard.down("KeyW")
        try:
            page.wait_for_function("target => window.__ashenDiagnostics().region === target", arg=target, timeout=4000)
        except Exception as error:
            raise AssertionError((target, page.evaluate("window.__ashenDiagnostics()"))) from error
        page.keyboard.up("KeyW")
        assert page.evaluate("window.__ashenDiagnostics().heading") == atan2(-exit_[3], -exit_[2])
        page.keyboard.press("KeyM")
        assert page.locator("#map canvas").is_visible()
        page.reload()
        assert page.evaluate("window.__ashenDiagnostics().region") == target
        page.locator("#play").click()
        page.keyboard.down("KeyS")
        page.wait_for_function("source => window.__ashenDiagnostics().region === source", arg=source, timeout=4000)
        page.keyboard.up("KeyS")
        assert not errors, errors
        page.context.close()
    browser.close()
print("PASS: cinco puertas de ida y vuelta, mapa y recarga, sin errores de consola")
