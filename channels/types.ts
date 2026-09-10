/**
 * Definições tipadas e contratos de canal para o ecossistema HSL / BRECHA.
 * Especificação Multicanal v1.1 - Antiquebra e Antifalha.
 */

export type ChannelId = 'hsl' | 'brecha';

export interface EditorialPolicy {
  readonly format: string;
  readonly targetDurationMinutes: readonly [number, number];
  readonly wordsPerMinuteRange: readonly [number, number];
  readonly structure: readonly string[];
  readonly requiredSignature?: string;
  readonly prohibitedThemes?: readonly string[];
  readonly principles: readonly string[];
}

export interface VisualPolicy {
  readonly aspectRatio: '16:9';
  readonly resolution: { readonly width: number; readonly height: number };
  readonly fps: number;
  readonly palette: {
    readonly background: string;
    readonly primaryText: string;
    readonly secondaryText: string;
    readonly accent: string;
    readonly flowSystem?: string;
    readonly verificationSafe?: string;
    readonly yellow?: string;
    readonly red?: string;
  };
  readonly typography: {
    readonly titles: string;
    readonly body: string;
    readonly dataMonospace: string;
  };
  readonly textures: readonly string[];
  readonly cameraLanguage: string;
  readonly reconstructionLabelRequired: boolean;
}

export interface NarrationPolicy {
  readonly locale: 'en-US' | 'pt-BR';
  readonly tone: string;
  readonly pacing: string;
  readonly defaultVoiceId?: string;
  readonly defaultModelId?: string;
  readonly pronunciationDictionaryPath?: string;
  readonly currencyRules: 'spoken_words' | 'literal';
}

export interface MotionPolicy {
  readonly style: string;
  readonly preferredEngines: readonly ('remotion-authored' | 'local-ffmpeg')[];
  readonly allow3d: boolean;
  readonly maxAuthoredScenes: number;
}

export interface PackagingPolicy {
  readonly thumbnailVariants: readonly { readonly id: string; readonly name: string; readonly concept: string }[];
  readonly titleGuidelines: readonly string[];
  readonly chapterMarkerPrefix?: string;
}

export interface EditorialComplianceRule {
  readonly id: string;
  readonly name: string;
  readonly required: boolean;
  readonly description: string;
}

export interface EditorialCompliancePolicy {
  readonly rules: readonly EditorialComplianceRule[];
}

export interface ReferenceManifest {
  readonly brandBiblePath?: string;
  readonly visualReferencesDir?: string;
  readonly styleFramesDir?: string;
  readonly brandingDir?: string;
}

export interface ChannelProfile {
  readonly schemaVersion: 1;
  readonly id: ChannelId;
  readonly version: string;
  readonly displayName: string;
  readonly locale: 'en-US' | 'pt-BR';
  readonly editorial: EditorialPolicy;
  readonly visual: VisualPolicy;
  readonly narration: NarrationPolicy;
  readonly motion: MotionPolicy;
  readonly packaging: PackagingPolicy;
  readonly compliance: EditorialCompliancePolicy;
  readonly references: ReferenceManifest;
}

export interface RunChannelSnapshot {
  readonly channelId: ChannelId;
  readonly profileVersion: string;
  readonly profileHash: string;
  readonly resolvedAt: string;
  readonly profile: ChannelProfile;
  readonly policyHashes: {
    readonly editorial: string;
    readonly visual: string;
    readonly narration: string;
    readonly motion: string;
    readonly packaging: string;
    readonly compliance: string;
  };
}

export interface RunContract {
  readonly schemaVersion: number;
  readonly runId: string;
  readonly episodeId: string;
  readonly checkpointThreadId: string;
  readonly channel: RunChannelSnapshot;
  readonly executionVersion: string;
  readonly dependencyLockHash: string;
  readonly createdAt: string;
}
