@echo off
setlocal
if not exist "%~dp0JUGAR-SIN-INSTALAR.html" (
  echo No se ha encontrado el juego. Descomprime el ZIP completo.
  pause
  exit /b 1
)
start "" "%~dp0JUGAR-SIN-INSTALAR.html"
if errorlevel 1 (
  echo No se pudo abrir el navegador predeterminado.
  echo Abre JUGAR-SIN-INSTALAR.html manualmente en tu navegador.
  pause
  exit /b 1
)
