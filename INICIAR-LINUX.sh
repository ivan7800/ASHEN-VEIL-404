#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
if [[ ! -f JUGAR-SIN-INSTALAR.html ]]; then echo 'No se encuentra el juego. Extrae el ZIP completo.' >&2; exit 1; fi
if command -v xdg-open >/dev/null 2>&1; then xdg-open "$(pwd)/JUGAR-SIN-INSTALAR.html"
elif command -v firefox >/dev/null 2>&1; then firefox "$(pwd)/JUGAR-SIN-INSTALAR.html"
elif command -v chromium >/dev/null 2>&1; then chromium "$(pwd)/JUGAR-SIN-INSTALAR.html"
else echo 'Abre JUGAR-SIN-INSTALAR.html en un navegador.'; fi
