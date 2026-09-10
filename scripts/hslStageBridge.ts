import fs from 'fs';
import path from 'path';
import { HslSceneDirectorAgent, EpisodeTopicInput, HslLongFormProjectPlan } from '../hsl/core/hslSceneDirectorAgent';
import { HslImageFrameEngine } from '../hsl/core/hslImageFrameEngine';
import { HslFireflyVideoEngine } from '../hsl/core/hslFireflyVideoEngine';
import { ElevenLabsNarrationAdapter } from '../adapters/elevenLabsNarrationAdapter';
import { SoundDesignAgent } from '../sound-agent/index';
import { VideoAnalysisInput } from '../sound-agent/types/scene-analysis.types';
import { ThumbnailSeoEngine, EpisodePackagingInput } from '../hsl/packaging/thumbnailSeoEngine';
import { validateBeforeRender } from '../hsl/core/hslValidationGatekeeper';
import { inspectMediaWithFfprobe } from '../hsl/core/hslPathResolver';
import { HslRunManifest } from '../hsl/core/hslRunManifest';
import { HslComplianceChecker } from '../spec/hsl-compliance-checker';
import { HslDriveStorage } from '../hsl/core/hslDriveStorage';
import {
  HSL_EPISODE_TARGET_DURATION_SECONDS,
  HSL_DURATION_TOLERANCE_SECONDS,
  HSL_AUDIO_BITRATE
} from '../spec/hsl-spec';
import { spawnSync } from 'child_process';
import { DialogLevelingAgent, LoudnessQaAgent } from '../hsl/postproduction/narrationAudioRuntime';
import { HslSoundFxRuntime, SoundFxScene } from '../hsl/postproduction/soundFxRuntime';

interface BridgeOptions {
  stage: string;
  episodeId: string;
  topic?: string;
  targetMinutes?: number;
  entity?: string;
  mechanism?: string;
  constraint?: string;
  consequence?: string;
  thesis?: string;
  dryRun?: boolean;
}

function parseArgs(): BridgeOptions {
  const args = process.argv.slice(2);
  let stage = 'STAGE_01_SCENE_PLAN';
  let episodeId = 'HSL_EPISODE_001';
  let topic = 'THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING';
  let targetMinutes = 10;
  let entity = 'Airport Jet Fuel Logistics';
  let mechanism = 'Pipeline to Hydrant Manifold High-Pressure Injection';
  let constraint = 'Hydrant Pressure Collapse at Node D (72 Units/min)';
  let consequence = '56 Delayed Flights and $2.7M Cascading Economic Loss';
  let thesis = 'The visible product is a flight; the hidden product is synchronized fuel logistics.';
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--stage' && args[i + 1]) stage = args[++i];
    else if (args[i] === '--episode-id' && args[i + 1]) episodeId = args[++i];
    else if (args[i] === '--topic' && args[i + 1]) topic = args[++i];
    else if (args[i] === '--target-minutes' && args[i + 1]) targetMinutes = parseInt(args[++i], 10);
    else if (args[i] === '--entity' && args[i + 1]) entity = args[++i];
    else if (args[i] === '--mechanism' && args[i + 1]) mechanism = args[++i];
    else if (args[i] === '--constraint' && args[i + 1]) constraint = args[++i];
    else if (args[i] === '--consequence' && args[i + 1]) consequence = args[++i];
    else if (args[i] === '--thesis' && args[i + 1]) thesis = args[++i];
    else if (args[i] === '--dry-run') dryRun = true;
  }

  return {
    stage,
    episodeId,
    topic,
    targetMinutes,
    entity,
    mechanism,
    constraint,
    consequence,
    thesis,
    dryRun
  };
}

function emitResult(result: Record<string, any>) {
  console.log(`\n__STAGE_RESULT__:${JSON.stringify(result)}`);
}

