import { HslSceneDirectorAgent } from '../../hsl/core/hslSceneDirectorAgent';
import { HslImageFrameEngine } from '../../hsl/core/hslImageFrameEngine';
import { HslFireflyVideoEngine } from '../../hsl/core/hslFireflyVideoEngine';
import { ElevenLabsNarrationAdapter, NarrationGenerateOptions } from '../../adapters/elevenLabsNarrationAdapter';
import { SoundDesignAgent } from '../../sound-agent';
import { validateBeforeRender } from '../../hsl/core/hslValidationGatekeeper';
import { HslComplianceChecker } from '../../spec/hsl-compliance-checker';
import { ThumbnailSeoEngine } from '../../hsl/packaging/thumbnailSeoEngine';
import { inspectMediaWithFfprobe, isValidPngFile } from '../../hsl/core/hslPathResolver';
import { VideoAnalysisInput } from '../../sound-agent/types/scene-analysis.types';
import * as assets from './lib/assets';
import * as server from './lib/assetServer';
import * as remotion from './lib/remotion';
import { createFfmpeg } from './lib/ffmpeg';
import { prepareAndRunIdeTask } from '../ide/ideRunner';
import * as firefly from './lib/firefly';
import { renderSfx } from './lib/sfx';
import { generateCodexImages } from './lib/codexImages';
import { checkCodexAccount } from '../ide/codexAccount';
import { driveCheckAuth,driveUploadVerified,driveVerify } from './storage/drive';
export function realDependencies(root: string) {
  return {
    plan: HslSceneDirectorAgent.planEpisodeFromScratch.bind(HslSceneDirectorAgent),
    frames: HslImageFrameEngine.generateFramesForEpisode.bind(HslImageFrameEngine),
    videos: HslFireflyVideoEngine.processVideoBeatsForEpisode.bind(HslFireflyVideoEngine),
    narrate: (options: NarrationGenerateOptions) => new ElevenLabsNarrationAdapter().generateSpeech(options),
    sound: (input: VideoAnalysisInput, tsx: string, json: string) => new SoundDesignAgent(root).runFullPipeline(input, tsx, json),
    gatekeeper: validateBeforeRender, compliance: HslComplianceChecker.checkCompliance.bind(HslComplianceChecker),
    package: ThumbnailSeoEngine.generatePackage.bind(ThumbnailSeoEngine),
    exportPackage: ThumbnailSeoEngine.exportPackagingDeliverables.bind(ThumbnailSeoEngine),
    inspect: inspectMediaWithFfprobe, isPng: isValidPngFile,
    ide: prepareAndRunIdeTask,
    fireflyEnvironment: firefly.fireflyEnvironment, profileInUse: firefly.profileInUse,
    probeFireflySession: firefly.probeSession, openFireflyLogin: firefly.openLoginChrome,
    runFireflyTake: firefly.runAgentTake, detailedProbe: firefly.detailedProbe,
    extractLastFrame: firefly.extractLastFrame, concatTakes: firefly.concatTakes,
    renderSfx,
    codexAccount:()=>checkCodexAccount(root), generateImages:(queue:string)=>generateCodexImages(root,queue),
    driveCheckAuth:()=>driveCheckAuth(root),driveUploadVerified:(manifest:string,result:string)=>driveUploadVerified(root,manifest,result),driveVerify:(manifest:string,result:string)=>driveVerify(root,manifest,result),
    ...assets, ...server, ...remotion, ...createFfmpeg(root),
  };
}
export type Dependencies = ReturnType<typeof realDependencies>;
