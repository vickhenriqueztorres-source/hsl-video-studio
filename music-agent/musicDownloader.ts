import fs from 'fs';
import path from 'path';
import {MusicTrackSource} from './musicCatalog';

export class MusicDownloader {
  public async downloadTrack(track: MusicTrackSource, outputPath: string): Promise<string> {
    fs.mkdirSync(path.dirname(outputPath), {recursive: true});
    console.log(`[Music Downloader] Baixando: ${track.title} (${track.artist}) - ${track.downloadUrl}`);

    const response = await fetch(track.downloadUrl);
    if (!response.ok) {
      throw new Error(`MUSIC_DOWNLOAD_FAILED:${response.status}:${track.downloadUrl}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    console.log(`[Music Downloader] Salvo (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB): ${outputPath}`);
    return outputPath;
  }
}
