# ASHEN VEIL 404 — REBIRTH v2.9.0 · Validación de candidata

## Verificado en esta versión

- Seis archivos principales de partida coincidían byte a byte entre el ZIP v2.8 y `main`, commit `f45448b`.
- `node tests/campaign.mjs` recorrió desde cero los dos desenlaces con eventos de teclado y ratón y el bucle real de simulación. Comprueba llave, puerta, atajo, campana, frascos, jefe, final y reapertura de la partida. El arnés lee la posición de los enemigos para orientar al jugador. No modifica la posición, vida o progresión del juego.
- El mismo arnés comprueba la carga de un guardado v2, pausa, diario y entrada de mando con un Gamepad estándar simulado. La persistencia se comprueba entre dos instancias del juego con un almacén simulado.
- El escenario de la Cripta se renderizó y revisó en Canvas nativo. Se regeneró la edición autónoma y se comprobaron la sintaxis de ambos JavaScript, el lanzador Bash y las pruebas Python.

## Pendiente para publicación estable

- Chromium terminó al arrancar por una restricción del entorno al crear sockets Unix. Chrome compartido bloqueó la apertura del archivo local.
- Validar en navegador el guardado entre sesiones, el HTML autónomo, los menús y el sonido. Probar los lanzadores en Windows y Linux y el mando, la interfaz y el rendimiento en Steam Deck. Falta también una partida humana completa para ajustar el ritmo y la dificultad.

---

## Registro histórico v2.8.0

Fecha: 12/11/2026. Ejecutado con Python Playwright + Chromium, HTML único insertado mediante `set_content` porque el navegador de esta infraestructura restringe `file://`.

## Pruebas automatizadas realizadas (9/9 PASS)
- `browser_smoke.py`: arranque, movimiento, magia, estamina, mapa e inventario.
- `browser_v22_regression.py`: animaciones y efectos.
- `browser_v23_mechanics.py`: palanca, osario, tablillas y trampas.
- `browser_v24_progression.py`: accesibilidad por fases, llave, puerta, secreto, jefe y final; restauración con almacenamiento simulado.
- `browser_v25_art.py`: texturas y decoraciones.
- `browser_v26_quest.py`: misión de los tres Ecos, recompensas únicas.
- `browser_v27_combat.py`: dirección de golpes, patrones, jefe y ataque fuerte.
- `browser_v28_seals.py`: dos sellos opcionales, premio único de 60 cenizas cada uno, atenuación de daño del jefe de 40 a 28 y diario de descubrimientos.
- `browser_visual_regression.py`: giro de cámara, pausa e inventario.

## Nueva mecánica
Los sellos están en la Cripta del Despertar y la Capilla Oculta. Pulsa E cerca de cada uno. Dan +60 cenizas y reducen cada uno un 15 % los golpes del Vigía (acumulación aditiva; 30 % con ambos). Son opcionales: no impiden terminar la campaña. Los estados `sealsBroken` y `zonesVisited` se guardan conservando la misma clave v2; partidas anteriores sin esos campos se leen con valores vacíos.

## Limitaciones
- La prueba de progreso es una simulación por estados y rutas, no una partida humana íntegra hasta los créditos.
- La restauración se ha probado con almacenamiento simulado; falta validar guardados en un navegador físico entre sesiones.
- Los scripts de arranque han sido inspeccionados; no se han probado en máquinas físicas Windows y Linux Mint.
- No se han medido los FPS en hardware real ni equilibrado la duración de una campaña de 1–2 horas.
