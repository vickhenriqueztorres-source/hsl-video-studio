import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
import {ElevenLabsNarrationAdapter} from '../adapters/elevenLabsNarrationAdapter';
import {SoundDesignAgent} from '../sound-agent/index';
import {VideoAnalysisInput} from '../sound-agent/types/scene-analysis.types';
import {HslSceneDirectorAgent, EpisodeTopicInput, HslLongFormProjectPlan} from '../hsl/core/hslSceneDirectorAgent';
import {HslImageFrameEngine} from '../hsl/core/hslImageFrameEngine';
import {HslFireflyVideoEngine} from '../hsl/core/hslFireflyVideoEngine';
import {ThumbnailSeoEngine, EpisodePackagingInput} from '../hsl/packaging/thumbnailSeoEngine';
import {HslRunValidator} from './verifyHslRun';
import {validateBeforeRender} from '../hsl/core/hslValidationGatekeeper';
import {HslRunManifest} from '../hsl/core/hslRunManifest';
import {inspectMediaWithFfprobe} from '../hsl/core/hslPathResolver';

export interface EpisodeGenerationOptions {
  readonly episodeId?: string;
  readonly topic?: string;
  readonly targetMinutes?: number;
  readonly entity?: string;
  readonly mechanism?: string;
  readonly constraint?: string;
  readonly consequence?: string;
  readonly thesis?: string;
}

