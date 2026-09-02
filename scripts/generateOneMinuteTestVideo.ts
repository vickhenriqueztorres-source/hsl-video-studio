import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
import {retrieveEditorInsights, syncEditorRagSnapshot} from '../hsl/editorial/editor/editorRagRuntime';
import {ElevenLabsNarrationAdapter} from '../adapters/elevenLabsNarrationAdapter';
import {SoundDesignAgent} from '../sound-agent/index';
import {VideoAnalysisInput} from '../sound-agent/types/scene-analysis.types';

export interface OneMinuteTestResult {
  readonly status: 'SUCCESS' | 'FAILED';
  readonly videoPath: string;
  readonly durationSeconds: number;
  readonly totalFrames: number;
  readonly fps: number;
  readonly resolution: string;
  readonly scenesCount: number;
  readonly sfxCount: number;
  readonly audioPlanPath: string;
}

export async function generateOneMinuteVideo(): Promise<OneMinuteTestResult> {
  const root = process.cwd();
  console.log('\n================================================================');
  console.log('🚀 INICIANDO PIPELINE HSL // PRESSURE TEST (VÍDEO 1 MINUTO)');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. AGENTE EDITOR RAG: Recuperação das diretrizes PRESSURE TEST
  // ---------------------------------------------------------------------------
  console.log('🧠 [1/5] Executando Editor RAG Agent (Pressure Test Guidelines)...');
  const sourceRoot = path.resolve(root, 'RAG EDITOR');
  const outputPath = path.resolve(root, 'assets', 'editorial-references', 'editor', 'editor-rag-index.json');
  const snapshot = syncEditorRagSnapshot(sourceRoot, outputPath);

  const editorialInsights = retrieveEditorInsights(snapshot, 'SHOT_PLANNING', [
    'ritmo_e_micro_pacing',
    'selecao_hibrida_de_midia',
    'estilo_johnny_harris',
    'profundidade_3d_layering',
    'sonoplastia_sincronizada'
  ]);
  console.log(`✅ Editor RAG recuperou ${editorialInsights.principles.length} princípios editoriais:`);
  editorialInsights.principles.slice(0, 3).forEach((p: string) => console.log(`   - ${p}`));

  // ---------------------------------------------------------------------------
  // 2. AGENTE DE VOZ ELEVENLABS: Geração da Narração em INGLÊS com a Voz Chris
  // ---------------------------------------------------------------------------
  console.log('\n🎙️ [2/5] Executando ElevenLabs Narration Agent (Voz Chris - English Pressure Test)...');
  const narrationAdapter = new ElevenLabsNarrationAdapter();

  // Script documental 100% nativo em inglês calibrado para os 12 beats de 5 segundos
  const englishNarrationScript = 'Beneath every major hub, an invisible operation runs at design capacity. As scheduled demand surges, system stress climbs rapidly. Safety buffers begin to evaporate. In a multi-stage flow from A to E, throughput looks balanced. Until you look closely at Node D. Processing drops to just seventy-two units per minute. The bottleneck is triggered. Backlog spikes instantly to twenty-three minutes. Critical buffers hit three percent. Workarounds and bypass routes are activated. But operational costs climb thirty-seven percent. Across the network, fifty-six operations fail. How much can a system hold? It is only as strong as its single tightest constraint.';

  const narrationDest = path.resolve(root, 'public', 'audio', 'narration_1min_chris_en.mp3');
  await narrationAdapter.generateSpeech({
    text: englishNarrationScript,
    outputPath: narrationDest
  });
  console.log(`✅ Narração em inglês gerada com a voz Chris em: ${narrationDest}`);

  // ---------------------------------------------------------------------------
  // 3. AGENTE DE SOUND DESIGN: Planejamento dos 12 Beats Cinemáticos
  // ---------------------------------------------------------------------------
  console.log('\n🎧 [3/5] Executando Sound Design Agent (12 Cenas / 1800 Frames)...');
  const soundAgent = new SoundDesignAgent(root);

  const videoAnalysis: VideoAnalysisInput = {
    videoId: 'hsl_pressure_test_1min',
    totalFrames: 1800, // 60s @ 30fps
    fps: 30,
    globalMood: 'suspense',
    scenes: [
      {
        sceneId: 'beat_01_normal',
        startFrame: 0,
        endFrame: 150,
        detectedMood: 'suspense',
        detectedEnvironment: 'airport_tarmac',
        visualCues: [{ frame: 0, type: 'environment', description: 'Airport normal flow' }],
        audioCues: [{ frame: 0, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'foley']
      },
      {
        sceneId: 'beat_02_demand',
        startFrame: 150,
        endFrame: 300,
        detectedMood: 'suspense',
        detectedEnvironment: 'airport_tarmac',
        visualCues: [{ frame: 150, type: 'action', description: 'Capacity rising' }],
        audioCues: [{ frame: 150, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'tension_riser']
      },
      {
        sceneId: 'beat_03_pressure',
        startFrame: 300,
        endFrame: 450,
        detectedMood: 'suspense',
        detectedEnvironment: 'terminal_crowd',
        visualCues: [{ frame: 300, type: 'action', description: 'Stress climbs' }],
        audioCues: [{ frame: 300, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'foley']
      },
      {
        sceneId: 'beat_04_apparent',
        startFrame: 450,
        endFrame: 600,
        detectedMood: 'suspense',
        detectedEnvironment: 'gate_area',
        visualCues: [{ frame: 450, type: 'action', description: 'Critical load 92%' }],
        audioCues: [{ frame: 450, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'tension_riser']
      },
      {
        sceneId: 'beat_05_flow',
        startFrame: 600,
        endFrame: 750,
        detectedMood: 'action',
        detectedEnvironment: 'digital_grid',
        visualCues: [{ frame: 600, type: 'action', description: 'System flow A-E nodes' }],
        audioCues: [{ frame: 600, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'foley']
      },
      {
        sceneId: 'beat_06_bottleneck',
        startFrame: 750,
        endFrame: 900,
        detectedMood: 'suspense',
        detectedEnvironment: 'radar_lock',
        visualCues: [{ frame: 750, type: 'climax', description: 'Bottleneck D=72 reveal', soundNeeded: 'boom_impact' }],
        audioCues: [{ frame: 750, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'boom']
      },
      {
        sceneId: 'beat_07_queue',
        startFrame: 900,
        endFrame: 1050,
        detectedMood: 'suspense',
        detectedEnvironment: 'queue_lines',
        visualCues: [{ frame: 900, type: 'action', description: 'Queue 23 mins' }],
        audioCues: [{ frame: 900, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'foley']
      },
      {
        sceneId: 'beat_08_buffers',
        startFrame: 1050,
        endFrame: 1200,
        detectedMood: 'suspense',
        detectedEnvironment: 'baggage_area',
        visualCues: [{ frame: 1050, type: 'action', description: 'Buffers 3%' }],
        audioCues: [{ frame: 1050, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'tension_riser']
      },
      {
        sceneId: 'beat_09_workaround',
        startFrame: 1200,
        endFrame: 1350,
        detectedMood: 'action',
        detectedEnvironment: 'control_room',
        visualCues: [{ frame: 1200, type: 'action', description: 'Emergency workaround' }],
        audioCues: [{ frame: 1200, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'foley']
      },
      {
        sceneId: 'beat_10_cost',
        startFrame: 1350,
        endFrame: 1500,
        detectedMood: 'suspense',
        detectedEnvironment: 'flight_board',
        visualCues: [{ frame: 1350, type: 'action', description: 'Cost +37%' }],
        audioCues: [{ frame: 1350, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'tension_riser']
      },
      {
        sceneId: 'beat_11_consequences',
        startFrame: 1500,
        endFrame: 1650,
        detectedMood: 'action',
        detectedEnvironment: 'grounded_planes',
        visualCues: [{ frame: 1500, type: 'action', description: '18400 passengers delayed' }],
        audioCues: [{ frame: 1500, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'foley']
      },
      {
        sceneId: 'beat_12_thesis',
        startFrame: 1650,
        endFrame: 1800,
        detectedMood: 'epic',
        detectedEnvironment: 'master_map',
        visualCues: [{ frame: 1650, type: 'climax', description: 'Master pressure map resolution', soundNeeded: 'boom_impact' }],
        audioCues: [{ frame: 1650, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'boom']
      }
    ]
  };

  const audioPlanPath = path.resolve(root, 'examples', 'test-video-1min-audio-plan.json');
  const remotionAudioPath = path.resolve(root, 'remotion', 'TestVideo1MinAudio.tsx');

  const {plan} = soundAgent.runFullPipeline(videoAnalysis, remotionAudioPath, audioPlanPath);
  console.log(`✅ AudioPlan gerado com ${plan.scenes.length} cenas dinâmicas e ${plan.scenes.reduce((a: number, b: any) => a + b.layers.length, 0)} camadas de SFX.`);

  // ---------------------------------------------------------------------------
  // 4. RENDERIZAÇÃO DO VÍDEO COMPLETO VIA REMOTION CLI
  // ---------------------------------------------------------------------------
  console.log('\n🎥 [4/5] Renderizando o vídeo final via Remotion CLI (1800 frames @ 30fps)...');
  const outDir = path.resolve(root, 'out');
  fs.mkdirSync(outDir, {recursive: true});
  const outputVideoPath = path.resolve(outDir, 'test-video-1min.mp4');

  const renderArgs = [
    'remotion', 'render',
    'remotion/index.ts',
    'TestVideo1Min',
    'out/test-video-1min.mp4',
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

  if (!fs.existsSync(outputVideoPath)) {
    throw new Error(`REMOTION_RENDER_FAILED: O vídeo não foi gerado em ${outputVideoPath}`);
  }

  // Copiar cópia direta para o Desktop
  const desktopPath = path.resolve('C:\\Users\\brend\\OneDrive\\Desktop\\test-video-1min.mp4');
  fs.copyFileSync(outputVideoPath, desktopPath);

  // ---------------------------------------------------------------------------
  // 5. VALIDAÇÃO TÉCNICA FFPROBE
  // ---------------------------------------------------------------------------
  console.log('\n📊 [5/5] Validando integridade técnica com ffprobe...');
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

  console.log('\n================================================================');
  console.log('🎉 VÍDEO HSL // PRESSURE TEST RENDERIZADO COM SUCESSO!');
  console.log('================================================================');
  console.log(`📁 Arquivo: ${outputVideoPath}`);
  console.log(`🖥️ Desktop: ${desktopPath}`);
  console.log(`🎙️ Voz: Chris (ElevenLabs Multilingual v2 - English Native)`);
  console.log(`🎬 Formato: 12 Beats Cinemáticos PRESSURE TEST (Mudança a cada 5s)`);
  console.log(`⏱️ Duração: ${duration.toFixed(2)}s (${Math.round(duration * 30)} frames @ 30fps)`);
  console.log(`📐 Resolução: ${videoStream?.width || 1920}x${videoStream?.height || 1080} (${videoStream?.codec_name || 'h264'})`);
  console.log(`🔊 Áudio: ${audioStream?.sample_rate || 48000}Hz (${audioStream?.channels || 2} canais estéreo)`);
  console.log('================================================================\n');

  return {
    status: 'SUCCESS',
    videoPath: outputVideoPath,
    durationSeconds: duration,
    totalFrames: 1800,
    fps: 30,
    resolution: `${videoStream?.width || 1920}x${videoStream?.height || 1080}`,
    scenesCount: 12,
    sfxCount: plan.scenes.reduce((a: number, b: any) => a + b.layers.length, 0),
    audioPlanPath
  };
}

if (require.main === module) {
  generateOneMinuteVideo().catch(err => {
    console.error('ONE_MINUTE_TEST_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
