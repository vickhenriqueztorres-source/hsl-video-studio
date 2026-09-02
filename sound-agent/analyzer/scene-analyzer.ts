import {SceneAnalysis, SceneMood, VideoAnalysisInput, VisualCue} from '../types/scene-analysis.types';

export class SceneAnalyzer {
  public analyze(input: VideoAnalysisInput | Record<string, any>): SceneAnalysis[] {
    if (input.scenes && Array.isArray(input.scenes) && input.scenes.length > 0) {
      return input.scenes.map((s: any) => this.normalizeScene(s));
    }

    // Default 1-scene fallback analysis
    return [
      {
        sceneId: 'scene_01',
        startFrame: 0,
        endFrame: input.totalFrames || 300,
        visualCues: [
          { frame: 0, type: 'environment', description: 'Cinematic environment scene', mood: 'suspense' },
          { frame: Math.round((input.totalFrames || 300) * 0.8), type: 'transition', description: 'Main transition' }
        ],
        audioCues: [
          { frame: 0, type: 'voice', hasVoice: true, targetDb: -12 }
        ],
        detectedMood: input.globalMood || 'suspense',
        detectedEnvironment: 'cinematic_interior',
        recommendedLayers: ['ambience', 'foley', 'tension_riser', 'boom']
      }
    ];
  }

  private normalizeScene(raw: any): SceneAnalysis {
    const visualCues: VisualCue[] = (raw.visualCues || []).map((vc: any) => ({
      frame: Number(vc.frame || 0),
      type: vc.type || 'action',
      description: vc.description || '',
      soundNeeded: vc.soundNeeded,
      mood: vc.mood,
      intensity: vc.intensity
    }));

    const mood: SceneMood = raw.detectedMood || raw.mood || 'suspense';
    const env = raw.detectedEnvironment || raw.environment || 'studio';
    const recommendedLayers = raw.recommendedLayers || ['ambience', 'foley', 'creative', 'impact'];

    return {
      sceneId: raw.sceneId || `scene_${Math.random().toString(36).substr(2, 4)}`,
      startFrame: Number(raw.startFrame || 0),
      endFrame: Number(raw.endFrame || 180),
      visualCues,
      audioCues: raw.audioCues || [],
      detectedMood: mood,
      detectedEnvironment: env,
      recommendedLayers
    };
  }
}
