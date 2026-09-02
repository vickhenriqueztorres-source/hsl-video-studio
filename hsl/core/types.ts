export type HslVisualMode = 'firefly_video' | 'generated_image_35mm' | 'vector_remotion' | 'motion_image_diagram';
export type HslShotSize = 'EXTREME_WIDE' | 'WIDE' | 'MEDIUM' | 'CLOSE' | 'MACRO' | 'ISOMETRIC_3D';
export type HslCameraMovement = 
  | 'SLOW_DOLLY_IN' 
  | 'ZOOM_OUT_REVEAL' 
  | 'SLOW_PAN_RIGHT' 
  | 'SLOW_PAN_LEFT' 
  | 'CAMERA_DRIFT' 
  | 'FAST_WHIP_PAN' 
  | 'ISOMETRIC_GLIDE' 
  | 'LOCKED_TELEMETRY'
  | 'PULSING_ORBIT';

export type HslPacingType = 'PUNCH_HOOK' | 'MODULAR_NARRATIVE' | 'HERO_EXPLORATION';

export type HslNarrativeRole =
  | 'MONUMENTAL_HOOK'
  | 'KINETIC_FLOW'
  | 'TECHNICAL_ANATOMY'
  | 'MATHEMATICAL_MODEL'
  | 'BOUNDARY_LIMIT'
  | 'BOTTLENECK_CRISIS'
  | 'EMERGENCY_DISPATCH'
  | 'SYSTEMIC_IMPACT'
  | 'CORE_THESIS';

export interface HslSceneBeat {
  readonly beatId: string;
  readonly actNumber: number;
  readonly actTitle: string;
  readonly stage: string;
  readonly durationSeconds: number;
  readonly durationFrames: number;
  readonly visualMode: HslVisualMode;
  readonly shotSize: HslShotSize;
  readonly cameraMovement: HslCameraMovement;
  readonly pacingType?: HslPacingType;
  readonly narrativeRole?: HslNarrativeRole;
  readonly cinematicPrompt: string;
  readonly voiceoverScript: string;
  readonly outputFramePath?: string;
  readonly outputVideoPath?: string;
  readonly infographicArchetype?: '3D_MAP' | 'CUTAWAY' | 'TARMAC_FLOW' | 'FLIPBOARD' | 'MACRO_HUD';
  readonly graphicHeadline?: string;
  readonly telemetryLabel?: string;
}

export interface HslLongFormProjectPlan {
  readonly episodeId: string;
  readonly episodeTitle: string;
  readonly subtitle: string;
  readonly totalDurationSeconds: number;
  readonly totalFrames: number;
  readonly totalBeatsCount: number;
  readonly targetMinutes: number;
  readonly thesis: string;
  readonly assetBaseUrl?: string;
  readonly acts: readonly {
    readonly actNumber: number;
    readonly title: string;
    readonly durationSeconds: number;
    readonly beatsCount: number;
  }[];
  readonly beats: readonly HslSceneBeat[];
}

export interface EpisodeTopicInput {
  readonly episodeId: string;
  readonly topic: string;
  readonly targetMinutes?: number;
  readonly entity: string;
  readonly mechanism: string;
  readonly constraint: string;
  readonly consequence: string;
  readonly thesis: string;
}
