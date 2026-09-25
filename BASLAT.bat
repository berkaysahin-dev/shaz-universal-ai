@echo off
cd /d "%~dp0"
chcp 65001 >nul
setlocal enabledelayedexpansion
title Vision Universal AI - Unified AI SDK & Platform (by Shaz Vision)
color 0b
cls

cd /d "%~dp0"

echo ================================================================
echo           VISION UNIVERSAL AI - UNIFIED AI SDK ENGINE
echo                     by Shaz Vision (shazvision.com)
echo ================================================================
echo.
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] .env dosyasi olusturuluyor...
        copy /Y .env.example .env >nul
    )
)

if not exist "node_modules" (
    echo [1/3] Paketler yukleniyor [npm install]...
    call npm.cmd install
    if errorlevel 1 (
        echo [HATA] npm install basarisiz oldu!
        pause
        exit /b %errorlevel%
    )
)

echo [2/3] TypeScript paketleri derleniyor (npm run build)...
call npm.cmd run build

echo [3/3] Vision Universal AI Demo Baslatiliyor...
echo.
echo ----------------------------------------------------------------
echo   Demo calistiriliyor (node demo.js)...
echo ----------------------------------------------------------------
echo.
if exist "demo.js" (
    node demo.js
) else (
    call npm.cmd test
)

echo.
pause
