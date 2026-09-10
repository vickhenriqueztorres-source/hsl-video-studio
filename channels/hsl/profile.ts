import type { ChannelProfile } from '../types';

export const hslProfile: ChannelProfile = {
  schemaVersion: 1,
  id: 'hsl',
  version: '1.0.0',
  displayName: 'Hidden Systems Lab',
  locale: 'en-US',
  editorial: {
    format: 'engineering_infrastructure_failure_investigation',
    targetDurationMinutes: [10, 10],
    wordsPerMinuteRange: [130, 150],
    structure: [
      'ACT_1_ANOMALY',
      'ACT_2_SYSTEM',
      'ACT_3_CASCADE',
      'ACT_4_BARRIERS',
      'ACT_5_COLLAPSE',
      'ACT_6_IMPACT',
      'ACT_7_INVESTIGATION',
      'ACT_8_DEFENSE'
    ],
    principles: [
      'Physical systems over software abstraction',
      'Technical causality over sensationalism',
      'Zero black screen guarantee'
    ]
  },
  visual: {
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    palette: {
      background: '#07080B',
      primaryText: '#E8ECF2',
      secondaryText: '#707A8A',
      accent: '#FFE500',
      yellow: '#FFE500',
      red: '#FF2E00',
    },
    typography: {
      titles: 'Cabinet Grotesk, Arial, sans-serif',
      body: 'Inter, Helvetica, sans-serif',
      dataMonospace: 'JetBrains Mono, monospace'
    },
    textures: ['technical_grid', 'blueprint_noise', 'metal_grain'],
    cameraLanguage: 'clinical orthographic, controlled slow push-in, telemetry overlays',
    reconstructionLabelRequired: false
  },
  narration: {
    locale: 'en-US',
    tone: 'authoritative, analytical, clinical engineering investigator',
    pacing: 'deliberate, steady',
    defaultVoiceId: 'cjVigY5qzO86Huf0OWal', // Chris
    defaultModelId: 'eleven_multilingual_v2',
    currencyRules: 'literal'
  },
  motion: {
    style: 'technical documentary; original explanatory motion',
    preferredEngines: ['remotion-authored', 'local-ffmpeg'],
    allow3d: true,
    maxAuthoredScenes: 12
  },
  packaging: {
    thumbnailVariants: [
      { id: 'technical', name: 'Technical Cutaway', concept: 'Cross-section machine with telemetry overlays' }
    ],
    titleGuidelines: [
      'THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING',
      'HOW THE SYSTEM FAILS BENEATH THE SURFACE'
    ]
  },
  compliance: {
    rules: [
      { id: 'HSL_RULE_01', name: 'Duration 600s', required: true, description: 'Duration 600s ±1s' },
      { id: 'HSL_RULE_02', name: '1080p 30fps H.264', required: true, description: 'Video technical format' }
    ]
  },
  references: {
    brandBiblePath: 'docs/HSL_MASTER_PRD_ARCHITECTURE_BRIEFING.md'
  }
};
