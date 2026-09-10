import fs from 'node:fs';
import path from 'node:path';
import type {
  HslPublicationPackage,
  EpisodePackagingInput,
  HslTitleSpec,
  HslThumbnailSpec,
  HslChapterTimestamp
} from '../../hsl/packaging/thumbnailSeoEngine';

export class BrechaPackagingEngine {
  public static generatePackage(input: EpisodePackagingInput): HslPublicationPackage {
    const titles: HslTitleSpec[] = [
      {
        variantId: 'A',
        role: 'CURIOSITY_GAP',
        title: input.mainTopic.length <= 65 ? input.mainTopic : input.mainTopic.slice(0, 62) + '...',
        strategicFormula: 'Premissa factual direta + consequência concreta',
        targetAudienceTrigger: 'Identificação imediata de risco pessoal'
      },
      {
        variantId: 'B',
        role: 'SEARCH_INTENT',
        title: `Como Funciona o Golpe do Celular Roubado (E os Primeiros 8 Minutos)`,
        strategicFormula: 'Palavra-chave de busca + janela temporal de emergência',
        targetAudienceTrigger: 'Busca por prevenção e resposta a incidentes'
      },
      {
        variantId: 'C',
        role: 'CONTRAST_PARADOX',
        title: `Por Que Senha e Biometria Não Impedem Este Golpe`,
        strategicFormula: 'Quebra de falsa segurança + paradoxo de confiança técnica',
        targetAudienceTrigger: 'Curiosidade crítica sobre falhas invisíveis de sistemas'
      }
    ];

    const thumbnails: HslThumbnailSpec[] = [
      {
        variantId: 'A',
        variantType: 'A_DECISAO',
        roleName: 'DECISAO_SEGUNDO_CRITICO',
        headlineText: '8 MINUTOS',
        focalSubject: 'Objeto familiar no instante crítico da decisão (segundo antes do clique ou transferência)',
        visualComposition: 'Primeiro plano fotográfico 35mm, fenda vertical assimétrica coral (20-35% do frame), paleta carvão e osso',
        lookDirection: 'Centro, close-up documental',
        colorAccent: '#FF5A47',
        imagePrompt: 'Documentary style close-up of smartphone on realistic Brazilian desk, subtle asymmetric vertical fissure glowing coral, cinematic Nordic lighting 35mm, no text.',
        outputImagePath: `runs/${input.episodeId}/packaging/thumbnail_A.png`
      },
      {
        variantId: 'B',
        variantType: 'B_MECANISMO',
        roleName: 'MECANISMO_SISTEMA_OCULTO',
        headlineText: '', // Brand Bible: preferencialmente zero palavras
        focalSubject: 'A tela aberta revelando o sistema invisível por trás da fenda assimétrica',
        visualComposition: 'Divisão assimétrica entre superfície cotidiana e fluxo de sistema em verde-azulado e coral',
        lookDirection: 'Horizontal / 2.5D',
        colorAccent: '#4F9B96',
        imagePrompt: 'Cinematic split composition showing everyday mobile device transitioning into technical system flow through asymmetric fissure, dark charcoal #0D0D0F palette, teal and coral accents.',
        outputImagePath: `runs/${input.episodeId}/packaging/thumbnail_B.png`
      },
      {
        variantId: 'C',
        variantType: 'C_CONSEQUENCIA',
        roleName: 'CONSEQUENCIA_EM_ABERTO',
        headlineText: 'CONTA ZERADA',
        focalSubject: 'Dinheiro, identidade ou acesso desaparecendo com callout de evidência',
        visualComposition: 'Fotografia macro forense com callout de evidência documental real em coral',
        lookDirection: 'Top-down isometric',
        colorAccent: '#FF5A47',
        imagePrompt: 'Forensic macro photography of real banking transfer confirmation and SIM card, dark textured charcoal surface, coral callout on critical vulnerability point, 35mm realism.',
        outputImagePath: `runs/${input.episodeId}/packaging/thumbnail_C.png`
      }
    ];

    const chapters: HslChapterTimestamp[] = [
      { timestamp: '00:00', seconds: 0, searchIntentTitle: '01. Superfície da Normalidade' },
      { timestamp: '02:45', seconds: 165, searchIntentTitle: '02. O Vetor de Ataque e a Anomalia' },
      { timestamp: '05:15', seconds: 315, searchIntentTitle: '03. A Mecânica Oculta: O Momento da Brecha' },
      { timestamp: '08:20', seconds: 500, searchIntentTitle: '04. Impacto, Danos e Protocolo de Sobrevivência' }
    ];

    const hookLines = `O roubo de celular no Brasil deixou de ser sobre o aparelho. Em minutos, uma cadeia coordenada de fraudes desmonta a segurança bancária.\n\nNeste documentário investigativo, a equipe do canal BRECHA reconstitui passo a passo o mecanismo que transforma uma janela semiaberta no trânsito em prejuízo de dezenas de milhares de reais.`;

    const detailedSummary = `A análise técnica revela como a conveniência de sistemas instantâneos de pagamento e autenticação por SMS cria uma janela de vulnerabilidade explorada com precisão cirúrgica antes do bloqueio da linha.\n\nBaseado em relatórios estatísticos de órgãos reguladores, ocorrências policiais documentadas e entrevistas com peritos em segurança da informação.`;

    const sourcesAndCredits = [
      'Banco Central do Brasil — Relatório de Fraudes e Estatísticas do MED (2024)',
      'Secretaria de Segurança Pública — Boletins de Ocorrência de Estelionato Eletrônico',
      'Anatel — Painel de Dados de Portabilidade Numérica e Alocação de Linhas',
      'Febraban — Relatórios de Segurança e Boas Práticas Digitais',
      'Canal BRECHA — Investigação Jornalística e Análise Forense Multicanal'
    ];

    const fullFormattedText = `${hookLines}\n\n${detailedSummary}\n\nCAPÍTULOS:\n${chapters.map(c => `${c.timestamp} ${c.searchIntentTitle}`).join('\n')}\n\nFONTES E REFERÊNCIAS:\n${sourcesAndCredits.map(s => `• ${s}`).join('\n')}\n\nAVISO DE CONFORMIDADE:\nEste vídeo tem finalidade exclusivamente jornalística, informativa e educativa sobre segurança digital e prevenção a fraudes financeiras. As dramatizações são identificadas como reconstituições ilustrativas.`;

    return {
      episodeId: input.episodeId,
      episodeTitle: input.mainTopic,
      strategicThesis: input.thesis,
      primaryKeyword: 'golpe do celular',
      semanticVariations: ['fraude bancaria', 'roubo de celular 8 minutos', 'pix conta laranja', 'sim swap', 'seguranca digital'],
      technicalEntities: [input.entity, 'Mecanismo Especial de Devolução (MED)', 'Autenticação de Dois Fatores', 'Chip SIM'],
      audienceSearchQueries: [
        'o que fazer quando roubam celular com banco',
        'como criminosos abrem banco em celular roubado',
        'como bloquear chip e evitar pix'
      ],
      youtubeTags: [
        'brecha',
        'segurança digital',
        'golpe do celular',
        'celular roubado',
        'pix',
        'bancos',
        'fraude financeira',
        'cibercrime',
        'investigação',
        'documentário',
        'brasil'
      ],
      titles,
      thumbnails,
      layeredDescription: {
        hookLines,
        detailedSummary,
        chapters,
        sourcesAndCredits,
        playlistAndNextVideo: 'Playlist: Documentários BRECHA — Casos e Mecânicas Reais',
        fullFormattedText
      }
    };
  }

