# QA · El peso del hierro v3.3.0

Base: `main` 6e11eb09e86ba454e6900455b6e9a740652d1976.

- `node tests/campaign.mjs`: aprobado. Dos finales, cinco ramales, 25 hallazgos originales, guardado antiguo, despertar de enemigos, combate y nuevas armas recogidas y persistidas.
- Capturas de las diez zonas y animaciones ligera y fuerte generadas con Canvas nativo. Huerto revisado visualmente; las demás capturas quedan disponibles en el proceso local de QA.
- HTML autónomo generado por `python3 tools/build_singlefile.py` y comprobado byte a byte por el arnés de campaña.
- Prueba Playwright de escritorio, móvil y `file://`: no ejecutada. El ejecutable Playwright 1234 no está instalado; Chromium del sistema falla al crear el socket (`Operation not permitted`) en el aislamiento. No se afirma compatibilidad visual nueva en navegadores físicos.
- Windows, Linux Mint, Safari, mando físico, audio en altavoces y duración humana cercana a cuatro horas: pendientes de revisión directa.

La campaña automatizada usa navegación dirigida y sus tiempos no estiman duración de una partida humana.

Pages: las URLs de recursos llevan versión 3.3.1 para invalidar cachés anteriores.
