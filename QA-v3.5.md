# QA · La voz del umbral v3.5.0

Base: main `72fd7f9ad7649b817e859a7b47c35a7d220411b7`. Campaña ejecutada mediante eventos de controles en el arnés con guardado aislado. La base llegó a los dos finales en 34,8 y 240,9 segundos dirigidos, con 25 hallazgos en la ruta ampliada. La candidata llegó en 34,8 y 279,5 segundos y registró 29 hallazgos. Los tiempos incluyen rutas conocidas y no estiman la duración humana.

| Zona | Observación del recorrido y del código | Segundos activos automatizados, ampliada |
| --- | --- | ---: |
| Cripta | Nave y pórtico legibles; la instrucción de la llave dirige hacia el corredor. | 38,1 |
| Patio de la Sal | La secuencia de las pilas tiene recompensa, pero la vuelta repetía camino. El torno abre un atajo. | 21,8 |
| Capilla | Raíces y Corazón identificables. La recompensa de vida y el paso secreto merecen el desvío. | 24,7 |
| Huerto | Los dos árboles son un objetivo local. La silla ahora da una razón para regresar con el acta. | 32,8 |
| Catacumbas | Llave y palanca son legibles. La defensa frontal del Carcelero favorece buscar el costado. | 43,9 |
| Archivo | La decisión cerraba un lado del acta; ahora también cambia el epílogo y abre el diálogo con la silla. | 25,1 |
| Nave | El Campanero y la onda organizan el espacio estrecho; el combate se beneficia de retroceder en la pasarela. | 9,6 |
| Sondas | Contrapeso y carta enlazan con el observatorio. El timbre adquiere una función narrativa. | 30,8 |
| Santuario | La onda ya tenía aviso; el visor da más tiempo para responder. | 17,6 |
| Cámara del Cielo | El Astrónomo indica el enigma y el visor da una ventaja antes de combatir al Vigía. | 34,9 |

- Aprobados ambos finales, los cinco ramales, las elecciones del Archivo y la persistencia, armas, muerte y cenizas, compuertas, atajos, ataque direccional y colocación de hitos. Las pruebas de combate verifican que no hay daño antes del contacto.
- Las 11 pruebas Chromium Headless 1193 cubren escritorio, toque emulado, subdirectorio, HTML autónomo y guardado del navegador. El arnés comprueba entrada de mando estándar simulada.
- Capturas de las diez zonas, despertar del Penitente y fases de cada tipo de golpe mediante ASHEN_CAPTURE y ASHEN_SWING_CAPTURE. Canvas nativo en la Cripta, 120 imágenes por modo: mediana 37,38 ms y p95 56,34 ms en normal, mediana 11,18 ms y p95 17,86 ms en ligero. Son tiempos del entorno de QA, no FPS en dispositivos físicos.
- Pendientes: partida humana sin guía para medir duración, orientación, muertes y ritmo; Safari, móviles y mandos físicos; mezcla escuchada y equilibrio de todas las combinaciones de arma y enemigo. Sigue sin medirse la distancia real a las cuatro horas. El recorrido automatizado prueba el contenido y los puntos de progresión, pero no cuantifica el volumen que faltaría para ese objetivo.
