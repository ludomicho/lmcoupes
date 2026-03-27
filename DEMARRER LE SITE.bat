@echo off
title LM Coupes — Serveur
color 0A
echo.
echo  ============================================
echo   LM COUPES — Demarrage du serveur...
echo  ============================================
echo.

cd /d "%~dp0"

IF NOT EXIST node_modules (
  echo  Installation des modules (premiere fois)...
  npm install
  echo.
)

echo  Serveur demarre sur http://localhost:3000
echo  Ouvre cette adresse dans ton navigateur.
echo.
echo  Appuie sur Ctrl+C pour arreter le serveur.
echo.

start "" http://localhost:3000
node server.js

pause
