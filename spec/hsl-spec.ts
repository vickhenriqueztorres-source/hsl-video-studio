/**
 * 📐 HSL SPECIFICATION-AS-CODE (ESPECIFICAÇÃO EXECUTÁVEL DO PRD)
 *
 * Módulo canônico único de constantes tipadas, invariantes e funções de derivação
 * do canal Hidden Systems Lab (HSL).
 *
 * PROIBIDO NÚMEROS MÁGICOS OU DEFINIÇÕES REDUNDANTES EM OUTROS ARQUIVOS.
 * Toda regra de produto, duração, formato, atos e empacotamento deriva deste módulo.
 */

// -----------------------------------------------------------------------------
// 1. DURAÇÃO E TEMPO DO EPISÓDIO (PRD Cláusula 1.4.1 & 2.1)
// -----------------------------------------------------------------------------
/** Duração mínima aceitável para um documentário long-form HSL em segundos (10 minutos) */
export const HSL_EPISODE_MIN_DURATION_SECONDS = 600; // 10m 00s

/** Duração máxima aceitável para um documentário long-form HSL em segundos (12 minutos) */
export const HSL_EPISODE_MAX_DURATION_SECONDS = 720; // 12m 00s

/** Duração alvo padrão para planejamento da partitura de 8 atos */
export const HSL_EPISODE_TARGET_DURATION_SECONDS = 600; // 10m 00s

/** Tolerância máxima permitida para dessincronia entre áudio, vídeo e plano em segundos */
export const HSL_DURATION_TOLERANCE_SECONDS = 5.0; // ±5s

// -----------------------------------------------------------------------------
// 2. VÍDEO, FRAMES E RESOLUÇÃO (PRD Cláusula 1.4.1 & RULES Cláusula 6)
// -----------------------------------------------------------------------------
/** Taxa de quadros canônica imutável do canal HSL */
export const HSL_FPS = 30;

/** Largura padrão do master em pixels (1080p Full HD) */
export const HSL_VIDEO_WIDTH = 1920;

/** Altura padrão do master em pixels (1080p Full HD) */
export const HSL_VIDEO_HEIGHT = 1080;

/** Codec de vídeo master obrigatório */
export const HSL_VIDEO_CODEC = 'h264';

/** Codec de áudio master obrigatório */
export const HSL_AUDIO_CODEC = 'aac';

/** Bitrate mínimo aceitável para áudio master */
export const HSL_AUDIO_BITRATE = '192k';

/** Converte segundos para contagem exata de frames a 30fps */
export function secondsToFrames(seconds: number): number {
  return Math.round(seconds * HSL_FPS);
}

/** Converte frames para segundos */
export function framesToSeconds(frames: number): number {
  return Number((frames / HSL_FPS).toFixed(3));
}

// -----------------------------------------------------------------------------
// 3. ESTRUTURA CANÔNICA DOS 8 ATOS (BRIEFING Cláusula 3 & MASTER PRD Cláusula 4)
// -----------------------------------------------------------------------------
export interface HslActSpec {
  readonly actNumber: number;
  readonly title: string;
  readonly targetDurationSeconds: number;
  readonly targetBeatsCount: number;
}

export const HSL_CANONICAL_ACTS: readonly HslActSpec[] = [
  { actNumber: 1, title: 'THE HOOK & THE VISIBLE MIRACLE', targetDurationSeconds: 75, targetBeatsCount: 12 },
  { actNumber: 2, title: 'THE PHYSICAL ANATOMY & LAYER BREAKDOWN', targetDurationSeconds: 90, targetBeatsCount: 14 },
  { actNumber: 3, title: 'THE FLOW DYNAMICS & THROUGHPUT MATH', targetDurationSeconds: 105, targetBeatsCount: 16 },
  { actNumber: 4, title: 'THE PHYSICAL LIMIT & BOUNDARY CONDITION', targetDurationSeconds: 75, targetBeatsCount: 12 },
  { actNumber: 5, title: 'THE BOTTLENECK & STRAIN BREAKDOWN', targetDurationSeconds: 90, targetBeatsCount: 14 },
  { actNumber: 6, title: 'THE EMERGENCY WORKAROUND & HIDDEN MARGINS', targetDurationSeconds: 60, targetBeatsCount: 10 },
  { actNumber: 7, title: 'SYSTEMIC CONSEQUENCES & ECONOMIC RIPPLE', targetDurationSeconds: 60, targetBeatsCount: 10 },
  { actNumber: 8, title: 'ORIGINAL THESIS & SYSTEM ARCHITECTURE', targetDurationSeconds: 45, targetBeatsCount: 8 }
] as const;

