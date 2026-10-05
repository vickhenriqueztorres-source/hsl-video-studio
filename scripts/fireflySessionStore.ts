import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..');
const STORE_DIR = path.join(REPO_ROOT, '.firefly-session');
const DEFAULT_PROFILE = process.env.HSL_FIREFLY_CHROME_PROFILE || 'D:\\HSL-FIREFLY-PROFILE';

export function saveSession(sourceDir = DEFAULT_PROFILE): boolean {
  if (!fs.existsSync(sourceDir)) {
    console.error(`[SESSION-STORE] Diretorio de origem nao existe: ${sourceDir}`);
    return false;
  }
  fs.mkdirSync(STORE_DIR, { recursive: true });
  console.log(`[SESSION-STORE] Salvando sessao persistente de ${sourceDir} para ${STORE_DIR}...`);
  try {
    fs.cpSync(sourceDir, STORE_DIR, { recursive: true, force: true });
    console.log(`[SESSION-STORE] Sessao salva com sucesso na raiz do projeto (.firefly-session)!`);
    return true;
  } catch (err: any) {
    console.error(`[SESSION-STORE] Erro ao salvar sessao: ${err.message}`);
    return false;
  }
}

export function restoreSession(targetDir = DEFAULT_PROFILE): boolean {
  if (!fs.existsSync(STORE_DIR)) {
    console.log(`[SESSION-STORE] Nenhum backup de sessao encontrado em ${STORE_DIR}`);
    return false;
  }
  console.log(`[SESSION-STORE] Restaurando sessao persistente de ${STORE_DIR} para ${targetDir}...`);
  try {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.cpSync(STORE_DIR, targetDir, { recursive: true, force: true });
    console.log(`[SESSION-STORE] Sessao restaurada com sucesso para ${targetDir}!`);
    return true;
  } catch (err: any) {
    console.error(`[SESSION-STORE] Erro ao restaurar sessao: ${err.message}`);
    return false;
  }
}

if (require.main === module) {
  const action = process.argv[2] || 'save';
  if (action === 'save') {
    saveSession();
  } else if (action === 'restore') {
    restoreSession();
  } else {
    console.log('Uso: ts-node scripts/fireflySessionStore.ts [save|restore]');
  }
}