  public static renderThumbnails(
    pkg: HslPublicationPackage,
    rootDir: string,
    outputDirs: string[]
  ): string[] {
    const { Resvg } = require('@resvg/resvg-js');
    const { execFileSync } = require('child_process');
    const renderedPaths: string[] = [];

    const variants = [
      {
        id: 'A',
        filename: 'thumbnail_variant_A_face.png',
        frameName: 'SCENE_001.png',
        accent: '#FF5A47',
        shortWord: '8 MINUTOS', // Hipótese 1: Decisão (O segundo antes do clique/transferência)
      },
      {
        id: 'B',
        filename: 'thumbnail_variant_B_split.png',
        frameName: 'SCENE_004.png',
        accent: '#4F9B96',
        shortWord: '', // Hipótese 2: Mecanismo (Zero palavras - mistério e revelação visual)
      },
      {
        id: 'C',
        filename: 'thumbnail_variant_C_object.png',
        frameName: 'SCENE_007.png',
        accent: '#FF5A47',
        shortWord: 'CONTA ZERADA', // Hipótese 3: Consequência em aberto
      }
    ];

    for (const v of variants) {
      let imageElement = '';
      const framePath = path.join(rootDir, 'runs', pkg.episodeId, 'frames', v.frameName);
      if (fs.existsSync(framePath)) {
        const imgData = fs.readFileSync(framePath).toString('base64');
        imageElement = `<image href="data:image/png;base64,${imgData}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>`;
      }

      // Brand Bible Seção 15: Objeto familiar + comportamento impossível + consequência em aberto
      // Zero a 3 palavras; SEM logo do canal; SEM moldura fixa; Fenda assimétrica sutil (20-35%)
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="vignette" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0D0D0F" stop-opacity="0.92"/>
      <stop offset="35%" stop-color="#0D0D0F" stop-opacity="0.60"/>
      <stop offset="70%" stop-color="#0D0D0F" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#0D0D0F" stop-opacity="0.40"/>
    </linearGradient>
    <filter id="fendaGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#FF5A47" flood-opacity="0.6"/>
    </filter>
    <style>
      .titleFont { font-family: 'Archivo', 'Source Sans 3', sans-serif; font-weight: 900; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="#0D0D0F"/>
  ${imageElement}
  <rect width="1920" height="1080" fill="url(#vignette)"/>

  <!-- A Fenda: Abertura vertical assimétrica canônica que revela a camada oculta -->
  <path d="M 1240 0 L 1260 380 L 1235 720 L 1255 1080" stroke="${v.accent}" stroke-width="4" fill="none" opacity="0.85" filter="url(#fendaGlow)"/>

  <!-- Tipografia de Impacto Minimalista (0 a 3 palavras - Archivo SemiExpanded ExtraBold) -->
  ${v.shortWord ? `
  <g transform="translate(100 920)">
    <text x="0" y="0" class="titleFont" font-size="140" fill="#E8E2D7" letter-spacing="-3" style="text-shadow: 0 10px 40px rgba(0,0,0,0.95);">${v.shortWord}</text>
  </g>
  ` : ''}
</svg>`;

      try {
        const png = new Resvg(svg, {
          fitTo: { mode: 'width', value: 1920 },
          font: { loadSystemFonts: true }
        }).render().asPng();

        for (const outDir of outputDirs) {
          fs.mkdirSync(outDir, { recursive: true });
          const targetPng = path.join(outDir, v.filename);
          fs.writeFileSync(targetPng, png);
          renderedPaths.push(targetPng);

          if (v.id === 'A') {
            const thumbJpg = path.join(outDir, 'thumbnail.jpg');
            try {
              execFileSync('ffmpeg', ['-y', '-i', targetPng, '-q:v', '2', thumbJpg], { timeout: 15000 });
              renderedPaths.push(thumbJpg);
            } catch {
              fs.copyFileSync(targetPng, path.join(outDir, 'thumbnail.png'));
            }
          }
        }
      } catch (e: any) {
        console.warn(`[BrechaPackagingEngine] Falha ao renderizar thumbnail ${v.id}: ${e.message}`);
      }
    }
    return renderedPaths;
  }

  public static exportPackagingDeliverables(
    pkg: HslPublicationPackage,
    outputDirectory: string,
    rootDir?: string
  ): { metadataJsonPath: string; descriptionTxtPath: string; titlesTxtPath: string } {
    fs.mkdirSync(outputDirectory, { recursive: true });
    const metadataJsonPath = path.join(outputDirectory, 'youtube-metadata.json');
    const descriptionTxtPath = path.join(outputDirectory, 'description.txt');
    const titlesTxtPath = path.join(outputDirectory, 'titles.txt');

    fs.writeFileSync(metadataJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
    fs.writeFileSync(descriptionTxtPath, pkg.layeredDescription.fullFormattedText, 'utf8');
    fs.writeFileSync(
      titlesTxtPath,
      pkg.titles.map((t, i) => `Opção ${t.variantId} [${t.role}]:\n${t.title}\nJustificativa: ${t.strategicFormula}\n`).join('\n---\n\n'),
      'utf8'
    );

    if (rootDir) {
      const thumbsDir = path.join(outputDirectory, 'thumbnails');
      const deliveryThumbs = path.join(rootDir, 'deliveries', pkg.episodeId, 'thumbnails');
      const deliveryRoot = path.join(rootDir, 'deliveries', pkg.episodeId);
      this.renderThumbnails(pkg, rootDir, [thumbsDir, deliveryThumbs, deliveryRoot]);
    }

    return { metadataJsonPath, descriptionTxtPath, titlesTxtPath };
  }
}
