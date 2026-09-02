export type SceneMood = 'suspense' | 'epic' | 'emotional' | 'ambient' | 'action' | 'calm' | 'dark' | 'dramatic';

export interface VisualCue {
  readonly frame: number;
  readonly type: 'environment' | 'action' | 'transition' | 'climax' | 'punchline' | 'camera_move';
  readonly description: string;
  readonly soundNeeded?: string;
  readonly mood?: SceneMood;
  readonly intensity?: 'low' | 'medium' | 'high' | 'maximum';
}

export interface AudioCue {
  readonly frame: number;
  readonly type: 'voice' | 'sfx' | 'music_break';
  readonly hasVoice?: boolean;
  readonly voiceType?: 'narration' | 'dialogue' | 'whisper' | 'shout';
  readonly targetDb?: number;
  readonly description?: string;
}

export interface SceneAnalysis {
  readonly sceneId: string;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly visualCues: readonly VisualCue[];
  readonly audioCues: readonly AudioCue[];
  readonly detectedMood: SceneMood;
  readonly detectedEnvironment: string;
  readonly recommendedLayers: readonly string[];
}

export interface VideoAnalysisInput {
  readonly videoId: string;
  readonly totalFrames: number;
  readonly fps: number;
  readonly globalMood?: SceneMood;
  readonly scenes: readonly SceneAnalysis[];
}
