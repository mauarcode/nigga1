@echo off
chcp 65001 >nul 2>&1
REM ========================================
REM   VERIFICAR INSTALACION
REM   Script para verificar que todo esté correcto
REM ========================================

cd /d "%~dp0"
cls

echo.
echo ========================================
echo   VERIFICACION DE INSTALACION
echo ========================================
echo.

REM Verificar Python del sistema
echo [1/8] Python del sistema...
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    python --version
    echo [OK] Python instalado en el sistema
) else (
    py --version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        py --version
        echo [OK] Python instalado (via py launcher^)
    ) else (
        echo [ERROR] Python no instalado
        echo Descarga desde: https://www.python.org/
    )
)

REM Verificar Node.js
echo.
echo [2/8] Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    node --version
    npm --version
    echo [OK] Node.js y npm instalados
) else (
    echo [ERROR] Node.js no instalado
    echo Ejecuta: nodejs_installer.msi
)

REM Verificar entorno virtual
echo.
echo [3/8] Entorno virtual (.venv^)...
if exist ".venv\Scripts\python.exe" (
    echo [OK] Entorno virtual existe
    .venv\Scripts\python.exe --version
) else (
    echo [AVISO] Entorno virtual no existe
    echo Se creara automaticamente al ejecutar INICIAR_TODO.bat
)

REM Verificar requirements.txt
echo.
echo [4/8] Archivo requirements.txt...
if exist "requirements.txt" (
    echo [OK] requirements.txt existe
    echo Contenido:
    type requirements.txt
) else (
    echo [ERROR] requirements.txt no existe
)

REM Verificar manage.py
echo.
echo [5/8] Archivo manage.py...
if exist "manage.py" (
    echo [OK] manage.py existe
) else (
    echo [ERROR] manage.py no existe
)

REM Verificar frontend
echo.
echo [6/8] Directorio frontend...
if exist "frontend" (
    echo [OK] Directorio frontend existe
    if exist "frontend\package.json" (
        echo [OK] package.json existe
    ) else (
        echo [ERROR] frontend\package.json no existe
    )
    if exist "frontend\node_modules" (
        echo [OK] node_modules instalado
    ) else (
        echo [AVISO] node_modules no instalado
        echo Se instalara automaticamente al ejecutar INICIAR_TODO.bat
    )
) else (
    echo [ERROR] Directorio frontend no existe
)

REM Verificar base de datos
echo.
echo [7/8] Base de datos...
if exist "db.sqlite3" (
    echo [OK] db.sqlite3 existe
) else (
    echo [AVISO] Base de datos no existe
    echo Se creara automaticamente al ejecutar INICIAR_TODO.bat
)

REM Verificar puertos
echo.
echo [8/8] Puertos 8000 y 3000...
netstat -ano | findstr ":8000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [AVISO] Puerto 8000 en uso
    echo INICIAR_TODO.bat cerrara el proceso automaticamente
) else (
    echo [OK] Puerto 8000 disponible
)
netstat -ano | findstr ":3000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [AVISO] Puerto 3000 en uso
    echo INICIAR_TODO.bat cerrara el proceso automaticamente
) else (
    echo [OK] Puerto 3000 disponible
)

echo.
echo ========================================
echo   VERIFICACION COMPLETA
echo ========================================
echo.
echo Si todos los checks estan OK o AVISO, puedes ejecutar:
echo   INICIAR_TODO.bat
echo.
echo Si hay [ERROR], corrige los problemas antes de continuar.
echo.
pause

