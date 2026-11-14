# QA · ASHEN VEIL 404 v3.8.0

## Alcance

Se conserva la campaña v3.7.1 descrita en [QA-v3.7.md](QA-v3.7.md). Esta entrega completa el menú y el control con mando estándar de la API Gamepad: cruceta para navegar, A para confirmar, B para volver, ajustes de sensibilidad y zona muerta persistentes, y aviso de conexión. No cambia el formato de guardado de la partida.

## Reproducción y resultados

```bash
python3 tools/build_singlefile.py
node tests/campaign.mjs
ASHEN_CHROMIUM=/ruta/a/chromium python3 tests/browser_v38_controller.py
for file in tests/browser_*.py; do
  [ "$file" = tests/browser_runtime.py ] || ASHEN_CHROMIUM=/ruta/a/chromium python3 "$file" || exit 1
done
git diff --check
```

- El HTML autónomo se regeneró desde las fuentes modulares. El arnés completó los dos finales, cinco ramales, diez umbrales, guardado y carga, muerte, combate y 29 hallazgos.
- Los **14 scripts de navegador** pasaron en Chromium Headless 140.0.7339.0, incluidos escritorio y tamaños móviles emulados. No se detectaron excepciones JavaScript en los recorridos.
- `browser_v38_controller.py` emuló un mando estándar mediante `navigator.getGamepads`: navegación y confirmación del menú, cambios de deslizadores, persistencia tras recarga, movimiento, cámara, reposo sin deriva bajo la zona muerta, pausa, diario, desconexión, reconexión y uso posterior del teclado.
- El menú con Ajustes abierto cabe en 1280 × 720 y 390 × 844 sin desbordamiento horizontal. Se conservaron los tonos de hierro y pergamino y el foco visible.
- `git diff --check` y la generación reproducible del HTML autónomo pasaron.

## Límites

La prueba de mando usa la API emulada, **no un mando físico**. No se ha medido la latencia, la compatibilidad de modelos concretos ni la ergonomía en una sesión larga. Chromium 140 en este entorno no dibuja el texto en las capturas headless, aunque el DOM, los cuadros de posición y las interacciones sí se comprobaron; el Chromium 156 del sistema no arranca por una restricción de sockets. Las capturas de este entorno no validan la tipografía. No se probaron dispositivos móviles físicos, Safari ni Firefox. La duración y el ritmo de una primera partida requieren una evaluación humana.
