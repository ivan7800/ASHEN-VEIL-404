# QA de Cartografía de los Ausentes · 3.2.0

Base de trabajo: `main` en `a500358a7fca0bcdd238b3f86efee2fc199601cc`. El árbol local inicial coincidía por SHA con el publicado.

| Área | Hallazgo y cambio |
| --- | --- |
| Encuentros | El altar recreaba el conjunto de enemigos, y la detección activaba la persecución sin transición. El descanso preserva el estado de los enemigos. Los nueve encuentros dan una señal visual, un aviso sonoro y entre 1,2 y 2,1 segundos de despertar antes de poder perseguir. Después sigue vigente la preparación de cada ataque. |
| Cripta y Catacumbas | La primera pista dirige hacia las luces del corredor. La inscripción sitúa el muro de la capilla y un atril marca la entrada al Archivo. Patio y Archivo conectan la impronta con una lectura del acta. |
| Capilla, Nave y Santuario | Se conservan las composiciones de raíces, agua y altar. Huerto, Sondas y Cámara añaden puntos de interés propios. La carta de Sondas se interpreta con la lente y dos espejos. |
| Campaña | Se acaba la ruta principal y la ruta restaurada por entradas normales. La segunda pasa por los cinco ramales y registra 25 hallazgos. Una prueba separada verifica la otra elección del Archivo. |
| Guardado | V2 legado, archivo ilegible, coordenadas fuera del mapa, recuperación de cenizas, recarga dentro del Archivo y retorno, reapertura de ambos finales y orientación persistente de los espejos. Los contextos de prueba tienen almacenes separados. |
| Arte y combate | Capturas de las diez zonas, reposo, aviso y despertar del Penitente y secuencias de espada ligera y fuerte. El mapa local oculta los hallazgos aún sin investigar. |
| Navegador | Once pruebas Playwright con Chromium Headless Shell 1193. Incluyen el HTML autónomo, rutas relativas bajo un subdirectorio con recursos servidos por el arnés, persistencia real en Chromium, acciones táctiles en emulación de móvil y consola sin errores en las pruebas que la registran. |
| Lanzadores | Sintaxis Bash y contenido del ZIP. Windows, Linux Mint, Safari y mando físico siguen pendientes de prueba directa. No se ha realizado una auditoría auditiva humana en altavoces o auriculares. |

El arnés de campaña se orienta con el mapa y conoce los destinos. La ruta original simulada emplea 34,8 s y la ampliada 240,9 s de reloj de juego. Estas cifras reflejan recorridos dirigidos. No estiman una partida humana. La escala actual de contenido sigue por debajo de una campaña de cuatro horas.

## Repetir

- `python3 tools/build_singlefile.py`
- `node tests/campaign.mjs`
- `ASHEN_CAPTURE=/ruta/zonas ASHEN_SWING_CAPTURE=/ruta/espada node tests/campaign.mjs` con `@napi-rs/canvas` disponible en `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.
- Ejecuta los once archivos de prueba `tests/browser_*.py` con Playwright instalado, excluyendo `browser_runtime.py`. Configura `ASHEN_CHROMIUM` si usas un Chromium distinto al instalado por Playwright.

Estado de salida: candidata en rama de trabajo. Se mantienen producción y GitHub Pages en la versión anterior hasta ampliar la campaña y validar su duración y ritmo jugando.
