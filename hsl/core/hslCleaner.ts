import fs from 'fs';
import path from 'path';
import { HslRunIdentity } from './hslRunIdentity';
import { HslRunManifest } from './hslRunManifest';

export interface CleanupResult {
  readonly runId: string;
  readonly freedBytes: number;
  readonly deletedFilesCount: number;
  readonly preservedDeliverables: string[];
}

export class HslCleaner {
  /**
   * Remove com segurança apenas arquivos intermediários transitórios de uma run CONCLUÍDA.
   * Proibido tocar em runs incompletas ou apagar áudio, vídeo master ou thumbnails.
   */
  public static cleanIntermediates(runIdOrHandle: string, rootDir: string = process.cwd()): CleanupResult {
    let identity;
    try {
      identity = HslRunIdentity.parse(runIdOrHandle);
    } catch {
      identity = { project: 'hsl', episode: runIdOrHandle.toLowerCase(), version: 1 };
    }

    const runId = HslRunIdentity.buildRunId(identity.project, identity.episode, identity.version);
    const manifest = new HslRunManifest(runId, rootDir);
    const manifestData = manifest.getData();

    // Bloqueia se a run não estiver concluída
    if (manifestData.overallStatus !== 'COMPLETED') {
      // Se for formato legado, checa se os entregáveis existem antes de permitir
      const outLegacy = path.resolve(rootDir, 'out', `${runIdOrHandle.toLowerCase()}.mp4`);
      if (!fs.existsSync(outLegacy)) {
        throw new Error(
          `CLEANUP_BLOCKED_FATAL: A run '${runIdOrHandle}' está com status '${manifestData.overallStatus}'. A limpeza de intermediários é permitida apenas para runs com status 'COMPLETED'.`
        );
      }
    }

    let deletedFilesCount = 0;
    let freedBytes = 0;

    // Pastas de intermediários (frames e vídeos dos beats)
    const possibleInterDirs = [
      HslRunIdentity.getPublicRunDirectory(identity, rootDir),
      path.resolve(rootDir, 'public', 'runs', runIdOrHandle),
      path.resolve(rootDir, 'runs', runIdOrHandle, 'frames'),
      path.resolve(rootDir, 'runs', runIdOrHandle, 'videos')
    ];

    for (const baseDir of possibleInterDirs) {
      if (!fs.existsSync(baseDir)) continue;

      const subdirs = ['frames', 'videos'];
      for (const sub of subdirs) {
        const subPath = path.resolve(baseDir, sub);
        if (fs.existsSync(subPath)) {
          const files = fs.readdirSync(subPath);
          for (const f of files) {
            const filePath = path.resolve(subPath, f);
            try {
              const stat = fs.statSync(filePath);
              freedBytes += stat.size;
              fs.unlinkSync(filePath);
              deletedFilesCount++;
            } catch {}
          }
        }
      }
    }

    const preservedDeliverables = [
      'scene-plan.json',
      'run-manifest.json',
      'narration.mp3',
      'thumbnails/*.png',
      'publication-package.json',
      'out/*.mp4'
    ];

    console.log(`\n🧹 LIMPEZA DE INTERMEDIÁRIOS CONCLUÍDA PARA: ${runIdOrHandle}`);
    console.log(`   Arquivos intermediários deletados: ${deletedFilesCount}`);
    console.log(`   Espaço em disco liberado: ${(freedBytes / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Entregáveis preservados: ${preservedDeliverables.join(', ')}\n`);

    return {
      runId: runIdOrHandle,
      freedBytes,
      deletedFilesCount,
      preservedDeliverables
    };
  }
}
