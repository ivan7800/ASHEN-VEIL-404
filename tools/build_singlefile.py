#!/usr/bin/env python3
"""Inline local assets to produce a single HTML for offline play."""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "style.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="style.css">', f"<style>{css}</style>")
for name in ("art", "lighting", "audio", "expedition", "game"):
    tag = f'<script src="src/{name}.js"></script>'
    if html.count(tag) != 1:
        raise SystemExit(f"Expected one asset tag for {name}.js")
    source = (root / "src" / f"{name}.js").read_text(encoding="utf-8")
    source = source.replace("</script", r"<\/script")
    html = html.replace(tag, f"<script>{source}</script>")
out = root / "JUGAR-SIN-INSTALAR.html"
out.write_text(html, encoding="utf-8")
print(out, out.stat().st_size, "bytes")
