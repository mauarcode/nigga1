@echo off
cd /d "%~dp0"

echo.
echo ========================================
echo   FRONTEND - Next.js
echo ========================================
echo   Directory: %CD%
echo ========================================
echo.

if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    npm install
)

echo [INFO] Iniciando Next.js en puerto 3000...
echo.
npm run dev
