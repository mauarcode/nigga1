@echo off
setlocal EnableDelayedExpansion

rem ===============================
rem   BARBERIA ELITE - START ALL
rem ===============================

rem Go to script directory and set vars
cd /d "%~dp0"
set "ROOT=%~dp0"
set "VENV=%ROOT%.venv"
set "PY=%VENV%\Scripts\python.exe"

echo(
echo ========================================
echo   BARBERIA ELITE - START
echo ========================================
echo(

echo [0/5] Checking virtualenv (.venv)...
if not exist "%PY%" (
  echo [INFO] Creating .venv ...
  py -3 -m venv "%VENV%" 2>nul || python -m venv "%VENV%" 2>nul
)
if not exist "%PY%" (
  echo [ERROR] Could not create .venv
  pause
  exit /b 1
)

echo [1/5] Python in venv...
"%PY%" --version >nul 2>&1 || ( echo [ERROR] Python not responding & pause & exit /b 1 )
echo [OK] Python ready

echo [2/5] Installing Python deps...
"%PY%" -m pip --version >nul 2>&1 || "%PY%" -m ensurepip --upgrade >nul 2>&1
"%PY%" -m pip install --upgrade pip setuptools wheel >nul 2>&1
"%PY%" -m pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
  echo [WARN] Retrying without cache...
  "%PY%" -m pip install --no-cache-dir -r requirements.txt || ( echo [ERROR] pip install failed & pause & exit /b 1 )
)
echo [OK] Deps installed

echo [3/5] Verifying Django...
"%PY%" -c "import django; print(django.get_version())" >nul 2>&1 || ( echo [ERROR] Django not available & pause & exit /b 1 )
echo [OK] Django OK

echo [4/5] Migrating DB...
if not exist "db.sqlite3" (
  "%PY%" manage.py migrate --no-input || ( echo [ERROR] migrate failed & pause & exit /b 1 )
  "%PY%" -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','barberia_backend.settings'); import django; django.setup(); from django.contrib.auth import get_user_model; U=get_user_model(); u=U.objects.filter(username='admin').first(); import sys; sys.exit(0) if u else (U.objects.create_superuser('admin','admin@example.com','admin123', rol='admin') and 0)" >nul 2>&1
) else (
  "%PY%" manage.py migrate --no-input >nul 2>&1
)
echo [OK] DB ready

echo(
echo ========================================
echo   STARTING SERVICES
echo ========================================
echo(

echo [5/5] Starting Backend (Django)...
start "BACKEND - Django [DO NOT CLOSE]" cmd /k "%PY%" manage.py runserver

rem Wait and verify backend is running
echo [INFO] Waiting for backend to start...
set BACKEND_READY=0
for /L %%i in (1,1,15) do (
  timeout /t 1 /nobreak >nul
  netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
  if !ERRORLEVEL! EQU 0 (
    set BACKEND_READY=1
    goto :backend_ready
  )
  echo [INFO] Checking backend... %%i/15
)
:backend_ready

if !BACKEND_READY! EQU 1 (
  echo [OK] Backend is running on port 8000
) else (
  echo [WARN] Backend may not be ready yet
  echo [INFO] Check the BACKEND window for errors
)

echo(
echo Starting Frontend (Next.js)...
start "FRONTEND - Next.js [DO NOT CLOSE]" cmd /k "%ROOT%frontend\start_frontend.bat"

rem Wait and verify frontend is running
echo [INFO] Waiting for frontend to compile...
set FRONTEND_READY=0
for /L %%i in (1,1,40) do (
  timeout /t 1 /nobreak >nul
  netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
  if !ERRORLEVEL! EQU 0 (
    set FRONTEND_READY=1
    goto :frontend_ready
  )
  if %%i LSS 5 (
    echo [INFO] Waiting for npm install...
  ) else (
    echo [INFO] Compiling Next.js... %%i/40
  )
)
:frontend_ready

if !FRONTEND_READY! EQU 1 (
  echo [OK] Frontend is running on port 3000
) else (
  echo [WARN] Frontend may not be ready yet
  echo [INFO] Check the FRONTEND window for errors
)

echo(
echo ========================================
echo   SERVICES STATUS
echo ========================================
echo(

if !BACKEND_READY! EQU 1 (
  echo [OK] Backend:  http://localhost:8000
) else (
  echo [WARN] Backend: Not responding yet
)

if !FRONTEND_READY! EQU 1 (
  echo [OK] Frontend: http://localhost:3000
) else (
  echo [WARN] Frontend: Not responding yet
)

echo(
if !BACKEND_READY! EQU 1 if !FRONTEND_READY! EQU 1 (
  echo [SUCCESS] Both services are ready!
  echo [INFO] Opening browser...
  timeout /t 3 /nobreak >nul
  start http://localhost:3000
) else (
  echo [WARN] One or more services are not ready
  echo [INFO] Wait 30 seconds and open manually: http://localhost:3000
)

echo(
echo ========================================
echo   IMPORTANT
echo ========================================
echo(
echo Credentials: admin / admin123
echo(
echo Keep both windows open while using the system.
echo If you see errors, check the RED and GREEN windows.
echo(
pause
