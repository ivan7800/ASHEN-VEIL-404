# QA · La piedra y el umbral v3.6.0

Base: `main` en `dece6c5e63ef21c8e8917817d8506d2974b01c67`, versión 3.5.0. El árbol local de referencia coincide con ese commit y el HTML inicial coincidía con el servido por GitHub Pages.

## Auditoría y comparación

| Zona | Defecto observado en v3.5.0 | Cambio revisado |
| --- | --- | --- |
| Cripta del Despertar | Las diagonales del techo competían con el pórtico funerario. | Bóveda dibujada con contraste más bajo y sombras de contacto. El eje de losas sigue visible desde el inicio. |
| Catacumbas de los Olvidados | La trama del techo y las juntas repetidas aplanaban el osario. | Nervios más discretos y remate continuo en los bordes de las losas del osario. |
| Capilla Oculta | La estatua en primer plano y las raíces tapaban parte de la cabecera. | Estatua, columna caída y raíz desplazadas hacia los lados. La vidriera y el suelo del altar forman el eje. |
| Santuario del Vigía | El suelo repetía un marco por losa y la preparación de la onda se confundía con otros ataques. | Borde continuo en la cabecera, ojo y arma con poses según el ataque, marcas de los dos radios en el suelo. |
| Nave Inundada | La rejilla y el agua compartían la misma trama. Los arcos del perímetro distraían de la ruta. | Pasarela mate, agua más oscura con reflejos breves, pilastras y línea de marea. La campanada tiene un anillo propio. |
| Patio de la Sal | La grúa quedaba recortada y una tablilla grande ocupaba la vista. | Grúa completa con gancho, marca de trabajo baja, costras de sal y canal de drenaje. |
| Archivo de los Ausentes | Los estantes alternaban con arcos repetidos y los atriles bajos y altos tenían el mismo dibujo. | Estantes rectos en los paños libres, juntas estrechas en el suelo y soportes de lectura más bajos. |
| Huerto de las Voces | La silueta del árbol hueco era plana. Una tablilla duplicaba la silla. | Tronco abierto, ramificación más clara, bancales y silla dibujada en el punto que se examina. |
| Estación de Sondas | El contrapeso colgaba sin bastidor junto a una tablilla genérica. | Contrapeso con bastidor en su punto de uso, manómetro propio, conducciones y piso remachado. |
| Cámara del Cielo Inmóvil | Cada losa repetía órbitas y los espejos figuraban como decorado junto a sus marcas. | Órbitas a escala de la sala, cartas estelares y reflejos que cambian al girar los espejos. |

Ideas para otra revisión: mayor variación entre techos y secciones con altura física. El raycasting actual dibuja desniveles sobre un plano transitable. Esta entrega usa ese plano.

Varios enemigos usaban el fotograma de preparación para el despertar. Ahora cinco criaturas tienen poses de despertar, aviso por patrón, golpe, reacción y caída. Se retiran las sacudidas del escenario durante el combate para que las marcas y las paredes coincidan. El brazo y la hoja que se ven en primera persona siguen el ataque hasta recuperar la pose inicial. El impacto usa el reloj de daño de v3.5 y la retícula distingue contacto, guardia y resonancia por forma.

La versión anterior superponía las barras con los botones táctiles en orientación vertical. Se reservó su espacio y se revisó el mapa en horizontal. El diario desplaza su contenido con el botón de cierre a la vista. Los avisos y objetivos se apilan cuando ocupan varias líneas.

## Recorridos, capturas y compatibilidad

