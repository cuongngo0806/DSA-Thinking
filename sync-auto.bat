@echo off
cd /d "%~dp0"
title DSA Compass - auto sync
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync.ps1" -Watch
pause
