@echo off
echo ===============================
echo  📦 Avvio deploy del progetto
echo ===============================

:: Cambia directory al progetto (solo se lo salvi fuori)
:: cd C:\Users\Gioahn\Percorso\al\progetto

:: Aggiungi tutti i file modificati
git add .

:: Chiedi un messaggio di commit all'utente
set /p commitMsg="Scrivi il messaggio di commit: "

:: Esegui il commit
git commit -m "%commitMsg%"

:: Fai il push
git push origin main

echo ===============================
echo  ✅ Deploy completato!
echo ===============================
pause
