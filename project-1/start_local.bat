@echo off
title StudyAI Local Development Server
echo ======================================================================
echo   StudyAI Local Development (Offline/Localhost Only)
echo   UI: http://localhost:5173  |  API: http://localhost:8000
echo ======================================================================
cd /d "%~dp0"
start "StudyAI Backend" python -m uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir backend --reload
npm run dev -- --host 127.0.0.1 --port 5173
pause
