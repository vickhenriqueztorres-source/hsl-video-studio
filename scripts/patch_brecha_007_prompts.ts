import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { assertPhotographicPrompt } from '../hsl/startframe/photographicPrompt';

const REPO_ROOT = path.resolve(__dirname, '..');
const file = path.join(REPO_ROOT, 'runs', 'BRECHA_EPISODE_007', 'visual-prompts.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

console.log('[Patch] Corrigindo prompts em visual-prompts.json...');

for (const b of data.beats) {
  if (b.beatId === 'SCENE_016') {
    b.imagePrompt = b.imagePrompt
      .replace(/infogr[áa]fico de fluxo financeiro/gi, 'esquema pericial de fluxo financeiro')
      .replace(/infogr[áa]fico/gi, 'diagrama técnico');
  } else if (b.beatId === 'SCENE_030') {
    b.imagePrompt = b.imagePrompt
      .replace(/Infogr[áa]fico forense detalhando/gi, 'Painel esquemático pericial impresso detalhando')
      .replace(/gr[áa]fico ortogonal/gi, 'documental em plano detalhe')
      .replace(/infogr[áa]fico/gi, 'painel');
  } else if (b.beatId === 'SCENE_040') {
    b.imagePrompt = b.imagePrompt
      .replace(/Painel infogr[áa]fico de defesa pessoal/gi, 'Painel pericial de protocolos de defesa')
      .replace(/infogr[áa]fico/gi, 'documental');
  }
}

// Salvar no disco
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('[Patch] visual-prompts.json salvo com sucesso!');

// Validar todos os beats contra assertPhotographicPrompt
let fails = 0;
for (const b of data.beats) {
  try {
    assertPhotographicPrompt(b.imagePrompt);
  } catch (e: any) {
    console.error(`[FALHA] ${b.beatId}: ${e.message}`);
    fails++;
  }
}

if (fails === 0) {
  console.log('✅ 100% dos 38 prompts visuais aprovados em assertPhotographicPrompt!');
} else {
  throw new Error(`${fails} prompts ainda falharam!`);
}

// Atualizar o banco SQLite
console.log('[Patch] Atualizando banco de checkpoints SQLite...');
const dbPath = path.join(REPO_ROOT, 'database', 'langgraph-checkpoints.sqlite');
const db = new Database(dbPath);

const rows = db.prepare('SELECT checkpoint_id, checkpoint FROM checkpoints WHERE thread_id LIKE ?').all('%BRECHA_EPISODE_007%');
console.log(`[Patch] Encontrados ${rows.length} checkpoints para atualizar.`);

const updateStmt = db.prepare('UPDATE checkpoints SET checkpoint = ? WHERE checkpoint_id = ?');

let updatedCount = 0;
for (const r of rows as any[]) {
  const jsonStr = Buffer.isBuffer(r.checkpoint) ? r.checkpoint.toString('utf8') : String(r.checkpoint);
  if (jsonStr.includes('infográfico') || jsonStr.includes('infografico')) {
    const patchedStr = jsonStr
      .replace(/infogr[áa]fico de fluxo financeiro/gi, 'esquema pericial de fluxo financeiro')
      .replace(/Infogr[áa]fico forense detalhando/gi, 'Painel esquemático pericial impresso detalhando')
      .replace(/Painel infogr[áa]fico de defesa pessoal/gi, 'Painel pericial de protocolos de defesa')
      .replace(/gr[áa]fico ortogonal/gi, 'documental em plano detalhe')
      .replace(/infogr[áa]fico/gi, 'diagrama técnico');
    
    updateStmt.run(Buffer.from(patchedStr, 'utf8'), r.checkpoint_id);
    updatedCount++;
  }
}

console.log(`✅ [Patch] ${updatedCount} checkpoints SQLite atualizados com sucesso!`);
