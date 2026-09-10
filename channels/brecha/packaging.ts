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

  public static exportPackagingDeliverables(
    pkg: HslPublicationPackage,
    outputDirectory: string
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

    return { metadataJsonPath, descriptionTxtPath, titlesTxtPath };
  }
}
