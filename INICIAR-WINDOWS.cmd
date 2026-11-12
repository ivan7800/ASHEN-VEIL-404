@echo off
setlocal
cd /d "%~dp0"
if not exist "JUGAR-SIN-INSTALAR.html" (
  echo No se ha encontrado el juego. Descomprima el ZIP completo.
  pause
  exit /b 1
)
start "" "%~dp0JUGAR-SIN-INSTALAR.html"