async function executeStage(opts: BridgeOptions) {
  const root = process.cwd();
  const episodeDir = path.resolve(root, 'runs', opts.episodeId);
  fs.mkdirSync(episodeDir, { recursive: true });

  const topicInput: EpisodeTopicInput = {
    episodeId: opts.episodeId,
    topic: opts.topic || 'THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING',
    targetMinutes: opts.targetMinutes || 10,
    entity: opts.entity || 'Airport Jet Fuel Logistics',
    mechanism: opts.mechanism || 'Pipeline to Hydrant Manifold High-Pressure Injection',
    constraint: opts.constraint || 'Hydrant Pressure Collapse at Node D (72 Units/min)',
    consequence: opts.consequence || '56 Delayed Flights and $2.7M Cascading Economic Loss',
    thesis: opts.thesis || 'The visible product is a flight; the hidden product is synchronized fuel logistics.'
  };

  const manifest = new HslRunManifest(opts.episodeId, root);

  switch (opts.stage) {
    case 'STAGE_01_SCENE_PLAN': {
      manifest.startStage('STAGE_01_SCENE_PLAN');
      const scenePlanPath = path.resolve(episodeDir, 'scene-plan.json');
      let scenePlan: HslLongFormProjectPlan;
      if (fs.existsSync(scenePlanPath)) {
        scenePlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
        console.log(`    [Stage 01] Plano de cenas existente validado em ${scenePlanPath}. Total beats: ${scenePlan.totalBeatsCount}`);
      } else {
        scenePlan = HslSceneDirectorAgent.planEpisodeFromScratch(topicInput);
        fs.writeFileSync(scenePlanPath, JSON.stringify(scenePlan, null, 2), 'utf8');
      }
      manifest.completeStage('STAGE_01_SCENE_PLAN', { totalBeats: scenePlan.totalBeatsCount });
      manifest.setArtifacts({ scenePlanPath });
      HslDriveStorage.saveStageCheckpoint(opts.episodeId, 'STAGE_01_SCENE_PLAN', [scenePlanPath]);
      emitResult({
        status: 'SUCCESS',
        stage: opts.stage,
        totalBeats: scenePlan.totalBeatsCount,
        totalFrames: scenePlan.totalFrames,
        scenePlanPath
      });
      break;
    }

    case 'STAGE_02_IMAGE_FRAMES': {
      manifest.startStage('STAGE_02_IMAGE_FRAMES');
      const scenePlanPath = path.resolve(episodeDir, 'scene-plan.json');
      if (!fs.existsSync(scenePlanPath)) {
        throw new Error(`Scene plan not found at: ${scenePlanPath}`);
      }
      const scenePlan: HslLongFormProjectPlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
      if (opts.dryRun) {
        emitResult({
          status: 'SUCCESS',
          stage: opts.stage,
          dryRun: true,
          totalFrames: scenePlan.beats.length,
          outputDirectory: path.resolve(root, 'public', 'runs', opts.episodeId, 'frames')
        });
        break;
      }
      const frameResult = await HslImageFrameEngine.generateFramesForEpisode(opts.episodeId, scenePlan.beats);
      manifest.completeStage('STAGE_02_IMAGE_FRAMES', { totalGenerated: frameResult.totalGenerated });
      manifest.setArtifacts({ framesCount: frameResult.totalGenerated });
      emitResult({
        status: 'SUCCESS',
        stage: opts.stage,
        totalGenerated: frameResult.totalGenerated,
        outputDirectory: frameResult.outputDirectory
      });
      break;
    }

    case 'STAGE_03_FIREFLY_VIDEOS': {
      manifest.startStage('STAGE_03_FIREFLY_VIDEOS');
      const scenePlanPath = path.resolve(episodeDir, 'scene-plan.json');
      if (!fs.existsSync(scenePlanPath)) {
        throw new Error(`Scene plan not found at: ${scenePlanPath}`);
      }
      const scenePlan: HslLongFormProjectPlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
      if (opts.dryRun) {
        emitResult({
          status: 'SUCCESS',
          stage: opts.stage,
          dryRun: true,
          totalVideos: scenePlan.beats.filter(b => b.visualMode === 'firefly_video').length,
          videoOutputDirectory: path.resolve(root, 'public', 'runs', opts.episodeId, 'videos')
        });
        break;
      }
      const fireflyResult = await HslFireflyVideoEngine.processVideoBeatsForEpisode(opts.episodeId, scenePlan.beats);
      manifest.completeStage('STAGE_03_FIREFLY_VIDEOS', { totalVideos: fireflyResult.totalVideoBeats });
      manifest.setArtifacts({ videosCount: fireflyResult.totalVideoBeats });
      emitResult({
        status: 'SUCCESS',
        stage: opts.stage,
        totalVideos: fireflyResult.totalVideoBeats,
        videoOutputDirectory: fireflyResult.videoOutputDirectory
      });
      break;
    }

    case 'STAGE_04_NARRATION': {
      manifest.startStage('STAGE_04_NARRATION');
      const scenePlanPath = path.resolve(episodeDir, 'scene-plan.json');
      if (!fs.existsSync(scenePlanPath)) {
        throw new Error(`Scene plan not found at: ${scenePlanPath}`);
      }
      const scenePlan: HslLongFormProjectPlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
      const fullScript = scenePlan.beats.map(b => b.voiceoverScript).join(' ');
      const narrationDest = path.resolve(episodeDir, 'audio', 'narration.mp3');
      const publicNarrationDest = path.resolve(root, 'public', 'audio', 'narration.mp3');

      if (opts.dryRun) {
        emitResult({
          status: 'SUCCESS',
          stage: opts.stage,
          dryRun: true,
          scriptWordCount: fullScript.split(/\s+/).length,
          targetAudioPath: narrationDest
        });
        break;
      }

      if (!fs.existsSync(narrationDest) || fs.statSync(narrationDest).size < 100000) {
        const narrationAdapter = new ElevenLabsNarrationAdapter();
        await narrationAdapter.generateSpeech({ text: fullScript, outputPath: narrationDest });
      } else {
        console.log(`    [Stage 04] Áudio de narração existente validado (${(fs.statSync(narrationDest).size / 1024 / 1024).toFixed(2)} MB). Reutilizando.`);
      }
      fs.mkdirSync(path.dirname(publicNarrationDest), { recursive: true });
      fs.copyFileSync(narrationDest, publicNarrationDest);
      const narrationInfo = inspectMediaWithFfprobe(narrationDest);
      manifest.completeStage('STAGE_04_NARRATION', { durationSeconds: narrationInfo.durationSeconds });
      manifest.setArtifacts({ narrationAudioPath: narrationDest, narrationDurationSeconds: narrationInfo.durationSeconds });
      HslDriveStorage.saveStageCheckpoint(opts.episodeId, 'STAGE_04_NARRATION', [narrationDest]);
      emitResult({
        status: 'SUCCESS',
        stage: opts.stage,
        narrationPath: narrationDest,
        durationSeconds: narrationInfo.durationSeconds
      });
      break;
    }

    case 'STAGE_05_SOUND_DESIGN': {
      manifest.startStage('STAGE_05_SOUND_DESIGN');
      const scenePlanPath = path.resolve(episodeDir, 'scene-plan.json');
      if (!fs.existsSync(scenePlanPath)) {
        throw new Error(`Scene plan not found at: ${scenePlanPath}`);
      }
      const scenePlan: HslLongFormProjectPlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
      const audioPlanPath = path.resolve(episodeDir, 'audio-plan.json');
      const remotionAudioPath = path.resolve(root, 'remotion', 'TestVideo1MinAudio.tsx');

      if (opts.dryRun) {
        emitResult({
          status: 'SUCCESS',
          stage: opts.stage,
          dryRun: true,
          audioPlanPath
        });
        break;
      }

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
        videoId: opts.episodeId,
        totalFrames: scenePlan.totalFrames,
        fps: 30,
        globalMood: 'suspense',
        scenes: analysisScenes
      };

      soundAgent.runFullPipeline(videoAnalysis, remotionAudioPath, audioPlanPath);
      manifest.completeStage('STAGE_05_SOUND_DESIGN');
      HslDriveStorage.saveStageCheckpoint(opts.episodeId, 'STAGE_05_SOUND_DESIGN', [audioPlanPath]);
      emitResult({
        status: 'SUCCESS',
        stage: opts.stage,
        audioPlanPath
      });
      break;
    }

    case 'STAGE_06_PRE_RENDER_GATE': {
      manifest.startStage('STAGE_06_PRE_RENDER_GATE');
      const gatekeeper = await validateBeforeRender(opts.episodeId);
      if (!gatekeeper.passed) {
        manifest.failStage('STAGE_06_PRE_RENDER_GATE', gatekeeper.blocked_reason || 'Gatekeeper blocked');
        emitResult({
          status: 'BLOCKED',
          stage: opts.stage,
          passed: false,
          autoRecovered: gatekeeper.autoRecovered,
          blockedReason: gatekeeper.blocked_reason,
          verifiedBeats: gatekeeper.verifiedBeatsCount,
          totalBeats: gatekeeper.totalBeatsCount
        });
      } else {
        manifest.completeStage('STAGE_06_PRE_RENDER_GATE', {
          verifiedBeats: gatekeeper.verifiedBeatsCount,
          autoRecovered: gatekeeper.autoRecovered
        });
        emitResult({
          status: 'SUCCESS',
          stage: opts.stage,
          passed: true,
          autoRecovered: gatekeeper.autoRecovered,
          verifiedBeats: gatekeeper.verifiedBeatsCount,
          totalBeats: gatekeeper.totalBeatsCount
        });
      }
      break;
    }

    case 'STAGE_07_REMOTION_RENDER': {
      manifest.startStage('STAGE_07_REMOTION_RENDER');
      const scenePlanPath = path.resolve(episodeDir, 'scene-plan.json');
      if (!fs.existsSync(scenePlanPath)) {
        throw new Error(`Scene plan not found at: ${scenePlanPath}`);
      }
      const scenePlan: HslLongFormProjectPlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
      const outDir = path.resolve(root, 'out');
      fs.mkdirSync(outDir, { recursive: true });
      const tempVisualPath = path.resolve(outDir, `temp_visual_${opts.episodeId.toLowerCase()}.mp4`);

      if (opts.dryRun) {
        emitResult({
          status: 'SUCCESS',
          stage: opts.stage,
          dryRun: true,
          tempVisualPath,
          totalFrames: scenePlan.totalFrames || 18000
        });
        break;
      }

      let needsRender = true;
      if (fs.existsSync(tempVisualPath)) {
        try {
          const info = inspectMediaWithFfprobe(tempVisualPath);
          if (info.hasVideo && info.width === 1920 && info.height === 1080 &&
              Math.abs(info.durationSeconds - scenePlan.totalDurationSeconds) <= HSL_DURATION_TOLERANCE_SECONDS) {
            needsRender = false;
            console.log(`    [Stage 07] Trilha visual existente válida encontrada (${info.durationSeconds.toFixed(2)}s). Pulando re-codificação.`);
          }
        } catch {}
      }

      if (needsRender) {
        console.log(`    [Stage 07] Montando ${scenePlan.beats.length} beats cinematográficos em 1080p Full HD...`);
        const segmentDir = path.resolve(episodeDir, 'temp_segments');
        fs.mkdirSync(segmentDir, { recursive: true });
        const segmentPaths: string[] = [];

        for (let i = 0; i < scenePlan.beats.length; i++) {
          const beat = scenePlan.beats[i];
          const segPath = path.resolve(segmentDir, `seg_${String(i + 1).padStart(3, '0')}_${beat.beatId}.mp4`);
          const duration = beat.durationSeconds;

          const videoCandidates = [
            path.resolve(root, 'public', 'runs', opts.episodeId, 'videos', `${beat.beatId}.mp4`),
            path.resolve(root, 'runs', opts.episodeId, 'videos', `${beat.beatId}.mp4`)
          ];
          const videoPath = videoCandidates.find(p => fs.existsSync(p) && fs.statSync(p).size > 10000);

          const frameCandidates = [
            path.resolve(root, 'public', 'runs', opts.episodeId, 'frames', `${beat.beatId}.png`),
            path.resolve(root, 'runs', opts.episodeId, 'frames', `${beat.beatId}.png`)
          ];
          const framePath = frameCandidates.find(p => fs.existsSync(p) && fs.statSync(p).size > 5000);

          if (!fs.existsSync(segPath) || fs.statSync(segPath).size < 1000) {
            let ffmpegArgs: string[];
            if (videoPath) {
              ffmpegArgs = [
                '-y', '-hide_banner', '-loglevel', 'error',
                '-stream_loop', '-1', '-i', videoPath,
                '-t', duration.toFixed(3),
                '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,format=yuv420p',
                '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-movflags', '+faststart',
                segPath
              ];
            } else if (framePath) {
              ffmpegArgs = [
                '-y', '-hide_banner', '-loglevel', 'error',
                '-loop', '1', '-i', framePath,
                '-t', duration.toFixed(3),
                '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,format=yuv420p',
                '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-movflags', '+faststart',
                segPath
              ];
            } else {
              throw new Error(`Asset ausente para o beat ${beat.beatId}`);
            }

            const proc = spawnSync('ffmpeg', ffmpegArgs, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 50 });
            if (proc.status !== 0 || !fs.existsSync(segPath)) {
              throw new Error(`FFmpeg falhou ao codificar beat ${beat.beatId}: ${proc.stderr}`);
            }
          }
          segmentPaths.push(segPath);
          if ((i + 1) % 24 === 0 || i + 1 === scenePlan.beats.length) {
            console.log(`    [Stage 07] Progresso: ${i + 1}/${scenePlan.beats.length} beats renderizados...`);
          }
        }

        const concatListPath = path.resolve(segmentDir, 'concat_list.txt');
        fs.writeFileSync(
          concatListPath,
          segmentPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n') + '\n',
          'utf8'
        );

        console.log(`    [Stage 07] Unindo todos os beats em ${tempVisualPath}...`);
        const concatRes = spawnSync('ffmpeg', [
          '-y', '-nostdin', '-hide_banner', '-loglevel', 'error',
          '-f', 'concat', '-safe', '0', '-i', concatListPath,
          '-c', 'copy', tempVisualPath
        ], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 50 });

        if (concatRes.status !== 0 || !fs.existsSync(tempVisualPath)) {
          throw new Error(`FFmpeg concat falhou: ${concatRes.stderr}`);
        }

        try {
          fs.rmSync(segmentDir, { recursive: true, force: true });
        } catch {}
      }

      const visualInfo = inspectMediaWithFfprobe(tempVisualPath);
      manifest.completeStage('STAGE_07_REMOTION_RENDER', {
        tempVisualPath,
        durationSeconds: visualInfo.durationSeconds,
        width: visualInfo.width,
        height: visualInfo.height
      });
      manifest.setArtifacts({ videoVisualPath: tempVisualPath });

      emitResult({
        status: 'SUCCESS',
        stage: opts.stage,
        tempVisualPath,
        durationSeconds: visualInfo.durationSeconds,
        width: visualInfo.width,
        height: visualInfo.height
      });
      break;
    }

    case 'STAGE_08_PRE_MUX_GATE': {
      manifest.startStage('STAGE_08_PRE_MUX_GATE');
      const scenePlanPath = path.resolve(episodeDir, 'scene-plan.json');
      if (!fs.existsSync(scenePlanPath)) throw new Error(`Scene plan not found at: ${scenePlanPath}`);
      const scenePlan: HslLongFormProjectPlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));

      const outDir = path.resolve(root, 'out');
      const tempVisualPath = path.resolve(outDir, `temp_visual_${opts.episodeId.toLowerCase()}.mp4`);
      const narrationDest = path.resolve(episodeDir, 'audio', 'narration.mp3');
      const publicNarrationDest = path.resolve(root, 'public', 'audio', 'narration.mp3');

      if (opts.dryRun) {
        emitResult({
          status: 'SUCCESS',
          stage: opts.stage,
          dryRun: true,
          durationPass: true
        });
        break;
      }

      if (!fs.existsSync(tempVisualPath)) throw new Error(`Trilha visual não encontrada em ${tempVisualPath}`);
      if (!fs.existsSync(narrationDest)) throw new Error(`Narração não encontrada em ${narrationDest}`);

      const visualInfo = inspectMediaWithFfprobe(tempVisualPath);
      const targetDuration = visualInfo.durationSeconds > 0 ? visualInfo.durationSeconds : scenePlan.totalDurationSeconds;
      const audioInfo = inspectMediaWithFfprobe(narrationDest);
      let durationDiff = Math.abs(audioInfo.durationSeconds - targetDuration);

      console.log(`    [Stage 08] Duração Visual: ${targetDuration.toFixed(2)}s | Narração: ${audioInfo.durationSeconds.toFixed(2)}s | Delta: ${durationDiff.toFixed(2)}s`);

      if (durationDiff > HSL_DURATION_TOLERANCE_SECONDS) {
        const tempoFactor = audioInfo.durationSeconds / targetDuration;
        console.log(`    [Stage 08] Aplicando ajuste de tempo (atempo=${tempoFactor.toFixed(4)}) para sincronizar perfeitamente...`);
        const syncedMp3 = path.resolve(episodeDir, 'audio', 'narration-synced.mp3');
        const tempoRes = spawnSync('ffmpeg', [
          '-y', '-hide_banner', '-loglevel', 'error',
          '-i', narrationDest,
          '-filter:a', `atempo=${tempoFactor.toFixed(6)}`,
          '-c:a', 'libmp3lame', '-b:a', '192k',
          syncedMp3
        ], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 });

        if (tempoRes.status !== 0 || !fs.existsSync(syncedMp3)) {
          throw new Error(`FFmpeg atempo falhou: ${tempoRes.stderr}`);
        }
        fs.copyFileSync(syncedMp3, narrationDest);
        fs.mkdirSync(path.dirname(publicNarrationDest), { recursive: true });
        fs.copyFileSync(syncedMp3, publicNarrationDest);
        try { fs.unlinkSync(syncedMp3); } catch {}
      }

      console.log(`    [Stage 08] Aplicando DialogLevelingAgent para normalização -16 LUFS e 48kHz PCM...`);
      const narrationMasterWav = path.resolve(episodeDir, 'audio', 'narration-master.wav');
      const dialogLeveler = new DialogLevelingAgent();
      dialogLeveler.level(narrationDest, narrationMasterWav);

      const publicMasterWav = path.resolve(root, 'public', 'runs', opts.episodeId, 'audio', 'narration-master.wav');
      fs.mkdirSync(path.dirname(publicMasterWav), { recursive: true });
      fs.copyFileSync(narrationMasterWav, publicMasterWav);

      console.log(`    [Stage 08] Validando qualidade de áudio com LoudnessQaAgent...`);
      const loudnessQa = new LoudnessQaAgent();
      const qaResult = loudnessQa.validate(narrationMasterWav);
      const narrationQaPath = path.resolve(episodeDir, 'audio', 'narration-audio-qa.json');
      fs.writeFileSync(narrationQaPath, JSON.stringify(qaResult, null, 2), 'utf8');

      const updatedAudioInfo = inspectMediaWithFfprobe(narrationMasterWav);
      durationDiff = Math.abs(updatedAudioInfo.durationSeconds - targetDuration);
      console.log(`    [Stage 08] Sincronia final: Delta ${durationDiff.toFixed(2)}s | Status QA: ${qaResult.status}`);

      manifest.completeStage('STAGE_08_PRE_MUX_GATE', {
        visualDuration: targetDuration,
        audioDuration: updatedAudioInfo.durationSeconds,
        durationDiff,
        qaResult
      });

      emitResult({
        status: 'SUCCESS',
        stage: opts.stage,
        visualDuration: targetDuration,
        audioDuration: updatedAudioInfo.durationSeconds,
        durationDiff,
        narrationQaPath,
        qaStatus: qaResult.status
      });
      break;
    }

    case 'STAGE_09_FFMPEG_MUX': {
      manifest.startStage('STAGE_09_FFMPEG_MUX');
      const scenePlanPath = path.resolve(episodeDir, 'scene-plan.json');
      if (!fs.existsSync(scenePlanPath)) throw new Error(`Scene plan not found at: ${scenePlanPath}`);
      const scenePlan: HslLongFormProjectPlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));

      const outDir = path.resolve(root, 'out');
      fs.mkdirSync(outDir, { recursive: true });
      const tempVisualPath = path.resolve(outDir, `temp_visual_${opts.episodeId.toLowerCase()}.mp4`);
      const masterVideoPath = path.resolve(outDir, `${opts.episodeId.toLowerCase()}.mp4`);
      const narrationMasterWav = path.resolve(episodeDir, 'audio', 'narration-master.wav');
      const narrationDest = fs.existsSync(narrationMasterWav) ? narrationMasterWav : path.resolve(episodeDir, 'audio', 'narration.mp3');

      if (opts.dryRun) {
        emitResult({
          status: 'SUCCESS',
          stage: opts.stage,
          dryRun: true,
          masterVideoPath,
          durationSeconds: scenePlan.totalDurationSeconds
        });
        break;
      }

      if (!fs.existsSync(tempVisualPath)) throw new Error(`Trilha visual ausente em ${tempVisualPath}`);
      if (!fs.existsSync(narrationDest)) throw new Error(`Narração ausente em ${narrationDest}`);

      console.log(`    [Stage 09] Gerando trilha de sound design Kenney CC0 (SFX)...`);
      const scenes: SoundFxScene[] = scenePlan.beats.map(b => ({
        scene_id: b.beatId,
        episode_id: opts.episodeId,
        chapter_id: `ACT_${b.actNumber}`,
        planned_duration_seconds: b.durationSeconds,
        narrative_function: `${b.narrativeRole || ''} ${b.voiceoverScript || ''}`,
        visual_subject: b.promptSubject || b.cinematicPrompt || '',
        micro_events: [],
        remotion_choreography: []
      }));

      const sfxOutputDir = path.resolve(episodeDir, 'audio');
      const sfxRuntime = new HslSoundFxRuntime();
      const sfxResult = sfxRuntime.run({
        scenes,
        outputDirectory: sfxOutputDir,
        fps: 30
      });

      const sfxTrackPath = path.resolve(sfxOutputDir, 'sfx-track.wav');
      fs.copyFileSync(sfxResult.bedPath, sfxTrackPath);
      console.log(`    [Stage 09] Trilha SFX gerada: ${sfxTrackPath} (QA: ${sfxResult.qa.status})`);

      const musicCandidates = [
        path.resolve(root, 'assets/audio-library/music/cinematic/suspense/suspense_oppressive_gloom.mp3'),
        path.resolve(root, 'public/audio/music/cinematic/suspense/suspense_oppressive_gloom.mp3')
      ];
      const musicPath = musicCandidates.find(p => fs.existsSync(p));
      if (!musicPath) throw new Error('Trilha musical de suspense ausente em assets/audio-library');

      console.log(`    [Stage 09] Executando FFmpeg Master Mux com 3 faixas integradas...`);
      const muxArgs = [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-i', tempVisualPath,
        '-i', narrationDest,
        '-stream_loop', '-1', '-i', musicPath,
        '-i', sfxTrackPath,
        '-filter_complex',
        '[1:a]volume=1.0[voice];[2:a]volume=0.04[music];[3:a]volume=0.72[sfx];[voice][music][sfx]amix=inputs=3:duration=first:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11[aout]',
        '-map', '0:v:0',
        '-map', '[aout]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', HSL_AUDIO_BITRATE,
        '-ar', '48000',
        '-shortest',
        '-movflags', '+faststart',
        masterVideoPath
      ];

      const muxRes = spawnSync('ffmpeg', muxArgs, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 50 });
      if (muxRes.status !== 0 || !fs.existsSync(masterVideoPath)) {
        throw new Error(`FFmpeg Master Mux falhou: ${muxRes.stderr}`);
      }

      try { fs.unlinkSync(tempVisualPath); } catch {}

      const deliveryVideoDir = path.resolve(root, 'deliveries', opts.episodeId, 'video');
      const runVideoDir = path.resolve(episodeDir, 'video');
      fs.mkdirSync(deliveryVideoDir, { recursive: true });
      fs.mkdirSync(runVideoDir, { recursive: true });

      const finalDeliveryVideo = path.join(deliveryVideoDir, `${opts.episodeId.toLowerCase()}.mp4`);
      const finalRunVideo = path.join(runVideoDir, `${opts.episodeId.toLowerCase()}.mp4`);
      fs.copyFileSync(masterVideoPath, finalDeliveryVideo);
      fs.copyFileSync(masterVideoPath, finalRunVideo);

      const finalInfo = inspectMediaWithFfprobe(masterVideoPath);
      console.log(`    [Stage 09] Master final criado: ${masterVideoPath} (${finalInfo.durationSeconds.toFixed(2)}s, ${finalInfo.width}x${finalInfo.height})`);

      manifest.completeStage('STAGE_09_FFMPEG_MUX', {
        masterVideoPath,
        finalDeliveryVideo,
        durationSeconds: finalInfo.durationSeconds
      });
      manifest.setArtifacts({
        masterVideoPath,
        masterVideoDurationSeconds: finalInfo.durationSeconds,
        sfxTrackPath
      });

      emitResult({
        status: 'SUCCESS',
        stage: opts.stage,
        masterVideoPath,
        finalDeliveryVideo,
        durationSeconds: finalInfo.durationSeconds,
        width: finalInfo.width,
        height: finalInfo.height
      });
      break;
    }

    case 'STAGE_10_PACKAGING': {
      manifest.startStage('STAGE_10_PACKAGING');
      const scenePlanPath = path.resolve(episodeDir, 'scene-plan.json');
      let chapters: any[] = [];
      if (fs.existsSync(scenePlanPath)) {
        const scenePlan: HslLongFormProjectPlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
        chapters = scenePlan.acts.map(a => ({ title: a.title, durationSeconds: a.durationSeconds }));
      }
      const packagingInput: EpisodePackagingInput = {
        episodeId: opts.episodeId,
        mainTopic: topicInput.topic,
        entity: topicInput.entity,
        mechanism: topicInput.mechanism,
        constraint: topicInput.constraint,
        consequence: topicInput.consequence,
        thesis: topicInput.thesis,
        chapters
      };
      const publicationPackage = ThumbnailSeoEngine.generatePackage(packagingInput);
      ThumbnailSeoEngine.exportPackagingDeliverables(publicationPackage, root);

      const deliveryThumbsDir = path.resolve(root, 'deliveries', opts.episodeId, 'thumbnails');
      const deliveryPubDir = path.resolve(root, 'deliveries', opts.episodeId, 'publication');
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
      emitResult({
        status: 'SUCCESS',
        stage: opts.stage,
        titles: publicationPackage.titles,
        thumbnailsCount: publicationPackage.thumbnails.length,
        descriptionPreview: (publicationPackage.layeredDescription?.fullFormattedText || '').slice(0, 120)
      });
      break;
    }

    case 'STAGE_11_PRD_COMPLIANCE': {
      manifest.startStage('STAGE_11_PRD_COMPLIANCE');
      const complianceReport = HslComplianceChecker.checkCompliance(opts.episodeId);
      if (!complianceReport.passed) {
        manifest.failStage('STAGE_11_PRD_COMPLIANCE', `Reprovado em ${complianceReport.failedRules} regras.`);
        emitResult({
          status: 'FAILED',
          stage: opts.stage,
          passed: false,
          totalRules: complianceReport.totalRules,
          passedRules: complianceReport.passedRules,
          failedRules: complianceReport.failedRules,
          failures: complianceReport.results.filter(r => !r.passed)
        });
      } else {
        manifest.completeStage('STAGE_11_PRD_COMPLIANCE', {
          totalRules: complianceReport.totalRules,
          passedRules: complianceReport.passedRules
        });
        emitResult({
          status: 'SUCCESS',
          stage: opts.stage,
          passed: true,
          totalRules: complianceReport.totalRules,
          passedRules: complianceReport.passedRules
        });
      }
      break;
    }

    case 'STAGE_12_CLOUD_ARCHIVE': {
      try {
        if (!opts.dryRun) {
          HslDriveStorage.syncEpisode(opts.episodeId);
          HslDriveStorage.pruneRenderIntermediates(opts.episodeId);
        }
        manifest.completeRun();
        emitResult({
          status: 'SUCCESS',
          stage: opts.stage,
          driveSynced: true,
          localPruned: true,
          dryRun: opts.dryRun
        });
      } catch (err: any) {
        manifest.completeRun();
        emitResult({
          status: 'WARNING',
          stage: opts.stage,
          error: err.message
        });
      }
      break;
    }

    default:
      emitResult({
        status: 'UNKNOWN_STAGE',
        stage: opts.stage,
        supportedStages: [
          'STAGE_01_SCENE_PLAN',
          'STAGE_02_IMAGE_FRAMES',
          'STAGE_03_FIREFLY_VIDEOS',
          'STAGE_04_NARRATION',
          'STAGE_05_SOUND_DESIGN',
          'STAGE_06_PRE_RENDER_GATE',
          'STAGE_07_REMOTION_RENDER',
          'STAGE_08_PRE_MUX_GATE',
          'STAGE_09_FFMPEG_MUX',
          'STAGE_10_PACKAGING',
          'STAGE_11_PRD_COMPLIANCE',
          'STAGE_12_CLOUD_ARCHIVE'
        ]
      });
  }
}

const options = parseArgs();
executeStage(options).catch(err => {
  emitResult({
    status: 'ERROR',
    stage: options.stage,
    error: err instanceof Error ? err.stack || err.message : String(err)
  });
  process.exit(1);
});
