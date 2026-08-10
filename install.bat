@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

title Chemical Analysis - Installer
color 0A

echo.
echo  =============================================
echo    Chemical Analysis - Zero-Setup Installer
echo  =============================================
echo.

:: ── PYTHON ──────────────────────────────────────
echo [1/4] Checking for Python...

if exist "%LocalAppData%\Programs\Python\Python312\python.exe" (
    set "PY=%LocalAppData%\Programs\Python\Python312\python.exe"
    goto python_found
)

python --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PY=python"
    goto python_found
)

py --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PY=py"
    goto python_found
)

echo       Python not found. Downloading Python 3.12.2...
curl.exe -L --progress-bar -o "%~dp0_python_setup.exe" "https://www.python.org/ftp/python/3.12.2/python-3.12.2-amd64.exe"
if not exist "%~dp0_python_setup.exe" (
    echo [ERROR] Download failed. Check your internet connection.
    pause & exit /b 1
)
echo       Installing Python silently (this takes ~60 seconds)...
start /wait "" "%~dp0_python_setup.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_test=0
del /q "%~dp0_python_setup.exe" 2>nul

set "PY=%LocalAppData%\Programs\Python\Python312\python.exe"
if not exist "!PY!" (
    python --version >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        set "PY=python"
    ) else (
        echo [ERROR] Could not locate Python after install. Please install manually from https://python.org
        pause & exit /b 1
    )
)
echo       Python installed successfully.

:python_found
echo       Using: !PY!

:: ── NODE.JS ─────────────────────────────────────
echo [2/4] Checking for Node.js...

if exist "%ProgramFiles%\nodejs\npm.cmd" (
    set "NPM=%ProgramFiles%\nodejs\npm.cmd"
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    goto node_found
)

where.exe npm.cmd >nul 2>&1
if !ERRORLEVEL! equ 0 (
    for /f "delims=" %%i in ('where.exe npm.cmd') do set "NPM=%%i"
    goto node_found
)

echo       Node.js not found. Downloading Node.js 20 LTS...
curl.exe -L --progress-bar -o "%~dp0_node_setup.msi" "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
if not exist "%~dp0_node_setup.msi" (
    echo [ERROR] Download failed. Check your internet connection.
    pause & exit /b 1
)
echo       Installing Node.js silently (this takes ~60 seconds)...
start /wait msiexec /i "%~dp0_node_setup.msi" /qn /norestart
del /q "%~dp0_node_setup.msi" 2>nul

set "NPM=%ProgramFiles%\nodejs\npm.cmd"
if not exist "!NPM!" (
    echo [ERROR] Could not locate npm after install. Please install Node.js manually from https://nodejs.org
    pause & exit /b 1
)
set "PATH=%ProgramFiles%\nodejs;%PATH%"
echo       Node.js installed successfully.

:node_found
echo       Using: !NPM!


:: ── BACKEND SETUP ───────────────────────────────
echo [3/4] Setting up Python backend...
cd /d "%~dp0backend"
if not exist .venv (
    "!PY!" -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install --quiet --upgrade pip setuptools wheel
python -m pip install --quiet -r requirements.txt
echo       Backend dependencies installed.
cd /d "%~dp0"


:: ── FRONTEND SETUP ──────────────────────────────
echo [4/4] Setting up React frontend...
cd /d "%~dp0frontend"
call "!NPM!" install
echo       Frontend dependencies installed.
cd /d "%~dp0"

echo.
echo  =============================================
echo    Installation Complete!
echo    Now double-click  start.bat  to run the app.
echo  =============================================
echo.
pause

