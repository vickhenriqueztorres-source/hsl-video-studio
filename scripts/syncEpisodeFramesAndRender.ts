import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const root = process.cwd();
const episodeId = process.argv[2] || 'HSL_EPISODE_016';

const manifestPath = path.resolve('C:/Users/brend/OneDrive/Desktop/PROJETO 30K ATE 27/02 - O OUTRO LADO/AUTOMACAO - O OUTRO LADO/chatgpt-image-bot/output/manifest.jsonl');
const framesDir = path.resolve(root, 'runs', episodeId, 'frames');
const publicFramesDir = path.resolve(root, 'public', 'runs', episodeId, 'frames');
const startFramesDir = path.resolve(root, 'runs', episodeId, 'start-frames');

fs.mkdirSync(framesDir, { recursive: true });
fs.mkdirSync(publicFramesDir, { recursive: true });
fs.mkdirSync(startFramesDir, { recursive: true });

console.log(`=======================================================`);
console.log(`🔄 SINCRONIZADOR DE FRAMES: ${episodeId}`);
console.log(`=======================================================`);
console.log(`📋 Manifesto de imagens: ${manifestPath}`);

if (!fs.existsSync(manifestPath)) {
  console.error(`❌ Arquivo de manifesto não encontrado em: ${manifestPath}`);
  process.exit(1);
}

const lines = fs.readFileSync(manifestPath, 'utf8').split(/\r?\n/).filter(Boolean);
let updatedCount = 0;

for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    if (entry.status === 'success' && entry.filepath && fs.existsSync(entry.filepath)) {
      const match = (entry.prompt || '').match(/\[(SCENE_\d+)\]/i);
      if (match) {
        const sceneId = match[1].toUpperCase();
        const targetFileName = `${sceneId}.png`;
        const dest1 = path.join(framesDir, targetFileName);
        const dest2 = path.join(publicFramesDir, targetFileName);
        const dest3 = path.join(startFramesDir, targetFileName);

        fs.copyFileSync(entry.filepath, dest1);
        fs.copyFileSync(entry.filepath, dest2);
        fs.copyFileSync(entry.filepath, dest3);
        console.log(`✅ [${sceneId}] Frame atualizado: ${entry.filename} -> ${dest1}`);
        updatedCount++;
      }
    }
  } catch {}
}

console.log(`\n📊 Total de frames fotorrealistas sincronizados: ${updatedCount}`);

if (updatedCount > 0) {
  console.log(`\n🎬 Iniciando re-renderização visual e mixagem final do episódio ${episodeId}...`);

  console.log(`\n▶️ [Passo 1/2] STAGE_07_REMOTION_RENDER...`);
  const r1 = spawnSync('npx.cmd', ['ts-node', '-T', 'scripts/hslStageBridge.ts', '--stage', 'STAGE_07_REMOTION_RENDER', '--episode-id', episodeId], {
    stdio: 'inherit',
    cwd: root
  });

  if (r1.status !== 0) {
    console.error(`❌ Falha no STAGE_07_REMOTION_RENDER`);
    process.exit(1);
  }

  console.log(`\n▶️ [Passo 2/2] STAGE_09_FFMPEG_MUX...`);
  const r2 = spawnSync('npx.cmd', ['ts-node', '-T', 'scripts/hslStageBridge.ts', '--stage', 'STAGE_09_FFMPEG_MUX', '--episode-id', episodeId], {
    stdio: 'inherit',
    cwd: root
  });

  if (r2.status !== 0) {
    console.error(`❌ Falha no STAGE_09_FFMPEG_MUX`);
    process.exit(1);
  }

  console.log(`\n🎉 Episódio ${episodeId} re-renderizado com sucesso com as novas imagens!`);
} else {
  console.log(`ℹ️ Nenhuma imagem com tag [SCENE_xxx] encontrada no manifesto ainda. Execute o gerador do bot primeiro.`);
}
