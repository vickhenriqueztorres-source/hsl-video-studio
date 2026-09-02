import {spawnSync} from 'child_process';
import fs from 'fs';
import path from 'path';

export class AudioProcessor {
  private readonly processedDir: string;

  constructor(baseDir = process.cwd()) {
    this.processedDir = path.resolve(baseDir, 'public', 'audio', 'processed');
    fs.mkdirSync(this.processedDir, {recursive: true});
  }

  public reverseAudio(inputFile: string, outputFile: string): string {
    const outPath = path.resolve(this.processedDir, outputFile);
    fs.mkdirSync(path.dirname(outPath), {recursive: true});

    const result = spawnSync('ffmpeg', [
      '-y',
      '-i', inputFile,
      '-af', 'areverse',
      '-ar', '48000',
      '-ac', '2',
      '-c:a', 'pcm_s24le',
      outPath
    ], {encoding: 'utf8'});

    if (result.status !== 0) {
      throw new Error(`FFMPEG_REVERSE_FAILED:${inputFile}:${result.stderr}`);
    }

    return outPath;
  }

  public applyParametricEq(inputFile: string, outputFile: string, lowGain = 0, midGain = -6, highGain = 2): string {
    const outPath = path.resolve(this.processedDir, outputFile);
    fs.mkdirSync(path.dirname(outPath), {recursive: true});

    const filter = `equalizer=f=100:width_type=o:w=1:g=${lowGain},equalizer=f=1000:width_type=o:w=1:g=${midGain},equalizer=f=8000:width_type=o:w=1:g=${highGain}`;

    const result = spawnSync('ffmpeg', [
      '-y',
      '-i', inputFile,
      '-af', filter,
      '-ar', '48000',
      '-ac', '2',
      '-c:a', 'pcm_s24le',
      outPath
    ], {encoding: 'utf8'});

    if (result.status !== 0) {
      throw new Error(`FFMPEG_EQ_FAILED:${inputFile}:${result.stderr}`);
    }

    return outPath;
  }
}
