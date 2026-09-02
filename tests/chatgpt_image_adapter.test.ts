import fs from 'fs';
import path from 'path';
import {ChatGptImageAdapter} from '../adapters/chatgptImageAdapter';
import {ChatGptStartFrameRuntime, formatCinematic35mmPrompt} from '../hsl/startframe/chatgptStartFrameRuntime';

function runTests(): void {
  console.log('[TEST] Iniciando validação do ChatGptImageAdapter e StartFrameRuntime...');

  const adapter = new ChatGptImageAdapter();
  const botDir = adapter.getBotDirectory();

  if (!fs.existsSync(botDir)) {
    throw new Error(`Pasta do chatgpt-image-bot não encontrada em: ${botDir}`);
  }

  // Teste 1: Formatação de prompt 35mm cinematográfico 16:9
  const rawPrompt = 'gato em sala de servidores';
  const formatted = formatCinematic35mmPrompt(rawPrompt);
  if (!formatted.includes('Cinematic 35mm photograph of') || !formatted.includes('--ar 16:9')) {
    throw new Error('Falha na formatação do prompt cinematográfico 16:9');
  }

  // Teste 2: Leitura do manifesto existente no chatgpt-image-bot
  const manifestMap = adapter.loadCompletedManifestMap();
  console.log(`[TEST] Manifesto do ChatGPT lido com sucesso. Total de imagens em cache: ${manifestMap.size}`);

  // Teste 3: Processamento de requisições utilizando imagens já existentes no manifesto
  const sampleEntry = Array.from(manifestMap.entries())[0];
  if (sampleEntry) {
    const [samplePrompt, sampleData] = sampleEntry;
    const targetCopyPath = path.resolve('runs', 'TEST_CHATGPT', 'start-frames', 'SHOT_001.png');

    const result = adapter.processRequests([
      {
        id: 'SHOT_001',
        prompt: samplePrompt,
        targetPath: targetCopyPath
      }
    ], false);

    if (result.totalCompleted !== 1) {
      throw new Error('Falha ao processar e copiar imagem em cache do manifesto');
    }
    if (!fs.existsSync(targetCopyPath)) {
      throw new Error(`Imagem não foi copiada para o destino: ${targetCopyPath}`);
    }

    console.log('[PASS] Cópia e validação de dimensões/SHA-256 via ChatGptImageAdapter concluídas com sucesso!');
  }

  // Teste 4: Validação do ChatGptStartFrameRuntime
  const runtime = new ChatGptStartFrameRuntime();
  const runResult = runtime.run({
    episodeId: 'TEST-EPISODE',
    shotPlanItems: [
      {
        shot_id: 'SHOT_TEST_01',
        parent_scene_id: 'SCENE_01',
        start_frame_prompt: sampleEntry ? sampleEntry[0] : 'Cinematic 35mm test shot --ar 16:9'
      }
    ],
    outputDirectory: path.resolve('runs', 'TEST_CHATGPT'),
    autoRunBot: false
  });

  if (!fs.existsSync(runResult.manifestPath)) {
    throw new Error(`Manifesto de start frames não foi criado em: ${runResult.manifestPath}`);
  }

  console.log('[PASS] Todos os testes do ChatGptImageAdapter e Runtime passaram com sucesso!');
}

runTests();