/** Total canônico de atos */
export const HSL_TOTAL_ACTS_COUNT = 8;

/** Total esperado de beats no planejamento padrão */
export const HSL_TOTAL_BEATS_COUNT = HSL_CANONICAL_ACTS.reduce((acc, act) => acc + act.targetBeatsCount, 0); // 96 beats

/** Soma total de duração dos 8 atos canônicos */
export const HSL_CANONICAL_ACTS_TOTAL_SECONDS = HSL_CANONICAL_ACTS.reduce((acc, act) => acc + act.targetDurationSeconds, 0); // 600s

// -----------------------------------------------------------------------------
// 4. MODOS VISUAIS E CONTRATOS DE ASSET (PRD Cláusula 1.4.3)
// -----------------------------------------------------------------------------
export const HSL_VALID_VISUAL_MODES = [
  'firefly_video',
  'generated_image_35mm',
  'vector_remotion',
  'motion_image_diagram'
] as const;

export type HslVisualMode = (typeof HSL_VALID_VISUAL_MODES)[number];

/** Proporção Canônica de Mídia para Episódios HSL (40% Fotos / 30% Vídeos / 15% Motions / 15% Diagramas) */
export const HSL_CANONICAL_MEDIA_RATIOS = {
  REALISTIC_35MM_IMAGES_PERCENT: 40,
  CONTINUOUS_VIDEOS_PERCENT: 30,
  MOTION_GRAPHICS_PERCENT: 15,
  MOTION_DIAGRAMS_PERCENT: 15
} as const;

/**
 * Resolve deterministicamente o modo visual do beat de acordo com a matriz canônica 40/30/15/15:
 * - 38 Imagens Realistas 35mm (40%)
 * - 29 Vídeos de Ação Contínua (30%)
 * - 14 Motion Graphics Vetoriais (15%)
 * - 15 Imagens de Diagramas / Esquemas (15%)
 */
export function resolveCanonicalVisualMode(actNumber: number, beatIndex: number): HslVisualMode {
  // Vídeos (29 beats no total)
  const isVideo = (actNumber === 1 && (beatIndex === 0 || beatIndex === 1 || beatIndex === 4 || beatIndex === 8 || beatIndex === 11)) ||
                  (actNumber === 2 && (beatIndex === 0 || beatIndex === 4 || beatIndex === 8 || beatIndex === 12)) ||
                  (actNumber === 3 && (beatIndex === 0 || beatIndex === 5 || beatIndex === 10 || beatIndex === 15)) ||
                  (actNumber === 4 && (beatIndex === 0 || beatIndex === 5 || beatIndex === 10)) ||
                  (actNumber === 5 && (beatIndex === 0 || beatIndex === 3 || beatIndex === 6 || beatIndex === 9 || beatIndex === 13)) ||
                  (actNumber === 6 && (beatIndex === 0 || beatIndex === 4 || beatIndex === 8)) ||
                  (actNumber === 7 && (beatIndex === 0 || beatIndex === 5)) ||
                  (actNumber === 8 && (beatIndex === 0 || beatIndex === 3 || beatIndex === 7));

  if (isVideo) return 'firefly_video';

  // Motion Graphics puros em Remotion (14 beats no total)
  const isMotionGraphics = (actNumber === 1 && (beatIndex === 2 || beatIndex === 7)) ||
                           (actNumber === 2 && (beatIndex === 2 || beatIndex === 9)) ||
                           (actNumber === 3 && (beatIndex === 2 || beatIndex === 7 || beatIndex === 12)) ||
                           (actNumber === 4 && (beatIndex === 2 || beatIndex === 7)) ||
                           (actNumber === 5 && (beatIndex === 2 || beatIndex === 8)) ||
                           (actNumber === 6 && beatIndex === 2) ||
                           (actNumber === 7 && beatIndex === 2) ||
                           (actNumber === 8 && beatIndex === 2);

  if (isMotionGraphics) return 'vector_remotion';

  // Imagens de Diagramas / Telemetria (15 beats no total)
  const isDiagram = (actNumber === 1 && (beatIndex === 3 || beatIndex === 9)) ||
                    (actNumber === 2 && (beatIndex === 3 || beatIndex === 10)) ||
                    (actNumber === 3 && (beatIndex === 3 || beatIndex === 8 || beatIndex === 13)) ||
                    (actNumber === 4 && (beatIndex === 3 || beatIndex === 8)) ||
                    (actNumber === 5 && (beatIndex === 4 || beatIndex === 10)) ||
                    (actNumber === 6 && (beatIndex === 3 || beatIndex === 7)) ||
                    (actNumber === 7 && beatIndex === 3) ||
                    (actNumber === 8 && beatIndex === 4);

  if (isDiagram) return 'motion_image_diagram';

  // Imagens 35mm Fotorrealistas Limpas (38 beats no total // 40%)
  return 'generated_image_35mm';
}

