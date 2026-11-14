# ASHEN VEIL 404 — La piedra y el umbral v3.7.0

Mazmorra de horror cósmico medieval en primera persona. [Jugar en el navegador](https://ivan7800.github.io/ASHEN-VEIL-404/). Cinco zonas originales, cinco ramales de exploración, nueve encuentros y dos finales. La campana sumergida, los Ecos del Velo y los sellos alteran el desenlace.

## Jugar

1. Extrae el ZIP completo en una carpeta.
2. En Windows, abre `INICIAR-WINDOWS.cmd`. En Linux Mint, ejecuta `bash INICIAR-LINUX.sh` en esa carpeta.
3. También puedes abrir `JUGAR-SIN-INSTALAR.html` directamente en un navegador moderno, incluso sin conexión.

Pulsa **K** para guardar o usa el botón de pausa. El navegador asigna almacenes distintos al sitio web y al archivo local. Para continuar desde el HTML local, conserva la ruta desde la que jugabas.

## Controles

| Acción | Teclado y ratón | Mando estándar |
| --- | --- | --- |
| Moverse y mirar | WASD y ratón o flechas izquierda/derecha | Sticks |
| Correr | Mayús | Pulsar stick izquierdo |
| Ataque ligero o fuerte | Clic izquierdo o H / J | RT / X |
| Bloqueo frontal | Clic derecho | LT |
| Esquivar e interactuar | Espacio / E | B / A |
| Curar o lanzar magia | F / Q | Y / RB |
| Inventario y diario | Tab | Select |
| Mapa y subida de nivel en altar | M / L | Cruceta arriba / abajo |
| Pausa | Esc | Start |
| Guardar y silenciar | K / U | Menú de pausa |

En **Ajustes** puedes regular el volumen, reducir destellos y sacudidas, y activar un modo ligero con un límite de 30 imágenes por segundo. Reducir efectos fija el agua y el emblema del menú y oculta las partículas ambientales. Los avisos del Vigía y del Campanero siguen visibles.

## Cartografía de los Ausentes

Explora los ramales cruzando sus umbrales al caminar; no hace falta pulsar una tecla para cambiar de zona. Busca los pasadizos en la cripta, las catacumbas, la capilla, la nave y el santuario. En cada ramal, el mapa muestra su propio plano. El diario conserva las pistas que ya has escuchado y los objetos que has investigado. Puedes regresar por el mismo umbral. En pantallas táctiles, usa las flechas para desplazarte y los botones curvos para girar.

## La piedra y el umbral · v3.6

La pasarela y la línea de marea distinguen la Nave. El Patio de la Sal deja ver la grúa desde el camino. Los mecanismos de Sondas, la silla del Huerto y los espejos del observatorio se reconocen al acercarse. El dibujo de los suelos y muros conserva el trazado 2.5D.

La postura del enemigo distingue el despertar, la preparación y el ataque. Las marcas en el suelo avisan de las ondas. Las cuatro armas muestran su propio golpe, y la retícula distingue el contacto normal, la guardia y la resonancia de la Aguja de Marea. En móvil, las barras quedan por encima de los botones en vertical y entre los dos grupos de controles en horizontal.

Consulta [CAMBIOS.md](CAMBIOS.md) y [QA-v3.6.md](QA-v3.6.md). Quedan por medir la duración y el ritmo de una primera partida humana.

## Cambios de v3.1.1

- El golpe de espada ya no se retrae por el mismo arco: el tajo avanza en una dirección y la recuperación completa un arco separado, con variantes para el ataque fuerte.

## Cambios de v3.1

- Relieves funerarios, raíces, piedra húmeda, hierro ritual y agua en la nave. Luz cálida en la cripta, verde mineral en el osario, violeta en la capilla y carmesí en el santuario.
- Penitente Hueco, Carcelero del Osario, Testigo Ciego y Campanero Ahogado con siluetas y señales propias. El Vigía abre su ojo al cambiar de fase y alterna barrido, estocada y onda anular.
- La reliquia abre ojos en la capilla y cambia una estatua de posición. El repique modifica el santuario. El ambiente de la nave y sus pasos usan síntesis propia.
- Bloqueo frontal, línea de visión compartida, aviso de trampas antes del daño, IA alrededor de recodos, diario de inscripciones y pantalla de muerte.

## Desarrollo

`src/game.js` contiene la campaña, guardados, controles y raycasting. `src/art.js` dibuja relieves y criaturas originales. `src/lighting.js` prepara paletas, iluminación y superficies. `src/audio.js` sintetiza el audio. Todo el arte y el audio añadidos se generan localmente.

GitHub Pages sirve `index.html` con rutas relativas. Ejecuta `python3 tools/build_singlefile.py` para regenerar el HTML autónomo. Consulta [QA-v3.6.md](QA-v3.6.md) para reproducir las comprobaciones y capturas actuales. Ejecuta `node tests/campaign.mjs` para recorrer ambos finales en el arnés.

## Historial de v2.2 a v2.8

### Contenido y mejoras de v2.2.0
- Se conservan cuatro sectores, seis enemigos incluyendo jefe, llave, puerta, secreto, reliquia, inventario, progresión y final.
- **60 fotogramas originales** (4 tipos de enemigo × 5 poses × 3 variantes). Poses: espera, desplazamiento, preparación de ataque, golpe y daño.
- Señal de amenaza ante ataques enemigos, con preparación y recuperación diferenciadas entre espectros, caballeros y jefe.
- Espectros intentan rodear al jugador en vez de avanzar siempre en línea recta.
- Efectos pixelados de impacto y hechizo, usando partículas proyectadas según la cámara.
- Ocho decoraciones nuevas: arcos, estandartes y cadenas; **20 decoraciones en total**.
- Conserva el guardado anterior bajo la clave `ashen-veil-rebirth-v2`.

## Modificación y pruebas
- Fuentes: `index.html`, `style.css`, `src/game.js`.
- Regenerar HTML autónomo: `python tools/build_singlefile.py` (solo para desarrollo; para jugar no hace falta Python).
- Tests automatizados, si tienes Python + Playwright + Chromium: `python tests/browser_smoke.py`; `python tests/browser_visual_regression.py`; `python tests/browser_v22_regression.py`.
- Captura: `tests/captura_rebirth_v22.png`.

## Limitaciones verificadas
- El motor es raycasting **2.5D**, no 3D geométrico completo; los personajes son sprites 2D.
- No hay animaciones esqueléticas. Los fotogramas son transformaciones y detalles procedurales, no una librería de animación dibujada artesanalmente.
- La prueba de persistencia del guardado está **bloqueada por el entorno Chromium** (navegación a `file://` y origen HTTPS simulado denegados). No se afirma que se haya verificado la restauración tras recargar.
- Lanzadores Windows/Linux aún no ejecutados en sistemas físicos; se ha verificado sintaxis del script Linux.
- La sesión completa de inicio a final, el balance de dificultad y la experiencia de 1–2 horas siguen pendientes de pruebas y contenido.


## v2.3 — Las Catacumbas Vivas
- Tres trampas temporizadas con aviso previo, daño y enfriamiento de impacto. La esquiva evita las espinas.
- Una palanca en las catacumbas revela un osario oculto: recompensa única de 160 cenizas.
- Dos tablillas narrativas con textos originales.
- Iconos procedurales para palanca, osario y tablillas; marcadores de trampas en el mapa.
- Estados persistentes `leverUsed`, `cacheOpened` y `tabletsRead`, sin cambiar la clave de guardado previa.
- El juego sigue siendo un prototipo 2.5D, no un mundo 3D completo.


## v2.4 — La Mazmorra Definitiva (estabilización)
- Objetivos de progresión visibles: llave, puerta, Vigía, sello y victoria.
- La muerte y el descanso vuelven a generar enemigos normales, pero **nunca resucitan al jefe ya derrotado**.
- El progreso del jefe queda registrado en partidas guardadas (`bossDefeated`) y se lee también desde partidas anteriores con `dead`/`won`.
- Restauración más segura: un guardado con coordenadas inválidas no altera las paredes, y el nivel se acota antes de calcular la vida máxima.
- Incluye verificación de conectividad del mapa, puerta y muro secreto, simulación de recorrido completo hasta los créditos y regresión de guardado.
- Nota: completar el circuito por automatización usa un *hook temporal en memoria*, no reproducimos una partida humana completa.


## v2.5 — Identidad visual de las cuatro regiones
- Cuatro familias nuevas de muros pixel art (cripta/osario, catacumbas húmedas, capilla enraizada y santuario del jefe), generadas offline por Canvas.
- Seis nuevas siluetas dibujadas por código: sarcófago, pila de huesos, hongos fosforescentes, raíces, vidriera y brasero.
- Doce nuevos elementos de escenario colocados para identificar habitaciones y caminos.
- Niebla cromática y viñeteado por región, sin afectar las colisiones, enemigos ni el guardado.
- Conserva el HTML autónomo y los lanzadores Windows/Linux.

## v2.6 — Los Ecos del Velo (exploración y encuentros)
- **Misión secundaria opcional:** tres Ecos del Velo repartidos entre cripta, catacumbas y capilla, representados mediante un nuevo sprite pixel art original.
- Cada eco aporta 90 cenizas (270 en total). Reunir los tres aumenta de forma permanente la capacidad máxima de frascos en uno.
- Dos encuentros adicionales (un caballero y un espectro) custodian las zonas opcionales: ocho enemigos en total contando el jefe.
- Tres puntos de decoración adicionales, un registro de progreso en el inventario y nuevos textos de recompensa.
- Corregida una incidencia heredada: la selección de objetos interactivos devolvía copias, por lo que algunos objetos seguían visibles tras recogerse. Ahora se opera sobre la referencia original.
- Persistencia de `echoesCollected` y `echoReward` en el guardado v2 existente. La v2.6 lee partidas anteriores que no tengan estos campos.
- Prueba principal de los tres ecos, recompensa única, minimapa e inventario: `python tests/browser_v26_quest.py`.

**Aviso:** el recorrido completo de principio a fin con un jugador real, los lanzadores en los dos sistemas físicos y el guardado persistente en el navegador real no están validados en este entorno. No se afirma que el juego tenga ya 1–2 horas de campaña.


## Novedades v2.7
Ataques telegrafiados con dirección y arco real: esquivar fuera del cono evita el golpe. Caballeros con guardia y estocada; ánimas con embestida; Vigía con barrido y estocada en segunda fase. Ataque fuerte (J) con mayor daño y aturdimiento.

## Pruebas de esta versión

Consulta `VALIDACION.md`. Para ejecutar pruebas de navegador necesitas Python, Playwright y Chromium **solo en el equipo de desarrollo**, nunca para jugar. El archivo `JUGAR-SIN-INSTALAR.html` continúa funcionando sin instalación de dependencias.

## Novedades v2.8 — Los Dos Ritos
- Dos sellos opcionales de exploración: Sepultura (cripta) y Herejía (capilla). Cada activación concede 60 cenizas y reduce un 15 % el daño infligido por el jefe. No bloquean el final.
- Diario de regiones visitadas en el inventario y mensajes de primer descubrimiento.
- Indicador de sellos opcionales junto al objetivo cuando queda pendiente derrotar al Vigía.
- Guardado compatible con v2.x, registrando sellos activados y zonas visitadas.
- Pruebas adicionales de interacción, recompensa única, reducción de daño y restauración simulada.

## El peso del hierro · v3.3

- Espada de Ceniza: equilibrada y disponible desde el inicio.
- Lanza del Cantero: hallazgo del Patio de la Sal, mayor alcance y arco estrecho.
- Hacha de Raíz: hallazgo del Huerto, golpe lento y fuerte que rompe guardias.
- Aguja de Marea: hallazgo de Sondas, alcance máximo a cambio de precisión y aguante.
- Cambia entre armas encontradas con **C**, el botón **Arma** en pantalla táctil o la **cruceta derecha** del mando. El arma equipada y las adquiridas se conservan en el guardado v2.

El menú inicial adopta hierro ennegrecido, ceniza y un marco ritual. Los hallazgos se ubican en ramales que ya forman parte del recorrido.

## Arquitectura del Velo · v3.4

Desde la Cripta, sigue las losas hacia el pórtico funerario. En los ramales, la grúa de sal, el atril del Archivo, el árbol hueco, el contrapeso de Sondas y los espejos del observatorio funcionan como referencias visuales. Las marcas de altura son parte del dibujo del escenario; el motor usa un plano transitable.

Las caras de muro, franjas de suelo, hitos y focos se configuran en `src/lighting.js`. Los relieves y siluetas se generan en `src/art.js` y se dibujan desde `src/game.js`.

## La voz del umbral · v3.5

La impronta de Sal permite abrir el torno y conecta el acta del Archivo con la silla del Huerto. Escucha la respuesta en Sondas y léela en la Cámara del Cielo antes de enfrentarte al Vigía para ganar tiempo ante su onda. La decisión del Archivo también cambia el epílogo de ambos finales.

La espada corta rápido. La lanza premia acertar con la punta. El hacha rompe guardias y barre a varios blancos a corta distancia. La Aguja de Marea aprovecha el momento en que un enemigo prepara su ataque. Cada arma aplica el daño en el momento de contacto y esquivar cancela el ataque pendiente.
