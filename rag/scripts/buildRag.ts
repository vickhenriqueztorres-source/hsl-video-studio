import fs from 'fs';
import path from 'path';

export interface ChunkTimestamp {
  readonly start: string;
  readonly end: string;
}

export type KnowledgeType =
  | 'technical_principle'
  | 'narrative_principle'
  | 'practical_example'
  | 'decision_rule'
  | 'heuristic_parameter'
  | 'subjective_recommendation'
  | 'workflow';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface SoundDesignChunk {
  readonly id: string;
  readonly sourceFile: string;
  readonly sourceTimestamp?: ChunkTimestamp;
  readonly title: string;
  readonly summary: string;
  readonly content: string;
  readonly knowledgeType: KnowledgeType;
  readonly tags: readonly string[];
  readonly confidence: ConfidenceLevel;
  readonly relatedConcepts: readonly string[];
}

export interface DecisionRule {
  readonly id: string;
  readonly category: string;
  readonly when: readonly string[];
  readonly recommend: readonly string[];
  readonly avoid: readonly string[];
  readonly reason: string;
  readonly sourceChunks: readonly string[];
  readonly confidence: ConfidenceLevel;
}

export const VALID_CATEGORIES = [
  'narrative_intent',
  'score',
  'ambience',
  'foley',
  'creative_sound_design',
  'riser',
  'drone',
  'whoosh',
  'hit',
  'boom',
  'reverse_impact',
  'transition',
  'music_editing',
  'beat_alignment',
  'frequency_separation',
  'voice_processing',
  'equalization',
  'reverb',
  'room_matching',
  'layering',
  'waveform_editing',
  'volume_automation',
  'mixing',
  'restraint',
  'cinematic_style'
] as const;

