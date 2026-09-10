@echo off
chcp 65001 > nul
echo =======================================================
echo   ATUALIZAR VÍDEO DO EPISÓDIO 016 COM NOVOS FRAMES
echo =======================================================
echo Sincronizando imagens geradas pelo bot e re-renderizando...
echo.
npx ts-node -T scripts/syncEpisodeFramesAndRender.ts HSL_EPISODE_016
pause
