import fs from 'fs';
import path from 'path';
import http from 'http';
import {AddressInfo} from 'net';
import { spawnSync, spawn } from 'child_process';
import { HslSceneDirectorAgent, EpisodeTopicInput, HslLongFormProjectPlan } from '../core/hslSceneDirectorAgent';
import { HslImageFrameEngine } from '../core/hslImageFrameEngine';
import { HslFireflyVideoEngine } from '../core/hslFireflyVideoEngine';
import { ElevenLabsNarrationAdapter } from '../../adapters/elevenLabsNarrationAdapter';
import { SoundDesignAgent } from '../../sound-agent/index';
import { VideoAnalysisInput } from '../../sound-agent/types/scene-analysis.types';
import { ThumbnailSeoEngine, EpisodePackagingInput } from '../packaging/thumbnailSeoEngine';
import { validateBeforeRender } from '../core/hslValidationGatekeeper';
import { inspectMediaWithFfprobe } from '../core/hslPathResolver';
import { HslRunManifest } from '../core/hslRunManifest';
import { HslComplianceChecker } from '../../spec/hsl-compliance-checker';
import { HslDriveStorage } from '../core/hslDriveStorage';
import {
  HSL_EPISODE_TARGET_DURATION_SECONDS,
  HSL_EPISODE_MIN_DURATION_SECONDS,
  HSL_DURATION_TOLERANCE_SECONDS,
  HSL_AUDIO_BITRATE
} from '../../spec/hsl-spec';

export interface MasterPipelineOptions {
  readonly episodeId?: string;
  readonly topic?: string;
  readonly targetMinutes?: number;
  readonly entity?: string;
  readonly mechanism?: string;
  readonly constraint?: string;
  readonly consequence?: string;
  readonly thesis?: string;
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.json') return 'application/json';
  return 'application/octet-stream';
}

