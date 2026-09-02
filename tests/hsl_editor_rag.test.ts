import fs from 'fs';
import path from 'path';
import {
  HslEditorConceptId,
  HslEditorRetrievalStage,
  retrieveEditorInsights,
  syncEditorRagSnapshot
} from '../hsl/editorial/editor/editorRagRuntime';

function runEditorRagTests(): void {
  const sourceRoot = path.resolve('RAG EDITOR');
  const outputPath = path.resolve('assets/editorial-references/editor/editor-rag-index.json');

  console.log('[TEST] Executando sincronização do Editor RAG...');
  const snapshot = syncEditorRagSnapshot(sourceRoot, outputPath);

  if (snapshot.schema !== 'hsl.editorial.editor-rag-index.v1') {
    throw new Error(`Schema inválido: ${snapshot.schema}`);
  }
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Snapshot JSON não foi criado em: ${outputPath}`);
  }
  if (snapshot.concepts.length !== 10) {
    throw new Error(`Esperado 10 conceitos indexados, encontrado ${snapshot.concepts.length}`);
  }
  if (snapshot.chunk_receipts.length === 0) {
    throw new Error('Nenhum chunk receipt foi gerado');
  }

  const requiredConcepts: HslEditorConceptId[] = [
    'luz_e_sombra_cinematografica',
    'profundidade_3d_layering',
    'estilo_johnny_harris',
    'cortes_j_l_cuts',
    'drops_cinematicos_sobs',
    'ritmo_e_micro_pacing',
    'selecao_hibrida_de_midia',
    'color_grading_atmosfera',
    'sonoplastia_sincronizada',
    'fair_use_protocolo_fantasma'
  ];

  for (const conceptId of requiredConcepts) {
    const conceptIdx = snapshot.concepts.find(c => c.concept_id === conceptId);
    if (!conceptIdx) {
      throw new Error(`Conceito obrigatório ausente no índice: ${conceptId}`);
    }
    if (conceptIdx.principles.length === 0) {
      throw new Error(`Conceito ${conceptId} possui 0 princípios registrados`);
    }
    if (conceptIdx.chunk_count === 0) {
      throw new Error(`Conceito ${conceptId} possui 0 chunks associados`);
    }
  }

  const stages: HslEditorRetrievalStage[] = [
    'SHOT_PLANNING',
    'SCENE_TRANSITION',
    'MOTION_GRAPHICS',
    'SOBS_DROPS_SELECTION',
    'POSTPRODUCTION_COLOR_SOUND'
  ];

  for (const stage of stages) {
    const retrieval = retrieveEditorInsights(snapshot, stage);
    if (retrieval.schema !== 'hsl.editorial.editor-retrieval.v1') {
      throw new Error(`Retrieval schema inválido para o estágio ${stage}`);
    }
    if (retrieval.principles.length === 0) {
      throw new Error(`Estágio ${stage} retornou 0 princípios de edição`);
    }
    if (retrieval.chunk_receipts.length === 0) {
      throw new Error(`Estágio ${stage} retornou 0 recibos de chunks`);
    }
  }

  if (snapshot.storage_policy.stores_source_prose !== false) {
    throw new Error('Política de armazenamento violada: stores_source_prose deve ser false');
  }
  if (snapshot.phrase_fingerprints.length === 0) {
    throw new Error('Nenhum fingerprint de frase foi gerado');
  }

  console.log('[PASS] Todos os testes do Editor RAG passaram com sucesso!');
  console.log(JSON.stringify({
    status: 'EDITOR_RAG_TESTS_PASS',
    concepts_count: snapshot.concepts.length,
    chunks_count: snapshot.chunk_receipts.length,
    fingerprints_count: snapshot.phrase_fingerprints.length
  }, null, 2));
}

runEditorRagTests();
