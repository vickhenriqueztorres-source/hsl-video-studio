export type HslVisualMode = 'firefly_video' | 'generated_image_35mm' | 'vector_remotion' | 'motion_image_diagram';
export type MediaPolicy = 'stills' | 'local-motion' | 'firefly-hybrid';
export type MediaProvider = 'firefly-kling' | 'local-ffmpeg' | 'none';
export type MotionIntent = 'none' | 'camera' | 'physical';

export interface MediaPlanBeat {
  readonly beatId: string;
  readonly sourceBeatId: string;
  readonly provider: MediaProvider;
  readonly motionIntent: MotionIntent;
  readonly reason: string;
  readonly durationFrames: number;
  readonly takeCount: number;
}

export interface MediaPlan {
  readonly schema: 'hsl-media-plan/v1';
  readonly hash: string;
  readonly scenePlanHash: string;
  readonly episodeId: string;
  readonly policy: MediaPolicy;
  readonly fps: 30;
  readonly takeSeconds: 5;
  readonly coveragePolicy: 'full-coverage-trim';
  readonly beats: readonly MediaPlanBeat[];
  readonly totalFrames: number;
  readonly totalBeats: number;
  /** External five-second generations, including every continuation take. */
  readonly totalTakes: number;
  readonly fireflyBeatIds: readonly string[];
  readonly localMotionBeatIds: readonly string[];
  readonly stillBeatIds: readonly string[];
  readonly fireflyFrames: number;
}
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
  | 'CORE_THESIS'
  | 'PHYSICAL_SCALE'
  | 'SYSTEM_ARCHITECTURE'
  | 'CRITICAL_METRIC'
  | 'STRUCTURAL_DYNAMICS'
  | 'MECHANICAL_BLUEPRINT'
  | 'HYDRO_MECHANICS'
  | 'THERMODYNAMICS'
  | 'AERODYNAMICS'
  | 'VORTEX_PHYSICS'
  | 'AERODYNAMIC_MAP'
  | 'SEISMIC_CRISIS'
  | 'CRITICAL_STRAIN'
  | 'SEISMIC_TELEMETRY'
  | 'THERMAL_LIMIT'
  | 'VISCOSITY_BREAKDOWN'
  | 'THERMAL_MAP'
  | 'URBAN_SCALE'
  | 'GLOBAL_MAP'
  | 'ARCHITECTURAL_PARADIGM'
  | 'ORIGINAL_THESIS'
  | 'FINAL_HANDOFF'
  | (string & {});

export interface HslSceneBeat {
  readonly beatId: string;
  readonly sourceBeatId?: string;
  /** Provider is authoritative; firefly_video remains the compatibility render mode. */
  readonly mediaProvider?: MediaProvider;
  readonly motionIntent?: MotionIntent;
  readonly motionReason?: string;
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
  readonly promptSubject?: string;
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
