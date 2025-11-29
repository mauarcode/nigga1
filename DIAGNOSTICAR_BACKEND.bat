@echo off
cd /d "%~dp0"

echo(
echo ========================================
echo   DIAGNOSTICO DE BACKEND
echo ========================================
echo(

echo [1/4] Verificando Python y Django...
.\.venv\Scripts\python.exe -c "import django; print('Django version:', django.get_version())"
if errorlevel 1 (
  echo [ERROR] Django no esta disponible
  pause
  exit /b 1
)

echo(
echo [2/4] Verificando configuracion de Django...
.\.venv\Scripts\python.exe manage.py check
if errorlevel 1 (
  echo [ERROR] Hay problemas en la configuracion
  pause
  exit /b 1
)

echo(
echo [3/4] Verificando migraciones...
.\.venv\Scripts\python.exe manage.py showmigrations
if errorlevel 1 (
  echo [ERROR] Problema con migraciones
  pause
  exit /b 1
)

echo(
echo [4/4] Intentando iniciar el servidor...
echo(
echo ========================================
echo   Si ves errores AQUI, ese es el problema
echo ========================================
echo(
echo Presiona Ctrl+C para detener cuando termines de revisar
echo(
.\.venv\Scripts\python.exe manage.py runserver

pause


