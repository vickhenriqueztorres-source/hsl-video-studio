import fs from 'fs';
import path from 'path';
import {buildRag, SoundDesignChunk, DecisionRule, VALID_CATEGORIES} from '../scripts/buildRag';

function validateRagIntegrity(): void {
  console.log('[TEST] Iniciando validação de integridade do pipeline RAG de Sound Design...');

  // 1. Executar buildRag se necessário
  const {chunks, decisionRules} = buildRag();

  const root = process.cwd();
  const chunksJsonlPath = path.resolve(root, 'rag', 'chunks', 'sound-design-chunks.jsonl');
  const knowledgeIndexPath = path.resolve(root, 'rag', 'index', 'knowledge-index.json');
  const decisionRulesPath = path.resolve(root, 'rag', 'index', 'decision-rules.json');
  const audioVocabPath = path.resolve(root, 'rag', 'index', 'audio-vocabulary.json');
  const mixGuidelinesPath = path.resolve(root, 'rag', 'index', 'mix-guidelines.json');
  const sourceMapPath = path.resolve(root, 'rag', 'index', 'source-map.json');
  const readmePath = path.resolve(root, 'rag', 'README.md');

  // 2. Verificar existência de todos os arquivos gerados
  const requiredFiles = [
    chunksJsonlPath,
    knowledgeIndexPath,
    decisionRulesPath,
    audioVocabPath,
    mixGuidelinesPath,
    sourceMapPath,
    readmePath
  ];

  for (const f of requiredFiles) {
    if (!fs.existsSync(f)) {
      throw new Error(`RAG_FILE_MISSING: Arquivo obrigatório não encontrado: ${f}`);
    }
  }

  // 3. Verificar que os 4 arquivos fonte foram processados
  const sourceMap = JSON.parse(fs.readFileSync(sourceMapPath, 'utf8'));
  const sourceKeys = Object.keys(sourceMap.source_files);
  const expectedSources = ['CONT1.md', 'CONT2-2.md', 'CONT3-3.md', 'CONT4-4.md'];

  for (const exp of expectedSources) {
    if (!sourceKeys.includes(exp)) {
      throw new Error(`RAG_SOURCE_MISSING: Arquivo fonte ${exp} não mapeado no source-map`);
    }
  }

  // 4. Validar unicidade de IDs e integridade dos Chunks
  const chunkIds = new Set<string>();
  const chunkContents = new Set<string>();

  for (const chunk of chunks) {
    if (!chunk.id || !chunk.id.startsWith('sd_')) {
      throw new Error(`RAG_INVALID_CHUNK_ID: ID inválido: ${chunk.id}`);
    }
    if (chunkIds.has(chunk.id)) {
      throw new Error(`RAG_DUPLICATE_CHUNK_ID: ID duplicado: ${chunk.id}`);
    }
    chunkIds.add(chunk.id);

    if (!chunk.content || chunk.content.trim().length < 50) {
      throw new Error(`RAG_EMPTY_CONTENT: Conteúdo muito curto ou vazio no chunk: ${chunk.id}`);
    }
    if (chunkContents.has(chunk.content.trim())) {
      throw new Error(`RAG_DUPLICATE_CONTENT: Conteúdo duplicado no chunk: ${chunk.id}`);
    }
    chunkContents.add(chunk.content.trim());

    if (!chunk.sourceFile || !chunk.sourceFile.endsWith('.md')) {
      throw new Error(`RAG_INVALID_SOURCE_FILE: sourceFile inválido no chunk: ${chunk.id}`);
    }

    if (chunk.sourceTimestamp) {
      if (!chunk.sourceTimestamp.start || !chunk.sourceTimestamp.end) {
        throw new Error(`RAG_INVALID_TIMESTAMP: Timestamp incompleto no chunk: ${chunk.id}`);
      }
    }

    for (const tag of chunk.tags) {
      if (!(VALID_CATEGORIES as readonly string[]).includes(tag)) {
        throw new Error(`RAG_INVALID_CATEGORY_TAG: Tag não reconhecida (${tag}) no chunk: ${chunk.id}`);
      }
    }
  }

  // 5. Validar Regras de Decisão e links para chunks existentes
  const ruleIds = new Set<string>();
  const coveredRuleCategories = new Set<string>();

  for (const rule of decisionRules) {
    if (!rule.id || !rule.id.startsWith('rule_')) {
      throw new Error(`RAG_INVALID_RULE_ID: ID de regra inválido: ${rule.id}`);
    }
    if (ruleIds.has(rule.id)) {
      throw new Error(`RAG_DUPLICATE_RULE_ID: ID de regra duplicado: ${rule.id}`);
    }
    ruleIds.add(rule.id);

    if (rule.category) {
      coveredRuleCategories.add(rule.category);
    }

    if (!rule.when || rule.when.length === 0) {
      throw new Error(`RAG_EMPTY_RULE_WHEN: Campo 'when' vazio na regra: ${rule.id}`);
    }
    if (!rule.recommend || rule.recommend.length === 0) {
      throw new Error(`RAG_EMPTY_RULE_RECOMMEND: Campo 'recommend' vazio na regra: ${rule.id}`);
    }
    if (!rule.avoid || rule.avoid.length === 0) {
      throw new Error(`RAG_EMPTY_RULE_AVOID: Campo 'avoid' vazio na regra: ${rule.id}`);
    }
    if (!rule.reason || rule.reason.trim().length < 10) {
      throw new Error(`RAG_EMPTY_RULE_REASON: Motivo muito curto na regra: ${rule.id}`);
    }

    // Verificar se todos os sourceChunks existem no set de chunks
    for (const srcChunkId of rule.sourceChunks) {
      if (!chunkIds.has(srcChunkId)) {
        throw new Error(`RAG_DANGLING_CHUNK_REF: Regra ${rule.id} referencia chunk inexistente: ${srcChunkId}`);
      }
    }
  }

  // 6. Validar que todas as 25 categorias obrigatórias possuem pelo menos uma regra de decisão
  for (const cat of VALID_CATEGORIES) {
    if (!coveredRuleCategories.has(cat)) {
      throw new Error(`RAG_CATEGORY_NOT_COVERED: Categoria obrigatória sem regra de decisão correspondente: ${cat}`);
    }
  }

  // 7. Validar integridade dos arquivos JSON
  JSON.parse(fs.readFileSync(knowledgeIndexPath, 'utf8'));
  JSON.parse(fs.readFileSync(decisionRulesPath, 'utf8'));
  JSON.parse(fs.readFileSync(audioVocabPath, 'utf8'));
  JSON.parse(fs.readFileSync(mixGuidelinesPath, 'utf8'));
  JSON.parse(fs.readFileSync(sourceMapPath, 'utf8'));

  console.log('[PASS] Pipeline RAG de Sound Design validado com 100% de integridade!');
  console.log(JSON.stringify({
    status: 'RAG_INTEGRITY_TESTS_PASS',
    total_chunks: chunks.length,
    total_decision_rules: decisionRules.length,
    total_categories_covered: VALID_CATEGORIES.length,
    source_files_processed: expectedSources.length
  }, null, 2));
}

validateRagIntegrity();