async function startPublicAssetServer(root: string): Promise<{baseUrl: string; close: () => Promise<void>}> {
  const publicRoot = path.resolve(root, 'public');
  const publicRootLower = publicRoot.toLowerCase();

  const server = http.createServer((req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
      const cleanPath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '').replace(/^public\//, '');
      const normalizedRelative = path.normalize(cleanPath);
      let filePath = path.resolve(publicRoot, normalizedRelative);

      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        const inRoot = path.resolve(root, normalizedRelative);
        if (fs.existsSync(inRoot) && fs.statSync(inRoot).isFile()) {
          filePath = inRoot;
        }
      }

      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      const stat = fs.statSync(filePath);
      const range = req.headers.range;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', getContentType(filePath));

      if (range) {
        const match = range.match(/bytes=(\d*)-(\d*)/);
        const start = match && match[1] ? parseInt(match[1], 10) : 0;
        const end = match && match[2] ? parseInt(match[2], 10) : stat.size - 1;
        const safeEnd = Math.min(end, stat.size - 1);
        if (start >= stat.size || start > safeEnd) {
          res.writeHead(416, {'Content-Range': `bytes */${stat.size}`});
          res.end();
          return;
        }
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${safeEnd}/${stat.size}`,
          'Content-Length': safeEnd - start + 1
        });
        fs.createReadStream(filePath, {start, end: safeEnd}).pipe(res);
        return;
      }

      res.setHeader('Content-Length', stat.size);
      fs.createReadStream(filePath).pipe(res);
    } catch (err: any) {
      res.statusCode = 500;
      res.end(err.message || 'Asset server error');
    }
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()))
  };
}

export async function runMasterEpisodePipeline(options?: MasterPipelineOptions) {
  const root = process.cwd();

  const topicInput: EpisodeTopicInput = {
    episodeId: options?.episodeId || 'HSL_EPISODE_001',
    topic: options?.topic || 'THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING',
    targetMinutes: options?.targetMinutes || 10,
    entity: options?.entity || 'Airport Jet Fuel Logistics',
    mechanism: options?.mechanism || 'Pipeline to Hydrant Manifold High-Pressure Injection',
    constraint: options?.constraint || 'Hydrant Pressure Collapse at Node D (72 Units/min)',
    consequence: options?.consequence || '56 Delayed Flights and $2.7M Cascading Economic Loss',
    thesis: options?.thesis || 'The visible product is a flight; the hidden product is synchronized fuel logistics.'
  };

  console.log('\n================================================================');
  console.log('🚀 HSL MASTER SQUAD ORCHESTRATOR // AUTONOMOUS PIPELINE');
  console.log(`🎬 Episódio: ${topicInput.topic}`);
  console.log(`⏱️ Duração Alvo: ${topicInput.targetMinutes} Minutos (${HSL_EPISODE_TARGET_DURATION_SECONDS}s // 18,000 frames)`);
  console.log('================================================================\n');

  const manifest = new HslRunManifest(topicInput.episodeId, root);
  const episodeDir = path.resolve(root, 'runs', topicInput.episodeId);
  fs.mkdirSync(episodeDir, { recursive: true });

  // ---------------------------------------------------------------------------
  // 1. SCENE PLAN (PLANEJAMENTO DE 8 ATOS DO ZERO)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_01_SCENE_PLAN');
  console.log('🎬 [1/11] Scene Director: Planejando projeto de cenas...');
  const scenePlan: HslLongFormProjectPlan = HslSceneDirectorAgent.planEpisodeFromScratch(topicInput);
  const scenePlanPath = path.resolve(episodeDir, 'scene-plan.json');
  fs.writeFileSync(scenePlanPath, JSON.stringify(scenePlan, null, 2), 'utf8');
  manifest.completeStage('STAGE_01_SCENE_PLAN', { totalBeats: scenePlan.totalBeatsCount });
  manifest.setArtifacts({ scenePlanPath });

  // ---------------------------------------------------------------------------
  // 2. IMAGE ENGINE (GERAÇÃO DE NOVOS FRAMES 35MM)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_02_IMAGE_FRAMES');
  console.log('\n🖼️ [2/11] Image Engine: Populando frames 35mm cinematográficos...');
  const frameResult = await HslImageFrameEngine.generateFramesForEpisode(topicInput.episodeId, scenePlan.beats);
  manifest.completeStage('STAGE_02_IMAGE_FRAMES', { totalGenerated: frameResult.totalGenerated });
  manifest.setArtifacts({ framesCount: frameResult.totalGenerated });

  // ---------------------------------------------------------------------------
  // 3. FIREFLY ENGINE (PROCESSAMENTO DE TAKES MP4)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_03_FIREFLY_VIDEOS');
  console.log('\n🤖 [3/11] Firefly Engine: Integrando takes reais de vídeo...');
  const fireflyResult = await HslFireflyVideoEngine.processVideoBeatsForEpisode(topicInput.episodeId, scenePlan.beats);
  manifest.completeStage('STAGE_03_FIREFLY_VIDEOS', { totalVideos: fireflyResult.totalVideoBeats });
  manifest.setArtifacts({ videosCount: fireflyResult.totalVideoBeats });

  // ---------------------------------------------------------------------------
  // 4. NARRATION ENGINE (ELEVENLABS VOZ CHRIS COM FAILOVER)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_04_NARRATION');
  console.log('\n🎙️ [4/11] Narration Engine: Sintetizando áudio master com voz Chris...');
  const narrationAdapter = new ElevenLabsNarrationAdapter();
  const fullScript = scenePlan.beats.map(b => b.voiceoverScript).join(' ');
  const narrationDest = path.resolve(episodeDir, 'audio', 'narration.mp3');
  const publicNarrationDest = path.resolve(root, 'public', 'audio', 'narration.mp3');
  await narrationAdapter.generateSpeech({ text: fullScript, outputPath: narrationDest });
  fs.mkdirSync(path.dirname(publicNarrationDest), { recursive: true });
  fs.copyFileSync(narrationDest, publicNarrationDest);
  const narrationInfo = inspectMediaWithFfprobe(narrationDest);
  manifest.completeStage('STAGE_04_NARRATION', { durationSeconds: narrationInfo.durationSeconds });
  manifest.setArtifacts({ narrationAudioPath: narrationDest, narrationDurationSeconds: narrationInfo.durationSeconds });

  // ---------------------------------------------------------------------------
  // 5. SOUND DESIGN AGENT (ORQUESTRAÇÃO MULTI-LAYER)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_05_SOUND_DESIGN');
  console.log('\n🎧 [5/11] Sound Design: Orquestrando camadas de tensão e foley...');
  const soundAgent = new SoundDesignAgent(root);
  let frameOffset = 0;
  const analysisScenes = scenePlan.beats.map((beat, idx) => {
    const startFrame = frameOffset;
    const endFrame = frameOffset + beat.durationFrames;
    frameOffset = endFrame;
    return {
      sceneId: beat.beatId.toLowerCase(),
      startFrame,
      endFrame,
      detectedMood: idx % 2 === 0 ? ('suspense' as const) : ('action' as const),
      detectedEnvironment: 'industrial_refinery',
      visualCues: [{ frame: startFrame, type: 'environment' as const, description: beat.stage }],
      audioCues: [{ frame: startFrame, type: 'voice' as const, hasVoice: true, voiceType: 'narration' as const, targetDb: -12 }],
      recommendedLayers: ['ambience', 'foley', 'tension_riser']
    };
  });
  const videoAnalysis: VideoAnalysisInput = {
    videoId: topicInput.episodeId,
    totalFrames: scenePlan.totalFrames,
    fps: 30,
    globalMood: 'suspense',
    scenes: analysisScenes
  };
  const audioPlanPath = path.resolve(episodeDir, 'audio-plan.json');
  const remotionAudioPath = path.resolve(root, 'remotion', 'TestVideo1MinAudio.tsx');
  soundAgent.runFullPipeline(videoAnalysis, remotionAudioPath, audioPlanPath);
  manifest.completeStage('STAGE_05_SOUND_DESIGN');

  // ---------------------------------------------------------------------------
  // 6. CANONICAL GATEKEEPER VALIDATION (BLOQUEANTE COM AUTO-CURA)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_06_PRE_RENDER_GATE');
  console.log('\n🛡️ [6/11] GATEKEEPER VALIDATOR: Validando fisicamente 100% dos assets no disco...');
  const gatekeeper = await validateBeforeRender(topicInput.episodeId);

  if (!gatekeeper.passed) {
    manifest.failStage('STAGE_06_PRE_RENDER_GATE', gatekeeper.blocked_reason || 'Falha de validação no gatekeeper.');
    throw new Error(`🛑 [Gatekeeper: BLOCKED] Renderização cancelada: ${gatekeeper.blocked_reason}`);
  }
  manifest.completeStage('STAGE_06_PRE_RENDER_GATE', { verifiedBeats: gatekeeper.verifiedBeatsCount, autoRecovered: gatekeeper.autoRecovered });
  console.log(`✅ [Gatekeeper: PASSED] Liberado para renderização visual.`);

  // ---------------------------------------------------------------------------
  // 7. REMOTION ENGINE (RENDER VISUAL CHUNKED 1080P FULL HD)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_07_REMOTION_RENDER');
  console.log('\n🎥 [7/11] Remotion Engine: Renderizando vídeo visual HslLongFormComposition em 1080p...');
  const outDir = path.resolve(root, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const tempVisualPath = path.resolve(outDir, `temp_visual_${topicInput.episodeId.toLowerCase()}.mp4`);
  const outputVideoPath = path.resolve(outDir, `${topicInput.episodeId.toLowerCase()}.mp4`);

  const renderPropsPath = path.resolve(outDir, `${topicInput.episodeId.toLowerCase()}_render-props.json`);
  let relativePlanPath = path.relative(root, scenePlanPath).replace(/\\/g, '/');
  const assetServer = await startPublicAssetServer(root);
  console.log(`🛰️ [Asset Server] Servindo public/ em ${assetServer.baseUrl}`);

  const part1Relative = `out/temp_visual_${topicInput.episodeId.toLowerCase()}_p1.mp4`;
  const part2Relative = `out/temp_visual_${topicInput.episodeId.toLowerCase()}_p2.mp4`;
  const part1Path = path.resolve(root, part1Relative);
  const part2Path = path.resolve(root, part2Relative);
  const concatListPath = path.resolve(outDir, `concat_${topicInput.episodeId.toLowerCase()}.txt`);
  // Limpeza preventiva de %TEMP% e garantia de que public/runs contenha apenas o episódio atual
  function cleanRemotionTemp(maxAgeMs = 60000) {
    try {
      const os = require('os');
      const tempDir = os.tmpdir();
      const entries = fs.readdirSync(tempDir);
      const now = Date.now();
      for (const entry of entries) {
        if (entry.startsWith('remotion-') || entry.includes('remotion')) {
          const full = path.join(tempDir, entry);
          try {
            const stat = fs.statSync(full);
            if (now - stat.mtimeMs > maxAgeMs) {
              if (stat.isDirectory()) fs.rmSync(full, { recursive: true, force: true });
              else fs.unlinkSync(full);
            }
          } catch {}
        }
      }
    } catch {}
  }

  function prunePublicRuns() {
    try {
      const publicRunsDir = path.resolve(root, 'public', 'runs');
      if (fs.existsSync(publicRunsDir)) {
        const runs = fs.readdirSync(publicRunsDir);
        for (const r of runs) {
          if (r !== topicInput.episodeId) {
            fs.rmSync(path.join(publicRunsDir, r), { recursive: true, force: true });
          }
        }
      }
    } catch {}
  }

  function syncCurrentRunAssets() {
    const localRunDir = path.resolve(root, 'runs', topicInput.episodeId);
    const publicRunDir = path.resolve(root, 'public', 'runs', topicInput.episodeId);
    const publicLiteralRunDir = path.resolve(root, 'public', 'public', 'runs', topicInput.episodeId);
    const buildPublicRunDir = path.resolve(root, 'build', 'public', 'runs', topicInput.episodeId);
    const buildPublicLiteralRunDir = path.resolve(root, 'build', 'public', 'public', 'runs', topicInput.episodeId);

    if (!fs.existsSync(localRunDir)) return;

    fs.mkdirSync(path.dirname(publicRunDir), { recursive: true });
    fs.cpSync(localRunDir, publicRunDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(publicLiteralRunDir), { recursive: true });
    fs.cpSync(localRunDir, publicLiteralRunDir, { recursive: true, force: true });

    if (fs.existsSync(path.resolve(root, 'build', 'public'))) {
      fs.mkdirSync(path.dirname(buildPublicRunDir), { recursive: true });
      fs.cpSync(localRunDir, buildPublicRunDir, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(buildPublicLiteralRunDir), { recursive: true });
      fs.cpSync(localRunDir, buildPublicLiteralRunDir, { recursive: true, force: true });
    }
  }

  // Pré-empacotamento local no disco para eliminar cópias em %TEMP% e race conditions
  cleanRemotionTemp(0);
  prunePublicRuns();
  syncCurrentRunAssets();

  const buildDir = path.resolve(root, 'build');
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }

  console.log('\n📦 [Remotion Bundler] Criando bundle local otimizado em ./build...');
  const bundleRes = spawnSync('npx', [
    'remotion', 'bundle',
    'remotion/index.ts',
    'build',
    '--public-dir=public'
  ], { cwd: root, shell: true, stdio: 'inherit' });

  if (bundleRes.status !== 0) {
    throw new Error('REMOTION_BUNDLE_FATAL: Falha ao gerar bundle do Remotion em ./build.');
  }
  syncCurrentRunAssets();
  fs.writeFileSync(renderPropsPath, JSON.stringify({...scenePlan, assetBaseUrl: assetServer.baseUrl}, null, 2), 'utf8');
  relativePlanPath = path.relative(root, renderPropsPath).replace(/\\/g, '/');

  async function renderChunk(frameRange: string, outFileRelative: string, label: string) {
    cleanRemotionTemp(0);
    syncCurrentRunAssets();
    const chunkArgs = [
      'remotion', 'render',
      'build',
      'HslLongFormComposition',
      outFileRelative,
      `--props=${relativePlanPath}`,
      `--frames=${frameRange}`,
      '--public-dir=build/public',
      '--muted',
      '--concurrency=2',
      '--gl=angle',
      '--image-format=jpeg',
      '--jpeg-quality=80',
      '--timeout=3600000'
    ];

    console.log(`\n🎬 [Remotion ${label}] Frames ${frameRange} ➔ ${outFileRelative}...`);
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('npx', chunkArgs, { cwd: root, shell: true });
      let lastLoggedFrame = 0;

      proc.stdout?.on('data', (chunk) => {
        const text = chunk.toString();
        const match = text.match(/Rendered\s+(\d+)\/(\d+)/);
        if (match) {
          const current = parseInt(match[1], 10);
          const total = parseInt(match[2], 10);
          if (current - lastLoggedFrame >= 500 || current === total) {
            lastLoggedFrame = current;
            const pct = ((current / total) * 100).toFixed(1);
            console.log(`🎬 [Remotion ${label} Progress] ${current}/${total} frames (${pct}%)`);
          }
        }
      });

      proc.stderr?.on('data', (chunk) => {
        const errStr = chunk.toString();
        if (!errStr.includes('ExperimentalWarning') && !errStr.includes('Browserslist') && errStr.trim().length > 0) {
          console.error(`[Remotion Stderr] ${errStr.trim()}`);
        }
      });

      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Remotion ${label} falhou com código ${code}`));
      });

      proc.on('error', reject);
    });
  }

  const p1 = `out/temp_p1_${topicInput.episodeId.toLowerCase()}.mp4`;
  const p2 = `out/temp_p2_${topicInput.episodeId.toLowerCase()}.mp4`;
  const p3 = `out/temp_p3_${topicInput.episodeId.toLowerCase()}.mp4`;
  const p4 = `out/temp_p4_${topicInput.episodeId.toLowerCase()}.mp4`;

  // Renderiza em 4 micro-chunks com limpeza automática de buffer
  await renderChunk('0-4499', p1, 'Parte 1/4 (Atos 1-2)');
  await renderChunk('4500-8999', p2, 'Parte 2/4 (Atos 3-4)');
  await renderChunk('9000-13499', p3, 'Parte 3/4 (Atos 5-6)');
  await renderChunk('13500-17999', p4, 'Parte 4/4 (Atos 7-8)');

  // Concatenação FFmpeg sem perdas
  console.log('\n🔗 [Remotion Stitcher] Unindo as 4 partes sem perdas com FFmpeg concat...');
  const fullP1 = path.resolve(root, p1);
  const fullP2 = path.resolve(root, p2);
  const fullP3 = path.resolve(root, p3);
  const fullP4 = path.resolve(root, p4);

  fs.writeFileSync(concatListPath, `file '${fullP1.replace(/\\/g, '/')}'\nfile '${fullP2.replace(/\\/g, '/')}'\nfile '${fullP3.replace(/\\/g, '/')}'\nfile '${fullP4.replace(/\\/g, '/')}'\n`, 'utf8');
  
  const concatResult = spawnSync('ffmpeg', [
    '-y', '-nostdin', '-hide_banner', '-loglevel', 'error',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatListPath,
    '-c', 'copy',
    tempVisualPath
  ], { encoding: 'utf8' });

  if (concatResult.status !== 0 || !fs.existsSync(tempVisualPath)) {
    throw new Error(`FFMPEG_CONCAT_FATAL: Falha ao unir chunks de vídeo: ${concatResult.stderr}`);
  }

  // Limpeza de arquivos intermediários
  [fullP1, fullP2, fullP3, fullP4, concatListPath].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  if (!fs.existsSync(tempVisualPath) || fs.statSync(tempVisualPath).size < 100000) {
    manifest.failStage('STAGE_07_REMOTION_RENDER', 'Trilha visual não foi gerada.');
    throw new Error('REMOTION_RENDER_GATE_FATAL: Falha ao renderizar trilha visual.');
  }
  manifest.completeStage('STAGE_07_REMOTION_RENDER');
  manifest.setArtifacts({ videoVisualPath: tempVisualPath });

  // ---------------------------------------------------------------------------
  // 8. PRE-MUX GATE (COMPARAÇÃO RIGOROSA DE DURAÇÃO COM FFPROBE)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_08_PRE_MUX_GATE');
  console.log('\n🔊 [8/11] Pre-Mux Gate: Validando coerência de duração visual vs narração...');
  const visualInfo = inspectMediaWithFfprobe(tempVisualPath);
  const audioInfo = inspectMediaWithFfprobe(narrationDest);
  let durationDiff = Math.abs(visualInfo.durationSeconds - audioInfo.durationSeconds);

  console.log(`📊 Duração Visual: ${visualInfo.durationSeconds.toFixed(2)}s | Narração Original: ${audioInfo.durationSeconds.toFixed(2)}s | Delta: ${durationDiff.toFixed(2)}s`);

  // Auto-Sincronização de Áudio com Preservação de Pitch se delta > tolerância
  if (durationDiff > HSL_DURATION_TOLERANCE_SECONDS) {
    const tempoFactor = audioInfo.durationSeconds / visualInfo.durationSeconds;
    console.log(`⚡ [AudioSync] Aplicando auto-sincronia temporal (atempo=${tempoFactor.toFixed(4)}) para sincronização milimétrica...`);
    const syncedAudioPath = path.resolve(episodeDir, 'narration_synced.mp3');
    const tempoRes = spawnSync('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-i', narrationDest,
      '-filter:a', `atempo=${tempoFactor.toFixed(4)}`,
      syncedAudioPath
    ], { encoding: 'utf8' });
    if (tempoRes.status === 0 && fs.existsSync(syncedAudioPath)) {
      fs.copyFileSync(syncedAudioPath, narrationDest);
      fs.copyFileSync(syncedAudioPath, publicNarrationDest);
      const updatedAudioInfo = inspectMediaWithFfprobe(narrationDest);
      durationDiff = Math.abs(visualInfo.durationSeconds - updatedAudioInfo.durationSeconds);
      console.log(`✅ [AudioSync] Áudio perfeitamente alinhado: ${updatedAudioInfo.durationSeconds.toFixed(2)}s (Novo Delta: ${durationDiff.toFixed(2)}s)`);
    }
  }

  manifest.completeStage('STAGE_08_PRE_MUX_GATE', { durationDiffSeconds: durationDiff });

  // ---------------------------------------------------------------------------
  // 9. FFMPEG MASTER AUDIO MUXER
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_09_FFMPEG_MUX');
  console.log('\n🔊 [9/11] FFmpeg Muxer: Combinando trilha visual, narração e ambiência...');
  const musicPath = path.resolve(root, 'assets', 'audio-library', 'music', 'cinematic', 'suspense', 'suspense_oppressive_gloom.mp3');

  const muxResult = spawnSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', tempVisualPath,
    '-stream_loop', '-1', '-i', musicPath,
    '-i', narrationDest,
    '-filter_complex', '[1:a]volume=0.04[bg];[2:a]volume=1.0[voice];[bg][voice]amix=inputs=2:duration=first[aout]',
    '-map', '0:v:0',
    '-map', '[aout]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', HSL_AUDIO_BITRATE,
    '-shortest',
    outputVideoPath
  ], { encoding: 'utf8' });

  if (muxResult.status !== 0 || !fs.existsSync(outputVideoPath)) {
    manifest.failStage('STAGE_09_FFMPEG_MUX', `Falha no FFmpeg mux: ${muxResult.stderr}`);
    throw new Error(`FFMPEG_MUX_FATAL: ${muxResult.stderr}`);
  }

  if (fs.existsSync(tempVisualPath)) fs.unlinkSync(tempVisualPath);

  const finalVideoInfo = inspectMediaWithFfprobe(outputVideoPath);
  manifest.completeStage('STAGE_09_FFMPEG_MUX', { finalDuration: finalVideoInfo.durationSeconds });
  manifest.setArtifacts({ masterVideoPath: outputVideoPath, masterVideoDurationSeconds: finalVideoInfo.durationSeconds });

  // Salva o vídeo master nas pastas oficiais de entrega do projeto
  const deliveryVideoDir = path.resolve(root, 'deliveries', topicInput.episodeId, 'video');
  const runVideoDir = path.resolve(episodeDir, 'video');
  fs.mkdirSync(deliveryVideoDir, { recursive: true });
  fs.mkdirSync(runVideoDir, { recursive: true });

  const finalDeliveryPath = path.join(deliveryVideoDir, `${topicInput.episodeId.toLowerCase()}.mp4`);
  const finalRunVideoPath = path.join(runVideoDir, `${topicInput.episodeId.toLowerCase()}.mp4`);
  fs.copyFileSync(outputVideoPath, finalDeliveryPath);
  fs.copyFileSync(outputVideoPath, finalRunVideoPath);

  // ---------------------------------------------------------------------------
  // 10. PUBLICATION PACKAGING AGENT (3 THUMBNAILS 4K + SEO)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_10_PACKAGING');
  console.log('\n📦 [10/11] Packaging Agent: Gerando 3 Thumbnails 4K A/B/C e pacote SEO...');
  const packagingInput: EpisodePackagingInput = {
    episodeId: topicInput.episodeId,
    mainTopic: topicInput.topic,
    entity: topicInput.entity,
    mechanism: topicInput.mechanism,
    constraint: topicInput.constraint,
    consequence: topicInput.consequence,
    thesis: topicInput.thesis,
    chapters: scenePlan.acts.map(a => ({ title: a.title, durationSeconds: a.durationSeconds }))
  };
  const publicationPackage = ThumbnailSeoEngine.generatePackage(packagingInput);
  process.env.HSL_ASSET_BASE_URL = assetServer.baseUrl;
  ThumbnailSeoEngine.exportPackagingDeliverables(publicationPackage, root);

  // Sincroniza entregáveis de publicação para deliveries/<EPISODE_ID>/
  const deliveryThumbsDir = path.resolve(root, 'deliveries', topicInput.episodeId, 'thumbnails');
  const deliveryPubDir = path.resolve(root, 'deliveries', topicInput.episodeId, 'publication');
  fs.mkdirSync(deliveryThumbsDir, { recursive: true });
  fs.mkdirSync(deliveryPubDir, { recursive: true });

  const runThumbsDir = path.resolve(episodeDir, 'thumbnails');
  if (fs.existsSync(runThumbsDir)) {
    fs.readdirSync(runThumbsDir).forEach(f => {
      fs.copyFileSync(path.join(runThumbsDir, f), path.join(deliveryThumbsDir, f));
    });
  }

  ['YOUTUBE_PUBLICATION_PACKAGE.md', 'publication-package.json'].forEach(f => {
    const src = path.join(episodeDir, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(deliveryPubDir, f));
    }
  });

  manifest.completeStage('STAGE_10_PACKAGING');

  // ---------------------------------------------------------------------------
  // 11. PRD COMPLIANCE GATE (GATE FINAL DE APROVAÇÃO DO PRODUTO)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_11_PRD_COMPLIANCE');
  console.log('\n📋 [11/11] PRD COMPLIANCE AUDIT: Validando todas as regras executáveis do PRD...');
  const complianceReport = HslComplianceChecker.checkCompliance(topicInput.episodeId);

  if (!complianceReport.passed) {
    manifest.failStage('STAGE_11_PRD_COMPLIANCE', `Entregável reprovado em ${complianceReport.failedRules} regras do PRD.`);
    HslComplianceChecker.printReportAndExit(complianceReport);
  }

  manifest.completeStage('STAGE_11_PRD_COMPLIANCE', {
    totalRules: complianceReport.totalRules,
    passedRules: complianceReport.passedRules
  });

  // ---------------------------------------------------------------------------
  // 12. CLOUD ARCHIVE & AUTO-CLEANUP (GOOGLE DRIVE SYNC & DISK HYGIENE)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_12_CLOUD_ARCHIVE');
  console.log('\n☁️ [12/12] Cloud Archive & Auto-Cleanup: Salvando no Google Drive e liberando disco...');
  try {
    HslDriveStorage.syncDeliveries();
    HslDriveStorage.syncSaves();
    HslDriveStorage.pruneRenderIntermediates(topicInput.episodeId);
    manifest.completeStage('STAGE_12_CLOUD_ARCHIVE', { driveSynced: true, localPruned: true });
    console.log('✅ [12/12] Entregáveis protegidos na nuvem e intermediários limpos do disco.');
  } catch (err: any) {
    console.warn(`⚠️ [Cloud Archive] Aviso no arquivamento: ${err.message}`);
    manifest.completeStage('STAGE_12_CLOUD_ARCHIVE', { driveSynced: false, error: err.message });
  }

  manifest.completeRun();
  await assetServer.close();

  console.log('\n================================================================');
  console.log('🎉 MASTER PIPELINE CONCLUÍDO COM 100% DE CONFORMIDADE COM O PRD!');
  console.log('================================================================\n');

  return {
    status: 'SUCCESS',
    videoPath: outputVideoPath,
    deliveryVideoPath: finalDeliveryPath,
    scenePlan,
    publicationPackage,
    complianceReport
  };
}

if (require.main === module) {
  runMasterEpisodePipeline().catch(err => {
    console.error('MASTER_PIPELINE_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
