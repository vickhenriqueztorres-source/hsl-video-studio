@echo off
chcp 65001 > nul
echo ===================================================
echo   HSL - CHATGPT IMAGE BOT (POOL DE 3 CONTAS)
echo ===================================================
cd /d "C:\Users\brend\OneDrive\Desktop\PROJETO 30K ATE 27\02 - O OUTRO LADO\AUTOMACAO - O OUTRO LADO\chatgpt-image-bot"
python -u -m src.main --run

echo.
echo ===================================================
echo   SINCRONIZANDO FRAMES E RENDERIZANDO VIDEO FINAL
echo ===================================================
cd /d "d:\HSL STUDIO AGENTS\hsl-video-studio"
npx.cmd ts-node -T scripts/syncEpisodeFramesAndRender.ts HSL_EPISODE_016

echo.
echo ===================================================
echo   PROCESSO CONCLUIDO COM SUCESSO!
echo ===================================================
pause