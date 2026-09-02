import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const HSL_EDITOR_SHINGLE_WORDS = 10;

export type HslEditorConceptId =
  | 'luz_e_sombra_cinematografica'
  | 'profundidade_3d_layering'
  | 'estilo_johnny_harris'
  | 'cortes_j_l_cuts'
  | 'drops_cinematicos_sobs'
  | 'ritmo_e_micro_pacing'
  | 'selecao_hibrida_de_midia'
  | 'color_grading_atmosfera'
  | 'sonoplastia_sincronizada'
  | 'fair_use_protocolo_fantasma';

export type HslEditorRetrievalStage =
  | 'SHOT_PLANNING'
  | 'SCENE_TRANSITION'
  | 'MOTION_GRAPHICS'
  | 'SOBS_DROPS_SELECTION'
  | 'POSTPRODUCTION_COLOR_SOUND';

export interface HslEditorChunkReceipt {
  readonly chunk_id: string;
  readonly file_name: string;
  readonly content_sha256: string;
  readonly line_start: number;
  readonly line_end: number;
  readonly concepts: readonly HslEditorConceptId[];
  readonly summary: string;
}

export interface HslEditorConceptIndex {
  readonly concept_id: HslEditorConceptId;
  readonly label: string;
  readonly chunk_count: number;
  readonly principles: readonly string[];
  readonly chunk_ids: readonly string[];
}

export interface HslEditorRagSnapshot {
  readonly schema: 'hsl.editorial.editor-rag-index.v1';
  readonly schema_version: '1.0.0';
  readonly reference_only: true;
  readonly generated_at: string;
  readonly source_directory_label: string;
  readonly storage_policy: Readonly<{
    stores_source_prose: false;
    fingerprint_algorithm: 'sha256-normalized-10-word-shingle';
    shingle_words: 10;
  }>;
  readonly concepts: readonly HslEditorConceptIndex[];
  readonly chunk_receipts: readonly HslEditorChunkReceipt[];
  readonly phrase_fingerprints: readonly string[];
}

export interface HslEditorRetrievalReceipt {
  readonly schema: 'hsl.editorial.editor-retrieval.v1';
  readonly stage: HslEditorRetrievalStage;
  readonly requested_concepts: readonly HslEditorConceptId[];
  readonly principles: readonly string[];
  readonly chunk_receipts: readonly HslEditorChunkReceipt[];
  readonly reference_only: true;
  readonly retrieval_timestamp: string;
}

const EDITOR_CONCEPT_DEFINITIONS: Record<
  HslEditorConceptId,
  {label: string; principles: string[]; keywords: string[]}
