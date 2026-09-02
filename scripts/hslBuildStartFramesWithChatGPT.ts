import fs from 'fs';
import path from 'path';
import {ChatGptStartFrameRuntime, ChatGptShotPlanItem} from '../hsl/startframe/chatgptStartFrameRuntime';

function parseArgs(): {videoNum: number; planPath?: string; outputDir?: string} {
  const args = process.argv.slice(2);
  let videoNum = 4;
  let planPath: string | undefined;
  let outputDir: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--video' && args[i + 1]) {
      videoNum = Number(args[i + 1]);
      i++;
    } else if (args[i] === '--plan' && args[i + 1]) {
      planPath = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    }
  }

  return {videoNum, planPath, outputDir};
}

function main(): void {
  const {videoNum, planPath, outputDir} = parseArgs();
  const productionId = process.env.HSL_RUN_ID || `HSL-VIDEO-00${videoNum}`;
  const defaultOutput = path.resolve(outputDir || process.env.HSL_OUTPUT || path.join('runs', productionId));

  let shotPlanItems: ChatGptShotPlanItem[] = [];
  let resolvedPlanPath = planPath ? path.resolve(planPath) : path.join(defaultOutput, 'start-frame-candidates', 'start-frame-shot-plan.json');

  if (fs.existsSync(resolvedPlanPath)) {
    console.log(`[ChatGPTStartFrames] Lendo plano de shots existente: ${resolvedPlanPath}`);
    const data = JSON.parse(fs.readFileSync(resolvedPlanPath, 'utf8')) as {items?: ChatGptShotPlanItem[]};
    shotPlanItems = data.items || [];
  } else {
    console.log(`[ChatGPTStartFrames] Plano ${resolvedPlanPath} não encontrado. Usando fila de prompts padrão do chatgpt-image-bot.`);
    const queueFile = path.resolve('chatgpt-image-bot', 'prompts', 'queue.txt');
    if (fs.existsSync(queueFile)) {
      const lines = fs.readFileSync(queueFile, 'utf8').split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
      shotPlanItems = lines.map((line, idx) => ({
        shot_id: `SHOT_${(idx + 1).toString().padStart(3, '0')}`,
        parent_scene_id: `SCENE_${(idx + 1).toString().padStart(3, '0')}`,
        start_frame_prompt: line
      }));
    }
  }

  if (!shotPlanItems.length) {
    throw new Error('[ChatGPTStartFrames] Nenhum prompt ou shot plan encontrado para geração.');
  }

  console.log(`[ChatGPTStartFrames] Iniciando geração de ${shotPlanItems.length} start frames para ${productionId}...`);

  const runtime = new ChatGptStartFrameRuntime();
  const result = runtime.run({
    episodeId: productionId,
    shotPlanItems,
    outputDirectory: defaultOutput,
    autoRunBot: true
  });

  console.log('\n=======================================================');
  console.log('🖼️ RESULTADO DA GERAÇÃO DE START FRAMES VIA CHATGPT');
  console.log('=======================================================');
  console.log(`Status: ${result.status}`);
  console.log(`Total Solicitado: ${result.totalShots}`);
  console.log(`Total Gerado/Disponível: ${result.generatedShots}`);
  console.log(`Manifesto salvo em: ${result.manifestPath}`);
  console.log('=======================================================\n');
}

if (require.main === module) {
  main();
}
