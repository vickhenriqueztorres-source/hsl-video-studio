/**
 * ==============================================================================
 * HIDDEN SYSTEMS LAB (HSL) - MASTER BRAND & EPISODE SYSTEM CONFIGURATION
 * Reference: docs2/brifieng .md | docs2/HSL — Editorial & Visual Briefing _ PRESSURE TEST.md
 * ==============================================================================
 */

export type HslEpisodeFormat = 'THE_JOURNEY' | 'SYSTEM_ANATOMY' | 'BOTTLENECK' | 'FAILURE';

export interface HslFormatSpec {
  readonly name: HslEpisodeFormat;
  readonly targetDurationMin: number;
  readonly targetDurationMax: number;
  readonly targetDurationSeconds: number;
  readonly targetFrames30fps: number;
  readonly description: string;
}

export const HSL_FORMAT_SPECS: Record<HslEpisodeFormat, HslFormatSpec> = {
  THE_JOURNEY: {
    name: 'THE_JOURNEY',
    targetDurationMin: 12,
    targetDurationMax: 18,
    targetDurationSeconds: 15 * 60, // 900s
    targetFrames30fps: 15 * 60 * 30, // 27,000 frames
    description: 'Jornada de um objeto, produto ou recurso através de uma rede física (ex: jet fuel, água, grãos).'
  },
  SYSTEM_ANATOMY: {
    name: 'SYSTEM_ANATOMY',
    targetDurationMin: 14,
    targetDurationMax: 20,
    targetDurationSeconds: 16 * 60, // 960s
    targetFrames30fps: 16 * 60 * 30, // 28,800 frames
    description: 'Análise profunda dos componentes, interfaces e controles de uma rede complexa.'
  },
  BOTTLENECK: {
    name: 'BOTTLENECK',
    targetDurationMin: 12,
    targetDurationMax: 18,
    targetDurationSeconds: 14 * 60, // 840s
    targetFrames30fps: 14 * 60 * 30, // 25,200 frames
    description: 'Foco na restrição crítica que governa a capacidade e o throughput de todo o sistema.'
  },
  FAILURE: {
    name: 'FAILURE',
    targetDurationMin: 14,
    targetDurationMax: 22,
    targetDurationSeconds: 18 * 60, // 1080s
    targetFrames30fps: 18 * 60 * 30, // 32,400 frames
    description: 'Investigação de propagação de estresse, falha em cascata e protocolos de recuperação.'
  }
};

/**
 * Paleta de Cores Oficial HSL (Contrato HSL_VISUAL_IDENTITY_V2)
 */
export const HSL_PALETTE = {
  // Background & Superfícies
  COLOR_BG_DARK: '#0D0E15',        // Obsidian Matte (Ambiente principal neutro)
  COLOR_SURFACE: '#161824',        // Superfície de cards e painéis
  COLOR_SURFACE_2: '#1C1F30',      // Superfície secundária destacada
  COLOR_SURFACE_BORDER: '#26293D', // Bordas e grid analítico
  
  // Destaques e Semântica de Estado
  COLOR_ACCENT_YELLOW: '#FFE500',   // Electric Acid Yellow (Foco editorial, hero metric, descoberta)
  COLOR_ACCENT_BLUE: '#0038FF',     // International Klein Blue (Infraestrutura, operação normal)
  COLOR_STATE_BOTTLENECK: '#FF2E00',// Hyper Orange (Gargalo, calor operacional, fila, saturação)
  COLOR_STATE_RECOVERY: '#00FF85',  // Recovery Green (Bypass, redundância, solução operacional)
  
  // Tipografia e Contrastes
  COLOR_TEXT_PRIMARY: '#F4F4F0',   // Branco off-white de alto contraste
  COLOR_TEXT_MUTED: '#8C90A4'      // Cinza técnico para unidades e telemetria
} as const;

/**
 * Mix Visual Obrigatório HSL
 */
export const HSL_VISUAL_MIX = {
  REMOTION_PERCENTAGE: 0.55,    // 50-60%: Quando o espectador precisa ENTENDER
  REAL_FOOTAGE_PERCENTAGE: 0.25,// 20-25%: Quando o espectador precisa RECONHECER (Fotografia 35mm / Arri Alexa)
  GENERATIVE_AI_PERCENTAGE: 0.15,// 10-20%: Quando o espectador precisa IMAGINAR (Processos invisíveis)
  TYPOGRAPHY_BUMPERS: 0.05      // 5-10%: Títulos monumentais e selos
} as const;

/**
 * Configurações de Movimento (Springs e Easing)
 */
export const HSL_MOTION_CONFIGS = {
  elasticPop: { damping: 12, mass: 0.6, stiffness: 180 },
  smoothPan: { damping: 20, mass: 1.0, stiffness: 80 },
  heavyDrop: { damping: 14, mass: 1.2, stiffness: 140 },
  microPacingFrames: 150 // Mudança visual a cada 4-5 segundos (120-150 frames @ 30fps)
} as const;
