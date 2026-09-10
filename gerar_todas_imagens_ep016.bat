@echo off
chcp 65001 > nul
echo =======================================================
echo   GERAR IMAGENS DO EPISÓDIO 016 (POOL DE 3 CONTAS)
echo =======================================================
echo Iniciando gerador com rotacao automatica entre as 3 contas...
echo.
cd /d "C:\Users\brend\OneDrive\Desktop\PROJETO 30K ATE 27\02 - O OUTRO LADO\AUTOMACAO - O OUTRO LADO\chatgpt-image-bot"
python -m src.main --run
echo.
echo Concluido! Agora sincronizando e atualizando o video...
cd /d "D:\HSL STUDIO AGENTS\hsl-video-studio"
npx ts-node -T scripts/syncEpisodeFramesAndRender.ts HSL_EPISODE_016
pause