> = {
  luz_e_sombra_cinematografica: {
    label: 'Iluminação & Sombras Cinematográficas',
    principles: [
      'PRIORITIZE_SHADOW_SIDE: Posicionar a câmera no lado da sombra para criar contraste e profundidade tridimensional.',
      'AVOID_FLAT_LIGHTING: Iluminação frontal chapada elimina o drama visual e achata a fisionomia do sujeito.',
      'USE_COUNTER_LIGHTING: Quanto mais contra-luz e luz lateral, maior o clima dramático e atmosfera cinematográfica.',
      'MAINTAIN_PRACTICAL_LIGHTS: Usar lâmpadas decorativas ou abajures ao fundo para separar o sujeito do cenário.'
    ],
    keywords: ['luz', 'sombra', 'dramática', 'dramatico', 'contra luz', 'profundidade', 'lado das sombras', 'janela', 'mistério']
  },
  profundidade_3d_layering: {
    label: 'Composição em Camadas & Profundidade 3D',
    principles: [
      'THREE_LAYER_COMPOSITION: Dividir cada cena visual em 3 camadas: Foreground (primeiro plano), Subject (sujeito em foco) e Background (fundo).',
      'FEATHERED_MASKING: Aplicar máscaras retangulares/elípticas com 15 a 25px de feathering para suavizar bordas recortadas.',
      'SWITCH_FOCUS_EFFECT: Alternar o foco dramático entre elementos do primeiro e segundo plano para criar tensão estético-narrativa.',
      'FOREGROUND_OBJECT_PLACEMENT: Posicionar objetos fora de foco próximos à lente (livros, estruturas, elementos) para ampliar o senso de escala.'
    ],
    keywords: ['profundidade', 'camadas', 'foreground', 'background', 'switch focus', 'máscara', 'feathering', 'recorte', '3d']
  },
  estilo_johnny_harris: {
    label: 'Estilo de Edição & Cartografia Johnny Harris',
    principles: [
      'ANIMATED_CARTOGRAPHY: Animar mapas 3D com texturas de papel antigo, linhas de rota em movimento e pins com ruído sonoro.',
      'PAPER_TEXTURE_OVERLAYS: Aplicar texturas de papel rasgado, jornais históricos e ruído analógico em transições e recortes.',
      'RETRO_TYPEWRITER_TEXT: Animações de texto estilo máquina de escrever retro com ritmo de 3 segundos e corte de chaveiro.',
      'GRID_AND_TECHNICAL_HUD: Utilizar linhas de grade, marcadores técnicos e linhas de guia minimalistas para estética documental.'
    ],
    keywords: ['johnny harris', 'mapas', 'typewriter', 'paper', 'textura', 'overlay', 'grid', 'capcut', 'documentary']
  },
  cortes_j_l_cuts: {
    label: 'Cortes Fluídos J-Cut e L-Cut',
    principles: [
      'J_CUT_AUDIO_LEAD: Iniciar o áudio da próxima tomada ou fala 0.5s a 1.5s antes do corte visual para suavizar a transição.',
      'L_CUT_AUDIO_TRAIL: Manter a continuidade da narração ou ambiente sonoro enquanto a imagem já transicionou para a cena seguinte.',
      'SEAMLESS_CONTINUITY: Eliminar cortes secos de vídeo e áudio simultâneos (hard cuts) para criar fluxo cinematográfico invisível.'
    ],
    keywords: ['j-cut', 'l-cut', 'corte j', 'corte l', 'transição invisível', 'áudio antecipado', 'fluxo sonoro']
  },
  drops_cinematicos_sobs: {
    label: 'Drops Cinemáticos & SOBS (Sound/Scene Breaks)',
    principles: [
      'PAUSE_NARRATION_FOR_SOBS: Interromper a narração principal por 2 a 5 segundos para dar espaço a falas de efeito reais.',
      'CULTURE_AND_NEWS_INSERTS: Utilizar trechos curtos de podcasts, reportagens de TV ou discursos históricos para validar o roteiro.',
      'HIGH_PRODUCTION_FAISCA: O protocolo Faísca usa drops cinemáticos no primeiro minuto para prender a retenção do espectador.'
    ],
    keywords: ['drops', 'sobs', 'faísca', 'interrupção', 'noticiário', 'podcast', 'discurso', 'trecho real', 'ira de deus']
  },
  ritmo_e_micro_pacing: {
    label: 'Ritmo Narrativo & Micro-Pacing',
    principles: [
      'RETENTION_HOOK_PACING: No primeiro minuto (intro), alternar elementos visuais ou estados de tela a cada 2 a 3 segundos.',
      'CUT_ON_ACTION: Realizar cortes de cena durante o movimento do sujeito ou da câmera para disfarçar a mudança visual.',
      'CONTRAST_PACING_VARIATION: Alternar sequências ágeis de cortes curtos com tomadas contemplativas mais longas.'
    ],
    keywords: ['ritmo', 'pacing', 'retenção', 'micro-pacing', 'hook', 'corte na ação', 'faísca', 'segundos']
  },
  selecao_hibrida_de_midia: {
    label: 'Estratégia Híbrida de Mídias',
    principles: [
      'HYBRID_MEDIA_BALANCE: Combinar bancos de mídias reais (Pexels, Pixabay), material histórico documental e artes de IA.',
      'AVOID_100_PERCENT_AI: O uso exclusivo de IA gera estranhamento e reduz a confiança do espectador; mídias reais trazem ancoragem.',
      'HIGH_RESOLUTION_SOURCE: Selecionar mídias nativas em 1080p ou superior mantendo proporção de aspecto 16:9.'
    ],
    keywords: ['banco de imagens', 'pexels', 'mídia real', 'ia', 'híbrido', 'reais', 'documental']
  },
  color_grading_atmosfera: {
    label: 'Graduação de Cor & Atmosfera Dramática',
    principles: [
      'COOL_SHADOWS_WARM_HIGHLIGHTS: Calibrar sombras em tons frios (azul/ciano) e realces em tons quentes (dourado/âmbar).',
      'HIGH_CONTRAST_TONAL_MAP: Elevar o contraste de tons médios sem estourar os brancos ou esmagar completamente os pretos.',
      'SELECTIVE_DESATURATION: Dessaturar cores secundárias para destacar elementos semânticos principais na cena.'
    ],
    keywords: ['color grading', 'cor', 'contraste', 'sombras frias', 'hsl', 'curvas', 'balanço de branco', 'atmosfera']
  },
  sonoplastia_sincronizada: {
    label: 'Sonoplastia Sincronizada (SFX Beds)',
    principles: [
      'TRANSITION_SFX_SYNC: Sincronizar efeito sonoro específico (whoosh, paper tear, click, riser) exatamente no frame de transição visual.',
      'TYPEWRITER_KEY_AUDIO: Cada letra ou palavra em animação de texto deve possuir um sfx mecânico de digitação sincronizado.',
      'AUDIO_DYNAMICS_BED: Manter a cama de efeitos sonoros em nível secundário em relação à narração (-12dB a -18dB abaixo da voz).'
    ],
    keywords: ['sfx', 'efeito sonoro', 'whoosh', 'riser', 'sincronizado', 'teletipo', 'paper tear', 'impacto']
  },
  fair_use_protocolo_fantasma: {
    label: 'Uso Justo & Protocolo Fantasma',
    principles: [
      'TRANSFORMATIVE_FAIR_USE: Agregar valor editorial significativo a materiais de terceiros com locução original, recortes e gráficos.',
      'VISUAL_AND_AUDIO_TRANSFORMATION: Aplicar filtros de cor, overlays de textura e narração para garantir conformidade com Fair Use.',
      'SHORT_CLIP_LIMITATION: Manter inserções de material com direitos autorais restritas a trechos curtos necessários à ilustração.'
    ],
    keywords: ['fair use', 'direitos autorais', 'protocolo fantasma', 'transformativo', 'uso justo', 'uso livre']
  }
};

