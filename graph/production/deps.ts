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
    ...assets, ...server, ...remotion, ...createFfmpeg(root),
  };
}
export type Dependencies = ReturnType<typeof realDependencies>;
