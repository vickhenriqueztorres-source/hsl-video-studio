import {SceneMood} from './scene-analysis.types';

export type FrequencyRole = 'low' | 'mid' | 'high' | 'full';

export interface VoiceTreatmentPlan {
  readonly reverb: 'none' | 'small_room' | 'large_hall' | 'cathedral';
  readonly eqProfile: 'voice_clear' | 'voice_warm' | 'voice_introspective' | 'voice_distant';
  readonly distance: 'near' | 'mid' | 'far';
  readonly targetDb: number;
}

export interface MusicDuckingConfig {
  readonly enabled: boolean;
  readonly duckAmount: number; // e.g. -8 dB
  readonly attackFrames: number;
  readonly releaseFrames: number;
}

export interface SceneMusicPlan {
  readonly role: 'theme' | 'tension_bed' | 'emotional_accent' | 'action_rhythm';
  readonly mood: SceneMood;
  readonly file: string;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly volumeDb: number;
  readonly ducking?: MusicDuckingConfig;
}

export interface AudioLayerPlan {
  readonly layerId: string;
  readonly type: 'ambience' | 'foley' | 'creative' | 'impact' | 'whoosh' | 'drone' | 'riser';
  readonly category: string;
  readonly file: string;
  readonly startFrame: number;
  readonly endFrame?: number;
  readonly durationFrames?: number;
  readonly volumeDb: number;
  readonly frequencyRole: FrequencyRole;
  readonly reverb?: string;
  readonly reverse?: boolean;
  readonly variations?: number;
}

export interface AudioTrackTransitionRef {
  readonly file: string;
  readonly startFrame: number;
  readonly endFrame?: number;
  readonly durationFrames?: number;
  readonly volumeDb: number;
}

export interface SceneTransitionPlan {
  readonly transitionId: string;
  readonly type: 'music_transition' | 'scene_bridge';
  readonly method: 'triple_calcar' | 'riser_hit' | 'ambient_pause' | 'crossfade';
  readonly supportTrack?: AudioTrackTransitionRef;
  readonly riserTrack?: AudioTrackTransitionRef;
  readonly anchorTrack?: AudioTrackTransitionRef;
}

export interface MasterLimiterConfig {
  readonly enabled: boolean;
  readonly ceilingDb: number;
}

export interface SidechainConfig {
  readonly enabled: boolean;
  readonly source: 'voice';
  readonly targets: readonly string[];
  readonly thresholdDb: number;
  readonly ratio: number;
}

export interface SceneMixingPlan {
  readonly masterLimiter: MasterLimiterConfig;
  readonly sidechain: SidechainConfig;
}

export interface SceneAudioPlan {
  readonly sceneId: string;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly mood: SceneMood;
  readonly environment: string;
  readonly hasVoice: boolean;
  readonly voiceTreatment?: VoiceTreatmentPlan;
  readonly music?: SceneMusicPlan;
  readonly layers: readonly AudioLayerPlan[];
  readonly transitions?: readonly SceneTransitionPlan[];
  readonly mixing: SceneMixingPlan;
}

export interface AudioPlan {
  readonly version: '1.0.0';
  readonly videoId: string;
  readonly totalFrames: number;
  readonly fps: number;
  readonly scenes: readonly SceneAudioPlan[];
}
