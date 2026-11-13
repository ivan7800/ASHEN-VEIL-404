#!/usr/bin/env bash
set -u
cd -- "$(dirname -- "${BASH_SOURCE[0]}")" || exit 1
game="$PWD/JUGAR-SIN-INSTALAR.html"
if [[ ! -f "$game" ]]; then
  printf '%s\n' 'No se encuentra el juego. Extrae el ZIP completo.' >&2
  exit 1
fi
for browser in xdg-open firefox chromium chromium-browser google-chrome; do
  if command -v "$browser" >/dev/null 2>&1 && "$browser" "$game"; then exit 0; fi
done
printf 'Abre manualmente este archivo en un navegador:\n%s\n' "$game" >&2
exit 1
