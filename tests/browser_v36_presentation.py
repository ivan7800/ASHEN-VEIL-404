"""Check the HUD and controls where the old mobile layout overlapped."""
from os import environ
from pathlib import Path

from playwright.sync_api import sync_playwright
from browser_runtime import launch


root = Path(__file__).resolve().parent.parent
edition = Path(environ.get("ASHEN_UI_BASE", root)).resolve() / "JUGAR-SIN-INSTALAR.html"
capture_dir = Path(environ["ASHEN_UI_CAPTURE"]) if "ASHEN_UI_CAPTURE" in environ else None
baseline = "ASHEN_UI_BASE" in environ
if capture_dir:
    capture_dir.mkdir(parents=True, exist_ok=True)


def capture(page, scene, moment):
    if capture_dir:
        page.screenshot(path=capture_dir / f"{scene}-{moment}.png")


def overlap(a, b):
    return a and b and (
        max(a["x"], b["x"]) < min(a["x"] + a["width"], b["x"] + b["width"])
        and max(a["y"], b["y"]) < min(a["y"] + a["height"], b["y"] + b["height"])
    )


with sync_playwright() as p:
    browser = launch(p.chromium)
    for scene, width, height, touch in [
        ("desktop", 1280, 720, False),
        ("portrait", 390, 844, True),
        ("short", 320, 568, True),
        ("landscape", 844, 390, True),
        ("compact-landscape", 568, 320, True),
    ]:
        errors = []
        page = browser.new_page(
            viewport={"width": width, "height": height},
            device_scale_factor=1,
            is_mobile=touch,
            has_touch=touch,
            reduced_motion="no-preference",
        )
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        page.goto(edition.as_uri(), wait_until="load")
        capture(page, scene, "menu")
        if not baseline:
            page.get_by_text("Ajustes", exact=True).click()
            page.locator("#quiet-effects").check()
            assert page.locator("#game").get_attribute("data-effects") == "reduced"
            assert page.locator(".crest").evaluate("el => getComputedStyle(el).animationName") == "none"
            page.get_by_text("Ajustes", exact=True).click()
        page.locator("#play").click()
        page.wait_for_function("window.__ashenDiagnostics().playing && !window.__ashenDiagnostics().paused")
        capture(page, scene, "game")
        if touch:
            assert page.locator("#touch-controls").is_visible()
            if not baseline:
                for grid in page.locator(".touch-grid").all():
                    assert not overlap(page.locator(".hud-bottom").bounding_box(), grid.bounding_box()), scene
                for button in page.locator("#touch-controls button").all():
                    rect = button.bounding_box()
                    assert rect["height"] >= 44 and rect["width"] >= 44, (scene, rect)
                    assert rect["x"] >= 0 and rect["x"] + rect["width"] <= width, (scene, rect)
            if baseline:
                page.keyboard.press("KeyM")
            else:
                page.get_by_role("button", name="Mapa", exact=True).tap()
        else:
            page.keyboard.press("KeyM")
        assert page.locator("#map").is_visible()
        capture(page, scene, "map")
        if not baseline:
            if touch:
                map_rect = page.locator("#map").bounding_box()
                for grid in page.locator(".touch-grid").all():
                    assert not overlap(map_rect, grid.bounding_box()), scene
            if touch:
                page.get_by_role("button", name="Diario", exact=True).tap()
            else:
                page.keyboard.press("Tab")
        else:
            page.keyboard.press("Tab")
        assert page.locator("#inventory").is_visible()
        assert page.get_by_role("button", name="Cerrar inventario").is_visible()
        capture(page, scene, "inventory")
        if not baseline:
            journal = page.locator("#items")
            assert journal.evaluate("element => document.activeElement === element"), scene
            if journal.evaluate("element => element.scrollHeight > element.clientHeight"):
                page.keyboard.press("PageDown")
                page.wait_for_function("document.getElementById('items').scrollTop > 0")
        page.get_by_role("button", name="Cerrar inventario").click()
        assert not page.locator("#inventory").is_visible()
        assert not errors, (scene, errors)
        page.context.close()
    browser.close()
if baseline:
    print("Capturas de referencia en cinco tamaños")
else:
    print("PASS: cinco tamaños, lectura de HUD y mapa, diario, foco y reducción de efectos")
