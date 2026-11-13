#!/usr/bin/env python3
"""Inline local assets to produce a single HTML for offline play."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "style.css").read_text(encoding="utf-8")
version = re.search(r"const VERSION='([0-9.]+)';", (root / "src/game.js").read_text(encoding="utf-8"))
if version is None:
    raise SystemExit("Expected the release version in src/game.js")
asset_version = version[1]
style_tag = f'<link rel="stylesheet" href="style.css?v={asset_version}">'
if html.count(style_tag) != 1:
    raise SystemExit("Expected one style.css asset tag for the release")
html = html.replace(style_tag, f"<style>{css}</style>")
for name in ("art", "lighting", "audio", "expedition", "game"):
    tag = f'<script src="src/{name}.js?v={asset_version}"></script>'
    if html.count(tag) != 1:
        raise SystemExit(f"Expected one asset tag for {name}.js")
    source = (root / "src" / f"{name}.js").read_text(encoding="utf-8")
    source = source.replace("</script", r"<\/script")
    html = html.replace(tag, f"<script>{source}</script>")
out = root / "JUGAR-SIN-INSTALAR.html"
out.write_text(html, encoding="utf-8")
print(out, out.stat().st_size, "bytes")
