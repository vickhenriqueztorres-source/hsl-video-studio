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
        variantType: 'A_FACE_EVIDENCE',
        roleName: 'DOCUMENTAL_EVIDENCIA',
        headlineText: '8 MINUTOS',
        focalSubject: 'Tela do banco com transferência em andamento sob luz realista',
        visualComposition: 'Primeiro plano dramático, paleta carvão e coral alaranjado',
        lookDirection: 'Centro, close-up macro',
        colorAccent: '#FF5A47',
        imagePrompt: 'Documentary style close-up of smartphone screen displaying banking transfer alert, dark moody room, subtle neon accents in coral and teal, Nordic cinematic lighting 35mm.',
        outputImagePath: `runs/${input.episodeId}/packaging/thumbnail_A.png`
      },
      {
        variantId: 'B',
        variantType: 'B_BEFORE_AFTER',
        roleName: 'ANOMALIA_VETOR',
        headlineText: 'CONTA ZERADA',
        focalSubject: 'Notificação de saldo antes e depois do ataque',
        visualComposition: 'Composição dividida com contraste térmico',
        lookDirection: 'Horizontal',
        colorAccent: '#4F9B96',
        imagePrompt: 'Split cinematic screen showing phone in dashboard mount and subsequent bank liquidation alert, cold tones, high detail realism.',
        outputImagePath: `runs/${input.episodeId}/packaging/thumbnail_B.png`
      },
      {
        variantId: 'C',
        variantType: 'C_HERO_OBJECT',
        roleName: 'MECANICA_FORENSE',
        headlineText: 'A BRECHA',
        focalSubject: 'Chip SIM removido ao lado de smartphone desmontado',
        visualComposition: 'Fotografia macro forense com iluminação cirúrgica',
        lookDirection: 'Top-down isometric',
        colorAccent: '#BCD5C2',
        imagePrompt: 'Forensic macro photography of SIM card removal tool, exposed microchip, dark charcoal textured surface, minimalist clean typography.',
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
        badge: 'BRECHA // INVESTIGAÇÃO FORENSE',
        line1: '8 MINUTOS',
        line2: 'A FALSA CENTRAL',
        telemetry: 'CHAMADA ATIVA // ORIGEM DIVERGENTE // ANOMALIA'
      },
      {
        id: 'B',
        filename: 'thumbnail_variant_B_split.png',
        frameName: 'SCENE_004.png',
        accent: '#4F9B96',
        badge: 'ENGENHARIA SOCIAL // FALSA CONFIANÇA',
        line1: 'SENHA E CHAVE',
        line2: 'NÃO IMPEDEM',
        telemetry: 'CONFIRMAÇÃO INDEPENDENTE // PROTOCOLO SUSPENSO'
      },
      {
        id: 'C',
        filename: 'thumbnail_variant_C_object.png',
        frameName: 'SCENE_007.png',
        accent: '#BCD5C2',
        badge: 'AUTENTICAÇÃO // VETOR DE ATAQUE',
        line1: 'A BRECHA',
        line2: 'OCULTA',
        telemetry: 'DISPOSITIVO AUTORIZADO // IDENTIDADE NÃO VERIFICADA'
      }
    ];

    for (const v of variants) {
      let imageElement = '';
      const framePath = path.join(rootDir, 'runs', pkg.episodeId, 'frames', v.frameName);
      if (fs.existsSync(framePath)) {
        const imgData = fs.readFileSync(framePath).toString('base64');
        imageElement = `<image href="data:image/png;base64,${imgData}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>`;
      }

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="vignette" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#080B10" stop-opacity="0.95"/>
      <stop offset="45%" stop-color="#080B10" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="#080B10" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#080B10" stop-opacity="0.05"/>
    </linearGradient>
    <style>
      .impact { font-family: Impact, 'Arial Black', sans-serif; font-weight: 900; }
      .mono { font-family: Consolas, 'Courier New', monospace; font-weight: 700; }
    </style>
  </defs>
  <rect width="1920" height="1080" fill="#080B10"/>
  ${imageElement}
  <rect width="1920" height="1080" fill="url(#vignette)"/>
  <!-- Corner Reticles -->
  <text x="50" y="65" class="mono" font-size="24" fill="${v.accent}">+</text>
  <text x="1870" y="65" class="mono" font-size="24" fill="${v.accent}" text-anchor="end">+</text>
  <text x="50" y="1035" class="mono" font-size="24" fill="${v.accent}">+</text>
  <text x="1870" y="1035" class="mono" font-size="24" fill="${v.accent}" text-anchor="end">+</text>
  <!-- Category Badge -->
  <g transform="translate(80 220)">
    <rect width="520" height="46" rx="4" fill="rgba(8,11,16,0.92)" stroke="${v.accent}" stroke-width="2"/>
    <text x="20" y="30" class="mono" font-size="20" fill="${v.accent}">${v.badge}</text>
  </g>
  <!-- Giant Headline -->
  <g transform="translate(80 410)">
    <rect x="-10" y="-130" width="750" height="145" rx="6" fill="rgba(8,11,16,0.75)"/>
    <text x="10" y="-15" class="impact" font-size="140" fill="#FFFFFF">${v.line1}</text>
  </g>
  <g transform="translate(80 570)">
    <rect x="-10" y="-130" width="750" height="145" rx="6" fill="rgba(8,11,16,0.75)"/>
    <text x="10" y="-15" class="impact" font-size="140" fill="${v.accent}">${v.line2}</text>
  </g>
  <!-- Telemetry Bar -->
  <g transform="translate(80 710)">
    <rect width="680" height="60" rx="4" fill="rgba(8,11,16,0.92)" stroke="#222B38" stroke-width="2"/>
    <text x="25" y="38" class="mono" font-size="20" fill="${v.accent}">${v.telemetry}</text>
  </g>
  <!-- BRECHA Branding -->
  <text x="1840" y="1030" class="mono" font-size="22" fill="#F0F4F8" text-anchor="end" opacity="0.75">CANAL BRECHA // INVESTIGAÇÃO FORENSE</text>
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