const STAGE_CONCEPT_MAP: Record<HslEditorRetrievalStage, HslEditorConceptId[]> = {
  SHOT_PLANNING: ['luz_e_sombra_cinematografica', 'profundidade_3d_layering', 'selecao_hibrida_de_midia'],
  SCENE_TRANSITION: ['cortes_j_l_cuts', 'profundidade_3d_layering', 'ritmo_e_micro_pacing'],
  MOTION_GRAPHICS: ['estilo_johnny_harris', 'profundidade_3d_layering', 'ritmo_e_micro_pacing'],
  SOBS_DROPS_SELECTION: ['drops_cinematicos_sobs', 'ritmo_e_micro_pacing', 'fair_use_protocolo_fantasma'],
  POSTPRODUCTION_COLOR_SOUND: ['color_grading_atmosfera', 'sonoplastia_sincronizada', 'cortes_j_l_cuts']
};

function sha256(value: string | Buffer): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function normalizeEditorWords(text: string): string[] {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function phraseFingerprints(text: string, shingleWords = HSL_EDITOR_SHINGLE_WORDS): string[] {
  const words = normalizeEditorWords(text);
  const fingerprints = new Set<string>();
  if (words.length < shingleWords) {
    if (words.length >= 4) {
      fingerprints.add(sha256(words.join(' ')));
    }
    return Array.from(fingerprints);
  }
  for (let i = 0; i <= words.length - shingleWords; i += 1) {
    const shingle = words.slice(i, i + shingleWords).join(' ');
    fingerprints.add(sha256(shingle));
  }
  return Array.from(fingerprints);
}

export function syncEditorRagSnapshot(sourceDir: string, outputPath: string): HslEditorRagSnapshot {
  const resolvedSourceDir = path.resolve(sourceDir);
  const resolvedOutputPath = path.resolve(outputPath);

  if (!fs.existsSync(resolvedSourceDir)) {
    throw new Error(`[HSL Editor RAG] Diretório fonte não existe: ${resolvedSourceDir}`);
  }

  const files = fs
    .readdirSync(resolvedSourceDir, {recursive: true})
    .map(f => f.toString())
    .filter(f => f.endsWith('.md') || f.endsWith('.description'));

  const chunkReceipts: HslEditorChunkReceipt[] = [];
  const allFingerprints = new Set<string>();
  const conceptCounts: Record<HslEditorConceptId, {chunkIds: string[]; principlesSet: Set<string>}> = {
    luz_e_sombra_cinematografica: {chunkIds: [], principlesSet: new Set()},
    profundidade_3d_layering: {chunkIds: [], principlesSet: new Set()},
    estilo_johnny_harris: {chunkIds: [], principlesSet: new Set()},
    cortes_j_l_cuts: {chunkIds: [], principlesSet: new Set()},
    drops_cinematicos_sobs: {chunkIds: [], principlesSet: new Set()},
    ritmo_e_micro_pacing: {chunkIds: [], principlesSet: new Set()},
    selecao_hibrida_de_midia: {chunkIds: [], principlesSet: new Set()},
    color_grading_atmosfera: {chunkIds: [], principlesSet: new Set()},
    sonoplastia_sincronizada: {chunkIds: [], principlesSet: new Set()},
    fair_use_protocolo_fantasma: {chunkIds: [], principlesSet: new Set()}
  };

  let totalChunks = 0;

  for (const relFile of files) {
    const fullPath = path.join(resolvedSourceDir, relFile);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const chunkSize = 40;

    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunkLines = lines.slice(i, i + chunkSize);
      const chunkText = chunkLines.join('\n');
      const chunkNormText = chunkText.toLowerCase();

      if (chunkText.trim().length < 20) continue;

      totalChunks += 1;
      const chunkId = `CHUNK_${totalChunks.toString().padStart(4, '0')}`;
      const chunkSha = sha256(chunkText);
      const matchedConcepts: HslEditorConceptId[] = [];

      for (const [conceptId, def] of Object.entries(EDITOR_CONCEPT_DEFINITIONS) as [HslEditorConceptId, typeof EDITOR_CONCEPT_DEFINITIONS[HslEditorConceptId]][]) {
        const matchesKeyword = def.keywords.some(kw => chunkNormText.includes(kw));
        if (matchesKeyword) {
          matchedConcepts.push(conceptId);
          conceptCounts[conceptId].chunkIds.push(chunkId);
          def.principles.forEach(p => conceptCounts[conceptId].principlesSet.add(p));
        }
      }

      // Compute shingle fingerprints for prose protection
      const fps = phraseFingerprints(chunkText);
      fps.forEach(fp => allFingerprints.add(fp));

      const summaryLine = chunkLines.find(l => l.trim().length > 10) || chunkLines[0] || 'Chunk snippet';
      const cleanSummary = summaryLine.replace(/^#+\s*/, '').trim().slice(0, 120);

      chunkReceipts.push({
        chunk_id: chunkId,
        file_name: relFile.replace(/\\/g, '/'),
        content_sha256: chunkSha,
        line_start: i + 1,
        line_end: Math.min(i + chunkSize, lines.length),
        concepts: matchedConcepts,
        summary: cleanSummary
      });
    }
  }

  const conceptIndices: HslEditorConceptIndex[] = (Object.keys(EDITOR_CONCEPT_DEFINITIONS) as HslEditorConceptId[]).map(conceptId => {
    const def = EDITOR_CONCEPT_DEFINITIONS[conceptId];
    const data = conceptCounts[conceptId];
    return {
      concept_id: conceptId,
      label: def.label,
      chunk_count: data.chunkIds.length,
      principles: Array.from(data.principlesSet).length > 0 ? Array.from(data.principlesSet) : def.principles,
      chunk_ids: data.chunkIds
    };
  });

  const snapshot: HslEditorRagSnapshot = {
    schema: 'hsl.editorial.editor-rag-index.v1',
    schema_version: '1.0.0',
    reference_only: true,
    generated_at: new Date().toISOString(),
    source_directory_label: 'RAG EDITOR',
    storage_policy: {
      stores_source_prose: false,
      fingerprint_algorithm: 'sha256-normalized-10-word-shingle',
      shingle_words: HSL_EDITOR_SHINGLE_WORDS
    },
    concepts: conceptIndices,
    chunk_receipts: chunkReceipts,
    phrase_fingerprints: Array.from(allFingerprints)
  };

  fs.mkdirSync(path.dirname(resolvedOutputPath), {recursive: true});
  fs.writeFileSync(resolvedOutputPath, JSON.stringify(snapshot, null, 2), 'utf-8');

  return snapshot;
}

export function retrieveEditorInsights(
  snapshot: HslEditorRagSnapshot,
  stage: HslEditorRetrievalStage,
  customConcepts?: readonly HslEditorConceptId[]
): HslEditorRetrievalReceipt {
  const requestedConcepts = customConcepts && customConcepts.length > 0 ? customConcepts : STAGE_CONCEPT_MAP[stage];
  const matchedChunkIds = new Set<string>();
  const principlesSet = new Set<string>();

  for (const conceptId of requestedConcepts) {
    const conceptIdx = snapshot.concepts.find(c => c.concept_id === conceptId);
    if (conceptIdx) {
      conceptIdx.principles.forEach(p => principlesSet.add(p));
      conceptIdx.chunk_ids.forEach(cid => matchedChunkIds.add(cid));
    }
  }

  const matchedReceipts = snapshot.chunk_receipts.filter(r => matchedChunkIds.has(r.chunk_id));

  return {
    schema: 'hsl.editorial.editor-retrieval.v1',
    stage,
    requested_concepts: requestedConcepts,
    principles: Array.from(principlesSet),
    chunk_receipts: matchedReceipts,
    reference_only: true,
    retrieval_timestamp: new Date().toISOString()
  };
}
