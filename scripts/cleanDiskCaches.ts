import fs from 'fs';
import path from 'path';

const root = process.cwd();

export function cleanDiskCaches(cleanRunsFrames = false) {
  console.log('\n================================================================');
  console.log('🧹 HSL VIDEO STUDIO // LIMPEZA PROFUNDA DE CACHES E TEMPORÁRIOS');
  console.log('================================================================');

  let freedBytes = 0;

  function safeRemove(targetPath: string, description: string) {
    if (!fs.existsSync(targetPath)) return;
    try {
      const stat = fs.statSync(targetPath);
      let size = 0;
      if (stat.isDirectory()) {
        const getDirSize = (dir: string): number => {
          let s = 0;
          for (const f of fs.readdirSync(dir)) {
            const p = path.join(dir, f);
            try {
              const st = fs.statSync(p);
              if (st.isDirectory()) s += getDirSize(p);
              else s += st.size;
            } catch {}
          }
          return s;
        };
        size = getDirSize(targetPath);
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        size = stat.size;
        fs.unlinkSync(targetPath);
      }
      freedBytes += size;
      console.log(`✅ [Removido] ${description}: ${(size / 1024 / 1024).toFixed(2)} MB liberados.`);
    } catch (e: any) {
      console.warn(`⚠️ [Aviso] Falha ao remover ${targetPath}: ${e.message}`);
    }
  }

  // 1. Limpa build/ (Webpack cache do Remotion)
  safeRemove(path.resolve(root, 'build'), 'build/ (Cache do Remotion Webpack)');

  // 2. Limpa cópias duplicadas em public/runs/ e public/public/
  safeRemove(path.resolve(root, 'public', 'runs'), 'public/runs/ (Cópias espelho de frames)');
  safeRemove(path.resolve(root, 'public', 'public'), 'public/public/ (Cópia redundante)');

  // 3. Limpa chunks de render temporários em out/
  const outDir = path.resolve(root, 'out');
  if (fs.existsSync(outDir)) {
    for (const f of fs.readdirSync(outDir)) {
      if ((f.startsWith('temp_') || f.startsWith('concat_')) && (f.endsWith('.mp4') || f.endsWith('.txt'))) {
        safeRemove(path.join(outDir, f), `out/${f} (Chunk temporário de render)`);
      }
    }
  }

  // 4. Limpa chatgpt-image-bot/ (screenshots e dados de testes obsoletos)
  safeRemove(path.resolve(root, 'chatgpt-image-bot'), 'chatgpt-image-bot/ (Logs de automação legada)');

  // 5. Opcional: Limpar frames PNG brutos de episódios antigos em runs/
  if (cleanRunsFrames) {
    const runsDir = path.resolve(root, 'runs');
    if (fs.existsSync(runsDir)) {
      for (const ep of fs.readdirSync(runsDir)) {
        const epFramesDir = path.join(runsDir, ep, 'frames');
        if (fs.existsSync(epFramesDir)) {
          safeRemove(epFramesDir, `runs/${ep}/frames/ (Frames PNG intermediários)`);
        }
        const epTempDir = path.join(runsDir, ep, 'temp-universal-svg-frames');
        if (fs.existsSync(epTempDir)) {
          safeRemove(epTempDir, `runs/${ep}/temp-svg/`);
        }
      }
    }
  }

  console.log('----------------------------------------------------------------');
  console.log(`🎉 LIMPEZA CONCLUÍDA! Total liberado: ${(freedBytes / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log('================================================================\n');

  return freedBytes;
}

if (require.main === module) {
  const cleanFrames = process.argv.includes('--clean-frames');
  cleanDiskCaches(cleanFrames);
}
