import type { ChannelProfile } from '../types';

export const brechaProfile: ChannelProfile = {
  schemaVersion: 1,
  id: 'brecha',
  version: '1.0.0',
  displayName: 'BRECHA',
  locale: 'pt-BR',
  editorial: {
    format: 'documentario_defesa_cotidiana_forense',
    targetDurationMinutes: [10, 12],
    wordsPerMinuteRange: [150, 165],
    structure: [
      'SUPERFICIE_COTIDIANA',
      'ANOMALIA',
      'RECONSTRUCAO',
      'EVIDENCIA',
      'SISTEMA_INVISIVEL',
      'MOMENTO_DA_BRECHA',
      'CONSEQUENCIA',
      'ACAO_DEFENSIVA'
    ],
    requiredSignature: 'Momento da Brecha',
    principles: [
      'IA representa. Evidência confirma.',
      'Toda fraude começa por uma brecha.',
      'Não culpabilizar a vítima: explicar por que parecia verdadeiro no momento.',
      'Coral exclusivo para o ponto explorado/revelado (5% a 12% do frame).',
      'Zero ambiente de laboratório hacker com neon, chuva de código ou capuz.'
    ],
    prohibitedThemes: [
      'tutoriais de invasao hacker',
      'promessas de enriquecimento',
      'divulgacao de dados de vitimas sem anonimizacao'
    ]
  },
  visual: {
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    palette: {
      background: '#0D0D0F', // Carvão
      primaryText: '#E8E2D7', // Osso
      secondaryText: '#6E6B68', // Cinza mineral
      accent: '#FF5A47', // Coral da brecha/revelação
      flowSystem: '#4F9B96', // Verde-azulado de fluxo/sistema
      verificationSafe: '#BCD5C2', // Menta pálida de verificação/segurança
    },
    typography: {
      titles: 'Archivo SemiExpanded, sans-serif',
      body: 'Source Sans 3, sans-serif',
      dataMonospace: 'IBM Plex Mono, monospace'
    },
    textures: ['papel_fino', 'concreto_suave', 'vidro_fosco', 'grao_cinematografico_leve'],
    cameraLanguage: 'continuidade causal de fern, espaco investigativo de LEMMiNO, ancoras documentais de Jim Browning',
    reconstructionLabelRequired: true
  },
  narration: {
    locale: 'pt-BR',
    tone: 'calma, proxima, precisa, investigativa sem paranoia ou moralismo',
    pacing: 'natural brasileiro, pausas nas revelacoes',
    defaultVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam / Português Documentário Natural
    defaultModelId: 'eleven_multilingual_v2',
    currencyRules: 'spoken_words'
  },
  motion: {
    style: 'documentario causal com prova forense; Remotion explicativo sem rede decorativa',
    preferredEngines: ['remotion-authored', 'local-ffmpeg'],
    allow3d: true,
    maxAuthoredScenes: 12
  },
  packaging: {
    thumbnailVariants: [
      { id: 'variant_a_objeto', name: 'Objeto / Gesto Cotidiano', concept: 'Celular, cartão ou documento brasileiro com fenda sutil' },
      { id: 'variant_b_fenda', name: 'Fenda Dividida (Antes/Depois)', concept: 'Divisão assimétrica entre superfície visível e mecanismo escondido' },
      { id: 'variant_c_evidencia', name: 'Evidência / Documento Real', concept: 'Comprovante, boletim ou extrato com callout coral' }
    ],
    titleGuidelines: [
      'Roubaram o celular. O banco foi aberto 8 minutos depois',
      'A ligação era perfeita — até este detalhe',
      'A voz era da filha dela. A filha nunca ligou.'
    ],
    chapterMarkerPrefix: 'Ato'
  },
  compliance: {
    rules: [
      { id: 'BRECHA_RULE_01', name: 'Presença do Momento da Brecha', required: true, description: 'O episódio deve conter o congelamento explicativo e fenda coral' },
      { id: 'BRECHA_RULE_02', name: 'Selo de Reconstrução em Cenas Dramatizadas', required: true, description: 'Cenas geradas não podem se passar por prova real' },
      { id: 'BRECHA_RULE_03', name: 'Idioma Português Brasileiro (pt-BR)', required: true, description: 'Narração e textos devem ser estritamente em pt-BR' }
    ]
  },
  references: {
    brandBiblePath: 'channels/brecha/editorial.md',
    styleFramesDir: 'channels/brecha/assets/style-frames',
    brandingDir: 'channels/brecha/assets/branding'
  }
};