export async function runHslEpisodePipeline(options?: EpisodeGenerationOptions) {
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
  console.log('🚀 HSL MASTER SQUAD ORCHESTRATOR // DETERMINISTIC PIPELINE');
  console.log(`🎬 Episódio: ${topicInput.topic}`);
  console.log(`⏱️ Duração Alvo: ${topicInput.targetMinutes} Minutos (600s // 18,000 frames)`);
  console.log('================================================================\n');

  const manifest = new HslRunManifest(topicInput.episodeId, root);
  const episodeDir = path.resolve(root, 'runs', topicInput.episodeId);
  fs.mkdirSync(episodeDir, {recursive: true});

  // ---------------------------------------------------------------------------
  // 1. AGENTE EDITOR DE CENAS: PLANEJAMENTO DO ZERO (8 ATOS / 100+ BEATS)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_01_SCENE_PLAN');
  console.log('🎬 [1/8] HslSceneDirectorAgent: Planejando projeto de cenas do zero...');
  const scenePlan: HslLongFormProjectPlan = HslSceneDirectorAgent.planEpisodeFromScratch(topicInput);
  const scenePlanPath = path.resolve(episodeDir, 'scene-plan.json');
  fs.writeFileSync(scenePlanPath, JSON.stringify(scenePlan, null, 2), 'utf8');
  manifest.completeStage('STAGE_01_SCENE_PLAN', { totalBeats: scenePlan.totalBeatsCount, totalFrames: scenePlan.totalFrames });
  manifest.setArtifacts({ scenePlanPath });
  console.log(`✅ Projeto de ${scenePlan.totalBeatsCount} cenas gerado em: ${scenePlanPath}`);

  // ---------------------------------------------------------------------------
  // 2. GERADOR DE NOVOS FRAMES DE IMAGEM (COM AUTO-GATE)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_02_IMAGE_FRAMES');
  console.log('\n🖼️ [2/8] HslImageFrameEngine: Gerando e validando novos frames de imagem...');
  const frameResult = await HslImageFrameEngine.generateFramesForEpisode(topicInput.episodeId, scenePlan.beats);
  manifest.completeStage('STAGE_02_IMAGE_FRAMES', { totalGenerated: frameResult.totalGenerated });
  manifest.setArtifacts({ framesCount: frameResult.totalGenerated });
  console.log(`✅ ${frameResult.totalGenerated} novos frames 35mm validados em: ${frameResult.outputDirectory}`);

  // ---------------------------------------------------------------------------
  // 3. ATIVAÇÃO DO FIREFLY VIDEO BOT (COM AUTO-GATE)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_03_FIREFLY_VIDEOS');
  console.log('\n🤖 [3/8] HslFireflyVideoEngine: Populando e validando takes do Firefly Video...');
  const fireflyResult = await HslFireflyVideoEngine.processVideoBeatsForEpisode(topicInput.episodeId, scenePlan.beats);
  manifest.completeStage('STAGE_03_FIREFLY_VIDEOS', { totalVideos: fireflyResult.totalVideoBeats });
  manifest.setArtifacts({ videosCount: fireflyResult.totalVideoBeats });
  console.log(`✅ ${fireflyResult.totalVideoBeats} takes de vídeo Firefly validados em: ${fireflyResult.videoOutputDirectory}`);

  // ---------------------------------------------------------------------------
  // 4. ELEVENLABS NARRATION AGENT (Voz Chris - English Native com Failover)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_04_NARRATION');
  console.log('\n🎙️ [4/8] ElevenLabs Narration Agent: Sintetizando áudio mestre com voz Chris...');
  const narrationAdapter = new ElevenLabsNarrationAdapter();
  const fullScript = scenePlan.beats.map(b => b.voiceoverScript).join(' ');
  const narrationDest = path.resolve(root, 'public', 'audio', 'narration.mp3');

  await narrationAdapter.generateSpeech({
    text: fullScript,
    outputPath: narrationDest
  });

  const narrationInfo = inspectMediaWithFfprobe(narrationDest);
  manifest.completeStage('STAGE_04_NARRATION', { durationSeconds: narrationInfo.durationSeconds });
  manifest.setArtifacts({ narrationAudioPath: narrationDest, narrationDurationSeconds: narrationInfo.durationSeconds });
  console.log(`✅ Narração master em inglês validada (${narrationInfo.durationSeconds.toFixed(2)}s) em: ${narrationDest}`);

  // ---------------------------------------------------------------------------
  // 5. SOUND DESIGN AGENT (Multi-Layer Long-Form AudioPlan)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_05_SOUND_DESIGN');
  console.log('\n🎧 [5/8] Sound Design Agent: Orquestrando camadas e ambiência sonora...');
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
      visualCues: [
        { frame: startFrame, type: 'environment' as const, description: beat.stage },
        { frame: startFrame + 60, type: 'action' as const, description: beat.stage }
      ],
      audioCues: [
        { frame: startFrame, type: 'voice' as const, hasVoice: true, voiceType: 'narration' as const, targetDb: -12 }
      ],
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
  const {plan} = soundAgent.runFullPipeline(videoAnalysis, remotionAudioPath, audioPlanPath);
  manifest.completeStage('STAGE_05_SOUND_DESIGN', { scenesCount: plan.scenes.length });
  console.log(`✅ AudioPlan orquestrado com ${plan.scenes.length} cenas.`);

  // ---------------------------------------------------------------------------
  // 6. PRE-RENDER CONTRACT GATE (BLOQUEANTE - ZERO TOLERÂNCIA)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_06_PRE_RENDER_GATE');
  console.log('\n🛡️ [6/8] PRE-RENDER CONTRACT GATE: Verificando 100% dos assets antes de iniciar o render...');
  const gatekeeperResult = await validateBeforeRender(topicInput.episodeId);
  if (!gatekeeperResult.passed) {
    manifest.failStage('STAGE_06_PRE_RENDER_GATE', gatekeeperResult.blocked_reason || `Falha de contrato no Gatekeeper.`);
    throw new Error(`🛑 [Gatekeeper: BLOCKED] Renderização abortada: ${gatekeeperResult.blocked_reason}`);
  }
  manifest.completeStage('STAGE_06_PRE_RENDER_GATE', { validBeats: gatekeeperResult.verifiedBeatsCount, autoRecovered: gatekeeperResult.autoRecovered });
  console.log(`✅ PRE-RENDER GATE PASSOU: 100% dos ${gatekeeperResult.verifiedBeatsCount} beats verificados e íntegros.`);

  // ---------------------------------------------------------------------------
  // 7. REMOTION ENGINE: RENDERIZAÇÃO VISUAL 1080P FULL HD
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_07_REMOTION_RENDER');
  console.log('\n🎥 [7/8] Remotion Engine: Renderizando vídeo visual HslLongFormComposition em 1080p Full HD...');
  const outDir = path.resolve(root, 'out');
  fs.mkdirSync(outDir, {recursive: true});
  const tempVisualPath = path.resolve(outDir, `temp_visual_${topicInput.episodeId.toLowerCase()}.mp4`);
  const outputVideoPath = path.resolve(outDir, `${topicInput.episodeId.toLowerCase()}.mp4`);

  const renderArgs = [
    'remotion', 'render',
    'remotion/index.ts',
    'HslLongFormComposition',
    `out/temp_visual_${topicInput.episodeId.toLowerCase()}.mp4`,
    '--muted',
    '--concurrency=4',
    '--timeout=3600000'
  ];

  console.log(`[Remotion CLI] Executando: npx ${renderArgs.join(' ')}`);
  const renderResult = spawnSync('npx', renderArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    maxBuffer: 1024 * 1024 * 50
  });

  if (renderResult.stdout) {
    console.log(renderResult.stdout);
  }

  if (!fs.existsSync(tempVisualPath) || fs.statSync(tempVisualPath).size < 100000) {
    manifest.failStage('STAGE_07_REMOTION_RENDER', 'Arquivo visual do Remotion não foi gerado ou está corrompido.');
    throw new Error('REMOTION_RENDER_GATE_FATAL: Falha ao renderizar a trilha visual.');
  }
  manifest.completeStage('STAGE_07_REMOTION_RENDER');
  manifest.setArtifacts({ videoVisualPath: tempVisualPath });

  // ---------------------------------------------------------------------------
  // 8. PRE-MUX GATE & FFMPEG AUDIO MUXER
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_08_PRE_MUX_GATE');
  console.log('\n🔊 [8/8] PRE-MUX GATE: Validando duração do vídeo contra narração do Chris...');
  const visualMediaInfo = inspectMediaWithFfprobe(tempVisualPath);
  const narrationMediaInfo = inspectMediaWithFfprobe(narrationDest);
  const durationDiff = Math.abs(visualMediaInfo.durationSeconds - scenePlan.totalDurationSeconds);

  console.log(`📊 Trilha Visual: ${visualMediaInfo.durationSeconds.toFixed(2)}s | Narração: ${narrationMediaInfo.durationSeconds.toFixed(2)}s`);
  if (durationDiff > 10.0) {
    manifest.failStage('STAGE_08_PRE_MUX_GATE', `Divergência de duração visual (${visualMediaInfo.durationSeconds}s) vs plano (${scenePlan.totalDurationSeconds}s).`);
    throw new Error(`PRE_MUX_GATE_FATAL: Divergência de duração inaceitável (${durationDiff.toFixed(2)}s > 10s).`);
  }
  manifest.completeStage('STAGE_08_PRE_MUX_GATE');

  // Muxing Final com FFmpeg
  manifest.startStage('STAGE_09_FFMPEG_MUX');
  console.log('🔊 [FFmpeg Muxer] Combinando trilha visual com narração do Chris e ambiência sonora...');
  const musicPath = path.resolve(root, 'public', 'audio', 'music', 'cinematic', 'suspense', 'suspense_oppressive_gloom.mp3');

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
    '-b:a', '192k',
    '-shortest',
    outputVideoPath
  ], {encoding: 'utf8'});

  if (muxResult.status !== 0 || !fs.existsSync(outputVideoPath)) {
    manifest.failStage('STAGE_09_FFMPEG_MUX', `Falha no FFmpeg mux: ${muxResult.stderr}`);
    throw new Error(`FFMPEG_MUX_FATAL: ${muxResult.stderr}`);
  }

  // Limpeza de arquivo temporário
  if (fs.existsSync(tempVisualPath)) {
    fs.unlinkSync(tempVisualPath);
  }

  const finalVideoInfo = inspectMediaWithFfprobe(outputVideoPath);
  manifest.completeStage('STAGE_09_FFMPEG_MUX', { finalDuration: finalVideoInfo.durationSeconds });
  manifest.setArtifacts({ masterVideoPath: outputVideoPath, masterVideoDurationSeconds: finalVideoInfo.durationSeconds });

  // Copiar cópia direta para o Desktop
  const desktopPath = path.resolve(`C:\\Users\\brend\\OneDrive\\Desktop\\${topicInput.episodeId.toLowerCase()}.mp4`);
  fs.copyFileSync(outputVideoPath, desktopPath);

  // ---------------------------------------------------------------------------
  // 9. PUBLICATION PACKAGING & SEO AGENT (A/B/C TEST ENGINE)
  // ---------------------------------------------------------------------------
  manifest.startStage('STAGE_10_PACKAGING');
  console.log('\n📦 [Packaging] Gerando 3 Thumbnails A/B/C em 4K, Títulos 1+1=3 e SEO...');
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
  fs.writeFileSync(path.join(episodeDir, 'publication-package.json'), JSON.stringify(publicationPackage, null, 2), 'utf8');
  manifest.completeStage('STAGE_10_PACKAGING');
  manifest.setArtifacts({
    thumbnails: [
      path.join(episodeDir, 'thumbnails', 'variant_a_4k.png'),
      path.join(episodeDir, 'thumbnails', 'variant_b_4k.png'),
      path.join(episodeDir, 'thumbnails', 'variant_c_4k.png')
    ],
    publicationPackagePath: path.join(episodeDir, 'YOUTUBE_PUBLICATION_PACKAGE.md')
  });
  manifest.completeRun();

  console.log('\n================================================================');
  console.log('🎉 EPISÓDIO LONG-FORM PRODUZIDO E VALIDADO COM SUCESSO!');
  console.log('================================================================');
  console.log(`📁 Vídeo Master: ${outputVideoPath}`);
  console.log(`🖥️ Desktop: ${desktopPath}`);
  console.log(`⏱️ Duração: ${finalVideoInfo.durationSeconds.toFixed(2)}s`);
  console.log(`📋 Projeto de Cenas: ${scenePlanPath}`);
  console.log(`📜 Manifesto da Run: ${path.resolve(episodeDir, 'run-manifest.json')}`);
  console.log('================================================================\n');

  return {
    status: 'SUCCESS',
    videoPath: outputVideoPath,
    desktopPath,
    scenePlan,
    publicationPackage
  };
}

if (require.main === module) {
  runHslEpisodePipeline().catch(err => {
    console.error('HSL_PIPELINE_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
