@echo off
color 0A
echo ===================================================
echo     INICIANDO SISTEMA DE INVENTARIO...
echo ===================================================
echo.
echo Arreglando bug de Windows en la ruta...
set PATH=%PATH:"=%
set PATH=C:\Program Files\nodejs\;%PATH%

echo Levantando servidores...
npm run dev
pause