export const HSL_MIN_VIDEO_FILE_SIZE_BYTES = 10000; // 10KB
export const HSL_MIN_IMAGE_FILE_SIZE_BYTES = 5000;  // 5KB

// -----------------------------------------------------------------------------
// 5. EMPACOTAMENTO OBRIGATÓRIO E THUMBNAILS (PRD Cláusula 1.4.6 & BRIEFING Cláusula 4)
// -----------------------------------------------------------------------------
export const HSL_REQUIRED_THUMBNAILS = [
  'thumbnail_variant_A_face.png',
  'thumbnail_variant_B_split.png',
  'thumbnail_variant_C_object.png'
] as const;

export const HSL_MIN_THUMBNAIL_SIZE_BYTES = 10000; // 10KB

export const HSL_REQUIRED_PACKAGE_FILES = [
  'YOUTUBE_PUBLICATION_PACKAGE.md',
  'publication-package.json'
] as const;

// -----------------------------------------------------------------------------
// 6. IDENTIDADE DE VOZ E ÁUDIO (PRD Cláusula 1.4.4 & BRIEFING Cláusula 2)
// -----------------------------------------------------------------------------
export const HSL_OFFICIAL_VOICE_NAME = 'Chris';
export const HSL_OFFICIAL_NARRATION_PROVIDER = 'ElevenLabs';
export const HSL_OFFICIAL_MODEL_ID = 'eleven_multilingual_v2';
export const HSL_MASTER_AUDIO_FILE = 'audio/narration.mp3';

// -----------------------------------------------------------------------------
// 7. IDENTIDADE VISUAL CANÔNICA: KINETIC VELOCITY (POP-DOCUMENTARY)
// -----------------------------------------------------------------------------
/** Preto carvão moderno fosco para fundos (não azulado) */
export const HSL_COLOR_OBSIDIAN_MATTE = '#0D0E15';

/** Amarelo ácido elétrico - o ponto de choque visual e glifos de fluxo */
export const HSL_COLOR_ELECTRIC_ACID_YELLOW = '#FFE500';

/** Azul elétrico vivo International Klein Blue para vetores de rede */
export const HSL_COLOR_INTERNATIONAL_KLEIN_BLUE = '#0038FF';

/** Laranja hiper-saturado para alertas, gargalos e placares */
export const HSL_COLOR_HYPER_ORANGE = '#FF2E00';

/** Off-White marfim para tipografia monumental e elegante */
export const HSL_COLOR_OFF_WHITE = '#F4F4F0';

export const HSL_KINETIC_PALETTE = {
  background: HSL_COLOR_OBSIDIAN_MATTE,
  accentYellow: HSL_COLOR_ELECTRIC_ACID_YELLOW,
  accentBlue: HSL_COLOR_INTERNATIONAL_KLEIN_BLUE,
  warningOrange: HSL_COLOR_HYPER_ORANGE,
  typography: HSL_COLOR_OFF_WHITE
} as const;

export const HSL_KINETIC_FONTS = {
  headline: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  telemetry: '"JetBrains Mono", Consolas, "Courier New", monospace'
} as const;

