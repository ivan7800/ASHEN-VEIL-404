#!/usr/bin/env python3
"""Produce an entirely offline HTML, with no external dependencies."""
from pathlib import Path
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text(encoding='utf-8')
css=(root/'style.css').read_text(encoding='utf-8')
lighting=(root/'src/lighting.js').read_text(encoding='utf-8')
js=(root/'src/game.js').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
html=html.replace('<script src="src/lighting.js"></script>','<script>'+lighting+'</script>')
html=html.replace('<script src="src/game.js"></script>','<script>'+js.replace('</script','<\\/script')+'</script>')
out=root/'JUGAR-SIN-INSTALAR.html'
out.write_text(html,encoding='utf-8')
print(out, out.stat().st_size, 'bytes')
