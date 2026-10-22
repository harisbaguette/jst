@echo off
cd /d "%~dp0"
python scripts\serve-game.py
if errorlevel 1 pause
