import {spawnSync} from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {SfxSourcePack} from './sfxCatalog';

export class SfxDownloader {
  public async downloadFile(url: string, outputPath: string): Promise<void> {
    fs.mkdirSync(path.dirname(outputPath), {recursive: true});
    console.log(`[SFX Downloader] Baixando: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SFX_DOWNLOAD_HTTP_ERROR:${response.status}:${url}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    console.log(`[SFX Downloader] Salvo (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB): ${outputPath}`);
  }

  public extractZip(zipPath: string, extractDir: string): void {
    fs.mkdirSync(extractDir, {recursive: true});
    console.log(`[SFX Downloader] Extraindo ${path.basename(zipPath)} para ${extractDir}...`);

    // Tenta tar (nativo no Windows 10/11 e Linux)
    const tarResult = spawnSync('tar', ['-xf', zipPath, '-C', extractDir], {encoding: 'utf8'});
    if (tarResult.status === 0) {
      return;
    }

    // Fallback: PowerShell Expand-Archive no Windows
    if (process.platform === 'win32') {
      const psResult = spawnSync('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force`
      ], {encoding: 'utf8'});

      if (psResult.status === 0) {
        return;
      }
      throw new Error(`SFX_EXTRACT_FAILED:${zipPath}:${psResult.stderr || tarResult.stderr}`);
    }

    throw new Error(`SFX_EXTRACT_FAILED:${zipPath}:${tarResult.stderr}`);
  }

  public async fetchPack(pack: SfxSourcePack, tempRoot: string): Promise<string> {
    const zipPath = path.join(tempRoot, `${pack.id}.zip`);
    const extractPath = path.join(tempRoot, pack.id);

    await this.downloadFile(pack.downloadUrl, zipPath);
    this.extractZip(zipPath, extractPath);

    return extractPath;
  }
}
