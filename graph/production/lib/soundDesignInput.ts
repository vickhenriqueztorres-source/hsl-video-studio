import { HslLongFormProjectPlan } from '../../../hsl/core/types';
import { VideoAnalysisInput } from '../../../sound-agent/types/scene-analysis.types';
export function soundDesignInput(episodeId: string, plan: HslLongFormProjectPlan): VideoAnalysisInput {
  let frameOffset = 0;
  return { videoId: episodeId, totalFrames: plan.totalFrames, fps: 30, globalMood: 'suspense',
    scenes: plan.beats.map((beat, idx) => {
      const startFrame = frameOffset;
      const endFrame = frameOffset + beat.durationFrames;
      frameOffset = endFrame;
      return { sceneId: beat.beatId.toLowerCase(), startFrame, endFrame,
        detectedMood: idx % 2 === 0 ? 'suspense' : 'action', detectedEnvironment: 'industrial_refinery',
        visualCues: [{ frame: startFrame, type: 'environment', description: beat.stage }],
        audioCues: [{ frame: startFrame, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }],
        recommendedLayers: ['ambience', 'foley', 'tension_riser'] };
    }) };
}