- El arnés ejecutó ambos finales desde la Cripta por eventos de teclado y ratón. El recorrido corto duró 34,8 s de simulación y el ampliado 279,5 s, con cinco ramales, 29 hallazgos, vuelta a la mazmorra y restauración de partida. Se verificaron rutas, atajos, finales, alcance, temporización, guardados v2, muerte, cenizas y entrada de mando estándar simulada. Estos son recorridos dirigidos.
- Las pruebas de regresión verifican que los golpes produzcan efectos a partir del contacto, que las posturas del enemigo cambien con el aviso y desaparezcan al terminar la caída, y que los reflejos de los espejos respondan al estado del mecanismo.
- Doce scripts de Playwright aprobados con Chromium Headless 140.0.7339.186 en Linux. Incluyen escritorio, controles táctiles emulados, persistencia al recargar, recursos bajo un subdirectorio y arranque desde `file://`. La prueba de presentación verifica el menú, el HUD, mapa, diario, foco y reducción de efectos en 1280 × 720, 390 × 844, 320 × 568, 844 × 390 y 568 × 320.
- Se compararon diez vistas fijas con las mismas cámaras, con capturas adicionales durante ambos recorridos. En combate se revisaron 32 fotogramas por versión para las cuatro armas y 94 por versión para los nueve encuentros, incluidas las dos fases del Vigía. Las escenas preparadas sitúan al jugador y al enemigo para observar las poses como una prueba aislada. El ZIP contiene las comparativas por zona, arma, encuentro y familia de pantallas.
- El generador comprobó las rutas versionadas y el arnés comparó el JavaScript integrado con sus fuentes. El lanzador de Linux pasó sintaxis y ejecución con sustitutos de navegador, con rutas con espacios y control de archivo ausente. El lanzador Windows se conserva.
- El escritorio y cada prueba táctil de navegador usan contextos nuevos. El arnés guarda en memoria y el sitio publicado se comprueba desde un perfil aislado.
- Fuera de la cobertura: Windows físico y su lanzador en ejecución, Safari, Firefox, móviles y mandos físicos, mezcla escuchada y duración humana. El Chromium del sistema 156 no arrancó por una restricción de sockets Unix del entorno. Se usó el Chromium Headless 140 de Playwright para las comprobaciones.

## Rendimiento

Cronómetro sobre `render()` a 480 × 270 en Linux x64. Dos rondas por versión, con el orden invertido en la segunda. Cada ronda toma 100 muestras por escena y modo tras 24 imágenes de calentamiento. Los valores son intervalos entre rondas, en ms, de mediana y p95. El cronómetro del navegador mide la llamada síncrona y excluye cadencia real, composición y latencia en dispositivos.

| Escena y modo | Chromium v3.5 mediana / p95 | Chromium v3.6 mediana / p95 |
| --- | ---: | ---: |
| Cripta normal | 2,70–2,80 / 3,30–3,80 | 2,10–2,20 / 2,70–3,10 |
| Cripta ligero | 1,20 / 1,50–2,20 | 1,00 / 1,40 |
| Nave normal | 3,10–3,40 / 4,10–4,70 | 2,70–2,80 / 3,60–4,00 |
| Nave ligero | 1,55 / 2,20–2,40 | 1,30–1,35 / 1,90 |
| Onda del Vigía normal | 2,70–2,75 / 3,20–3,50 | 2,10–2,20 / 2,70–3,00 |
| Onda del Vigía ligero | 1,10 / 1,50–1,60 | 1,00 / 1,50 |

Con Node v24.22.1 y `@napi-rs/canvas` 0.1.100, las medianas normales fueron 30,43–31,34 → 28,66–30,60 en la Cripta, 35,07–35,34 → 35,95–37,42 en la Nave y 30,29–30,94 → 29,25–31,17 en el Santuario. El p95 normal subió en la Cripta (34,33–37,11 → 38,37–43,40) y se solapó entre versiones en la Nave (43,78–49,08 → 47,63–51,11). En ligero la mediana de la Nave bajó de 14,81–14,95 a 13,02–13,79. Los resultados de Canvas nativo se usan como comprobación secundaria. Queda por medir la fluidez en equipos y teléfonos físicos.

## Reproducción

```bash
python3 tools/build_singlefile.py
node tests/campaign.mjs
python3 tests/browser_v36_presentation.py
python3 tools/benchmark_renderer.py /ruta/al/checkout-v3.5.0
```

Los scripts de navegador aceptan `ASHEN_CHROMIUM` para elegir el ejecutable. Para capturar las escenas, asigna los directorios de salida a `ASHEN_CAPTURE`, `ASHEN_ENEMY_CAPTURE` y `ASHEN_SWING_CAPTURE` al ejecutar el arnés. `ASHEN_SWING_CONTACT=1` incluye un objetivo y `ASHEN_BASELINE` permite comparar con el checkout de v3.5.0. `ASHEN_RENDER_BENCH=1` activa la medición en Canvas nativo. Estas opciones requieren `@napi-rs/canvas` en `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.
