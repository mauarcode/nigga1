@echo off
setlocal

cd /d "%~dp0"

echo.
echo ========================================
echo   REINICIAR BACKEND DJANGO
echo ========================================
echo.

echo [1/3] Deteniendo procesos de Python...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq BACKEND*" 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Verificando codigo...
.\.venv\Scripts\python.exe manage.py check
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Hay problemas en el codigo
    pause
    exit /b 1
)

echo [3/3] Iniciando servidor Django...
echo.
echo ========================================
echo   SERVIDOR INICIANDO
echo ========================================
echo.
echo Backend estara en: http://localhost:8000
echo.
echo Para verificar que AllowAny funciona, abre:
echo http://localhost:8000/api/citas/horarios-disponibles/?barbero_id=1^&fecha=2025-11-01^&duracion=30
echo.
echo Debe mostrar JSON (NO error 401)
echo.
echo ========================================
echo.

.\.venv\Scripts\python.exe manage.py runserver


