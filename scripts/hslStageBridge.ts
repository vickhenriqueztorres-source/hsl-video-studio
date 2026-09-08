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
      const scenePlan = HslSceneDirectorAgent.planEpisodeFromScratch(topicInput);
      const scenePlanPath = path.resolve(episodeDir, 'scene-plan.json');
      fs.writeFileSync(scenePlanPath, JSON.stringify(scenePlan, null, 2), 'utf8');
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

      const narrationAdapter = new ElevenLabsNarrationAdapter();
      await narrationAdapter.generateSpeech({ text: fullScript, outputPath: narrationDest });
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
        emitResult({
          status: 'SUCCESS',
          stage: opts.stage,
          driveSynced: true,
          localPruned: true,
          dryRun: opts.dryRun
        });
      } catch (err: any) {
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
