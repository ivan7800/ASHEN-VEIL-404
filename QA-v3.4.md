# QA de Arquitectura del Velo · v3.4.0

Base de comparación: `main` en `8b8ce658a7fc8c69bc3f077297baebaa9399dc56`. Las capturas de cámara fija se obtuvieron desde las mismas posiciones y orientaciones en ambas versiones. La prueba de campaña toma además capturas durante el recorrido.

| Zona | Observación de partida | Cambio |
| --- | --- | --- |
| Cripta del Despertar | El brasero se veía desde la entrada, pero el fondo repetía arcos. | Nave de losas, pórtico iluminado y nichos funerarios. |
| Catacumbas de los Olvidados | Los hongos y pilares daban color; el osario se perdía en el perímetro. | Estantes de huesos sobre la pared sur y losas transversales hacia el osario. |
| Capilla Oculta | Las raíces en primer plano daban carácter y ocultaban parte del recinto. | Raíces incorporadas al relieve, piedra rota y losas en torno al Corazón. |
| Santuario del Vigía | El Vigía dominaba el centro, con un fondo de arcos uniformes. | Eje de losas, cabecera iluminada y dos agujas junto al sello. |
| Nave Inundada | El agua distinguía la zona, pero faltaba un borde legible. | Rejilla sugerida, pilastras y línea de marea. |
| Patio de la Sal | El recorrido funcionaba; la grúa se mencionaba sin una silueta clara. | Grúa, pila y canales de drenaje. |
| Archivo de los Ausentes | Los libros estaban dibujados dentro del mismo arco que en otras zonas. | Estantes rectos y atril junto al acta. |
| Huerto de las Voces | El árbol claro se distinguía; el hueco y la silla necesitaban presencia. | Árbol hueco, silla y bancales. |
| Estación de Sondas | El manómetro tapaba parte de la vista al acercarse. | Manómetro desplazado hacia el borde, conducciones, rejillas y contrapeso. |
| Cámara del Cielo Inmóvil | La esfera dominaba la imagen y ocultaba el fondo. | Esfera a menor escala, órbitas marcadas y espejos a los lados. |

- `node tests/campaign.mjs` recorre ambos finales, los cinco ramales y 25 hallazgos. Prueba combates, trampas, armas, atajos, ecos, guardados v2, recuperación después de morir y elección del Archivo. Los guardados de la prueba viven en memoria.
- La comprobación de arquitectura verifica las diez regiones, que cada relieve tenga muro fijo y paso abierto delante, y que los hitos estén en celdas transitables. La decoración no escribe sobre la cuadrícula de colisión. Los desniveles y el agua profunda son recursos visuales.
- Once pruebas Playwright aprobadas en Chromium Headless 1193. Se probaron escritorio, tacto emulado, recursos bajo subdirectorio y el HTML autónomo desde `file://`. Se generó el HTML con `python3 tools/build_singlefile.py`; el arnés compara la copia integrada con las fuentes.
- La medición de Canvas nativo usa 120 imágenes de la Cripta por modo. Las mediciones varían con la carga del entorno y no representan FPS de un dispositivo móvil.
- Pendientes de validación directa: Safari, dispositivos móviles físicos y duración de una primera partida humana.

Para reproducir las capturas, ejecuta `ASHEN_CAPTURE=/ruta/capturas node tests/campaign.mjs` con `@napi-rs/canvas` instalado en `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.
