import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

export type HslThumbnailVariantType = 'A_FACE_EVIDENCE' | 'B_BEFORE_AFTER' | 'C_HERO_OBJECT';

export interface HslThumbnailSpec {
  readonly variantId: 'A' | 'B' | 'C';
  readonly variantType: HslThumbnailVariantType;
  readonly roleName: string;
  readonly headlineText: string;
  readonly focalSubject: string;
  readonly visualComposition: string;
  readonly lookDirection: string;
  readonly colorAccent: string;
  readonly imagePrompt: string;
  readonly outputImagePath: string;
}

export interface HslTitleSpec {
  readonly variantId: 'A' | 'B' | 'C';
  readonly role: 'SEARCH_INTENT' | 'CURIOSITY_GAP' | 'CONTRAST_PARADOX';
  readonly title: string;
  readonly strategicFormula: string;
  readonly targetAudienceTrigger: string;
}

export interface HslChapterTimestamp {
  readonly timestamp: string;
  readonly seconds: number;
  readonly searchIntentTitle: string;
}

export interface HslPublicationPackage {
  readonly episodeId: string;
  readonly episodeTitle: string;
  readonly strategicThesis: string;
  readonly primaryKeyword: string;
  readonly semanticVariations: readonly string[];
  readonly technicalEntities: readonly string[];
  readonly audienceSearchQueries: readonly string[];
  readonly youtubeTags: readonly string[];
  readonly titles: readonly HslTitleSpec[];
  readonly thumbnails: readonly HslThumbnailSpec[];
  readonly layeredDescription: {
    readonly hookLines: string;
    readonly detailedSummary: string;
    readonly chapters: readonly HslChapterTimestamp[];
    readonly sourcesAndCredits: readonly string[];
    readonly playlistAndNextVideo: string;
    readonly fullFormattedText: string;
  };
}

export interface EpisodePackagingInput {
  readonly episodeId: string;
  readonly mainTopic: string;
  readonly entity: string;
  readonly mechanism: string;
  readonly constraint: string;
  readonly consequence: string;
  readonly thesis: string;
  readonly chapters: readonly {readonly title: string; readonly durationSeconds: number}[];
}

