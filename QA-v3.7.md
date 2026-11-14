# QA · ASHEN VEIL 404 v3.7.1

## Punto de partida

`main` estaba en `674e140804530264cff33cd23a28707dff864948` (v3.7.0), con el árbol limpio y [GitHub Pages en verde](https://github.com/ivan7800/ASHEN-VEIL-404/actions/runs/43577502562). No había instrucciones `AGENTS.md` en el repositorio ni en sus directorios padre. El generador reproducía el HTML publicado sin diferencias. El arnés alcanzaba el final corto y fallaba al entrar en el Patio: el traslado por proximidad ocurría mientras el arnés aún intentaba llegar al punto antiguo para pulsar E. Cinco pruebas de navegador seguían esperando la versión 3.6.0. La prueba de sellos leía texto dependiente de la visibilidad CSS del diario y fallaba en Chromium headless.

## Cambios y cobertura

| Área | Comprobación |
| --- | --- |
| Umbrales | Diez aperturas de ida y vuelta entre las cinco zonas y sus ramales. El arco se proyecta en el mismo plano que activa el paso. Se verificaron hueco y jambas, colisión, movimiento paralelo, espera, tecla E, cruce descentrado, orientación, regreso sin rebote, mapa y restauración de partida. |
| Campaña | Dos partidas nuevas mediante entradas de teclado y ratón en el arnés. El final restaurado cubrió los cinco ramales, 29 hallazgos y la decisión de conservar el nombre. La alternativa de borrar el nombre se comprobó aparte, incluida su persistencia. Se revisaron llaves, atajos, sellos, armas, jefe, muerte y cenizas. |
| Guardado | Conserva la versión y clave del formato v2. El guardado de 3.7.0 dentro de la abertura antigua del Archivo conserva progreso y cenizas al recolocarse en las Catacumbas. |
| Navegador | Chromium headless 140.0.7339.0. Escritorio 1280 × 720 y táctil emulado a 390 × 844, 320 × 568, 844 × 390 y 568 × 320. Menú, pausa, HUD, mapa, diario, cambios de ajustes, persistencia, versión modular en subdirectorio y HTML autónomo desde archivo local. Cinco cruces de ida y vuelta por teclado en navegador, con recarga y vigilancia de errores de consola. |
| Audio | Revisión de configuración de volumen y efecto de umbral en la ruta de movimiento. Queda por escuchar la mezcla en una partida real. |

## Reproducción

```bash
python3 tools/build_singlefile.py
node tests/campaign.mjs
for file in tests/browser_*.py; do
    [ "$file" = tests/browser_runtime.py ] || python3 "$file" || exit 1
done
python3 tools/benchmark_renderer.py /ruta/al/checkout-3.7.0
```

`ASHEN_CHROMIUM` permite elegir el ejecutable. El Chromium 156 del sistema no arrancó por una restricción de sockets Unix, por lo que se ejecutó la suite con Chromium Headless 140. `ASHEN_DOOR_CAPTURE` guarda las cinco vistas de las puertas. `ASHEN_UI_CAPTURE` guarda menú, escena, mapa y diario en los cinco tamaños. Las pruebas antiguas que generan capturas se ejecutaron en una copia temporal.

El arnés tardó 34,8 y 282,2 segundos de simulación en las dos rutas dirigidas. Para valorar el ritmo y la duración de una primera partida hace falta jugar sin conocer el mapa. La compatibilidad con móviles y mandos físicos, Safari, Firefox y lanzador Windows sigue sin verificarse.

## Resultados de 3.7.1

- Compilación reproducible, igualdad entre JavaScript modular e integrado y arnés de campaña aprobados. Se aprobaron los 13 scripts ejecutables de Playwright. Las cinco capturas de puertas y las 20 de interfaz se generaron con las opciones indicadas arriba.
- Rendimiento de Canvas a 480 × 270, dos rondas de 100 muestras por escena y modo, con 24 cuadros de calentamiento. Rangos de mediana por ronda en milisegundos:

| Escena, calidad normal | 3.7.0 | 3.7.1 |
| --- | ---: | ---: |
| Cripta | 1,90–2,10 | 1,85–2,00 |
| Nave | 2,40 | 2,40–2,60 |
| Onda del Vigía | 1,90–2,00 | 2,00 |

En modo ligero la mediana fue de 0,80–1,10 ms en la base y 0,85–1,20 ms en la candidata. El p95 máximo de la comparativa fue 5,80 ms en la base y 5,60 ms en la candidata, con variación entre escenas y rondas. Son tiempos síncronos de dibujo y no miden la latencia de entrada ni la cadencia de un dispositivo físico.
