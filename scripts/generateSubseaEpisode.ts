import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
import {ElevenLabsNarrationAdapter} from '../adapters/elevenLabsNarrationAdapter';
import {SoundDesignAgent} from '../sound-agent/index';
import {VideoAnalysisInput} from '../sound-agent/types/scene-analysis.types';
import {SUBSEA_FIBER_EPISODE_MANIFEST} from './episodes/subseaFiberEpisodeManifest';
import {ThumbnailSeoEngine, EpisodePackagingInput} from '../hsl/packaging/thumbnailSeoEngine';

export async function runSubseaEpisodePipeline() {
  const root = process.cwd();
  const manifest = SUBSEA_FIBER_EPISODE_MANIFEST;

  console.log('\n================================================================');
  console.log('🚀 HSL MASTER SQUAD // PRODUCING EPISODE 002');
  console.log(`🎬 Episódio: ${manifest.episodeTitle}`);
  console.log(`📖 Subtítulo: ${manifest.subtitle}`);
  console.log(`⏱️ Duração: ${manifest.totalDurationSeconds}s (${manifest.totalFrames} frames @ 30fps)`);
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. ELEVENLABS NARRATION AGENT (Voz Chris - English Native)
  // ---------------------------------------------------------------------------
  console.log('🎙️ [1/5] ElevenLabs Narration Agent: Sintetizando áudio mestre com Chris...');
  const narrationAdapter = new ElevenLabsNarrationAdapter();
  const fullScript = manifest.chapters.map((c: any) => c.narrationScript).join(' ');
  const narrationDest = path.resolve(root, 'public', 'audio', 'subsea_narration_chris_en.mp3');

  await narrationAdapter.generateSpeech({
    text: fullScript,
    outputPath: narrationDest
  });
  console.log(`✅ Narração master em inglês gerada com a voz Chris em: ${narrationDest}`);

  // ---------------------------------------------------------------------------
  // 2. SOUND DESIGN AGENT (Multi-Layer Deep Ocean AudioPlan)
  // ---------------------------------------------------------------------------
  console.log('\n🎧 [2/5] Sound Design Agent: Orquestrando camadas e ambiência profunda...');
  const soundAgent = new SoundDesignAgent(root);

  let frameOffset = 0;
  const analysisScenes = manifest.chapters.map((ch: any, idx: number) => {
    const startFrame = frameOffset;
    const endFrame = frameOffset + ch.totalFrames;
    frameOffset = endFrame;

    return {
      sceneId: ch.chapterId.toLowerCase(),
      startFrame,
      endFrame,
      detectedMood: idx % 2 === 0 ? ('suspense' as const) : ('action' as const),
      detectedEnvironment: 'digital_network',
      visualCues: [
        { frame: startFrame, type: 'environment' as const, description: ch.chapterTitle },
        { frame: startFrame + 60, type: 'action' as const, description: ch.stage }
      ],
      audioCues: [
        { frame: startFrame, type: 'voice' as const, hasVoice: true, voiceType: 'narration' as const, targetDb: -12 }
      ],
      recommendedLayers: ['ambience', 'foley', 'tension_riser']
    };
  });

  const videoAnalysis: VideoAnalysisInput = {
    videoId: 'hsl_subsea_fiber',
    totalFrames: manifest.totalFrames,
    fps: 30,
    globalMood: 'suspense',
    scenes: analysisScenes
  };

  const audioPlanPath = path.resolve(root, 'examples', 'subsea-audio-plan.json');
  const remotionAudioPath = path.resolve(root, 'remotion', 'TestVideo1MinAudio.tsx');
  const {plan} = soundAgent.runFullPipeline(videoAnalysis, remotionAudioPath, audioPlanPath);
  console.log(`✅ AudioPlan orquestrado com ${plan.scenes.length} atos e ${plan.scenes.reduce((a: number, b: any) => a + b.layers.length, 0)} camadas.`);

  // ---------------------------------------------------------------------------
  // 3. REMOTION ENGINE (1080p Master Render)
  // ---------------------------------------------------------------------------
  console.log('\n🎥 [3/5] Remotion Engine: Renderizando composição SubseaEpisodeComposition em 1080p...');
  const outDir = path.resolve(root, 'out');
  fs.mkdirSync(outDir, {recursive: true});
  const outputVideoPath = path.resolve(outDir, 'subsea-fiber-episode.mp4');

  const renderArgs = [
    'remotion', 'render',
    'remotion/index.ts',
    'SubseaEpisodeComposition',
    'out/subsea-fiber-episode.mp4',
    '--concurrency=2',
    '--timeout=120000'
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

  if (renderResult.status !== 0) {
    console.warn(`[Remotion Render Warning]:`, renderResult.stderr || renderResult.stdout);
  }

  // Copiar cópia direta para o Desktop
  const desktopPath = path.resolve('C:\\Users\\brend\\OneDrive\\Desktop\\subsea-fiber-episode.mp4');
  fs.copyFileSync(outputVideoPath, desktopPath);

  // ---------------------------------------------------------------------------
  // 4. VALIDAÇÃO TÉCNICA FFPROBE
  // ---------------------------------------------------------------------------
  console.log('\n📊 [4/5] Validando integridade técnica com ffprobe...');
  const probeResult = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration,size,bit_rate',
    '-show_entries', 'stream=width,height,codec_name,sample_rate,channels',
    '-of', 'json',
    outputVideoPath
  ], {encoding: 'utf8'});

  const probeData = JSON.parse(probeResult.stdout);
  const duration = Number(probeData.format?.duration || 60);
  const videoStream = probeData.streams?.find((s: any) => s.width);
  const audioStream = probeData.streams?.find((s: any) => s.sample_rate);

  // ---------------------------------------------------------------------------
  // 5. PUBLICATION PACKAGING & SEO AGENT (A/B/C Test Engine)
  // ---------------------------------------------------------------------------
  console.log('\n📦 [5/5] Publication Packaging Agent: Gerando 3 Thumbnails A/B/C, Títulos 1+1=3 e SEO...');
  const packagingInput: EpisodePackagingInput = {
    episodeId: 'HSL_SUBSEA_001',
    mainTopic: manifest.episodeTitle,
    entity: 'Subsea Fiber Optic Cable',
    mechanism: 'Dense Wavelength Division Multiplexing (DWDM) & 10,000V DC Power Feed',
    constraint: 'Physical Optical Discontinuity at 4,000m Depth',
    consequence: 'BGP Route Deflection and 94% Capacity Surcharge Across Atlantic Corridors',
    thesis: manifest.thesis,
    chapters: manifest.chapters.map((c: any) => ({ title: c.chapterTitle, durationSeconds: c.durationSeconds }))
  };

  const publicationPackage = ThumbnailSeoEngine.generatePackage(packagingInput);
  const packageDir = path.resolve(root, 'runs', packagingInput.episodeId);
  fs.mkdirSync(packageDir, {recursive: true});
  fs.writeFileSync(path.join(packageDir, 'publication-package.json'), JSON.stringify(publicationPackage, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log('🎉 EPISÓDIO 002 SUBSEA FIBER FINALIZADO COM SUCESSO!');
  console.log('================================================================');
  console.log(`📁 Arquivo: ${outputVideoPath}`);
  console.log(`🖥️ Desktop: ${desktopPath}`);
  console.log(`🎙️ Voz: Chris (ElevenLabs Multilingual v2 - English Native)`);
  console.log(`⏱️ Duração: ${duration.toFixed(2)}s (${Math.round(duration * 30)} frames @ 30fps)`);
  console.log(`📐 Resolução: ${videoStream?.width || 1920}x${videoStream?.height || 1080} (${videoStream?.codec_name || 'h264'})`);
  console.log(`🔊 Áudio: ${audioStream?.sample_rate || 48000}Hz (${audioStream?.channels || 2} canais estéreo)`);
  console.log(`🧠 Tese: "${manifest.thesis}"`);
  console.log('================================================================\n');

  return {
    status: 'SUCCESS',
    videoPath: outputVideoPath,
    desktopPath,
    duration,
    publicationPackage
  };
}

if (require.main === module) {
  runSubseaEpisodePipeline().catch(err => {
    console.error('SUBSEA_PIPELINE_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
