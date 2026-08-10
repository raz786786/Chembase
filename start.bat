@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

title ChemBase Pro - Chemical Engineering Companion
color 0A

echo.
echo  =============================================
echo    ChemBase Pro - Chemical Engineering Companion
echo    Starting Backend + Frontend...
echo  =============================================
echo.

:: Kill any existing processes on our ports
echo [INFO] Clearing ports 9222 and 5800...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9222 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5800 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1

:: ── Detect Python ───────────────────────────────
set "PY="
if exist "%LocalAppData%\Programs\Python\Python312\python.exe" (
    set "PY=%LocalAppData%\Programs\Python\Python312\python.exe"
) else (
    python --version >nul 2>&1
    if !ERRORLEVEL! equ 0 set "PY=python"
    if not defined PY (
        py --version >nul 2>&1
        if !ERRORLEVEL! equ 0 set "PY=py"
    )
)
if not defined PY (
    echo [ERROR] Python not found! Run install.bat first.
    pause & exit /b 1
)

:: ── Detect npm ──────────────────────────────────
if exist "%ProgramFiles%\nodejs\npm.cmd" (
    set "NPM=%ProgramFiles%\nodejs\npm.cmd"
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
) else (
    set "NPM=npm"
)

:: ── Start Backend ───────────────────────────────
echo [1/2] Starting Backend (FastAPI) on http://127.0.0.1:9222 ...
start "ChemBase-Backend" cmd /k "title ChemBase Backend (Port 9222) & color 0B & cd /d ""%~dp0backend"" & call .venv\Scripts\activate.bat & python -m uvicorn app.main:app --host 127.0.0.1 --port 9222 --reload"

:: Wait for backend to initialize
echo      Waiting for backend to start...
ping 127.0.0.1 -n 5 > nul

:: ── Start Frontend ──────────────────────────────
echo [2/2] Starting Frontend (Vite) on http://localhost:5800 ...
start "ChemBase-Frontend" cmd /k "title ChemBase Frontend (Port 5800) & color 0E & cd /d ""%~dp0frontend"" & call "!NPM!" run dev"

:: Wait for frontend to initialize
ping 127.0.0.1 -n 4 > nul

echo.
echo  =============================================
echo    ChemBase Pro is running!
echo.
echo    Frontend:  http://localhost:5800
echo    Backend:   http://127.0.0.1:9222
echo    API Docs:  http://127.0.0.1:9222/docs
echo.
echo    Close this window to keep servers running.
echo    Or press any key to STOP all servers.
echo  =============================================
echo.
pause

:: Cleanup - kill both servers
echo.
echo [INFO] Shutting down servers...
taskkill /FI "WindowTitle eq ChemBase Backend*" /F >nul 2>&1
taskkill /FI "WindowTitle eq ChemBase Frontend*" /F >nul 2>&1
echo [DONE] All servers stopped.
timeout /t 2 /nobreak >nul