export class ThumbnailSeoEngine {
  public static generatePackage(input: EpisodePackagingInput): HslPublicationPackage {
    const mainTopic = (input.mainTopic || (input as any).topic || '').toLowerCase();
    const entity = (input.entity || '').toLowerCase();
    const episodeId = (input.episodeId || '').toUpperCase();

    const isMegaShip = episodeId.includes('MEGASHIP') || episodeId.includes('SHIP') || episodeId.includes('SUEZ') || mainTopic.includes('megafrete') || mainTopic.includes('monstro') || mainTopic.includes('240.000') || mainTopic.includes('240,000') || mainTopic.includes('frear') || entity.includes('vessel') || entity.includes('container') || mainTopic.includes('navio');
    const isKessler = !isMegaShip && (episodeId.includes('KESSLER') || episodeId.includes('DEBRIS') || episodeId.includes('SPACE') || mainTopic.includes('space') || mainTopic.includes('kessler') || mainTopic.includes('paint') || mainTopic.includes('28,000') || mainTopic.includes('debris') || entity.includes('satellite') || entity.includes('debris') || entity.includes('orbit'));
    const isSubsea = !isMegaShip && (episodeId.includes('SUBSEA') || mainTopic.includes('ocean') || mainTopic.includes('subsea'));
    const isAiCooling = !isMegaShip && (episodeId.includes('AI_COOLING') || episodeId.includes('AI_DATACENTER_COOLING') || mainTopic.includes('datacenter') || mainTopic.includes('supercomputer') || entity.includes('chilled') || entity.includes('gpu') || entity.includes('datacenter'));
    const isSkyscraper = !isMegaShip && (episodeId.includes('SKYSCRAPER') || mainTopic.includes('skyscraper') || mainTopic.includes('tower') || mainTopic.includes('psi') || mainTopic.includes('hydraulic') || mainTopic.includes('megatall'));
    const isGrid = !isMegaShip && (episodeId.includes('GRID') || episodeId.includes('FREQUENCY') || mainTopic.includes('grid') || mainTopic.includes('hertz') || mainTopic.includes('hz') || mainTopic.includes('frequency') || mainTopic.includes('blackout') || mainTopic.includes('electricity') || mainTopic.includes('storage'));
    const isWallStreetLatency = !isMegaShip && (episodeId.includes('WALL_STREET') || episodeId.includes('LATENCY') || episodeId.includes('HFT') || mainTopic.includes('wall street') || mainTopic.includes('high-frequency trading') || mainTopic.includes('latency') || mainTopic.includes('millisecond') || mainTopic.includes('microwave'));

    // 1. GERAÇÃO DOS 3 TÍTULOS ESTRATÉGICOS (FÓRMULAS 1+1=3)
    const titles: HslTitleSpec[] = isMegaShip ? [
      {
        variantId: 'A',
        role: 'SEARCH_INTENT',
        title: `How a 240,000-Ton Container Ship Stops Before Crashing`,
        strategicFormula: '[Recognizable Entity] + [Specific Angle] + [Consequence / Scale]',
        targetAudienceTrigger: 'Busca direta & Engenheiros navais, entusiastas marítimos e logística global buscando entender a hidrodinâmica extrema de colossos de 400m.'
      },
      {
        variantId: 'B',
        role: 'CURIOSITY_GAP',
        title: `Why Megaships Need 5 Kilometers to Brake in Shallow Canals`,
        strategicFormula: '[Concrete Context] + [Contradiction] + [Implicit Question]',
        targetAudienceTrigger: 'Feed de recomendações: escala inercial brutal (5.200m / 14 minutos) com lacuna de curiosidade irresistível sobre o Efeito Bank.'
      },
      {
        variantId: 'C',
        role: 'CONTRAST_PARADOX',
        title: `The 8-Second Steering Error That Freezes 10% of Global Trade`,
        strategicFormula: 'The [Entity] that [Positive Impact] — and [Hidden Vulnerability]',
        targetAudienceTrigger: 'Fascínio e urgência sobre o colapso logístico global e a fragilidade dos canais da Terra.'
      }
    ] : isKessler ? [
      {
        variantId: 'A',
        role: 'SEARCH_INTENT',
        title: `How Space Debris Could Destroy Modern Satellites`,
        strategicFormula: '[Recognizable Entity] + [Specific Angle] + [Consequence / Scale]',
        targetAudienceTrigger: 'Busca direta & Engenheiros, entusiastas de astronomia e tecnologia orbital buscando entender o congestionamento da órbita LEO.'
      },
      {
        variantId: 'B',
        role: 'CURIOSITY_GAP',
        title: `Why a 1cm Paint Fleck Can Black Out Global GPS`,
        strategicFormula: '[Concrete Context] + [Contradiction] + [Implicit Question]',
        targetAudienceTrigger: 'Feed de recomendações: escala minúscula com consequência catastrófica global (lacuna de curiosidade).'
      },
      {
        variantId: 'C',
        role: 'CONTRAST_PARADOX',
        title: `The 72-Hour Chain Reaction That Traps Humanity on Earth`,
        strategicFormula: 'The [Entity] that [Positive Impact] — and [Hidden Vulnerability]',
        targetAudienceTrigger: 'Fascínio e urgência sobre o colapso irreversível da infraestrutura orbital moderna.'
      }
    ] : isWallStreetLatency ? [
      {
        variantId: 'A',
        role: 'SEARCH_INTENT',
        title: `How High-Frequency Trading Networks Beat Fiber Optic Speed`,
        strategicFormula: '[Search Term] + [Hidden Mechanism] + [Specific Technical Edge]',
        targetAudienceTrigger: 'Busca direta & publico interessado em HFT, baixa latencia, redes Chicago-New Jersey e micro-ondas financeiros.'
      },
      {
        variantId: 'B',
        role: 'CURIOSITY_GAP',
        title: `The 3-Millisecond Problem on Wall Street`,
        strategicFormula: '[Concrete Number] + [Famous Institution] + [Implicit Mystery]',
        targetAudienceTrigger: 'Feed de recomendacoes: um numero pequeno conectado a dinheiro gigantesco e infraestrutura secreta.'
      },
      {
        variantId: 'C',
        role: 'CONTRAST_PARADOX',
        title: `Why Wall Street Drilled Mountains to Save 3 Milliseconds`,
        strategicFormula: '[Absurd Physical Action] + [Tiny Time Gain] + [Financial Stakes]',
        targetAudienceTrigger: 'Paradoxo visual: obras de engenharia em montanhas para vencer uma fila invisivel de nanossegundos.'
      }
    ] : isGrid ? [
      {
        variantId: 'A',
        role: 'SEARCH_INTENT',
        title: `Why The Power Grid Cannot Store Electricity`,
        strategicFormula: '[Recognizable Entity] + [Specific Angle] + [Consequence / Scale]',
        targetAudienceTrigger: 'Busca direta & Engenheiros, técnicos e público interessado em infraestrutura elétrica continental.'
      },
      {
        variantId: 'B',
        role: 'CURIOSITY_GAP',
        title: `The 0.5 Hertz Problem That Causes Total Blackouts`,
        strategicFormula: '[Concrete Context] + [Contradiction] + [Implicit Question]',
        targetAudienceTrigger: 'Feed de recomendações: extrema urgência e tensão sobre o colapso em cascata da rede elétrica.'
      },
      {
        variantId: 'C',
        role: 'CONTRAST_PARADOX',
        title: `Why The Entire Electric Grid Has Zero Storage`,
        strategicFormula: 'The [Entity] that [Positive Impact] — and [Hidden Vulnerability]',
        targetAudienceTrigger: 'Fascínio e choque com o fato contraintuitivo de que a rede não possui baterias ou estoque.'
      }
    ] : isSkyscraper ? [
      {
        variantId: 'A',
        role: 'SEARCH_INTENT',
        title: `How Water Reaches The Top of Megatall Skyscrapers`,
        strategicFormula: '[Recognizable Entity] + [Specific Angle] + [Consequence / Scale]',
        targetAudienceTrigger: 'Busca direta & Engenheiros e entusiastas de arquitetura interessados na hidráulica de mega-arranha-céus.'
      },
      {
        variantId: 'B',
        role: 'CURIOSITY_GAP',
        title: `The 800 PSI Problem Inside Supertall Towers`,
        strategicFormula: '[Concrete Context] + [Contradiction] + [Implicit Question]',
        targetAudienceTrigger: 'Feed de recomendações: alta tensão mecânica com risco de ruptura por pressão hidrostática.'
      },
      {
        variantId: 'C',
        role: 'CONTRAST_PARADOX',
        title: `Why Megatall Skyscrapers Are Actually 5 Buildings in One`,
        strategicFormula: 'The [Entity] that [Positive Impact] — and [Hidden Vulnerability]',
        targetAudienceTrigger: 'Fascínio por infraestruturas de escala monumental e segredos da engenharia vertical.'
      }
    ] : isAiCooling ? [
      {
        variantId: 'A',
        role: 'SEARCH_INTENT',
        title: `How 45,000 Liters of Liquid Keep AI Clusters From Melting`,
        strategicFormula: '[Recognizable Entity] + [Specific Angle] + [Consequence / Scale]',
        targetAudienceTrigger: 'Busca direta & Engenheiros e entusiastas de hardware de IA buscando entender a termodinâmica de supercomputadores.'
      },
      {
        variantId: 'B',
        role: 'CURIOSITY_GAP',
        title: `Why Supercomputer Chips Vaporize If Cooling Stops for 180 Seconds`,
        strategicFormula: '[Concrete Context] + [Contradiction] + [Implicit Question]',
        targetAudienceTrigger: 'Feed de recomendações: alta urgência térmica com lacuna de curiosidade irresistível.'
      },
      {
        variantId: 'C',
        role: 'CONTRAST_PARADOX',
        title: `The Invisible Liquid Circuit Keeping 100,000 GPUs Alive`,
        strategicFormula: 'The [Entity] that [Positive Impact] — and [Hidden Vulnerability]',
        targetAudienceTrigger: 'Fascínio por infraestruturas extremas e centros de dados de inteligência artificial.'
      }
    ] : isSubsea ? [
      {
        variantId: 'A',
        role: 'SEARCH_INTENT',
        title: `How Subsea Fiber Optic Cables Carry 99% of the Global Internet`,
        strategicFormula: '[Recognizable Entity] + [Specific Angle] + [Consequence / Why]',
        targetAudienceTrigger: 'Busca direta & Usuários interessados em entender a infraestrutura física da web.'
      },
      {
        variantId: 'B',
        role: 'CURIOSITY_GAP',
        title: `Why One Broken Wire at the Bottom of the Ocean Can Cut Off Entire Countries`,
        strategicFormula: '[Concrete Context] + [Contradiction] + [Implicit Question]',
        targetAudienceTrigger: 'Página inicial & Feed de recomendações: lacuna de curiosidade com alta tensão.'
      },
      {
        variantId: 'C',
        role: 'CONTRAST_PARADOX',
        title: `The 17-Millimeter Glass Line That Keeps Global Civilization Online`,
        strategicFormula: 'The [Entity] that [Positive Impact] — and [Hidden Vulnerability]',
        targetAudienceTrigger: 'Curiosidade investigativa e fascínio por engenharia extrema.'
      }
    ] : [
      {
        variantId: 'A',
        role: 'SEARCH_INTENT',
        title: `How Airport Underground Fuel Grids Keep 100,000 Flights in the Air`,
        strategicFormula: '[Recognizable Entity] + [Specific Angle] + [Consequence / Scale]',
        targetAudienceTrigger: 'Busca direta & Usuários interessados em entender a engenharia oculta dos aeroportos.'
      },
      {
        variantId: 'B',
        role: 'CURIOSITY_GAP',
        title: `Why Modern Airports Cannot Run Out of Fuel`,
        strategicFormula: '[Concrete Context] + [Contradiction] + [Implicit Question]',
        targetAudienceTrigger: 'Página inicial & Feed de recomendações: lacuna de curiosidade com alta tensão.'
      },
      {
        variantId: 'C',
        role: 'CONTRAST_PARADOX',
        title: `The Invisible 150 PSI Pipe That Keeps Global Aviation Alive`,
        strategicFormula: 'The [Entity] that [Positive Impact] — and [Hidden Vulnerability]',
        targetAudienceTrigger: 'Curiosidade investigativa e fascínio por infraestruturas extremas.'
      }
    ];

    // 2. GERAÇÃO DAS 3 THUMBNAILS MULTIVARIÁVEIS (TESTE A/B/C)
    const thumbnails: HslThumbnailSpec[] = isMegaShip ? [
      {
        variantId: 'A',
        variantType: 'A_FACE_EVIDENCE',
        roleName: 'Prático do Canal de Suez + Alerta de Distância 5 KM',
        headlineText: '5 KM TO BRAKE?',
        focalSubject: 'Prático do canal no passadiço sob tensão extrema observando radar de aproximação e margem de areia a 60m',
        visualComposition: 'Rosto ocupando 40% do quadro à esquerda com olhar guiado para o vetor de proa e sandbank em Acid Yellow.',
        lookDirection: 'Olhar guiado para a curva inercial de frenagem (#FFE500)',
        colorAccent: '#FFE500',
        imagePrompt: 'Cinematic 35mm documentary portrait, focused Suez maritime pilot on container ship bridge looking with intense tension at canal bank radar markers, dramatic chiaroscuro lighting, obsidian matte background, 8k.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_A_face.png`
      },
      {
        variantId: 'B',
        roleName: 'Transformação Antes/Depois (Contraste Causal)',
        variantType: 'B_BEFORE_AFTER',
        headlineText: '1.2M CLEARANCE',
        focalSubject: 'Split screen: Colosso de 240.000t navegando em canal vs. Visão sonar subaquática com folga de 1.2m sugada pelo Efeito Bank',
        visualComposition: 'Divisão diagonal nítida com feixe laser brilhante em Laranja Hiper.',
        lookDirection: 'Contraste direto esquerda / direita',
        colorAccent: '#FF2E00',
        imagePrompt: 'Split composition documentary image, left side showing massive 400m container ship towering over narrow desert canal fairway, right side showing underwater sonar view with razor-thin 1.2m keel clearance being sucked by Bernoulli bank forces, high contrast.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_B_split.png`
      },
      {
        variantId: 'C',
        roleName: 'Objeto Protagonista / Hélice e Sucção de Margem',
        variantType: 'C_HERO_OBJECT',
        headlineText: 'BANK SUCTION',
        focalSubject: 'Corte transversal 3D de canal mostrando navio de 400m travado a 60° com retícula na sucção hidrodinâmica de popa',
        visualComposition: 'Macro industrial monumental de canal estreito com telemetria monoespaçada 240,000 TONS // 8-SECOND LOCK.',
        lookDirection: 'Foco central direto no vetor de sucção assimétrica',
        colorAccent: '#FF2E00',
        imagePrompt: 'High tech macro industrial 3D cutaway of a 400m container megaship wedged across a narrow canal, glowing orange telemetry reticle locked on the Bernoulli stern suction vortex, dark matte obsidian background, 8k engineering photograph.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_C_object.png`
      }
    ] : isKessler ? [
      {
        variantId: 'A',
        variantType: 'A_FACE_EVIDENCE',
        roleName: 'Engenheiro de Dinâmica Orbital + Alerta de Colisão Hipersônica',
        headlineText: '28,000 KM/H',
        focalSubject: 'Engenheiro de satélites em sala de controle sob tensão observando trajetória de fragmento de 1cm em rota de colisão',
        visualComposition: 'Rosto ocupando 40% do quadro à esquerda com olhar guiado para o display de órbita 550 km à direita com Acid Yellow.',
        lookDirection: 'Olhar guiado para o alerta de colisão orbital (#FFE500)',
        colorAccent: '#FFE500',
        imagePrompt: 'Cinematic 35mm documentary portrait, focused aerospace flight dynamics officer in space operations control room looking with intense scrutiny at an orbital collision conjunction warning, dramatic lighting, obsidian matte background, 8k.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_A_face.png`
      },
      {
        variantId: 'B',
        variantType: 'B_BEFORE_AFTER',
        roleName: 'Transformação Antes/Depois (Contraste Causal)',
        headlineText: 'CASCADE COLLAPSE',
        focalSubject: 'Split screen: Constelação de satélites em órbita perfeita azul vs. Nuvem densa de estilhaços incandescentes destruindo satélites',
        visualComposition: 'Divisão diagonal nítida com feixe laser brilhante em Laranja Hiper.',
        lookDirection: 'Contraste direto esquerda / direita',
        colorAccent: '#FF2E00',
        imagePrompt: 'Split composition documentary image, left side showing glowing serene blue orbital satellite constellation over Earth horizon, right side showing catastrophic cloud of supersonic space debris shattering satellites into fiery shrapnel, high contrast.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_B_split.png`
      },
      {
        variantId: 'C',
        roleName: 'Objeto Protagonista / Escudo Whipple Perfurado',
        variantType: 'C_HERO_OBJECT',
        headlineText: 'ONE SHIELD',
        focalSubject: 'Macro de escudo Whipple com blindagem de sacrifício vaporizada e retícula de telemetria travada na cratera de 11.3 km/s',
        visualComposition: 'Macro industrial monumental de blindagem aeroespacial com telemetria monoespaçada 11.3 KM/S // 50 KILOJOULES.',
        lookDirection: 'Foco central direto no elemento de dissipação de impacto',
        colorAccent: '#FFE500',
        imagePrompt: 'High tech macro industrial cutaway of a perforated spacecraft Whipple shield bumper, glowing orange telemetry reticle locked on the hypervelocity impact crater, dark matte obsidian background, 8k engineering photograph.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_C_object.png`
      }
    ] : isWallStreetLatency ? [
      {
        variantId: 'A',
        variantType: 'A_FACE_EVIDENCE',
        roleName: 'Trader quantitativo + fila de matching engine',
        headlineText: '3 MS',
        focalSubject: 'Engenheiro de baixa latencia olhando para uma fila de pacotes com timestamp em nanosegundos',
        visualComposition: 'Rosto tecnico em tensao no terco esquerdo com evidencia de rota Chicago-New Jersey no lado direito.',
        lookDirection: 'Olhar guiado para o timestamp vencedor em Acid Yellow',
        colorAccent: '#FFE500',
        imagePrompt: 'Cinematic 35mm documentary portrait, focused low-latency network engineer in exchange colocation room looking at a nanosecond order queue and Chicago-New Jersey route map, obsidian matte lighting, acid yellow telemetry, 8k.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_A_face.png`
      },
      {
        variantId: 'B',
        variantType: 'B_BEFORE_AFTER',
        roleName: 'Fibra contra ar livre',
        headlineText: 'AIR WINS',
        focalSubject: 'Split screen: fibra optica enterrada mais lenta versus torre de micro-ondas em linha reta',
        visualComposition: 'Divisao diagonal com vidro azul a esquerda e feixe de micro-ondas amarelo a direita.',
        lookDirection: 'Contraste direto fibra / radio',
        colorAccent: '#FF2E00',
        imagePrompt: 'Split composition documentary image, left side buried fiber optic cable glowing blue through mountain trench, right side microwave tower firing acid yellow beam through clear air toward Wall Street skyline, high contrast, cinematic engineering photo.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_B_split.png`
      },
      {
        variantId: 'C',
        variantType: 'C_HERO_OBJECT',
        roleName: 'Objeto heroico / torre de micro-ondas',
        headlineText: '3 MILLISECONDS',
        focalSubject: 'Torre de micro-ondas militar na nevoa com feixe laser brilhante em Acid Yellow apontado para a camera',
        visualComposition: 'Objeto monumental centralizado, reticula circular no prato, fundo Obsidian e telemetria de latencia.',
        lookDirection: 'Foco central direto no feixe de radio em linha reta',
        colorAccent: '#FFE500',
        imagePrompt: 'Heroic military-grade microwave relay tower in fog, bright acid yellow laser-like beam pointed directly at camera, dark obsidian sky, precise latency HUD reticle, cinematic 35mm engineering documentary, 8k.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_C_object.png`
      }
    ] : isGrid ? [
      {
        variantId: 'A',
        variantType: 'A_FACE_EVIDENCE',
        roleName: 'Despachante da Rede + Alerta de Frequência 59.42 Hz',
        headlineText: '59.42 HZ',
        focalSubject: 'Despachante em sala de controle sob tensão observando frequencímetro caindo com gráficos em Acid Yellow',
        visualComposition: 'Rosto ocupando 40% do quadro à esquerda com olhar guiado para o display de subfrequência à direita.',
        lookDirection: 'Olhar guiado para o indicador de subfrequência (#FF2E00)',
        colorAccent: '#FFE500',
        imagePrompt: 'Cinematic 35mm documentary portrait, focused power grid dispatcher in continental control room looking with serious urgency at a digital frequency waveform dropping to 59.42 Hz, dramatic lighting, obsidian matte background, 8k.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_A_face.png`
      },
      {
        variantId: 'B',
        variantType: 'B_BEFORE_AFTER',
        roleName: 'Transformação Antes/Depois (Contraste Causal)',
        headlineText: 'GRID COLLAPSE',
        focalSubject: 'Split screen: Onda senoidal verde síncrona 60.00 Hz vs. Metrópole em blackout total no escuro com céu estrelado',
        visualComposition: 'Divisão diagonal nítida com linha luminosa em Laranja Hiper.',
        lookDirection: 'Contraste direto esquerda / direita',
        colorAccent: '#FF2E00',
        imagePrompt: 'Split composition documentary image, left side showing glowing 60.00 Hz electrical grid over illuminated city, right side showing sudden massive blackout engulfing metropolis in total pitch black darkness, high contrast.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_B_split.png`
      },
      {
        variantId: 'C',
        variantType: 'C_HERO_OBJECT',
        roleName: 'Objeto Protagonista / Rotor de Turbina Síncrona (3.600 RPM)',
        headlineText: 'ONE ROTOR',
        focalSubject: 'Macro industrial de rotor maciço de turbina a vapor de 3.600 RPM com retícula travada nas pás de titânio',
        visualComposition: 'Objeto monumental centralizado com fundo Obsidian escuro e telemetria monoespaçada 3,600 RPM // 60.00 HZ.',
        lookDirection: 'Foco central direto no elemento de inércia mecânica',
        colorAccent: '#FF2E00',
        imagePrompt: 'High tech macro industrial cutaway of massive 3600 RPM steam turbine rotor and generator shaft, glowing orange telemetry reticle locked on titanium low-pressure blades, dark matte obsidian background, 8k engineering photograph.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_C_object.png`
      }
    ] : isSkyscraper ? [
      {
        variantId: 'A',
        variantType: 'A_FACE_EVIDENCE',
        roleName: 'Engenheiro Hidráulico + Alerta de 800 PSI',
        headlineText: '800 PSI',
        focalSubject: 'Engenheiro inspecionando corte isométrico de válvula de alívio com gráficos de pressão em Acid Yellow',
        visualComposition: 'Rosto ocupando 40% do quadro à esquerda com olhar guiado para o duto sob 50 Bar à direita.',
        lookDirection: 'Olhar guiado para o indicador de pressão hidrostática (#FF2E00)',
        colorAccent: '#FFE500',
        imagePrompt: 'Cinematic 35mm documentary portrait, focused mechanical engineer in skyscraper mechanical plant looking with intense scrutiny at a high-pressure 800 PSI water distribution riser, dramatic lighting, obsidian matte background, 8k.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_A_face.png`
      },
      {
        variantId: 'B',
        variantType: 'B_BEFORE_AFTER',
        roleName: 'Transformação Antes/Depois (Contraste Causal)',
        headlineText: '50 BAR BURST',
        focalSubject: 'Split screen: Fluxo hidráulico controlado em Klein Blue vs. Ruptura de tubulação no térreo sob 800 PSI',
        visualComposition: 'Divisão diagonal nítida com linha luminosa em Laranja Hiper.',
        lookDirection: 'Contraste direto esquerda / direita',
        colorAccent: '#FF2E00',
        imagePrompt: 'Split composition documentary image, left side showing glowing serene blue water flow inside high-rise riser, right side showing violent high pressure water jet rupturing pipe flange inside dark elevator shaft, high contrast.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_B_split.png`
      },
      {
        variantId: 'C',
        variantType: 'C_HERO_OBJECT',
        roleName: 'Objeto Protagonista / Válvula Redutora de Pressão (PRV)',
        headlineText: 'ONE VALVE',
        focalSubject: 'Macro industrial de Válvula Redutora de Pressão (PRV) com retícula travada no diafragma sob 50 Bar',
        visualComposition: 'Objeto monumental centralizado com fundo Obsidian escuro e telemetria monoespaçada 50 BAR // 800 PSI.',
        lookDirection: 'Foco central direto no elemento de alívio hidrostático',
        colorAccent: '#FF2E00',
        imagePrompt: 'High tech macro industrial cutaway of massive bronze Pressure Reducing Valve (PRV) inside supertall skyscraper, glowing orange telemetry reticle locked on the heavy spring mechanism, dark matte obsidian background, 8k engineering photograph.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_C_object.png`
      }
    ] : isAiCooling ? [
      {
        variantId: 'A',
        variantType: 'A_FACE_EVIDENCE',
        roleName: 'Engenheiro de Infraestrutura + Alerta Térmico',
        headlineText: 'NO LIQUID?',
        focalSubject: 'Engenheiro em data center inspecionando vazamento de líquido refrigerante com luz estroboscópica',
        visualComposition: 'Rosto ocupando 40% do quadro à esquerda com olhar guiado para a tubulação de cobre superaquecida.',
        lookDirection: 'Olhar guiado para a placa de resfriamento térmico (#FFE500)',
        colorAccent: '#FFE500',
        imagePrompt: 'Cinematic 35mm documentary portrait, focused data center cooling engineer looking with serious suspicion toward illuminated liquid cold plate tubes, dramatic lighting, obsidian matte background, 8k.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_A_face.png`
      },
      {
        variantId: 'B',
        variantType: 'B_BEFORE_AFTER',
        roleName: 'Transformação Antes/Depois (Contraste Causal)',
        headlineText: '105°C MELTDOWN',
        focalSubject: 'Split screen: Supercomputador azul brilhante (45.000 L/min) vs. Cluster desligado por thermal trip vermelho',
        visualComposition: 'Divisão diagonal nítida com feixe laser brilhante em Laranja Hiper.',
        lookDirection: 'Contraste direto esquerda / direita',
        colorAccent: '#FF2E00',
        imagePrompt: 'Split composition documentary image, left side showing glowing cool blue liquid-cooled AI GPU server racks, right side showing smoking overheating server racks flashing critical red thermal warnings, high contrast.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_B_split.png`
      },
      {
        variantId: 'C',
        roleName: 'Objeto Protagonista / Gargalo de Micro-Canais',
        variantType: 'C_HERO_OBJECT',
        headlineText: 'ONE VALVE',
        focalSubject: 'Retícula circular de alta precisão focando o micro-canal de cobre de 0.2mm bloqueado',
        visualComposition: 'Macro industrial monumental de cold plate com telemetria monoespaçada 1.2 GIGAWATTS // 105°C.',
        lookDirection: 'Foco central direto no elemento de constrição térmica',
        colorAccent: '#FF2E00',
        imagePrompt: 'High tech macro industrial cutaway of a 0.2mm direct-to-chip copper liquid cold plate, glowing orange telemetry reticle locked on the coolant channel, dark matte obsidian background, 8k engineering photograph.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_C_object.png`
      }
    ] : isSubsea ? [
      {
        variantId: 'A',
        variantType: 'A_FACE_EVIDENCE',
        roleName: 'Investigador / Engenheiro + Ruptura de Fibra',
        headlineText: 'THE SEVER',
        focalSubject: 'Engenheiro em sala limpa examinando cabo de fibra óptica partido a 4.000m',
        visualComposition: 'Rosto ocupando 40% do quadro à esquerda com olhos no terço superior, olhando para a fibra partida à direita.',
        lookDirection: 'Olhar guiado para o ponto crítico de ruptura (Laranja Hiper)',
        colorAccent: '#FFE500', // Acid Yellow
        imagePrompt: 'Cinematic 35mm documentary portrait, focused subsea telecommunications engineer in ship cleanroom holding a severed 17mm subsea fiber optic cable core, high contrast lighting, dark obsidian background, dramatic rim light, 8k documentary style.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_A_face.png`
      },
      {
        variantId: 'B',
        variantType: 'B_BEFORE_AFTER',
        roleName: 'Transformação Antes/Depois (Contraste Causal)',
        headlineText: 'INTERNET COLLAPSE',
        focalSubject: 'Split screen: Malha global brilhante de petabits vs. Fundo oceânico escuro com rota BGP saturada',
        visualComposition: 'Divisão diagonal nítida com linha divisória brilhante em Laranja Hiper.',
        lookDirection: 'Contraste direto esquerda / direita',
        colorAccent: '#FF2E00', // Hyper Orange
        imagePrompt: 'Split composition documentary image, left side showing glowing transatlantic fiber optic pulses connecting continents at night, right side showing dark abyss with snapped underwater cable throwing red warning telemetry, high contrast.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_B_split.png`
      },
      {
        variantId: 'C',
        variantType: 'C_HERO_OBJECT',
        roleName: 'Objeto Protagonista / Repetidor de 10.000V',
        headlineText: '10,000 VOLTS',
        focalSubject: 'Corte transversal de precisão do cabo submarino de 17mm com retícula no tubo de cobre',
        visualComposition: 'Objeto monumental centralizado com fundo Obsidian escuro e telemetria monoespaçada 10,000V DC FEED.',
        lookDirection: 'Foco central direto no elemento de alta voltagem',
        colorAccent: '#FF2E00', // Hyper Orange
        imagePrompt: 'High tech industrial cutaway of a 17mm deep sea armored subsea fiber optic cable showing copper power tube, steel strength members and glowing glass fiber strands, glowing orange telemetry reticle, dark matte obsidian background, 8k macro photograph.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_C_object.png`
      }
    ] : [
      {
        variantId: 'A',
        variantType: 'A_FACE_EVIDENCE',
        roleName: 'Investigador / Sujeito + Prova Concreta',
        headlineText: 'NO FUEL?',
        focalSubject: 'Investigador / Operador olhando com espanto para o fluxograma de pressão',
        visualComposition: 'Rosto ocupando 40% do quadro à esquerda com olhos no terço superior, olhando para o diagrama à direita.',
        lookDirection: 'Olhar guiado para o ponto crítico de abastecimento (Laranja Hiper)',
        colorAccent: '#FFE500', // Acid Yellow
        imagePrompt: 'Cinematic 35mm documentary portrait, focused aviation engineer looking with serious suspicion toward an illuminated airport pipeline schematic, high contrast lighting, dark obsidian background, dramatic rim light, 8k documentary style.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_A_face.png`
      },
      {
        variantId: 'B',
        variantType: 'B_BEFORE_AFTER',
        roleName: 'Transformação Antes/Depois (Contraste Causal)',
        headlineText: 'BEFORE TAKEOFF',
        focalSubject: 'Split screen: Pista movimentada em operação vs. Pista congelada com aviões parados',
        visualComposition: 'Divisão diagonal nítida com linha divisória brilhante em Laranja Hiper.',
        lookDirection: 'Contraste direto esquerda / direita',
        colorAccent: '#FF2E00', // Hyper Orange
        imagePrompt: 'Split composition documentary image, left side showing bustling glowing airport runway at dawn, right side showing dark deserted tarmac with grounded planes and warning signals, high contrast, cinematic depth of field.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_B_split.png`
      },
      {
        variantId: 'C',
        roleName: 'Objeto Protagonista / Gargalo de Sistema',
        variantType: 'C_HERO_OBJECT',
        headlineText: 'ONE FAILURE',
        focalSubject: 'Retícula circular de alta precisão focando o duto subterrâneo de hidrante',
        visualComposition: 'Objeto monumental centralizado com fundo Obsidian escuro e telemetria monoespaçada 150 PSI.',
        lookDirection: 'Foco central direto no elemento de constrição',
        colorAccent: '#FF2E00', // Hyper Orange
        imagePrompt: 'High tech industrial cutaway of massive aviation jet fuel hydrant manifold, glowing orange telemetry reticle locked on the pressure valve, dark matte obsidian background, volumetric atmospheric haze, 8k macro engineering photograph.',
        outputImagePath: `runs/${input.episodeId}/thumbnails/thumbnail_variant_C_object.png`
      }
    ];

    // 3. CAPÍTULOS COM INTENÇÃO DE BUSCA E TIMESTAMPS
    let accumulatedSeconds = 0;
    const chapters: HslChapterTimestamp[] = input.chapters.map((ch) => {
      const minutes = Math.floor(accumulatedSeconds / 60);
      const seconds = accumulatedSeconds % 60;
      const timestamp = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      accumulatedSeconds += ch.durationSeconds;

      return {
        timestamp,
        seconds: accumulatedSeconds - ch.durationSeconds,
        searchIntentTitle: ch.title
      };
    });

    // 4. MAPA SEMÂNTICO E TAGS
    const primaryKeyword = isMegaShip
      ? 'megaship hydrodynamics suez canal container ship'
      : isWallStreetLatency
      ? 'high frequency trading low latency microwave network'
      : isGrid
      ? 'power grid frequency 60hz blackout'
      : isSkyscraper
      ? 'skyscraper water pressure plumbing'
      : isAiCooling
      ? 'ai supercomputer liquid cooling'
      : isSubsea
      ? 'subsea fiber optic cable'
      : 'airport fuel logistics';

    const semanticVariations = isMegaShip ? [
      'how 240000 ton container ships brake',
      'suez canal bank effect suction explained',
      'squat effect under keel clearance shallow water',
      'why megaships get stuck in narrow canals'
    ] : isWallStreetLatency ? [
      'why wall street drilled mountains for fiber',
      'chicago new york high frequency trading latency',
      'microwave trading networks beat fiber optic cables',
      'how latency arbitrage works in milliseconds'
    ] : isGrid ? [
      'why power grid has zero energy storage',
      'the 0.5 hertz problem grid collapse',
      'how electrical grid frequency is controlled',
      'what happens during a continental blackout'
    ] : isSkyscraper ? [
      'how water gets to the top of skyscrapers',
      'supertall tower 800 psi water pressure',
      'skyscraper pressure reducing valves break tanks',
      'burj khalifa plumbing system engineering'
    ] : isAiCooling ? [
      'how direct to chip liquid cooling works',
      'gpu thermal throttling 105c limit',
      'ai data center power and water consumption',
      '1.2 gigawatt cooling plant thermodynamics'
    ] : isSubsea ? [
      'how the physical internet works',
      'undersea fiber optic cable map',
      'undersea cable cut internet disruption',
      'subsea repeater 10000 volts'
    ] : [
      'how planes get fuel',
      'aviation supply chain',
      'airport turnaround delay causes',
      'underground jet fuel pipeline network'
    ];

    const technicalEntities = isMegaShip ? [
      'Ultra Large Container Vessel (24,000 TEU / 240,000t Displacement)',
      '11-Cylinder Two-Stroke Marine Diesel Engine (100,000 Brake HP)',
      '10-Meter Bronze Fixed-Pitch Propeller Cavitation Vortices',
      'Bernoulli Asymmetric Hydrodynamic Bank Suction and Bow Cushion',
      '1.2m Under-Keel Clearance (UKC) Dynamic Squat Sinkage'
    ] : isWallStreetLatency ? [
      'Spread Networks Chicago-New Jersey Dark Fiber Route',
      'Exchange Matching Engine Price-Time Priority Queue',
      'Microwave Relay Line-of-Sight and Fresnel Zone Clearance',
      'Refractive Index of Optical Fiber vs Air Propagation',
      'Latency Arbitrage Across Futures, Equities and FX Venues'
    ] : isGrid ? [
      'Synchronous Rotational Kinetic Inertia (3,600 RPM Rotors)',
      'Rate of Change of Frequency (RoCoF in Hz/s)',
      'Under-Frequency Load Shedding (UFLS 100ms Relays)',
      'Turbine Low-Pressure Blade Harmonic Resonance (59.5 Hz Trip)',
      'Transformer Magnetic Core Over-fluxing (V/Hz Exceeded)'
    ] : isSkyscraper ? [
      'Hydrostatic Head Pressure (1 Bar / 10m // 50 Bar Base)',
      'Cascaded Gravity-Fed Transfer Break Tanks (Atmospheric Reset)',
      'Staged High-Voltage Multistage Centrifugal Booster Pumps',
      'Direct-Acting & Pilot-Operated Pressure Reducing Valves (PRV)',
      'Hydraulic Transient Shockwaves (Water Hammer Suppression)'
    ] : isAiCooling ? [
      'Direct-to-Chip Micro-Channel Cold Plates (0.2mm)',
      'Dielectric Coolant Recirculation (45,000 L/min)',
      'Thermal Throttling Trip Point (105°C Silicon Vaporization)',
      'Closed-Loop Chilled Water Plant (1.2 Gigawatts)',
      'Cavitation & Micro-Particulate Filtration Threshold'
    ] : isSubsea ? [
      'Dense Wavelength Division Multiplexing (DWDM)',
      'Subsea Optical Repeaters (EDFA)',
      'BGP Autonomous System Routing',
      'Power Feed Equipment (PFE 10,000V)',
      'Armored Ocean Grapnel Splicing'
    ] : [
      'Jet A-1 Fuel',
      'Hydrant Manifold Pressure',
      'Turnaround Time Logistics',
      'Fuel Farm Reserve Headroom',
      'Aircraft Apron Fuelling'
    ];

    const audienceSearchQueries = isMegaShip ? [
      'how do giant container ships stop',
      'what is the bank effect in ship navigation',
      'why did ever given get stuck in suez canal',
      'how much horsepower does a container ship have'
    ] : isWallStreetLatency ? [
      'how high frequency trading networks work',
      'why microwave is faster than fiber for trading',
      'what is latency arbitrage',
      'why wall street paid for straight fiber routes'
    ] : isGrid ? [
      'how is power grid frequency controlled',
      'why does the electrical grid have no storage',
      'what causes massive regional blackouts'
    ] : isSkyscraper ? [
      'how does water reach top floor of burj khalifa',
      'what happens if a pipe bursts in a skyscraper',
      'inside skyscraper mechanical plant floor plumbing'
    ] : isAiCooling ? [
      'how are ai supercomputers cooled',
      'what happens when gpu cooling fails',
      'inside 1 gigawatt ai data center cooling'
    ] : isSubsea ? [
      'how does the internet cross the ocean',
      'what happens when a subsea cable breaks',
      'how are deep sea cables repaired'
    ] : [
      'how does fuel reach airplanes at airport',
      'why are flights delayed for fueling',
      'inside airport underground fuel system'
    ];

    const youtubeTags = isMegaShip ? [
      'hidden systems lab',
      'megaship hydrodynamics',
      'how container ships brake',
      'suez canal blockage',
      'ever given physics',
      'bank effect suction',
      'squat effect keel clearance',
      '100000 hp marine engine',
      'maritime engineering documentary',
      'global supply chain logistics'
    ] : isWallStreetLatency ? [
      'hidden systems lab',
      'high frequency trading',
      'hft latency',
      'wall street speed war',
      'microwave trading network',
      'spread networks',
      'latency arbitrage',
      'fiber optic trading',
      'market microstructure',
      'engineering documentary'
    ] : isGrid ? [
      'hidden systems lab',
      'power grid frequency',
      '60 hz electrical grid',
      'why grid has no storage',
      'blackout engineering',
      'under frequency load shedding',
      'power plant steam turbine',
      'electrical engineering documentary',
      'how power grid works',
      'energy storage problem'
    ] : isSkyscraper ? [
      'hidden systems lab',
      'skyscraper water pressure',
      'burj khalifa plumbing',
      'supertall building engineering',
      'hydrostatic pressure',
      'pressure reducing valve',
      'vertical city infrastructure',
      'break tank plumbing',
      'mechanical engineering documentary',
      'how skyscrapers work'
    ] : isAiCooling ? [
      'hidden systems lab',
      'ai supercomputer liquid cooling',
      'direct to chip cooling',
      'gpu thermal meltdown',
      '1 gigawatt data center',
      'nvidia h100 liquid cooling',
      'thermodynamics of ai',
      'microchannel cold plate',
      'data center engineering',
      'artificial intelligence infrastructure'
    ] : isSubsea ? [
      'hidden systems lab',
      'subsea fiber optic cable',
      'undersea cable map',
      'physical internet',
      'fiber optic repeaters',
      'how internet works underwater',
      'bgp route deflection',
      'telecommunications documentary',
      'deep sea engineering',
      'global data infrastructure'
    ] : [
      'hidden systems lab',
      'airport fuel logistics',
      'how planes refuel',
      'aviation engineering',
      'logistics throughput',
      'turnaround delay',
      'jet fuel pipeline',
      'airport pressure test',
      'supply chain bottleneck',
      'commercial aviation documentary'
    ];

    // 5. DESCRIÇÃO EM CAMADAS (LAYERED DESCRIPTION)
    const hookLines = isMegaShip
      ? `This documentary investigates why a 240,000-ton container ship needs 5.2 kilometers to come to a complete halt. Learn how 80% of global trade depends on maritime pilots navigating 400-meter giants through razor-thin canals where 1.2 meters of under-keel clearance can trigger the catastrophic Bernoulli Bank Effect.`
      : isWallStreetLatency
      ? `This documentary investigates why Wall Street spent hundreds of millions of dollars cutting straighter routes through mountains, then replaced parts of the race with microwave towers, all to win milliseconds and nanoseconds inside exchange queues.`
      : isGrid
      ? `This documentary investigates why the entire continental power grid operates with zero seconds of stored electricity. Learn how millions of tons of synchronized spinning turbines balance supply and demand on a razor-thin 0.5 Hertz tightrope.`
      : isSkyscraper
      ? `This documentary investigates why supertall skyscrapers are physically impossible without segmented hydraulic engineering. Learn how 500-meter towers conquer 800 PSI of hydrostatic pressure by operating as five independent vertical cities stacked in the sky.`
      : isAiCooling
      ? `This documentary investigates why the global AI race is actually an extreme thermodynamic war. Learn how 45,000 liters of dielectric liquid keep 100,000 GPUs from vaporizing under 1.2 gigawatts of thermal load.`
      : isSubsea
      ? `This documentary investigates how ninety-nine percent of intercontinental internet traffic travels through 17-millimeter glass strands on the deep ocean floor. Learn why the global "cloud" is actually a vulnerable, high-voltage underwater machine.`
      : `This documentary investigates how invisible fuel pipelines determine modern flight schedules. Learn why passenger aviation does not simply buy fuel—it relies on an extreme, synchronized logistics network.`;

    const detailedSummary = isMegaShip
      ? `A 400-meter Ultra Large Container Vessel (ULCV) displaces a quarter of a million tons and packs over 8 billion Joules of raw kinetic energy. Powered by a 100,000-horsepower turbocharged diesel engine and swinging a 10-meter bronze propeller, these colossal vessels carry 24,000 containers across the open oceans with virtually zero rolling friction.\n\nYet when entering constrained fairways like the Suez Canal, fluid dynamics cease to be linear. Under Bernoulli's principle, water accelerated between the hull and shallow sandbanks creates a massive hydrostatic pressure drop. Known as the Bank Effect, this invisible low-pressure vacuum pulls the stern violently toward the shallow bank while pushing the bow across the fairway. Simultaneously, the Squat Effect dynamically sucks the hull downward, reducing under-keel clearance from 1.2 meters to mere centimeters.\n\nIn this episode of Hidden Systems Lab, we explore the violent hydrodynamics, 2-stroke diesel propulsion physics, and high-tension salvage mechanics that keep global maritime supply chains from suffering fatal kinetic thrombosis.`
      : isWallStreetLatency
      ? `In 2010, Spread Networks turned geography into a financial weapon: an ultra-low-latency route between Chicago and New Jersey that reportedly shaved roughly 100 miles and 3 milliseconds from older paths. The underlying business was not stock picking. It was arrival priority inside continuous electronic markets.\n\nThis episode breaks down the physical stack beneath high-frequency trading: colocation cages, cross-connects, matching engines, refractive index, microwave relay towers, rain fade, time synchronization and queue position. Fiber is reliable, but light moves slower through glass than electromagnetic waves move through air, pushing firms toward fragile line-of-sight radio networks.\n\nIn this episode of Hidden Systems Lab, we show why modern finance is not only a price system. At the frontier, it is a planetary timing system where a mountain, a storm, or a rack cable can decide who reaches the queue first.`
      : isGrid
      ? `Every single watt of electricity consumed across North America is generated at the exact same millisecond it is used. The modern electric grid has zero storage—it is not a static pipeline of energy, but a live, continent-wide standing electromagnetic wave locked at 60.000 Hz.\n\nWhen electrical demand exceeds generation by even a fraction of a percent, the imbalance extracts rotational kinetic energy directly from massive multi-ton turbine shafts, physically slowing them down. If the frequency drops past the 59.50 Hz boundary, harmonic resonance causes titanium turbine blades to crack and transformers to overheat, triggering automated self-preservation trips that can plunge 50 million people into total darkness in less than 60 seconds.\n\nIn this episode of Hidden Systems Lab, we explore the swing equation, rotational inertia physics, and high-speed automated load-shedding defenses that keep modern civilization powered.`
      : isSkyscraper
      ? `Every time someone opens a faucet on the 163rd floor of a 500-meter tower, they are triggering an everyday action that defies extreme physics. If a continuous water pipe connected the top penthouse to the ground, the cumulative weight of the water column would generate 50 Bar (800 PSI) at the base—enough concentrated hydrostatic force to rupture concrete walls and slice through ductile iron pipes.\n\nTo prevent catastrophic building-wide flooding, skyscrapers are engineered not as single structures, but as five independent hydrostatic municipal districts isolated by open-air break tanks and staged booster pumps.\n\nIn this episode of Hidden Systems Lab, we explore the fluid mechanics, pressure reducing valve cascades, and mechanical isolation floors that make living in the clouds physically possible.`
      : isAiCooling
      ? `Every frontier neural network training run depends on an unseen industrial machine dissipating 1,000,000 BTUs per second across acres of copper micro-channels. When a single primary pump suffers cavitation or micro-particulates block a 0.2mm channel, silicon temperatures surge past the 105°C thermal trip point in less than 180 seconds, triggering an emergency shutdown of half a billion dollars in compute.\n\nIn this episode of Hidden Systems Lab, we explore the fluid mechanics, phase-change physics, and high-pressure closed loops that keep Artificial Intelligence from melting down.`
      : isSubsea
      ? `Every financial transaction, streaming video, and global data packet depends on an invisible subsea fiber optic grid spanning more than 800,000 miles across the seabed. Powered by 10,000-volt direct current loops and amplified by optical repeaters every 50 miles, these glass threads operate under extreme oceanic pressure. When an anchor snag severs a deep sea cable at 4,000 meters, autonomous BGP protocols deflect traffic, surging adjacent corridors to critical saturation.\n\nIn this episode of Hidden Systems Lab, we explore the quantum laser mechanics, high-voltage power grids, and specialized ocean repair ships that keep humanity connected.`
      : `Every passenger flight that takes off on time depends on a hidden logistics chain that moves millions of gallons of fuel from refineries through bulk tank farms and high-pressure underground hydrant grids directly into the aircraft wings. When a single pressure constraint occurs at the final manifold, schedule margins evaporate, triggering cascading delays across the global network.\n\nIn this episode of Hidden Systems Lab, we break down the throughput mathematics, the bottleneck mechanics, and the fail-safe protocols that keep modern airports operating under peak pressure.`;

    const chapterLines = chapters.map(c => `${c.timestamp} ${c.searchIntentTitle}`).join('\n');

    const sourcesAndCredits = isMegaShip ? [
      'International Maritime Organization (IMO) Navigational Safety Standards',
      'Suez Canal Authority (SCA) Rules of Navigation & Transit Reports',
      'Society of Naval Architects and Marine Engineers (SNAME) Hydrodynamic Studies',
      'Lloyd’s List Maritime Intelligence & Marine Salvage Case Studies',
      'Hidden Systems Lab Archive & Telemetry Research Team'
    ] : isWallStreetLatency ? [
      'Forbes / Wall Street Speed War reporting on Spread Networks route and 3 ms latency gain',
      'Chicago Booth Review / Budish, Cramton and Shim market design analysis',
      'Bank for International Settlements 2025 Triennial FX Survey',
      'IEEE / arXiv low-latency microwave communications research',
      'Hidden Systems Lab Archive & Telemetry Research Team'
    ] : isGrid ? [
      'NERC (North American Electric Reliability Corporation) Frequency Response Standards',
      'IEEE Power & Energy Society / Power System Dynamic Performance Committee',
      'FERC / U.S.-Canada Power System Outage Task Force Investigation Audits',
      'Hidden Systems Lab Archive & Telemetry Research Team'
    ] : isSkyscraper ? [
      'CTBUH (Council on Tall Buildings and Urban Habitat) MEP Engineering Guidelines',
      'ASPE (American Society of Plumbing Engineers) High-Rise Water Supply Design Manual',
      'Burj Khalifa & Shanghai Tower Mechanical Infrastructure Engineering Audits',
      'Hidden Systems Lab Archive & Telemetry Research Team'
    ] : isAiCooling ? [
      'ASHRAE TC 9.9 Mission Critical Facility Liquid Cooling Guidelines',
      'Open Compute Project (OCP) Direct-to-Chip Immersion Specifications',
      'IEEE Transactions on Components and Packaging Technologies',
      'Hidden Systems Lab Archive & Telemetry Research Team'
    ] : isSubsea ? [
      'TeleGeography Subsea Cable Map Technical Archive',
      'International Cable Protection Committee (ICPC) Recommendations',
      'IEEE Communications Society / Subsea Optical Transmission Studies',
      'Hidden Systems Lab Archive & Telemetry Research Team'
    ] : [
      'FAA / ICAO International Aviation Fuel System Standards',
      'Air Transport Association (ATA) Ground Turnaround Technical Reports',
      'Hidden Systems Lab Archive & Telemetry Research Team'
    ];

    const playlistAndNextVideo = isMegaShip
      ? `Watch Next: The 28,000 km/h Paint Fleck That Can Destroy The Internet in 72 Hours\nOfficial Playlist: Hidden Systems Lab — Season 1 (Throughput & Choke-Points)`
      : isWallStreetLatency
      ? `Watch Next: The 0.5 Hertz Problem That Causes Total Blackouts\nOfficial Playlist: Hidden Systems Lab — Season 1 (Invisible Infrastructure & System Bottlenecks)`
      : isAiCooling
      ? `Watch Next: Why Airports Cannot Run Out of Fuel\nOfficial Playlist: Hidden Systems Lab — Season 1 (Physical Infrastructure & Thermodynamics)`
      : isSubsea
      ? `Watch Next: The Hidden System That Keeps Planes Flying\nOfficial Playlist: Hidden Systems Lab — Season 1 (Physical Infrastructure & Global Throughput)`
      : `Watch Next: The Physical Internet Beneath the Ocean\nOfficial Playlist: Hidden Systems Lab — Season 1 (Throughput & Bottlenecks)`;

    const fullFormattedText = `${hookLines}

${detailedSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 CAPÍTULOS & TIMESTAMPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${chapterLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 FONTES & REFERÊNCIAS TÉCNICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${sourcesAndCredits.map(s => `• ${s}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 ASSISTA A SEGUIR & PLAYLISTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${playlistAndNextVideo}

${isMegaShip ? '#HiddenSystemsLab #MaritimeEngineering #Megaships #SuezCanal #Hydrodynamics #GlobalTrade' : isKessler ? '#HiddenSystemsLab #SpaceDebris #KesslerSyndrome #Astronomy #Satellites #OrbitalMechanics' : isWallStreetLatency ? '#HiddenSystemsLab #HighFrequencyTrading #WallStreet #Latency #Finance #Engineering' : isGrid ? '#HiddenSystemsLab #PowerGrid #ElectricalEngineering #Blackout #Energy #Infrastructure' : isAiCooling ? '#HiddenSystemsLab #ArtificialIntelligence #Engineering #Supercomputing #LiquidCooling #Hardware' : '#HiddenSystemsLab #Engineering #Infrastructure #Logistics #Documentary'}`;

    return {
      episodeId: input.episodeId,
      episodeTitle: input.mainTopic,
      strategicThesis: input.thesis,
      primaryKeyword,
      semanticVariations,
      technicalEntities,
      audienceSearchQueries,
      youtubeTags,
      titles,
      thumbnails,
      layeredDescription: {
        hookLines,
        detailedSummary,
        chapters,
        sourcesAndCredits,
        playlistAndNextVideo,
        fullFormattedText
      }
    };
  }

  /**
   * Exporta todos os entregáveis físicos de empacotamento:
   * - 3 Thumbnails 4K (A/B/C)
   * - YOUTUBE_PUBLICATION_PACKAGE.md
   * - publication-package.json
   */
  public static exportPackagingDeliverables(pkg: HslPublicationPackage, rootDir: string = process.cwd()): void {
    const runDir = path.resolve(rootDir, 'runs', pkg.episodeId);
    const thumbsDir = path.resolve(runDir, 'thumbnails');
    fs.mkdirSync(thumbsDir, { recursive: true });

    // 1. Salva publication-package.json
    const jsonPath = path.join(runDir, 'publication-package.json');
    fs.writeFileSync(jsonPath, JSON.stringify(pkg, null, 2), 'utf8');

    // 2. Salva YOUTUBE_PUBLICATION_PACKAGE.md
    const mdContent = `# 📦 HSL PUBLICATION PACKAGE // ${pkg.episodeId}
# TÍTULO: ${pkg.episodeTitle}

---

## 🎯 1. TÍTULOS ESTRATÉGICOS (REGRA 1+1=3)

${pkg.titles.map((t, idx) => `### Variante ${t.variantId} (${t.role})
**Título:** \`${t.title}\`
- **Fórmula:** ${t.strategicFormula}
- **Gatilho de Retenção:** ${t.targetAudienceTrigger}
`).join('\n')}

---

## 🖼️ 2. THUMBNAILS MULTIVARIÁVEIS (TESTE A/B/C)

${pkg.thumbnails.map((th) => `### Variante ${th.variantId} (${th.variantType})
- **Papel:** ${th.roleName}
- **Headline Curta (1-3 palavras):** \`${th.headlineText}\`
- **Sujeito Focal:** ${th.focalSubject}
- **Composição Visual:** ${th.visualComposition}
- **Direção do Olhar:** ${th.lookDirection}
- **Acento de Cor:** \`${th.colorAccent}\`
- **Arquivo Físico:** \`${th.outputImagePath}\`
- **Prompt Cinematográfico:** \`${th.imagePrompt}\`
`).join('\n')}

---

## 📝 3. DESCRIÇÃO OTIMIZADA PARA O YOUTUBE

\`\`\`text
${pkg.layeredDescription.fullFormattedText}
\`\`\`

---

## 🏷️ 4. TAGS E ENTIDADES SEO

- **Palavra-chave Primária:** \`${pkg.primaryKeyword}\`
- **Variações Semânticas:** ${pkg.semanticVariations.join(', ')}
- **Entidades Técnicas:** ${pkg.technicalEntities.join(', ')}
- **Consultas de Audiência:** ${pkg.audienceSearchQueries.join(', ')}
- **Tags YouTube:** \`${pkg.youtubeTags.join(', ')}\`
`;
    const mdPath = path.join(runDir, 'YOUTUBE_PUBLICATION_PACKAGE.md');
    fs.writeFileSync(mdPath, mdContent, 'utf8');

    // 3. Renderiza as 3 thumbnails 4K/Full HD com tipografia de impacto via Remotion still
    const isMegaShip = pkg.episodeId.includes('MEGASHIP') || pkg.episodeId.includes('SHIP') || pkg.episodeId.includes('SUEZ') || pkg.episodeTitle.toLowerCase().includes('megafrete') || pkg.episodeTitle.toLowerCase().includes('monstro') || pkg.episodeTitle.toLowerCase().includes('240.000') || pkg.episodeTitle.toLowerCase().includes('frear');
    const isKessler = !isMegaShip && (pkg.episodeId.includes('KESSLER') || pkg.episodeId.includes('DEBRIS') || pkg.episodeId.includes('SPACE') || pkg.episodeTitle.toLowerCase().includes('space') || pkg.episodeTitle.toLowerCase().includes('debris') || pkg.episodeTitle.toLowerCase().includes('kessler') || pkg.episodeTitle.toLowerCase().includes('paint') || pkg.episodeTitle.toLowerCase().includes('satellite'));
    const isAi = !isMegaShip && (pkg.episodeId.includes('AI_COOLING') || pkg.episodeId.includes('AI_DATACENTER_COOLING') || pkg.episodeId.includes('DATACENTER') || pkg.episodeId.includes('COOLING'));
    const isSky = !isMegaShip && (pkg.episodeId.includes('SKYSCRAPER') || pkg.episodeTitle.toLowerCase().includes('skyscraper') || pkg.episodeTitle.toLowerCase().includes('tower'));
    const isGrid = !isMegaShip && (pkg.episodeId.includes('GRID') || pkg.episodeId.includes('FREQUENCY') || pkg.episodeTitle.toLowerCase().includes('grid') || pkg.episodeTitle.toLowerCase().includes('hertz') || pkg.episodeTitle.toLowerCase().includes('blackout'));
    const isWallStreetLatency = !isMegaShip && (pkg.episodeId.includes('WALL_STREET') || pkg.episodeId.includes('LATENCY') || pkg.episodeId.includes('HFT') || pkg.episodeTitle.toLowerCase().includes('wall street') || pkg.episodeTitle.toLowerCase().includes('latency') || pkg.episodeTitle.toLowerCase().includes('millisecond'));
    const assetBaseUrl = process.env.HSL_ASSET_BASE_URL;
    const thumbConfigs = [
      {
        target: path.join(thumbsDir, 'thumbnail_variant_A_face.png'),
        props: {
          variantId: 'A',
          assetBaseUrl,
          baseImageSrc: isMegaShip ? 'images/megaship/act1.jpg' : isKessler ? `runs/${pkg.episodeId}/frames/SCENE_001.png` : `runs/${pkg.episodeId}/frames/SCENE_001.png`,
          headlineLines: isMegaShip ? ['5 KM', 'TO BRAKE'] : isKessler ? ['28,000 KM/H', 'DEBRIS STRIKE'] : isWallStreetLatency ? ['3 MS', 'QUEUE WINS'] : isGrid ? ['59.42 HZ', 'GRID TRIP'] : isSky ? ['800 PSI', '50 BAR LIMIT'] : isAi ? ['NO LIQUID?', '105°C MELTDOWN'] : ['NO FUEL?', '150 PSI MAIN'],
          badgeText: isMegaShip ? '240,000 TONS // HYDRODYNAMIC INERTIA' : isKessler ? 'ORBITAL BOTTLENECK // 1CM PAINT FLECK' : isWallStreetLatency ? 'LATENCY BOTTLENECK // PRICE-TIME PRIORITY' : isGrid ? 'FREQUENCY TRIP // 59.42 HZ' : isSky ? 'PRESSURE BOTTLENECK // 800 PSI' : isAi ? 'SYSTEM BOTTLENECK // 45,000 L/MIN' : 'SYSTEM BOTTLENECK // 150 PSI',
          accentColor: '#FFE500',
          telemetryLabel: isMegaShip ? '400M HULL // 14 MIN RUNOUT DISTANCE' : isKessler ? '550 KM LEO // 35,000 TRACKED OBJECTS' : isWallStreetLatency ? 'CHICAGO-NJ // 825 MILES // 13.3 MS' : isGrid ? '60.00 HZ SYNC // 3,600 RPM ROTORS' : isSky ? '500M ELEVATION // 50 BAR BASE' : isAi ? '100,000 GPUS // 1.2 GIGAWATTS' : '52M GALLONS // ZERO TRUCKS'
        }
      },
      {
        target: path.join(thumbsDir, 'thumbnail_variant_B_split.png'),
        props: {
          variantId: 'B',
          assetBaseUrl,
          baseImageSrc: isMegaShip ? 'images/megaship/act1.jpg' : `runs/${pkg.episodeId}/frames/SCENE_002.png`,
          secondaryImageSrc: isMegaShip ? 'images/megaship/act5.jpg' : `runs/${pkg.episodeId}/frames/SCENE_065.png`,
          headlineLines: isMegaShip ? ['1.2M CLEARANCE', 'SUEZ LOCK'] : isKessler ? ['CASCADE', 'COLLAPSE'] : isWallStreetLatency ? ['FIBER', 'VS AIR'] : isGrid ? ['60.00 HZ', 'BLACKOUT'] : isSky ? ['50 BAR', 'PIPE BURST'] : isAi ? ['100,000 GPUS', 'THERMAL TRIP'] : ['1,200 JETS', 'GROUNDED'],
          badgeText: isMegaShip ? 'BERNOULLI SQUAT EFFECT' : isKessler ? '72-HOUR KESSLER CASCADE' : isWallStreetLatency ? 'MICROWAVE BEATS GLASS' : isGrid ? 'CASCADING BLACKOUT' : isSky ? '800 PSI RUPTURE' : isAi ? '105°C MELTDOWN' : '150 PSI COLLAPSE',
          leftLabel: isMegaShip ? 'OPEN OCEAN: 22 KNOTS' : 'NORMAL FLOW',
          rightLabel: isMegaShip ? 'SUEZ FAIRWAY: 8-SEC LOCK' : 'CRITICAL STOP',
          telemetryLabel: isMegaShip ? 'UKC: 1.2M -> 0.48M SQUAT SINK' : isKessler ? 'IRIDIUM-COSMOS // 11.7 KM/S STRIKE' : isWallStreetLatency ? 'REFRACTION LIMIT // C/1.5 VS AIR' : isGrid ? 'CONTINENTAL DESYNCHRONIZATION' : isSky ? 'HYDROSTATIC COLLAPSE' : isAi ? 'CRITICAL THERMAL TRIP' : 'TOTAL GROUND STOP'
        }
      },
      {
        target: path.join(thumbsDir, 'thumbnail_variant_C_object.png'),
        props: {
          variantId: 'C',
          assetBaseUrl,
          baseImageSrc: isMegaShip ? 'images/megaship/act6.jpg' : `runs/${pkg.episodeId}/frames/SCENE_024.png`,
          headlineLines: isMegaShip ? ['BANK', 'SUCTION'] : isKessler ? ['ONE SHIELD', '11.3 KM/S'] : isWallStreetLatency ? ['3', 'MILLISECONDS'] : isGrid ? ['ONE ROTOR', '3,600 RPM'] : isSky ? ['ONE VALVE', '500 METERS'] : isAi ? ['ONE VALVE', '1.2 GIGAWATTS'] : ['ONE VALVE', '52,000,000 GAL'],
          badgeText: isMegaShip ? '14 SALVAGE TUGS // 2,500T BOLLARD PULL' : isKessler ? 'WHIPPLE BUMPER SHIELD' : isWallStreetLatency ? 'MICROWAVE TOWER LINE OF SIGHT' : isGrid ? 'SYNCHRONOUS TURBINE ROTOR' : isSky ? 'PRESSURE REDUCING VALVE' : isAi ? 'DIRECT-TO-CHIP COOLING' : 'HIDDEN PRESSURE GRID',
          telemetryLabel: isMegaShip ? 'LOCK: STERN SUCTION // $9.6B DAILY' : isKessler ? 'LOCK: 1.27MM BUMPER // 120 GPA SHOCK' : isWallStreetLatency ? 'LOCK: 3.2NS EDGE // TENS OF MILLIONS' : isGrid ? 'LOCK: 59.50 HZ BLADE RESONANCE' : isSky ? 'LOCK: PRV CAVITATION // 50 BAR' : isAi ? 'LOCK: 0.2MM COLD PLATE // 105°C' : 'LOCK: 150 PSI // 1800 GPM',
          episodeLabel: isMegaShip ? 'HSL // MEGASHIP HYDRODYNAMICS' : 'HIDDEN SYSTEMS LAB // DOCUMENTARY',
          metricValue: 'SINGLE POINT OF FAILURE'
        }
      }
    ];

    const tempPropsDir = path.resolve(rootDir, 'out', 'temp_thumb_props');
    fs.mkdirSync(tempPropsDir, { recursive: true });

    for (let i = 0; i < thumbConfigs.length; i++) {
      const cfg = thumbConfigs[i];
      const propsFile = path.join(tempPropsDir, `thumb_${i}.json`);
      fs.writeFileSync(propsFile, JSON.stringify(cfg.props), 'utf8');

      const relativeOut = path.relative(rootDir, cfg.target).replace(/\\/g, '/');
      const relativeProps = path.relative(rootDir, propsFile).replace(/\\/g, '/');

      const bundleOrEntry = 'remotion/index.ts';
      const publicDirArg = '--public-dir=public';

      // Executa Remotion Still diretamente
      const render = spawnSync(
        process.platform === 'win32' ? 'npx.cmd' : 'npx',
        [
          'remotion',
          'still',
          'HslThumbnail',
          relativeOut,
          `--props=${relativeProps}`,
          publicDirArg,
          '--gl=angle',
          '--log=error',
          '--overwrite'
        ],
        { cwd: rootDir, encoding: 'utf8', timeout: 30000 }
      );

      if (render.status !== 0 || !fs.existsSync(cfg.target)) {
        console.warn(`[ThumbnailSeoEngine] Remotion still falhou para ${cfg.target}: ${render.stderr || render.stdout}. Usando Resvg compositor.`);
        // Fallback robusto usando @resvg/resvg-js
        const { Resvg } = require('@resvg/resvg-js');
        const accent = cfg.props.accentColor || '#FFE500';
        const line1 = cfg.props.headlineLines[0] || 'SYSTEM';
        const line2 = cfg.props.headlineLines[1] || 'COLLAPSE';
        const badge = cfg.props.badgeText || 'BOTTLENECK LIMIT';
        const telemetry = cfg.props.telemetryLabel || 'TELEMETRY';

        let imageElement = '';
        const imgPathOnDisk = path.resolve(rootDir, cfg.props.baseImageSrc);
        const altImgPath = path.resolve(rootDir, 'public', cfg.props.baseImageSrc);
        const resolvedImg = fs.existsSync(imgPathOnDisk) ? imgPathOnDisk : (fs.existsSync(altImgPath) ? altImgPath : undefined);
        if (resolvedImg) {
          const imgData = fs.readFileSync(resolvedImg).toString('base64');
          imageElement = `<image href="data:image/jpeg;base64,${imgData}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>`;
        }

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="vignette" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#07090E" stop-opacity="0.95"/>
      <stop offset="42%" stop-color="#07090E" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="#07090E" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#07090E" stop-opacity="0.05"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      .impact { font-family: Impact, 'Arial Black', sans-serif; font-weight: 900; }
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 700; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="#07090E"/>
  ${imageElement}
  <rect width="1920" height="1080" fill="url(#vignette)"/>
  <!-- Corner Reticles -->
  <text x="50" y="65" class="mono" font-size="24" fill="${accent}">+</text>
  <text x="1870" y="65" class="mono" font-size="24" fill="${accent}" text-anchor="end">+</text>
  <text x="50" y="1035" class="mono" font-size="24" fill="${accent}">+</text>
  <text x="1870" y="1035" class="mono" font-size="24" fill="${accent}" text-anchor="end">+</text>
  <!-- Category Badge -->
  <g transform="translate(80 240)">
    <rect width="520" height="46" rx="4" fill="rgba(7,9,14,0.92)" stroke="${accent}" stroke-width="2"/>
    <text x="20" y="30" class="mono" font-size="20" fill="${accent}">${badge}</text>
  </g>
  <!-- Giant Headline -->
  <g transform="translate(80 430)">
    <rect x="-10" y="-130" width="700" height="145" rx="6" fill="rgba(7,9,14,0.7)"/>
    <text x="10" y="-15" class="impact" font-size="145" fill="#FFFFFF">${line1}</text>
  </g>
  <g transform="translate(80 585)">
    <rect x="-10" y="-130" width="700" height="145" rx="6" fill="rgba(7,9,14,0.7)"/>
    <text x="10" y="-15" class="impact" font-size="145" fill="${accent}">${line2}</text>
  </g>
  <!-- Telemetry Bar -->
  <g transform="translate(80 720)">
    <rect width="640" height="60" rx="4" fill="rgba(7,9,14,0.92)" stroke="#2B3245" stroke-width="2"/>
    <text x="25" y="38" class="mono" font-size="22" fill="#00D8FF">${telemetry}</text>
  </g>
  <!-- HSL Channel Branding -->
  <text x="1840" y="1030" class="mono" font-size="20" fill="#F4F4F0" text-anchor="end" opacity="0.6">HIDDEN SYSTEMS LAB // DOCUMENTARY</text>
</svg>`;

        try {
          const png = new Resvg(svg, {
            fitTo: {mode: 'width', value: 1920},
            font: {loadSystemFonts: true}
          }).render().asPng();
          fs.writeFileSync(cfg.target, png);
        } catch (e) {}
      }
    }

    console.log(`✅ [ThumbnailSeoEngine] Pacote de publicação e 3 thumbnails estendidas exportadas com sucesso em: ${runDir}`);
  }
}
