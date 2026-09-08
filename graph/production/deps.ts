import { HslSceneDirectorAgent } from '../../hsl/core/hslSceneDirectorAgent';
import { HslImageFrameEngine } from '../../hsl/core/hslImageFrameEngine';
import { HslLocalMotionVideoEngine } from '../../hsl/core/hslFireflyVideoEngine';
import type { NarrationGenerateOptions } from '../../adapters/elevenLabsNarrationAdapter';
import { narrateWithManagedKey } from './lib/elevenLabsNarration';
import { SoundDesignAgent } from '../../sound-agent';
import { validateBeforeRender } from '../../hsl/core/hslValidationGatekeeper';
import { HslComplianceChecker, type ComplianceOptions } from '../../spec/hsl-compliance-checker';
import { ThumbnailSeoEngine } from '../../hsl/packaging/thumbnailSeoEngine';
import { inspectMediaWithFfprobe, isValidPngFile } from '../../hsl/core/hslPathResolver';
import { VideoAnalysisInput } from '../../sound-agent/types/scene-analysis.types';
import * as assets from './lib/assets';
import * as server from './lib/assetServer';
import * as remotion from './lib/remotion';
import { createFfmpeg } from './lib/ffmpeg';
import { prepareAndRunIdeTaskWithFailover } from '../ide/ideRunner';
import * as firefly from './lib/firefly';
import { reviewTake } from './lib/firefly/qa';
import { renderSfx } from './lib/sfx';
import { generateCodexImages } from './lib/codexImages';
import { checkCodexAccounts } from '../ide/codexAccount';
import { driveCheckAuth, driveUploadVerified, driveVerify } from './storage/drive';
import { DialogLevelingAgent, LoudnessQaAgent } from '../../hsl/postproduction/narrationAudioRuntime';
export function realDependencies(root: string) {
  return {
    plan: HslSceneDirectorAgent.planEpisodeFromScratch.bind(HslSceneDirectorAgent),
    frames: HslImageFrameEngine.generateFramesForEpisode.bind(HslImageFrameEngine),
    videos: HslLocalMotionVideoEngine.processVideoBeatsForEpisode.bind(HslLocalMotionVideoEngine),
    narrate: (options: NarrationGenerateOptions) => narrateWithManagedKey(root, options),
    levelNarration: (inputPath: string, outputPath: string) => new DialogLevelingAgent().level(inputPath, outputPath),
    validateNarration: (filePath: string) => new LoudnessQaAgent().validate(filePath),
    sound: (input: VideoAnalysisInput, tsx: string, json: string) => new SoundDesignAgent(root).runFullPipeline(input, tsx, json),
    gatekeeper: validateBeforeRender,
    compliance: (episodeId?: string, options?: ComplianceOptions) => HslComplianceChecker.checkCompliance(episodeId, options),
    package: ThumbnailSeoEngine.generatePackage.bind(ThumbnailSeoEngine),
    exportPackage: ThumbnailSeoEngine.exportPackagingDeliverables.bind(ThumbnailSeoEngine),
    inspect: inspectMediaWithFfprobe,
    isPng: isValidPngFile,
    ide: prepareAndRunIdeTaskWithFailover,
    fireflyEnvironment: firefly.fireflyEnvironment,
    profileInUse: firefly.profileInUse,
    probeFireflySession: firefly.probeSession,
    openFireflyLogin: firefly.openLoginChrome,
    runFireflyTake: firefly.runAgentTake,
    reconcileFireflyTake: firefly.reconcileUnstartedAgentTake,
    reconcileCompletedFireflyTake: firefly.reconcileCompletedAgentTake,
    recoverFireflyResult: firefly.recoverResultReadyAgentTake,
    detailedProbe: firefly.detailedProbe,
    extractLastFrame: firefly.extractLastFrame,
    concatTakes: firefly.concatTakes,
    reviewFireflyTake: reviewTake,
    fitSceneVideo: firefly.fitSceneVideo,
    renderSfx,
    codexAccount: async (): Promise<{authenticated:boolean;reason?:string}> => {
      const result=await checkCodexAccounts(root);
      return result.authenticated?{authenticated:true}:{authenticated:false,reason:result.reason};
    },
    generateImages: (queue: string) => generateCodexImages(root, queue),
    driveCheckAuth: () => driveCheckAuth(root),
    driveUploadVerified: (manifest: string, result: string) => driveUploadVerified(root, manifest, result),
    driveVerify: (manifest: string, result: string) => driveVerify(root, manifest, result),
    ...assets,
    ...server,
    ...remotion,
    ...createFfmpeg(root),
  };
}
export type Dependencies = ReturnType<typeof realDependencies>;
