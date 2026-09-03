import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {REPO_ROOT} from '../../checkpointer';
import {walk} from '../../audio/import';
import {assertWithin} from '../lib/assets';
import {md5File} from './hash';
import {driveCheckAuth, driveUploadVerified, driveVerify} from './drive';
import {storageSummary} from './index';
import type {StorageEntry, DriveManifestItem} from './model';

export async function libraryStorage(root: string, action: 'scan'|'upload'|'verify') {
  const bank = path.join(root, 'assets/audio-library'), run = path.join(root, 'runs/.storage/library');
  const indexPath = path.join(run, 'storage-index.json');
  const old: StorageEntry[] = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')).items : [];
  const items: StorageEntry[] = [];
  for (const file of walk(bank)) {
    assertWithin(bank, file);
    const rel = path.relative(root, file).replace(/\\/g, '/'), md5 = await md5File(file);
    const previous = old.find(item => item.path === rel && item.md5 === md5);
    items.push({...previous, path: rel, md5, sizeBytes: fs.statSync(file).size, tier: 'library', status: previous?.status ?? 'local'});
  }
  fs.mkdirSync(run, {recursive: true});
  const save = () => fs.writeFileSync(indexPath, JSON.stringify({items}, null, 2) + '\n');
  save();
  if (action !== 'scan') {
    if (!process.env.HSL_DRIVE_FOLDER_ID) throw new Error('HSL_DRIVE_FOLDER_ID_REQUIRED');
    if ((await driveCheckAuth(root)).exitCode !== 0) throw new Error('DRIVE_AUTH_REQUIRED:npm run hsl:drive:auth');
    // Upload is still verified for existing objects; it never trusts size alone.
    const manifest: DriveManifestItem[] = items.filter(item => action === 'upload' || !!item.driveFileId).map(item => ({
      localPath: path.join(root, item.path), remoteSubpath: '02_ASSETS_LIBRARY/' + item.path.slice('assets/audio-library/'.length),
      md5: item.md5, sizeBytes: item.sizeBytes, driveFileId: item.driveFileId}));
    const manifestPath = path.join(run, `${action}-manifest.json`), resultPath = path.join(run, `${action}-result.json`);
    fs.writeFileSync(manifestPath, JSON.stringify({folderId: process.env.HSL_DRIVE_FOLDER_ID, items: manifest}, null, 2) + '\n');
    const result = await (action === 'upload' ? driveUploadVerified : driveVerify)(root, manifestPath, resultPath);
    for (const item of items) {
      const remote = result.items.find(r => path.resolve(r.localPath) === path.resolve(root, item.path));
      if (!remote) {if (action === 'verify') {item.status = 'pending-upload'; item.error = 'not-uploaded';} continue;}
      item.driveFileId = remote.driveFileId ?? item.driveFileId;
      item.remoteMd5 = remote.remoteMd5;
      const unchanged = await md5File(path.join(root, item.path)) === item.md5;
      if (['uploaded', 'already'].includes(remote.status) && remote.remoteMd5 === item.md5 && unchanged) {
        item.status = 'both'; item.uploadedAt = new Date().toISOString(); delete item.error;
      } else {
        item.status = remote.status === 'mismatch' || !unchanged ? 'mismatch' : 'pending-upload';
        item.error = remote.error ?? (unchanged ? 'remote verification failed' : 'local file changed during upload');
      }
    }
    save();
  }
  return {indexPath, summary: storageSummary(items).library, items};
}
if (require.main === module) {
  const flags = process.argv.slice(2);
  if (flags.some(flag => !['--scan', '--upload', '--verify'].includes(flag)) || flags.length !== 1)
    throw new Error('Use hsl:storage:library -- --scan|--upload|--verify (library is never pruned)');
  libraryStorage(REPO_ROOT, flags[0].slice(2) as 'scan'|'upload'|'verify')
    .then(r => {console.log(JSON.stringify({indexPath: r.indexPath, ...r.summary}, null, 2));
      if (flags[0] !== '--scan' && r.items.some(x => x.status !== 'both')) process.exitCode = 2;})
    .catch(e => {console.error(e.message); process.exitCode = 1;});
}
