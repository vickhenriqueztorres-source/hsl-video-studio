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
    textures: ['formica_clara', 'granito_cinza', 'azulejo_comum', 'cimento_fino', 'plastico_fosco', 'papel_timbrado', 'grao_cinematografico_leve'],
    cameraLanguage: 'documentário de defesa cotidiana brasileira; iluminação crua, neutra e funcional (fluorescente de cozinha/portaria, dia nublado, lâmpada de teto comum sem golden hour ou pôr do sol); materiais autênticos como fórmica clara e granito; presença humana periférica ou ausente com o objeto ou evidência documental como protagonista; dinamismo de corte (19-35 mudanças no primeiro minuto inspirado em fern); enquadramentos sóbrios e planos detalhe funcionais',
    reconstructionLabelRequired: true,
    characterPolicy: {
      presence: 'periferica_ou_ausente',
      dominance: 'objeto_protagonista',
      faceFraming: 'proibido_close_frontal_dramatico',
      handsAndGestures: 'funcional_cotidiano_sem_pose_stock'
    }
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
      { id: 'variant_a_decisao', name: 'Decisão', concept: 'O segundo antes do clique ou transferência bancária com fenda coral sutil' },
      { id: 'variant_b_mecanismo', name: 'Mecanismo', concept: 'A tela aberta revelando o sistema oculto e fluxo invisível por trás da fenda' },
      { id: 'variant_c_consequencia', name: 'Consequência', concept: 'Dinheiro, identidade ou acesso desaparecendo com callout de evidência' }
    ],
    titleGuidelines: [
      'Roubaram o celular. O banco foi aberto 8 minutos depois',
      'A ligação era perfeita — até este detalhe',
      'A voz era da filha dela. A filha nunca ligou.',
      'O golpe que começa quando você recebe dinheiro',
      'Eles sabiam seu nome, banco e saldo'
    ],
    chapterMarkerPrefix: 'Ato'
  },
  compliance: {
    rules: [
      { id: 'RULE_BRECHA_MOMENTO_DA_BRECHA', name: 'Presença do Momento da Brecha', required: true, description: 'O episódio deve conter o congelamento explicativo e fenda coral na decisão da vítima' },
      { id: 'RULE_BRECHA_RECONSTRUCTION_LABELS', name: 'Selo de Reconstrução em Cenas Dramatizadas', required: true, description: 'Cenas geradas não podem se passar por prova real' },
      { id: 'RULE_BRECHA_LOCALE_PORTUGUESE', name: 'Idioma Português Brasileiro (pt-BR)', required: true, description: 'Narração e textos devem ser estritamente em pt-BR natural' },
      { id: 'RULE_BRECHA_EVIDENCE_INTEGRITY', name: 'Integridade de Evidências Reais', required: true, description: 'Nenhum fato central pode depender exclusivamente de imagem gerada' },
      { id: 'RULE_BRECHA_COLD_OPEN_CALLBACK', name: 'Retorno ao Objeto no Fechamento', required: true, description: 'O fechamento deve retornar ao objeto físico da abertura com o golpe desarmado' }
    ]
  },
  references: {
    brandBiblePath: 'channels/brecha/editorial.md',
    styleFramesDir: 'channels/brecha/assets/style-frames',
    brandingDir: 'channels/brecha/assets/branding'
  }
};
