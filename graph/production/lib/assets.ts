import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { REPO_ROOT } from '../../checkpointer';

export function assertWithin(base: string, target: string): string {
  const resolved = path.resolve(target);
  const relative = path.relative(path.resolve(base), resolved);
  if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error(`PATH_CONFINEMENT: ${resolved} outside ${base}`);
  if (fs.existsSync(resolved)) {
    const realBase = fs.realpathSync(base);
    const realRelative = path.relative(realBase, fs.realpathSync(resolved));
    if (!realRelative || realRelative === '..' || realRelative.startsWith('..' + path.sep) || path.isAbsolute(realRelative)) throw new Error(`PATH_CONFINEMENT: symlink ${resolved}`);
  }
  return resolved;
}
export function assertRepoRoot(root: string) {
  const real = fs.realpathSync(root);
  if (real !== fs.realpathSync(REPO_ROOT)) assertWithin(REPO_ROOT, real);
}
export function removeWithin(root: string, target: string) {
  assertRepoRoot(root);
  fs.rmSync(assertWithin(root, target), { recursive: true, force: true });
}
export function cleanRemotionTemp(root: string, maxAgeMs = 60000) {
  assertRepoRoot(root);
  const temp = os.tmpdir();
  for (const entry of fs.readdirSync(temp)) {
    if (!entry.includes('remotion')) continue;
    const full = assertWithin(temp, path.join(temp, entry));
    try {
      const stat = fs.statSync(full);
      // ISO-03: Proteger temporários de workers ativos; só remove arquivos com idade expirada
      if (Date.now() - stat.mtimeMs > Math.max(maxAgeMs, 30000)) {
        fs.rmSync(full, { recursive: true, force: true });
      }
    } catch (e) {
      // Windows can hold browser files open. Same best-effort cleanup as master.
      if (!(e instanceof Error) || !('code' in e) || !['EBUSY', 'EPERM', 'EACCES', 'ENOENT'].includes(String(e.code))) throw e;
    }
  }
}
export function prunePublicRuns(root: string, episodeId: string) {
  assertRepoRoot(root);
  // ISO-01: Proibir exclusão em massa de outros episódios/canais.
  // Limpeza restrita estritamente a temporários residuais da própria execução solicitante.
  const episodeFolder = path.join(root, 'public', 'runs', episodeId);
  if (fs.existsSync(episodeFolder)) {
    for (const entry of fs.readdirSync(episodeFolder)) {
      if (entry.endsWith('.tmp') || entry.endsWith('.part') || entry.startsWith('.temp')) {
        try { fs.rmSync(path.join(episodeFolder, entry), { recursive: true, force: true }); } catch {}
      }
    }
  }
}
export function syncCurrentRunAssets(root: string, episodeId: string) {
  const src = assertWithin(root, path.join(root, 'runs', episodeId));
  if (!fs.existsSync(src)) return;
  const destinations = ['public/runs', 'public/public/runs'];
  if (fs.existsSync(path.join(root, 'build/public'))) destinations.push('build/public/runs', 'build/public/public/runs');
  for (const destination of destinations) {
    const dest = assertWithin(root, path.join(root, destination, episodeId));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(src, dest, { recursive: true, force: true });
  }
}
