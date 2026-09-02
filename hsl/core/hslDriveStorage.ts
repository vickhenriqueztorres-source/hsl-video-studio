import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';

export class HslDriveStorage {
  private static readonly SCRIPT_PATH = path.resolve(process.cwd(), 'scripts', 'driveSync.py');
  private static readonly DEFAULT_FOLDER_ID = '1j2tFJVmQrXOLE_aEvlDG1Yo1zQUx-sTq';

  /**
   * Sincroniza entregáveis de um episódio ou de todos para o Google Drive
   */
  public static syncDeliveries(folderId = this.DEFAULT_FOLDER_ID): boolean {
    console.log('\n☁️ [Google Drive] Sincronizando entregáveis finais (MP4, Thumbs 4K, SEO)...');
    const res = spawnSync('python', [
      this.SCRIPT_PATH,
      '--folder-id', folderId,
      '--action', 'deliveries'
    ], { encoding: 'utf8' });

    if (res.status === 0) {
      console.log('✅ [Google Drive] Entregáveis sincronizados com sucesso na nuvem!');
      return true;
    } else {
      console.warn(`⚠️ [Google Drive] Aviso na sincronização: ${res.stderr || res.stdout}`);
      return false;
    }
  }

  /**
   * Sincroniza manifests, planos de cena e áudios master (saves) para o Google Drive
   */
  public static syncSaves(folderId = this.DEFAULT_FOLDER_ID): boolean {
    console.log('\n☁️ [Google Drive] Sincronizando saves e manifests de episódios...');
    const res = spawnSync('python', [
      this.SCRIPT_PATH,
      '--folder-id', folderId,
      '--action', 'saves'
    ], { encoding: 'utf8' });

    if (res.status === 0) {
      console.log('✅ [Google Drive] Saves sincronizados com sucesso na nuvem!');
      return true;
    } else {
      console.warn(`⚠️ [Google Drive] Aviso na sincronização de saves: ${res.stderr || res.stdout}`);
      return false;
    }
  }

  /**
   * Limpa partes temporárias e caches pesados pós-render para manter o PC sempre leve
   */
  public static pruneRenderIntermediates(episodeId: string): void {
    const root = process.cwd();
    console.log(`\n🧹 [Auto-Cleanup] Limpando chunks temporários do episódio ${episodeId}...`);

    // Chunks em out/
    const outDir = path.resolve(root, 'out');
    if (fs.existsSync(outDir)) {
      for (const f of fs.readdirSync(outDir)) {
        if (f.toLowerCase().includes(episodeId.toLowerCase()) && (f.startsWith('temp_') || f.startsWith('concat_'))) {
          try {
            fs.unlinkSync(path.join(outDir, f));
            console.log(`🧹 Removido chunk temporário: out/${f}`);
          } catch {}
        }
      }
    }

    // Cache build/ do Remotion
    const buildDir = path.resolve(root, 'build');
    if (fs.existsSync(buildDir)) {
      try {
        fs.rmSync(buildDir, { recursive: true, force: true });
        console.log(`🧹 Removido cache build/ do Remotion`);
      } catch {}
    }

    // Cópias redundantes em public/runs/
    const publicRuns = path.resolve(root, 'public', 'runs');
    if (fs.existsSync(publicRuns)) {
      try {
        fs.rmSync(publicRuns, { recursive: true, force: true });
        console.log(`🧹 Removidas cópias espelho de public/runs/`);
      } catch {}
    }
  }
}