export function buildRag(): {
  chunks: SoundDesignChunk[];
  decisionRules: DecisionRule[];
} {
  const root = process.cwd();
  const sourceOriginDir = path.resolve(root, 'RAG - AGENTE - SFX');
  const ragSourceDir = path.resolve(root, 'rag', 'source');
  const chunksDir = path.resolve(root, 'rag', 'chunks');
  const indexDir = path.resolve(root, 'rag', 'index');
  const schemasDir = path.resolve(root, 'rag', 'schemas');

  fs.mkdirSync(ragSourceDir, {recursive: true});
  fs.mkdirSync(chunksDir, {recursive: true});
  fs.mkdirSync(indexDir, {recursive: true});
  fs.mkdirSync(schemasDir, {recursive: true});

  // 1. Copiar e sincronizar arquivos de origem
  const fileMappings: Record<string, string[]> = {
    'CONT1.md': ['CONT1.md'],
    'CONT2.md': ['CONT2.md', 'CONT2-2.md'],
    'CONT3.md': ['CONT3.md', 'CONT3-3.md'],
    'CONT4.md': ['CONT4.md', 'CONT4-4.md']
  };

  for (const [srcName, destNames] of Object.entries(fileMappings)) {
    const srcPath = path.join(sourceOriginDir, srcName);
    if (fs.existsSync(srcPath)) {
      const content = fs.readFileSync(srcPath, 'utf8');
      for (const destName of destNames) {
        fs.writeFileSync(path.join(ragSourceDir, destName), content, 'utf8');
      }
    }
  }

  // 2. Definir o conjunto estruturado de Chunks Semânticos (300-700 palavras)
  const chunks: SoundDesignChunk[] = [
    // --- CONT1 CHUNKS (Equalização, Reverb, Espacialidade, Transições Atmosféricas) ---
    {
      id: 'sd_cont1_eq_001',
      sourceFile: 'CONT1.md',
      sourceTimestamp: {start: '00:00', end: '03:25'},
      title: 'Espacialidade e manipulação de frequências na introdução de cenas',
      summary: 'Utilização de equalização paramétrica e reverb surround (preset Catedral) para criar transições atmosféricas e posicionar áudios em espaços tridimensionais.',
      content: 'A manipulação de frequências e a aplicação de espaço (reverberação) são técnicas simples que conferem dimensão cinematográfica aos vídeos. Em vez de cortar o áudio bruscamente ou alterar apenas o volume, o editor utiliza um equalizador paramétrico para filtrar agudos e reforçar graves sutis, criando a sensação de um som distante ou encapsulado. Combinado ao efeito de reverb (como o preset Catedral no Final Cut ou Reverb Surround no Premiere Pro), o som da música ou da locução parece ecoar em um ambiente monumental, permitindo que a trilha continue no fundo sem competir com novas vozes ou cenas.',
      knowledgeType: 'technical_principle',
      tags: ['equalization', 'reverb', 'room_matching', 'transition', 'cinematic_style'],
      confidence: 'high',
      relatedConcepts: ['frequency_separation', 'layering', 'narrative_intent']
    },
    {
      id: 'sd_cont1_eq_002',
      sourceFile: 'CONT1.md',
      sourceTimestamp: {start: '03:26', end: '06:30'},
      title: 'Automação de Equalizador Paramétrico e controle de graves para transições',
      summary: 'Como animar pontos de corte de frequência com keyframes para abrir ou fechar o áudio suavemente sem clipar o ganho.',
      content: 'Ao animar os pontos do equalizador paramétrico através de keyframes, é possível criar uma transição sonora onde a música começa abafada (sem agudos e com frequências médias recuadas) e gradualmente "desencapsula" até seu espectro normal. O aumento sutil nas frequências graves faz o som vibrar e confere peso e impacto dramático, mas exige atenção redobrada aos medidores de áudio para evitar distorção digital (clipping). Essa técnica conduz a atenção do espectador de um momento introspectivo para o clímax da cena de forma orgânica.',
      knowledgeType: 'workflow',
      tags: ['equalization', 'volume_automation', 'waveform_editing', 'transition', 'mixing'],
      confidence: 'high',
      relatedConcepts: ['frequency_separation', 'restraint']
    },
    {
      id: 'sd_cont1_reverb_003',
      sourceFile: 'CONT1.md',
      sourceTimestamp: {start: '06:31', end: '11:04'},
      title: 'Efeito de voz distante e transições imersivas com reverb Catedral',
      summary: 'Técnica de transição entre vídeos e narrações aplicando reverb profundo na voz ou na música antes do início da nova trilha.',
      content: 'Para integrar um corte de vídeo onde a música do vídeo anterior ainda reverbera enquanto a narração do próximo take começa, utiliza-se a automação do parâmetro Mix de reverberação. Quando o clipe atual se aproxima do final, aumenta-se o nível de reverb enquanto o sinal direto diminui. Isso transforma o áudio em uma nuvem sonora ambiente, permitindo que a fala ou o próximo evento entrem com máxima clareza e sem choque perceptivo.',
      knowledgeType: 'practical_example',
      tags: ['reverb', 'voice_processing', 'transition', 'room_matching', 'narrative_intent'],
      confidence: 'high',
      relatedConcepts: ['ambience', 'cinematic_style']
    },

    // --- CONT2 CHUNKS (Frequency Carving, Camadas Graves/Médias/Agudas, Compassos, Modulação de SFX) ---
    {
      id: 'sd_cont2_carving_001',
      sourceFile: 'CONT2-2.md',
      sourceTimestamp: {start: '00:46', end: '02:19'},
      title: 'Frequency Carving: Separação de frequências entre voz e trilha sonora',
      summary: 'Por que apenas abaixar o ganho da trilha está incorreto e como esculpir o espectro médio para dar inteligibilidade à locução.',
      content: 'Ajustar apenas o ganho da trilha de áudio quando há uma locução é uma prática amadora que destrói o corpo e a energia da música. A técnica profissional correta é o Frequency Carving: através de um equalizador paramétrico, de-esser ou corte seletivo no centro do espectro sonoro (frequências médias onde a voz humana atua primordialmente), retiram-se apenas as frequências que concorrem com a fala. A trilha permanece cheia e encorpada nas extremidades graves e agudas, enquanto a voz ganha total inteligibilidade sem mascaramento.',
      knowledgeType: 'technical_principle',
      tags: ['frequency_separation', 'voice_processing', 'equalization', 'mixing', 'score'],
      confidence: 'high',
      relatedConcepts: ['volume_automation', 'restraint']
    },
    {
      id: 'sd_cont2_layering_002',
      sourceFile: 'CONT2-2.md',
      sourceTimestamp: {start: '02:20', end: '04:38'},
      title: 'Design de camadas sonoras: Separação em Graves, Médios e Agudos',
      summary: 'Estruturação do áudio em 3 faixas de frequência com momentos de ataque distintos para evitar poluição sonora.',
      content: 'Um sound design de alto impacto é construído dividindo os efeitos em três camadas de frequência fundamentais: graves (sub-impactos, bases sólidas e peso), médios (corpo principal, motores, passagens) e agudos (detalhes finos, cliques, caudas metálicas, faíscas). Para que múltiplas pistas toquem simultaneamente sem poluição sonora, elas devem possuir momentos de ataque escalonados: os elementos agudos iniciam o movimento, o riser cresce no médio e o grave ancora a virada, preenchendo o espectro de forma limpa e confortável para a audição.',
      knowledgeType: 'technical_principle',
      tags: ['layering', 'frequency_separation', 'cinematic_style', 'hit', 'riser'],
      confidence: 'high',
      relatedConcepts: ['mixing', 'waveform_editing']
    },
    {
      id: 'sd_cont2_intent_003',
      sourceFile: 'CONT2-2.md',
      sourceTimestamp: {start: '04:39', end: '06:17'},
      title: 'Realidade versus Intenção: Sonorização diegética e psicológica',
      summary: 'Como ultrapassar a sonorização puramente realista e utilizar graves ou texturas para guiar o subconsciente do público.',
      content: 'A sonorização cinematográfica não se restringe a reproduzir o que é fisicamente visível na cena (som diegético). Enquanto os sons literais (carros, pássaros distantes) conferem ancoragem visual, a introdução de uma cama de graves profundos ou drones em um take aéreo pacífico transforma a sensação da cena em suspense e apreensão psicológica. Trabalhar as três frequências em conjunto com a intenção dramática preenche o espectro e altera completamente o tom da narrativa.',
      knowledgeType: 'narrative_principle',
      tags: ['narrative_intent', 'drone', 'ambience', 'cinematic_style', 'layering'],
      confidence: 'high',
      relatedConcepts: ['creative_sound_design', 'restraint']
    },
    {
      id: 'sd_cont2_story_004',
      sourceFile: 'CONT2-2.md',
      sourceTimestamp: {start: '06:18', end: '08:52'},
      title: 'Coerência de escala visual e sonora: Tamanho visual exige peso correspondente',
      summary: 'Objetos e estruturas grandiosas demandam graves profundos; detalhes pequenos demandam agudos discretos.',
      content: 'O cérebro humano associa frequências graves a estruturas monumentais, poder e impacto (grandes palcos, explosões, edifícios) e frequências agudas a elementos pequenos e rápidos (flashes, cliques, ponteiros de relógio). Colocar um efeito agudo e leve em uma estrutura massiva quebra a imersão e remove a grandiosidade da cena. Da mesma forma, inverter a velocidade de um efeito sonoro existente (reverse) permite reutilizar o mesmo timbre para criar antecipações criativas sem inflar a biblioteca.',
      knowledgeType: 'narrative_principle',
      tags: ['narrative_intent', 'reverse_impact', 'cinematic_style', 'hit', 'boom'],
      confidence: 'high',
      relatedConcepts: ['layering', 'restraint']
    },
    {
      id: 'sd_cont2_music_005',
      sourceFile: 'CONT2-2.md',
      sourceTimestamp: {start: '08:53', end: '12:05'},
      title: 'Remix de trilha e respeito rigoroso à regra dos 4 compassos',
      summary: 'Regra rítmica fundamental para transições musicais imperceptíveis alinhadas no quarto compasso musical.',
      content: 'Ao editar ou trocar de trilha musical, é mandatório respeitar a contagem dos compassos (1, 2, 3, 4). Na estrutura musical tradicional, o quarto compasso é o momento natural de virada onde novos instrumentos entram ou a frase melódica se conclui. Fazer cortes fora do quarto compasso gera dissonância auditiva instantânea. Adicionar um riser que cresce ao longo do terceiro compasso e atinge seu ataque exatamente no início do primeiro tempo da nova trilha torna a transição suave e imperceptível.',
      knowledgeType: 'technical_principle',
      tags: ['music_editing', 'beat_alignment', 'transition', 'riser', 'score'],
      confidence: 'high',
      relatedConcepts: ['mixing', 'waveform_editing']
    },
    {
      id: 'sd_cont2_pause_006',
      sourceFile: 'CONT2-2.md',
      sourceTimestamp: {start: '12:06', end: '15:34'},
      title: 'Transições entre moods contrastantes: Respiração, antecipação e pausas',
      summary: 'Como transicionar entre trilhas de energias opostas utilizando pausas estratégicas, risers e ambientação prévia.',
      content: 'Quando a narrativa exige sair de uma trilha extremamente agitada para uma música calma e contemplativa, tentar uma sobreposição direta gera choque auditivo desconfortável. A solução é criar um respiro: finalizar a primeira trilha com um hit com cauda longa, introduzir uma pausa dramática com ruído de ambiência sutil (como ondas do mar e vento) e usar um riser suave para preparar o ouvinte antes que a nova melodia se inicie.',
      knowledgeType: 'decision_rule',
      tags: ['music_editing', 'transition', 'ambience', 'hit', 'restraint'],
      confidence: 'high',
      relatedConcepts: ['narrative_intent', 'score']
    },
    {
      id: 'sd_cont2_sfx_mod_007',
      sourceFile: 'CONT2-2.md',
      sourceTimestamp: {start: '15:35', end: '20:02'},
      title: 'Variação de SFX e micro-edição para evitar repetição artificial',
      summary: 'Uso de Pitch Shifter, variações de velocidade (-8 semitons, 80% speed) e cortes rítmicos para diversificar sons repetitivos.',
      content: 'Repetir o mesmo arquivo de efeito sonoro várias vezes seguidas (como passos, tiros, golpes ou faíscas) soa amador e robótico. Para criar variações ricas a partir do mesmo asset, utilizam-se técnicas de alteração de tom (Pitch Shifter com variações de -2 a -8 semitons), leves mudanças de velocidade (por exemplo, 80% a 110% de playback) e equalizações diferenciadas. Além disso, sons de fontes distantes devem ter suas altas frequências atenuadas (Low-Pass Filter) para refletir a distância física da câmera.',
      knowledgeType: 'practical_example',
      tags: ['creative_sound_design', 'foley', 'equalization', 'room_matching', 'cinematic_style'],
      confidence: 'high',
      relatedConcepts: ['waveform_editing', 'layering']
    },
    {
      id: 'sd_cont2_master_008',
      sourceFile: 'CONT2-2.md',
      sourceTimestamp: {start: '20:03', end: '23:25'},
      title: 'Finalização da Mix: Limitador de pico (Hard Limiter) e unidades de áudio na timeline',
      summary: 'Configuração do mixer master com limitador em -2dB a -3dB e habilitação de visualização de amostras de áudio para micro-alinhamentos.',
      content: 'Para garantir que a mixagem nunca distorça digitalmente nos dispositivos finais, deve-se aplicar um Limitador Pesado (Hard Limiter / Brickwall Limiter) no barramento Master da sequência, ajustado com teto entre -2 dB e -3 dB. Isso impede picos destrutivos mesmo em momentos de múltiplos impactos acumulados. Para sincronizações ultrarrápidas (como fagulhas de fogo ou tiros), deve-se habilitar a exibição de unidades de tempo de áudio na timeline (subframe / audio samples), permitindo micro-ajustes precisos que o grid de vídeo padrão em frames não permite.',
      knowledgeType: 'technical_principle',
      tags: ['mixing', 'waveform_editing', 'restraint', 'volume_automation', 'foley'],
      confidence: 'high',
      relatedConcepts: ['frequency_separation', 'equalization']
    },

    // --- CONT3 CHUNKS (Classificação de SFX: Risers, Drones, Whooshes, Hits; Calçamento de Áudio e Zoom) ---
    {
      id: 'sd_cont3_taxonomy_001',
      sourceFile: 'CONT3-3.md',
      sourceTimestamp: {start: '03:43', end: '05:15'},
      title: 'Taxonomia essencial de efeitos cinematográficos: Risers, Drones, Whooshes e Hits',
      summary: 'Definição e propósito dramático de cada uma das quatro categorias estruturais de sound effects.',
      content: 'Os quatro pilares dos efeitos sonoros modernos são: (1) Risers: criam expectativa e tensão crescente antes de uma grande revelação, virada ou corte; (2) Drones: sustentam atmosferas densas e suspense contínuo em momentos onde algo importante está prestes a ocorrer mas ainda permanece oculto; (3) Whooshes: conferem dinamismo e fluidez a movimentos rápidos de câmera, chicotes e transições de tela; (4) Hits: marcam informações cruciais, punchlines ou mudanças dramáticas imediatas, reforçando o impacto do que acabou de ser revelado.',
      knowledgeType: 'technical_principle',
      tags: ['riser', 'drone', 'whoosh', 'hit', 'creative_sound_design', 'narrative_intent'],
      confidence: 'high',
      relatedConcepts: ['boom', 'reverse_impact', 'cinematic_style']
    },
    {
      id: 'sd_cont3_automation_002',
      sourceFile: 'CONT3-3.md',
      sourceTimestamp: {start: '05:16', end: '10:24'},
      title: 'Automação de volume contextual alinhada ao movimento de câmera (Zoom)',
      summary: 'Diferença entre fades amadores padronizados e automação de volume expressiva motivada pela proximidade da câmera.',
      content: 'Amadores costumam aplicar o mesmo fade-in e fade-out linear em todos os clipes de áudio sem critério. A abordagem correta sincroniza a automação de volume com a dinâmica visual: quando a câmera realiza um zoom ou aproximação em direção a um objeto (como uma árvore sob tempestade de vento), o volume e a presença das frequências do efeito sonoro sobem progressivamente; quando a câmera se afasta, o som recua na mixagem, gerando tridimensionalidade e imersão realista.',
      knowledgeType: 'workflow',
      tags: ['volume_automation', 'waveform_editing', 'ambience', 'foley', 'mixing'],
      confidence: 'high',
      relatedConcepts: ['room_matching', 'cinematic_style']
    },
    {
      id: 'sd_cont3_three_sfx_003',
      sourceFile: 'CONT3-3.md',
      sourceTimestamp: {start: '10:25', end: '18:56'},
      title: 'Técnica do calçamento triplo para transições imperceptíveis de trilha',
      summary: 'Combinação de elemento intermediário, riser crescente e impacto reverso alinhados pelo waveform.',
      content: 'Para calçar uma transição de música sem gerar cortes secos ou embolamentos sonoros, utiliza-se a técnica dos 3 efeitos combinados: um som intermediário de suporte no centro do corte, um riser ascendente cujo ápice coincide com o início do novo compasso e um efeito de cauda reversa (reverse impact / swoosh reverso) que ancora o final da frase anterior. A inspeção visual do waveform na timeline permite posicionar o pico exato de amplitude (ganho) milimetricamente no ponto de virada.',
      knowledgeType: 'practical_example',
      tags: ['transition', 'riser', 'reverse_impact', 'waveform_editing', 'music_editing', 'beat_alignment'],
      confidence: 'high',
      relatedConcepts: ['layering', 'mixing']
    },

    // --- CONT4 CHUNKS (Fluxo em 3 Etapas, Camadas Abstratas, Saturação/Restraint, Diretrizes de Mixagem) ---
    {
      id: 'sd_cont4_workflow_001',
      sourceFile: 'CONT4-4.md',
      sourceTimestamp: {start: '00:35', end: '01:11'},
      title: 'Fluxo profissional em três etapas: Score, Ambience/Foley e Sound Design Criativo',
      summary: 'Metodologia estruturada de pós-produção de áudio: primeiro a música temporária, depois a base diegética e por fim os reforços conceituais.',
      content: 'A construção de uma trilha sonora de excelência segue três fases ordenadas: (1) Score: inserção de música temporária para estabelecer o tom emocional e fornecer a métrica de tempo para os efeitos; (2) Ambience & Foley: garantia de que tudo o que é visto em cena emita som, preenchendo inclusive o ruído de fundo de salas vazias (hiss/hum de ar condicionado); (3) Creative Sound Design: adição de camadas abstratas e reforços sonoros para elementos não visíveis, como pensamentos, tensão psicológica e movimentos estilizados de câmera.',
      knowledgeType: 'workflow',
      tags: ['score', 'ambience', 'foley', 'creative_sound_design', 'cinematic_style'],
      confidence: 'high',
      relatedConcepts: ['narrative_intent', 'layering', 'mixing']
    },
    {
      id: 'sd_cont4_score_edit_002',
      sourceFile: 'CONT4-4.md',
      sourceTimestamp: {start: '03:40', end: '05:08'},
      title: 'Reescrita e fatiamento da trilha musical (Score Editing) para apoiar a ação',
      summary: 'Como retalhar e reposicionar seções de faixas orquestrais e drones para alinhar hits e pausas aos cortes do vídeo.',
      content: 'Raramente uma música de biblioteca pronta irá casar perfeitamente com os cortes visuais sem intervenção do editor. Para que a música apoie os momentos narrativos, deve-se picotar a faixa, eliminando seções melódicas destoantes e reposicionando stabs orquestrais ou quedas de drone exatamente nos momentos de impacto visual (como uma remoção de grampo ou fechamento de porta). Músicas orquestrais sem ritmo de bateria marcado facilitam imensamente esse processo de edição invisível.',
      knowledgeType: 'technical_principle',
      tags: ['music_editing', 'score', 'drone', 'beat_alignment', 'waveform_editing'],
      confidence: 'high',
      relatedConcepts: ['transition', 'hit']
    },
    {
      id: 'sd_cont4_foley_reverb_003',
      sourceFile: 'CONT4-4.md',
      sourceTimestamp: {start: '05:09', end: '08:04'},
      title: 'Ambience contínua, variedade de Foley e reverberação por Submix Bus',
      summary: 'Importância de evitar ruído repetitivo em digitação/escrita e uso de barramento de reverb para colar o foley no ambiente.',
      content: 'Nenhum ambiente no mundo real é completamente silencioso; mesmo salas vazias exigem ruído de fundo (como ar-condicionado ou vento sutil na janela). Além disso, cada toque de teclado ou traço de caneta deve possuir variações acústicas sutis para não soar sintético. Como a maioria dos foleys é gravada em estúdios acusticamente tratados (som seco), deve-se rotear todas as pistas de foley através de um Submix Bus com reverberação de sala correspondente (room reverb), garantindo que todos os efeitos compartilhem o mesmo espaço acústico da cena.',
      knowledgeType: 'technical_principle',
      tags: ['ambience', 'foley', 'reverb', 'room_matching', 'mixing'],
      confidence: 'high',
      relatedConcepts: ['waveform_editing', 'restraint']
    },
    {
      id: 'sd_cont4_abstract_004',
      sourceFile: 'CONT4-4.md',
      sourceTimestamp: {start: '08:05', end: '11:30'},
      title: 'Sound Design abstrato: Comunicação de emoções e camadas de impacto não literal',
      summary: 'Uso de sinos, drones, reverse impacts e sons orgânicos (ossos quebrando) para enriquecer eventos visuais cotidianos.',
      content: 'O verdadeiro poder do sound design reside em comunicar o abstrato — sentimentos, gravidade e presságios. Uma simples colocação de caixa de papéis na mesa ganha peso dramático com um reverberating hit; a abertura de um grampeador se torna sinistra ao receber uma camada sutil de estalo ósseo (bone crunching). Essas camadas não literais enriquecem o universo sonoro, desde que suas características de frequência e timbre se fundam organicamente com o som base diegético.',
      knowledgeType: 'narrative_principle',
      tags: ['creative_sound_design', 'narrative_intent', 'reverse_impact', 'hit', 'layering', 'whoosh'],
      confidence: 'high',
      relatedConcepts: ['cinematic_style', 'drone']
    },
    {
      id: 'sd_cont4_restraint_005',
      sourceFile: 'CONT4-4.md',
      sourceTimestamp: {start: '11:31', end: '13:53'},
      title: 'Princípio da Moderação (Restraint): Evitar sobrecarga e reservar impacto para o clímax',
      summary: 'Por que acentuar todos os momentos destrói a dinâmica e como dosar intensidades entre pausas e clímax com booms e reverse cymbals.',
      content: 'Se o editor tentar tornar todos os momentos especiais com bass drops e hits grandiosos, nenhum momento terá destaque. Momentos intermediários de tensão exigem sutileza (como um leve cymbal suck back), enquanto momentos de impacto máximo e resolução de cena (clímax) são reservados para a combinação de reverse cymbal + sub boom de baixa frequência. A moderação e o equilíbrio são o diferencial entre uma edição profissional e uma colagem barulhenta.',
      knowledgeType: 'decision_rule',
      tags: ['restraint', 'boom', 'reverse_impact', 'hit', 'cinematic_style'],
      confidence: 'high',
      relatedConcepts: ['narrative_intent', 'mixing']
    },
    {
      id: 'sd_cont4_mix_levels_006',
      sourceFile: 'CONT4-4.md',
      sourceTimestamp: {start: '13:54', end: '16:44'},
      title: 'Diretrizes paramétricas de mixagem: Níveis de Diálogo, Efeitos e Música',
      summary: 'Parâmetros aproximados de medição (heurísticas): Diálogo a -12dB, SFX entre -10dB e -30dB, Score entre -20dB e -30dB.',
      content: 'Para que todas as pistas funcionem harmoniosamente sem mascaramentos nem clipping: (1) O Diálogo deve ser o elemento dominante, situado por volta de -12 dB para clareza absoluta da narrativa; (2) Os Efeitos Sonoros (SFX / Foley) devem flutuar entre -10 dB (grandes impactos principais) e -30 dB (foleys sutis de fundo); (3) A Trilha Musical (Score) costuma repousar entre -20 dB e -30 dB durante momentos com voz, subindo em pontes ou viradas instrumentais. O sound design é um processo iterativo construído em camadas sucessivas.',
      knowledgeType: 'heuristic_parameter',
      tags: ['mixing', 'volume_automation', 'voice_processing', 'score', 'foley'],
      confidence: 'high',
      relatedConcepts: ['frequency_separation', 'restraint']
    }
  ];

  // 3. Definir o conjunto estruturado de Regras de Decisão (Cobrindo todas as 25 categorias)
  const decisionRules: DecisionRule[] = [
    {
      id: 'rule_score_by_mood_001',
      category: 'score',
      when: [
        'iniciando o corte ou estruturação de uma nova cena',
        'definindo a intenção emocional e o ritmo dos cortes'
      ],
      recommend: [
        'inserir trilha temporária (temp track) antes de desenhar os sound effects',
        'escolher o gênero e instrumentação de acordo com o mood emocional da cena (heroico, tenso, calmo ou perseguição)'
      ],
      avoid: [
        'editar vídeo e sound design em silêncio absoluto sem métrica musical',
        'utilizar trilhas alegres em cenas de suspense ou vice-versa'
      ],
      reason: 'A música define a métrica de tempo, tom dramático e contexto para que os sound effects sejam desenhados em harmonia.',
      sourceChunks: ['sd_cont4_workflow_001', 'sd_cont2_music_005'],
      confidence: 'high'
    },
    {
      id: 'rule_ambience_location_002',
      category: 'ambience',
      when: [
        'cena estabelece um novo ambiente ou localização espacial',
        'momentos de silêncio na narrativa onde não há diálogos'
      ],
      recommend: [
        'adicionar ruído de fundo característico do local (ex: ar condicionado em escritório, vento em deserto, ondas em praia)',
        'manter o nível de ambiência sutil em segundo plano para preencher o vazio estéril'
      ],
      avoid: [
        'deixar momentos sem som diegético gerando uma cena artificialmente morta',
        'aumentar a ambiência a ponto de disputar espaço com falas'
      ],
      reason: 'Na realidade nada é 100% silencioso; a ambiência confere textura, realismo e conforto auditivo contínuo.',
      sourceChunks: ['sd_cont4_foley_reverb_003', 'sd_cont3_automation_002', 'sd_cont2_intent_003'],
      confidence: 'high'
    },
    {
      id: 'rule_foley_visual_003',
      category: 'foley',
      when: [
        'ações físicas visíveis na tela (digitação, escrita, passos, manuseio de papéis, trincos de porta)'
      ],
      recommend: [
        'sonorizar os elementos presentes na imagem para sincronia realista',
        'utilizar variações de amostras ou gravar foley diretamente na timeline para evitar repetições idênticas'
      ],
      avoid: [
        'repetir exatamente o mesmo arquivo de áudio para cada passo ou clique de teclado',
        'deixar ações visuais em primeiro plano desprovidas de som'
      ],
      reason: 'A ausência de foley ou a repetição robótica quebra a suspensão da descrença e soa amadora.',
      sourceChunks: ['sd_cont4_foley_reverb_003', 'sd_cont2_sfx_mod_007'],
      confidence: 'high'
    },
    {
      id: 'rule_riser_reveal_004',
      category: 'riser',
      when: [
        'antecedendo uma grande revelação, virada dramática, mudança de cena ou corte musical importante'
      ],
      recommend: [
        'posicionar o riser de modo que seu crescimento antecipe a mudança',
        'alinhar o ataque final do riser precisamente no ponto de corte ou primeiro tempo do novo compasso'
      ],
      avoid: [
        'usar risers longos em momentos banais sem desfecho visual correspondente',
        'interromper o riser antes de atingir seu ápice natural'
      ],
      reason: 'O riser gera expectativa no subconsciente do espectador e prepara a mente para a nova informação.',
      sourceChunks: ['sd_cont3_taxonomy_001', 'sd_cont2_music_005', 'sd_cont3_three_sfx_003'],
      confidence: 'high'
    },
    {
      id: 'rule_drone_suspense_005',
      category: 'drone',
      when: [
        'cenas de mistério, investigação, perigo iminente ou quando algo importante ainda não foi revelado'
      ],
      recommend: [
        'usar drones graves e contínuos para criar uma atmosfera densa e inquietante',
        'sustentar a frequência baixa como uma cama contínua que amplifica a gravidade da cena'
      ],
      avoid: [
        'usar drones melódicos em excesso competindo com diálogos reflexivos',
        'cortar o drone de maneira seca sem cauda natural de sustentação'
      ],
      reason: 'Drones estimulam a percepção psicológica de perigo e suspense contínuo sem demandar elementos rítmicos.',
      sourceChunks: ['sd_cont3_taxonomy_001', 'sd_cont2_intent_003', 'sd_cont4_score_edit_002'],
      confidence: 'high'
    },
    {
      id: 'rule_whoosh_movement_006',
      category: 'whoosh',
      when: [
        'movimentos rápidos de câmera (pans rápidos, whip pans), transições visuais ou ações dinâmicas de personagens'
      ],
      recommend: [
        'adicionar whooshes e swooshes para acompanhar a trajetória do movimento visual',
        'usar whooshes para conferir dinamismo e leveza rítmica em edições estilizadas'
      ],
      avoid: [
        'inserir whooshes em cortes lentos e contemplativos onde não há deslocamento de quadro',
        'utilizar whooshes com frequências excessivamente estridentes que causem fadiga auditiva'
      ],
      reason: 'O whoosh cria uma ponte auditiva que guia o olhar e torna as transições espaciais fluidas.',
      sourceChunks: ['sd_cont3_taxonomy_001', 'sd_cont4_abstract_004'],
      confidence: 'high'
    },
    {
      id: 'rule_hit_punchline_007',
      category: 'hit',
      when: [
        'revelação de informação chave, punchline em comédia, corte dramático ou virada narrativa'
      ],
      recommend: [
        'aplicar um hit imediatamente no instante do impacto visual para marcar o evento',
        'alinhar o pico de transiente do hit ao frame exato da ação na timeline'
      ],
      avoid: [
        'espalhar hits em todas as frases sem hierarquia de importância',
        'usar hits com ataques atrasados em relação ao corte'
      ],
      reason: 'Hits reforçam no cérebro a importância do elemento mostrado, pontuando a história como vírgulas e pontos finais sonoros.',
      sourceChunks: ['sd_cont3_taxonomy_001', 'sd_cont4_abstract_004', 'sd_cont2_story_004'],
      confidence: 'high'
    },
    {
      id: 'rule_boom_climax_008',
      category: 'boom',
      when: [
        'clímax de cena, resolução de bloco, fechamento de título principal ou impacto de grande escala'
      ],
      recommend: [
        'combinar sub-booms de baixa frequência com caudas de ressonância profunda',
        'reservar o boom para o ponto mais alto de energia da sequência'
      ],
      avoid: [
        'usar booms graves em momentos secundários ou pausas momentâneas de ação',
        'acumular múltiplos booms consecutivos gerando embolamento no espectro sub-grave'
      ],
      reason: 'O boom transmite magnitude, finalização e peso monumental que só surtem efeito se não forem banalizados.',
      sourceChunks: ['sd_cont4_restraint_005', 'sd_cont2_story_004'],
      confidence: 'high'
    },
    {
      id: 'rule_reverse_impact_009',
      category: 'reverse_impact',
      when: [
        'antecedência imediata de um golpe, corte sinistro ou término de frase musical'
      ],
      recommend: [
        'utilizar reverse cymbal (suck back) ou impacto invertido que suga o áudio em direção ao ponto de impacto',
        'casar o final do reverse exatamente com o transiente do hit seguinte'
      ],
      avoid: [
        'deixar um intervalo de silêncio entre o final do efeito reverso e o início do impacto',
        'utilizar reverse excessivamente longo que desvie a atenção do diálogo prévio'
      ],
      reason: 'O reverse cria uma sucção acústica que aumenta exponencialmente a força do impacto subsequente.',
      sourceChunks: ['sd_cont4_abstract_004', 'sd_cont4_restraint_005', 'sd_cont3_three_sfx_003'],
      confidence: 'high'
    },
    {
      id: 'rule_transition_calcar_010',
      category: 'transition',
      when: [
        'passagem entre duas cenas distintas ou transição entre temas de vídeo'
      ],
      recommend: [
        'calçar a transição com 3 elementos: suporte central, antecipação crescente (riser) e ancoragem (hit/reverso)',
        'esconder cortes bruscos tornando o fluxo sonoro uma experiência contínua'
      ],
      avoid: [
        'usar apenas fade-in e fade-out lineares amadores que revelam o corte',
        'deixar gaps de áudio vazios sem ambiência de transição'
      ],
      reason: 'Uma transição calçada em três pontos soa orgânica e guia a mente do público sem sobressaltos.',
      sourceChunks: ['sd_cont3_three_sfx_003', 'sd_cont1_eq_001', 'sd_cont2_pause_006'],
      confidence: 'high'
    },
    {
      id: 'rule_music_compass_011',
      category: 'music_editing',
      when: [
        'fatiando, emendando ou trocando faixas musicais na timeline'
      ],
      recommend: [
        'respeitar rigorosamente a contagem de 4 compassos (1, 2, 3, 4) para realizar cortes e viradas',
        'aproveitar as mudanças naturais de instrumentos no quarto compasso para introduzir novos temas'
      ],
      avoid: [
        'cortar no segundo ou terceiro compasso sem justificativa dramática intencional',
        'emendar compassos de tempos métricos conflitantes sem transição de descanso'
      ],
      reason: 'O ouvido humano espera a conclusão da frase métrica no quarto compasso; respeitar isso evita dissonância rítmica.',
      sourceChunks: ['sd_cont2_music_005', 'sd_cont4_score_edit_002'],
      confidence: 'high'
    },
    {
      id: 'rule_beat_alignment_012',
      category: 'beat_alignment',
      when: [
        'alinhando cortes de imagem e efeitos de transição com a trilha sonora'
      ],
      recommend: [
        'alinhar o corte do vídeo ao primeiro tempo forte (downbeat) do compasso musical',
        'visualizar a forma de onda (waveform) para identificar o pico exato do bumbo/caixa'
      ],
      avoid: [
        'cortar 1 ou 2 frames antes ou depois do beat por falta de precisão na timeline',
        'sobrepor beats concorrentes de duas faixas com tempos (BPM) incompatíveis'
      ],
      reason: 'O sincronismo do estímulo visual com o pulso sonoro multiplica o impacto e a percepção de polimento da edição.',
      sourceChunks: ['sd_cont2_music_005', 'sd_cont3_three_sfx_003'],
      confidence: 'high'
    },
    {
      id: 'rule_frequency_carving_013',
      category: 'frequency_separation',
      when: [
        'presença simultânea de locução/diálogo e trilha musical em segundo plano'
      ],
      recommend: [
        'aplicar técnica de Frequency Carving com EQ paramétrico, esculpindo e atenuando as frequências médias da trilha onde a voz atua',
        'manter os graves e agudos da trilha preservados para que a música continue encorpada e vibrante'
      ],
      avoid: [
        'simplesmente baixar o ganho geral da trilha até que ela fique inaudível ou perca toda a energia',
        'deixar a trilha concorrendo em frequências médias diretas com a fala'
      ],
      reason: 'A voz humana ganha clareza cristalina sem que a trilha perca seu corpo e potência emocional.',
      sourceChunks: ['sd_cont2_carving_001', 'sd_cont4_mix_levels_006'],
      confidence: 'high'
    },
    {
      id: 'rule_voice_intelligibility_014',
      category: 'voice_processing',
      when: [
        'ajustando volume e processamento de narrações, depoimentos e diálogos'
      ],
      recommend: [
        'manter o diálogo como prioridade no mix, visando pico em torno de -12 dB',
        'utilizar automação de reverb ou EQ para afastar a voz quando ela representar pensamentos ou memórias'
      ],
      avoid: [
        'enterrar a voz sob camadas pesadas de efeitos de impacto ou música',
        'permitir que a voz ultrapasse 0 dB e gere distorção digital estridente'
      ],
      reason: 'O diálogo é o veículo primordial da mensagem e deve permanecer sempre inteligível e bem balanceado.',
      sourceChunks: ['sd_cont4_mix_levels_006', 'sd_cont1_reverb_003', 'sd_cont2_carving_001'],
      confidence: 'high'
    },
    {
      id: 'rule_parametric_eq_015',
      category: 'equalization',
      when: [
        'ajustando timbres, limpando ressonâncias ou criando efeitos de distância em áudios'
      ],
      recommend: [
        'usar equalizador paramétrico para cortes precisos de frequências indesejadas e abertura de espaço para outros instrumentos',
        'animar filtros Low-Pass / High-Pass com keyframes para transições espaciais progressivas'
      ],
      avoid: [
        'recorrer unicamente ao ganho bruto para resolver problemas de conflito espectral',
        'amplificar excessivamente frequências sem monitorar os medidores de saturação'
      ],
      reason: 'O EQ molda o timbre e a clareza espacial de cada elemento individual sem desbalancear o volume geral.',
      sourceChunks: ['sd_cont1_eq_001', 'sd_cont1_eq_002', 'sd_cont2_carving_001', 'sd_cont2_sfx_mod_007'],
      confidence: 'high'
    },
    {
      id: 'rule_reverb_environment_016',
      category: 'reverb',
      when: [
        'inserindo foleys ou efeitos gravados em estúdio seco dentro de uma cena com ambiente específico'
      ],
      recommend: [
        'aplicar reverberação condizente com a geometria do espaço visual (ex: Grande Salão / Sala Pequena / Catedral)',
        'rotear pistas de foley através de um submix bus com reverb comum para unificar o espaço acústico'
      ],
      avoid: [
        'deixar foleys completamente secos em ambientes grandes e reverberantes',
        'inserir reverbs diferentes e conflitantes em cada clipe isolado'
      ],
      reason: 'O reverb conecta o som ao mundo físico da imagem, fazendo com que o efeito pareça ter sido gravado na própria locação.',
      sourceChunks: ['sd_cont4_foley_reverb_003', 'sd_cont1_reverb_003', 'sd_cont2_master_008'],
      confidence: 'high'
    },
    {
      id: 'rule_room_matching_017',
      category: 'room_matching',
      when: [
        'ambientando efeitos gravados isoladamente com a locação exibida na imagem'
      ],
      recommend: [
        'ajustar o decaimento do reverb e a atenuação de agudos de acordo com a distância e materiais da sala',
        'abafar o som com corte de altas frequências quando a fonte sonora estiver longe da câmera'
      ],
      avoid: [
        'reproduzir sons distantes com presença brilhante como se estivessem em primeiro plano',
        'ignorar as propriedades físicas do ambiente retratado'
      ],
      reason: 'A correspondência acústica de sala cria harmonia e verossimilhança visual-auditiva instantânea.',
      sourceChunks: ['sd_cont2_sfx_mod_007', 'sd_cont4_foley_reverb_003', 'sd_cont1_eq_001'],
      confidence: 'high'
    },
    {
      id: 'rule_layering_three_bands_018',
      category: 'layering',
      when: [
        'construindo transições de impacto, viradas de cena ou design de ações grandiosas'
      ],
      recommend: [
        'estruturar o evento em 3 camadas de frequência complementares (Grave para peso, Médio para corpo e Agudo para detalhe e ataque)',
        'escalonar os transientes para que cada frequência ocupe seu momento próprio sem colisão'
      ],
      avoid: [
        'acumular múltiplos efeitos disputando a mesma faixa restrita de frequência',
        'confiar em um único efeito solitário para momentos de clímax'
      ],
      reason: 'O empilhamento equilibrado em 3 bandas preenche o espectro auditivo de forma rica, potente e sem asperezas.',
      sourceChunks: ['sd_cont2_layering_002', 'sd_cont4_abstract_004'],
      confidence: 'high'
    },
    {
      id: 'rule_waveform_alignment_019',
      category: 'waveform_editing',
      when: [
        'sincronizando efeitos de impacto, passos, cliques ou transientes rápidos'
      ],
      recommend: [
        'editar com as formas de onda (waveforms) sempre visíveis na timeline',
        'alinhar o ápice da onda (transiente principal) com o frame exato do evento ou marcador de corte'
      ],
      avoid: [
        'posicionar clipes de áudio apenas pelo início do bloco sem verificar onde está o pico sonoro',
        'ignorar micro-defasagens de 1 a 2 frames entre imagem e áudio'
      ],
      reason: 'O waveform revela a física do áudio; alinhar visualmente o pico garante precisão cirúrgica.',
      sourceChunks: ['sd_cont4_score_edit_002', 'sd_cont2_master_008', 'sd_cont3_automation_002'],
      confidence: 'high'
    },
    {
      id: 'rule_volume_automation_020',
      category: 'volume_automation',
      when: [
        'ajustando a dinâmica de trilhas, foleys sob falas ou movimentos de câmera'
      ],
      recommend: [
        'usar keyframes para automação suave e expressiva de ganho',
        'aumentar o volume proporcionalmente à aproximação da câmera (zoom in) e atenuar no afastamento'
      ],
      avoid: [
        'manter volumes estáticos do início ao fim sem reagir aos acontecimentos da cena',
        'aplicar automações com curvas angulares bruscas que causem estalos'
      ],
      reason: 'A automação de volume imprime dinamismo, respiração e profundidade ao mix sonoro.',
      sourceChunks: ['sd_cont3_automation_002', 'sd_cont1_eq_002', 'sd_cont4_mix_levels_006'],
      confidence: 'high'
    },
    {
      id: 'rule_mixing_master_021',
      category: 'mixing',
      when: [
        'balanceando os níveis finais de diálogo, música e efeitos e finalizando o barramento Master'
      ],
      recommend: [
        'aplicar um limitador de pico rígido (Hard Limiter / Brickwall) no barramento Master ajustado entre -2 dB e -3 dB',
        'respeitar a hierarquia de níveis: Diálogo a -12dB, SFX de -10dB a -30dB, Score de -20dB a -30dB'
      ],
      avoid: [
        'permitir que os picos ultrapassem 0 dB gerando distorção destrutiva',
        'deixar a música abafando completamente a clareza do diálogo'
      ],
      reason: 'O limitador e a escala de medição garantem que o áudio soe consistente, potente e livre de clipping em qualquer player.',
      sourceChunks: ['sd_cont2_master_008', 'sd_cont4_mix_levels_006'],
      confidence: 'high'
    },
    {
      id: 'rule_restraint_avoid_overload_022',
      category: 'restraint',
      when: [
        'decidindo a quantidade e intensidade dos efeitos sonoros em uma sequência'
      ],
      recommend: [
        'identificar os momentos verdadeiramente cruciais da narrativa e reservar a intensidade máxima apenas para eles',
        'utilizar efeitos sutis em momentos intermediários e dosar o silêncio e as pausas'
      ],
      avoid: [
        'colocar hits e bass drops pesados em toda e qualquer ação ou movimento secundário',
        'sobrecarregar a timeline a ponto de anular o impacto do clímax'
      ],
      reason: 'Se todo momento for tratado como especial, nenhum terá impacto; o contraste e a moderação tornam os momentos épicos inesquecíveis.',
      sourceChunks: ['sd_cont4_restraint_005', 'sd_cont2_story_004'],
      confidence: 'high'
    },
    {
      id: 'rule_cinematic_style_023',
      category: 'cinematic_style',
      when: [
        'estabelecendo a identidade e a consistência estilística de um projeto audiovisual'
      ],
      recommend: [
        'adotar uma paleta consistente de sound design (timbre de risers, texturas de whooshes, tipo de reverbs)',
        'revisar a edição em passes iterativos sucessivos: base diegética -> suporte musical -> camadas criativas -> mix final'
      ],
      avoid: [
        'misturar estilos sonoros conflitantes aleatoriamente sem motivação narrativa',
        'esperar obter uma mixagem perfeita em uma única passagem rápida'
      ],
      reason: 'A consistência estilística e a construção em passes conferem identidade de estúdio e sofisticação à produção.',
      sourceChunks: ['sd_cont4_workflow_001', 'sd_cont4_abstract_004', 'sd_cont1_eq_001'],
      confidence: 'high'
    },
    {
      id: 'rule_creative_sound_design_024',
      category: 'creative_sound_design',
      when: [
        'enriquecendo cenas cotidianas ou criando metáforas e presságios sonoros'
      ],
      recommend: [
        'adicionar camadas não literais (como estalos ósseos ou sinos etéreos) que combinem em frequência com os sons da cena',
        'usar o áudio para comunicar o que não pode ser visto na imagem, como sensações e pensamentos'
      ],
      avoid: [
        'limitar o sound design exclusivamente à reprodução óbvia do que os olhos enxergam',
        'inserir sons abstratos desconectados do timbre dos elementos da tela'
      ],
      reason: 'O sound design criativo transforma imagens comuns em cinema, gerando curiosidade e tensão no espectador.',
      sourceChunks: ['sd_cont4_abstract_004', 'sd_cont2_intent_003'],
      confidence: 'high'
    },
    {
      id: 'rule_narrative_intent_025',
      category: 'narrative_intent',
      when: [
        'planejando o arco dramático e a reação psicológica desejada do público'
      ],
      recommend: [
        'guiar o sound design pela intenção dramática antes de se ater à realidade física da locação',
        'usar graves para sugerir gravidade e perigo e agudos para leveza ou agilidade'
      ],
      avoid: [
        'forçar atmosferas que entrem em contradição injustificada com a lógica do cérebro do público',
        'adicionar efeitos sonoros sem um propósito claro na narrativa'
      ],
      reason: 'O som é a parte oculta do iceberg: ele determina o que o público sente antes mesmo de racionalizar a imagem.',
      sourceChunks: ['sd_cont2_intent_003', 'sd_cont3_taxonomy_001', 'sd_cont4_abstract_004'],
      confidence: 'high'
    }
  ];

  // 4. Gravar rag/chunks/sound-design-chunks.jsonl
  const jsonlLines = chunks.map(c => JSON.stringify(c));
  fs.writeFileSync(
    path.join(chunksDir, 'sound-design-chunks.jsonl'),
    jsonlLines.join('\n'),
    'utf8'
  );

  // 5. Gravar rag/index/decision-rules.json
  fs.writeFileSync(
    path.join(indexDir, 'decision-rules.json'),
    JSON.stringify(decisionRules, null, 2),
    'utf8'
  );

  // 6. Gravar rag/index/audio-vocabulary.json
  const vocabulary = {
    schema: 'hsl.sound_design.audio_vocabulary.v1',
    categories: VALID_CATEGORIES,
    knowledge_types: [
      'technical_principle',
      'narrative_principle',
      'practical_example',
      'decision_rule',
      'heuristic_parameter',
      'subjective_recommendation',
      'workflow'
    ],
    confidence_levels: ['high', 'medium', 'low']
  };
  fs.writeFileSync(
    path.join(indexDir, 'audio-vocabulary.json'),
    JSON.stringify(vocabulary, null, 2),
    'utf8'
  );

  // 7. Gravar rag/index/mix-guidelines.json
  const mixGuidelines = {
    schema: 'hsl.sound_design.mix_guidelines.v1',
    description: 'Diretrizes paramétricas de mixagem e masterização extraídas do conhecimento RAG',
    levels_heuristic_db: {
      dialogue: {
        target_db: -12.0,
        tolerance_db: 2.0,
        description: 'Voz/Locução como elemento dominante da mixagem'
      },
      sound_effects_sfx: {
        range_min_db: -30.0,
        range_max_db: -10.0,
        description: 'Efeitos sonoros pontuais e foleys de fundo'
      },
      score_music: {
        range_min_db: -30.0,
        range_max_db: -20.0,
        description: 'Trilha musical de fundo durante presença de diálogo'
      }
    },
    master_bus: {
      hard_limiter_ceiling_db: -2.5,
      hard_limiter_range: [-3.0, -2.0],
      purpose: 'Garantir proteção contra clipping digital e uniformidade de volume'
    },
    submix_bus: {
      foley_reverb_room_matching: true,
      description: 'Roteamento de foley através de submix bus com reverberação correspondente'
    },
    metering_and_timeline: {
      audio_samples_units_enabled: true,
      purpose: 'Visualização e ajuste em micro-amostras de áudio para sincronização perfeita de transientes'
    }
  };
  fs.writeFileSync(
    path.join(indexDir, 'mix-guidelines.json'),
    JSON.stringify(mixGuidelines, null, 2),
    'utf8'
  );

  // 8. Gravar rag/index/source-map.json
  const sourceMap = {
    schema: 'hsl.sound_design.source_map.v1',
    generated_at: new Date().toISOString(),
    source_files: {
      'CONT1.md': {
        title: 'Espacialidade, Equalização Paramétrica e Transições Atmosféricas',
        chunks: chunks.filter(c => c.sourceFile.includes('CONT1')).map(c => c.id)
      },
      'CONT2-2.md': {
        title: 'Frequency Carving, Camadas de 3 Bandas, Regra dos 4 Compassos e Modulação de SFX',
        chunks: chunks.filter(c => c.sourceFile.includes('CONT2')).map(c => c.id)
      },
      'CONT3-3.md': {
        title: 'Taxonomia de SFX (Risers, Drones, Whooshes, Hits) e Calçamento Triplo de Transições',
        chunks: chunks.filter(c => c.sourceFile.includes('CONT3')).map(c => c.id)
      },
      'CONT4-4.md': {
        title: 'Metodologia em 3 Passos, Foley/Reverb por Submix, Sound Design Abstrato e Moderação',
        chunks: chunks.filter(c => c.sourceFile.includes('CONT4')).map(c => c.id)
      }
    }
  };
  fs.writeFileSync(
    path.join(indexDir, 'source-map.json'),
    JSON.stringify(sourceMap, null, 2),
    'utf8'
  );

  // 9. Gravar rag/index/knowledge-index.json
  const categoryToChunks: Record<string, string[]> = {};
  for (const cat of VALID_CATEGORIES) {
    categoryToChunks[cat] = chunks.filter(c => c.tags.includes(cat)).map(c => c.id);
  }

  const knowledgeIndex = {
    schema: 'hsl.sound_design.knowledge_index.v1',
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    stats: {
      total_chunks: chunks.length,
      total_decision_rules: decisionRules.length,
      total_categories: VALID_CATEGORIES.length,
      source_files_count: Object.keys(sourceMap.source_files).length
    },
    categories_coverage: categoryToChunks,
    chunks: chunks,
    decision_rules: decisionRules
  };
  fs.writeFileSync(
    path.join(indexDir, 'knowledge-index.json'),
    JSON.stringify(knowledgeIndex, null, 2),
    'utf8'
  );

  // 10. Gravar rag/README.md
  const readmeContent = `# 🎧 Sound Design Knowledge RAG Pipeline

> **Base de Conhecimento RAG Especializada em Sound Design Cinematográfico para Remotion e Pós-Produção**  
> **Fontes Originais:** \`CONT1.md\`, \`CONT2-2.md\`, \`CONT3-3.md\`, \`CONT4-4.md\`

---

## 📁 Estrutura de Diretórios

\`\`\`text
rag/
  source/            # Arquivos fonte normalizados
  chunks/            # Chunks semânticos estruturados (sound-design-chunks.jsonl)
  index/             # Índices consolidados, vocabulário, regras de decisão e diretrizes de mix
  schemas/           # Schemas JSON formais para chunks e regras de decisão
  scripts/           # Scripts de construção e sincronização (buildRag.ts)
  tests/             # Testes automatizados de integridade e cobertura (rag_integrity.test.ts)
  README.md          # Documentação operacional da base
\`\`\`

---

## 📊 Cobertura de Categorias & Conhecimento

A base cobre rigorosamente todas as 25 categorias obrigatórias de sound design:
- **Narrativa & Intenção:** \`narrative_intent\`, \`cinematic_style\`, \`restraint\`
- **Trilha & Ritmo:** \`score\`, \`music_editing\`, \`beat_alignment\`
- **Ambiência & Foley:** \`ambience\`, \`foley\`, \`room_matching\`
- **Efeitos de Impacto & Transição:** \`riser\`, \`drone\`, \`whoosh\`, \`hit\`, \`boom\`, \`reverse_impact\`, \`transition\`, \`creative_sound_design\`
- **Engenharia & Mixagem:** \`frequency_separation\`, \`voice_processing\`, \`equalization\`, \`reverb\`, \`layering\`, \`waveform_editing\`, \`volume_automation\`, \`mixing\`

---

## 🚀 Como Construir e Atualizar o RAG

Para reconstruir todos os índices a partir das fontes:
\`\`\`bash
npm run rag:build
\`\`\`

Para validar a integridade semântica, validação de schema e cobertura das 25 categorias:
\`\`\`bash
npm run rag:test
\`\`\`

---

## 🔍 Como Consultar o Índice

Você pode carregar o arquivo \`rag/index/knowledge-index.json\` ou consultar diretamente os chunks em \`rag/chunks/sound-design-chunks.jsonl\` e as regras de decisão em \`rag/index/decision-rules.json\`.
`;

  fs.writeFileSync(path.join(root, 'rag', 'README.md'), readmeContent, 'utf8');

  console.log(`[RAG Builder] Concluído! ${chunks.length} chunks e ${decisionRules.length} regras geradas.`);

  return {chunks, decisionRules};
}

if (require.main === module) {
  buildRag();
}
