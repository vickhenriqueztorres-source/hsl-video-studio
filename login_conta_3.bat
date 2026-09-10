@echo off
chcp 65001 > nul
echo ===================================================
echo   LOGIN NO CHATGPT - CONTA 3
echo ===================================================
cd /d "C:\Users\brend\OneDrive\Desktop\PROJETO 30K ATE 27\02 - O OUTRO LADO\AUTOMACAO - O OUTRO LADO\chatgpt-image-bot"
python -u -m src.main --setup-login --account 3
pause