@echo off
cd /d "%~dp0"
title DSA Compass - auto sync
npm run sync -- --watch
pause
