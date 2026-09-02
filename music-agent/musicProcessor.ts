import {spawnSync} from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface MusicTrackMetadata {
  readonly sampleRate: number;
  readonly bitDepth: number;
  readonly channels: number;
  readonly durationSeconds: number;
  readonly formatName: string;
  readonly sha256: string;
  readonly isValidMusicQuality: boolean;
}

export function sha256File(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return `sha256_${crypto.createHash('sha256').update(buffer).digest('hex')}`;
}

export function probeMusicTrack(filePath: string): MusicTrackMetadata {
  const probe = spawnSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'a:0',
    '-show_entries', 'stream=sample_rate,bits_per_raw_sample,bits_per_sample,channels,duration,codec_name',
    '-show_entries', 'format=format_name,duration',
    '-of', 'json',
    filePath
  ], {encoding: 'utf8'});

  if (probe.status !== 0) {
    throw new Error(`FFPROBE_MUSIC_FAILED:${filePath}:${probe.stderr || probe.stdout}`);
  }

  const data = JSON.parse(probe.stdout) as {
    streams?: Array<{
      sample_rate?: string | number;
      bits_per_raw_sample?: string | number;
      bits_per_sample?: string | number;
      channels?: number;
      duration?: string | number;
      codec_name?: string;
    }>;
    format?: {
      format_name?: string;
      duration?: string | number;
    };
  };

  const stream = data.streams?.[0];
  const sampleRate = Number(stream?.sample_rate || 44100);
  const rawBits = Number(stream?.bits_per_raw_sample || stream?.bits_per_sample || 0);
  const bitDepth = rawBits > 0 ? rawBits : 24;
  const channels = Number(stream?.channels || 2);
  const durationSeconds = Number(stream?.duration || data.format?.duration || 0);
  const formatName = stream?.codec_name || data.format?.format_name || 'unknown';
  const sha = sha256File(filePath);

  const isValidMusicQuality = sampleRate >= 44100 && channels >= 2 && durationSeconds >= 10;

  return {
    sampleRate,
    bitDepth,
    channels,
    durationSeconds,
    formatName,
    sha256: sha,
    isValidMusicQuality
  };
}

export function normalizeMusicTrack(inputPath: string, outputPath: string): MusicTrackMetadata {
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});

  const isWav = outputPath.endsWith('.wav');
  const ffmpegArgs = isWav
    ? ['-y', '-i', inputPath, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', outputPath]
    : ['-y', '-i', inputPath, '-ar', '48000', '-ac', '2', '-b:a', '320k', outputPath];

  const result = spawnSync('ffmpeg', ffmpegArgs, {encoding: 'utf8'});
  if (result.status !== 0) {
    throw new Error(`FFMPEG_MUSIC_CONVERSION_FAILED:${inputPath} -> ${outputPath}:${result.stderr}`);
  }

  return probeMusicTrack(outputPath);
}
