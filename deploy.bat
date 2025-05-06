@echo off
cd /d "%~dp0"
echo ===============================
echo  📦 Avvio deploy del progetto
echo ===============================

git add .
set /p commitMsg=Scrivi il messaggio di commit: 
git commit -m "%commitMsg%"
git push origin main

echo ===============================
echo  ✅ Deploy completato!
echo ===============================
pause
