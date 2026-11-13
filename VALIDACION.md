# Validación de la versión Cosmic Horror Remaster v3.1.1

Corrección de animación sobre la versión v3.1.0. Se mantienen el trazado, los mecanismos y las condiciones de ambos finales de v2.9.

| Ámbito | Resultado |
| --- | --- |
| Campaña automatizada | Dos recorridos desde la cripta por teclado y ratón con el bucle normal. El arnés lee posiciones para apuntar. Los recorridos no cambian posición, vida ni progresión directamente. |
| Exploración y finales | Llave, puerta, altar, capilla, reliquia, atajo, dos ritos, tres ecos, campana y jefe. Se reanuda antes del Vigía y se vuelven a abrir ambos finales desde el guardado. |
| Espada | Trayectoria muestreada para ataques ligero y fuerte: el tajo avanza en una dirección y la recuperación cambia de arco; sin retorno inverso por la misma trayectoria. |
| Pruebas aisladas | Paredes y esquinas, alcance, magia obstruida, aguante, bloqueo frontal y por detrás, esquiva, patrones del Penitente y el Campanero, onda de la fase 2 del Vigía, trampas, osario, diario, muerte y recuperación única de cenizas. Estas pruebas preparan estados concretos. |
| Guardados simulados | Carga de v2 anterior, progreso parcial, posición inaccesible con copia, archivo corrupto conservado e importe inválido de cenizas descartado. Ajustes y partida en claves distintas. |
| Controles y arranque | Arranque, pausa, mapa, diario y entrada Gamepad estándar simulada. Sintaxis JS, Bash y Python. Se verificaron los recursos y elementos DOM de ambas ediciones y la correspondencia de los bloques JS del HTML autónomo con el código fuente. |
| Capturas | Seis imágenes del Canvas nativo durante el recorrido. Muestran las cinco zonas y el Penitente, el Campanero y el Vigía. La interfaz HTML del navegador queda fuera de estas capturas. |
| Lanzador Linux | Sintaxis y ejecución con aplicaciones sustitutas. Ruta con espacios, alternativa si falla `xdg-open` y mensaje si falta el HTML. |
| Chromium | Diez pruebas Playwright intentadas. El navegador no arrancó debido a la restricción de sockets Unix. El Chrome compartido tampoco conectó con el servidor local. Cero pruebas Playwright aprobadas. |

## Rendimiento

120 imágenes por modo en la cripta, con 16 imágenes de calentamiento y cambios de orientación. Muestras en Node y Canvas nativo a 480 × 270. El coste varió entre ejecuciones. El modo ligero reduce rayos y muestras. Los suelos y paredes comparten búfer y los sprites se dibujan por tramos visibles.

| Modo | Medianas observadas | P95 observado |
| --- | ---: | ---: |
| Normal | 31,48–63,56 ms | 47,06–150,71 ms |
| Ligero | 11,13–22,15 ms | 14,06–34,26 ms |

La medición de CPU excluye DOM, GPU y temporización del navegador. Los objetivos de 60/30 FPS en el navegador siguen pendientes de validación.

## Guardado

- Clave `ashen-veil-rebirth-v2`. Campos requeridos `version: 2`, `x` e `y` finitos.
- Estado opcional de ángulo, punto de control, vida, cenizas, nivel, frascos, éter, objetos, puertas, enemigos, rituales, campana y final. Se validan las listas por ID. Los campos ausentes toman el valor inicial o se infieren, como ocurría en v2 con los frascos.
- Una posición dentro de un muro se recupera desde el altar y conserva el original en `ashen-veil-rebirth-v2-backup`. Un archivo ilegible, de otra versión o sin coordenadas finitas permanece intacto y suspende la escritura de esa sesión.
- Preferencias en `ashen-veil-remaster-options`.

## Incidencias corregidas

1. Las espinas anunciaban su fase activa después del daño. El aviso ahora la precede y comparte reloj con el mapa.
2. El bloqueo protegía desde atrás. Ahora requiere apuntar hacia la amenaza y disponer de aguante. Ataques y magia comparten el raycasting de paredes y esquinas.
3. El Testigo podía quedarse empujando contra paredes. Invierte su paso lateral al atascarse y los enemigos alertados elegibles buscan rutas alrededor de recodos.
4. Las cenizas podían recuperarse a través de paredes y un importe inválido podía propagarse al saldo. Se comprueban visibilidad, formato y rango.
5. El autoguardado podía sobrescribir un archivo ilegible. La escritura queda suspendida y el menú indica el motivo.
6. El lanzador Linux se detenía al fallar `xdg-open`. Ahora prueba otros navegadores y muestra la ruta del HTML si no puede abrirlo.
7. La animación del arma repetía hacia atrás el arco del golpe. El tajo y la recuperación ahora tienen trayectorias separadas, comprobadas con muestras para ambos tipos de ataque.

## Pendiente antes de fusionar

- Pasar Playwright y comprobar persistencia real, HTML mediante `file://`, volumen y reproducción efectiva de sonido y escalado de la interfaz.
- Probar Windows, Linux Mint y el mando físico. Medir FPS y memoria sostenida en escritorio y Steam Deck.
- Hacer una partida humana completa para valorar equilibrio, audio, ritmo y legibilidad. La candidata muestra mejoras comprobables de arte y simulación. La puntuación de la experiencia queda pendiente de esta prueba.