// -----------------------------------------------------------------------------
// 8. MOTION DESIGN & FÍSICA ELÁSTICA (REMOTION SPRING CONFIG)
// -----------------------------------------------------------------------------
/** Configuração canônica de mola Remotion (Smooth Bouncy Springs) */
export const HSL_SPRING_CONFIG = {
  damping: 12,
  stiffness: 100,
  mass: 0.8
} as const;

/** Limites de movimento de câmera em imagens infográficas (Ken Burns seguro) */
export const HSL_CAMERA_ZOOM_START = 1.0;
export const HSL_CAMERA_ZOOM_END = 1.06;
export const HSL_CAMERA_PAN_PIXELS = 18;

// -----------------------------------------------------------------------------
// 9. CONTRATO DE INFOGRÁFICO CINEMATOGRÁFICO HÍBRIDO (POP-DOCUMENTARY)
// -----------------------------------------------------------------------------
/**
 * Em partes infográficas (cortes 3D, mapas isométricos de dutos, placares de atraso e gauges de pressão):
 * - Imagem Base: Gerada em altíssima fidelidade com a paleta Kinetic Velocity.
 * - Animação Remotion: Física de mola nos textos, rotação de placares, linhas de vetor e drift de câmera.
 * - Elimina overhead de IA de vídeo onde precisão vetorial e legibilidade gráfica são mandatórias.
 */
export const HSL_INFOGRAPHIC_BEAT_TYPES = [
  '3D_TERRAIN_PIPELINE_MAP',
  'CUTAWAY_STORAGE_BUFFER_FLOW',
  'AIRCRAFT_TARMAC_SYSTEMS_IN_MOTION',
  'BOTTLENECK_DEPARTURE_FLIPBOARD',
  'HIGH_PRESSURE_NOZZLE_TELEMETRY'
] as const;

// -----------------------------------------------------------------------------
// 10. REGRAS DE DINAMISMO, PACING RÍTMICO E ANTI-REPETIÇÃO (INVARIANTES ESTRITAS)
// -----------------------------------------------------------------------------
/** Duração mínima absoluta de um beat de impacto rápido (corte de tensão) */
export const HSL_MIN_BEAT_DURATION_SECONDS = 2.5;

/** Duração máxima de um beat explicativo profundo (corte 3D / mapa de rede) */
export const HSL_MAX_BEAT_DURATION_SECONDS = 12.0;

/** Proibição estrita de repetição de roteiro: 100% dos beats devem ser únicos */
export const HSL_ALLOW_REPEATED_VOICEOVER = false;

/** Máximo de repetições consecutivas permitidas para o mesmo tamanho de plano */
export const HSL_MAX_CONSECUTIVE_IDENTICAL_SHOT = 2;

/**
 * Padrões de peso rítmico balanceados por ato (alternando planos rápidos de impacto de 3-4s
 * com planos de exploração heróica de 8-11s), somando exatamente o tempo canônico do ato.
 */
export const HSL_ACT_RHYTHM_TEMPLATES: Record<number, readonly number[]> = {
  1: [8.5, 3.5, 5.5, 9.0, 3.5, 6.0, 8.5, 3.5, 6.0, 8.5, 3.5, 9.0], // Total: 75s (12 beats)
  2: [4.0, 8.5, 4.0, 9.0, 3.5, 8.5, 4.5, 9.0, 4.0, 8.0, 4.5, 8.5, 4.0, 10.0], // Total: 90s (14 beats)
  3: [4.0, 9.0, 4.5, 10.0, 4.0, 8.5, 4.5, 9.5, 3.5, 8.5, 4.5, 9.0, 4.0, 10.0, 4.5, 7.0], // Total: 105s (16 beats)
  4: [4.0, 8.5, 4.0, 9.0, 3.5, 8.5, 4.0, 8.5, 3.5, 8.5, 3.5, 9.5], // Total: 75s (12 beats)
  5: [4.0, 9.0, 4.0, 9.0, 3.5, 8.5, 4.0, 9.5, 4.0, 8.5, 4.0, 8.5, 4.5, 9.0], // Total: 90s (14 beats)
  6: [4.0, 8.0, 4.0, 8.0, 3.5, 8.5, 4.0, 7.5, 4.0, 8.5], // Total: 60s (10 beats)
  7: [4.0, 8.5, 4.0, 8.0, 3.5, 8.0, 4.0, 8.5, 3.5, 8.0], // Total: 60s (10 beats)
  8: [4.0, 7.5, 4.0, 8.0, 3.5, 7.0, 3.5, 7.5] // Total: 45s (8 beats)
};

/**
 * Calcula durações dinâmicas exatas para os beats de um ato garantindo
 * conformidade frame-perfect a 30fps sem arredondamentos imperfeitos.
 */
export function getDynamicBeatDurations(actNumber: number, targetDurationSeconds: number, beatsCount: number): number[] {
  const template = HSL_ACT_RHYTHM_TEMPLATES[actNumber];
  if (template && template.length === beatsCount) {
    const sum = template.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - targetDurationSeconds) < 0.1) {
      return [...template];
    }
  }

  // Fallback proporcional se beatsCount for customizado
  const base = targetDurationSeconds / beatsCount;
  const result: number[] = [];
  let currentSum = 0;
  for (let i = 0; i < beatsCount; i++) {
    const isQuick = i % 2 === 0;
    const val = isQuick ? Math.max(HSL_MIN_BEAT_DURATION_SECONDS, Number((base * 0.6).toFixed(1))) : Number((base * 1.4).toFixed(1));
    result.push(val);
    currentSum += val;
  }
  const diff = Number((targetDurationSeconds - currentSum).toFixed(1));
  result[result.length - 1] = Number((result[result.length - 1] + diff).toFixed(1));
  return result;
}

/** Taxa canônica alvo de fala em inglês (palavras por segundo) para locução Chris */
export const HSL_WORDS_PER_SECOND_TARGET = 2.4;

/** Calcula a faixa de palavras recomendada para uma duração de beat específica */
export function getRecommendedWordBudget(durationSeconds: number): { minWords: number; maxWords: number; targetWords: number } {
  const targetWords = Math.round(durationSeconds * HSL_WORDS_PER_SECOND_TARGET);
  return {
    minWords: Math.max(4, targetWords - 2),
    maxWords: targetWords + 3,
    targetWords
  };
}

// -----------------------------------------------------------------------------
// 11. CLASSIFICADOR VISUAL SEMÂNTICO (ELIMINAÇÃO DE MODULO 3)
// -----------------------------------------------------------------------------
/**
 * Mapeamento determinístico da função narrativa para o modo visual apropriado.
 * PROIBIDO USO DE LOOPS ARITMÉTICOS (ex: i % 3 === 0).
 */
export const HSL_SEMANTIC_VISUAL_MAPPING = {
  MONUMENTAL_HOOK: 'firefly_video',       // Drone aéreo noturno / Abertura monumental viva
  KINETIC_FLOW: 'firefly_video',           // Tráfego em fluxo contínuo / Corredor de velocidade
  TECHNICAL_ANATOMY: 'generated_image_35mm', // Corte 3D transversal / Hardware de engenharia
  MATHEMATICAL_MODEL: 'generated_image_35mm', // Mapa 3D isométrico / Onda verde
  BOUNDARY_LIMIT: 'generated_image_35mm',    // Macro HUD / Retículas e limites físicos
  BOTTLENECK_CRISIS: 'generated_image_35mm', // Placar flipboard / Ponto de estrangulamento
  EMERGENCY_DISPATCH: 'firefly_video',      // Ambulância em trânsito / Ação de emergência
  SYSTEMIC_IMPACT: 'generated_image_35mm',   // Servidores de telemetria / Gráfico de perda
  CORE_THESIS: 'generated_image_35mm'       // Arquitetura global sincronizada
} as const;

/**
 * Proporção Áurea de Distribuição Visual (Equilíbrio Documental Vox/Keynote):
 * - 30% a 40% Vídeo Firefly de Ação Real (30 a 38 takes)
 * - 60% a 70% Infográficos 35mm Remotion (58 a 66 takes)
 */
export const HSL_TARGET_VIDEO_RATIO_MIN = 0.30;
export const HSL_TARGET_VIDEO_RATIO_MAX = 0.40;
export const HSL_TARGET_VIDEO_BEATS_COUNT = 36;


