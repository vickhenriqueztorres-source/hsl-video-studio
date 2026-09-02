import {spawnSync} from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface AudioMetadata {
  readonly sampleRate: number;
  readonly bitDepth: number;
  readonly channels: number;
  readonly durationSeconds: number;
  readonly formatName: string;
  readonly sha256: string;
  readonly isValidBroadcastQuality: boolean;
}

export function sha256File(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return `sha256_${crypto.createHash('sha256').update(buffer).digest('hex')}`;
}

export function probeAudio(filePath: string): AudioMetadata {
  const probe = spawnSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'a:0',
    '-show_entries', 'stream=sample_rate,bits_per_raw_sample,bits_per_sample,channels,duration,codec_name',
    '-show_entries', 'format=format_name,duration',
    '-of', 'json',
    filePath
  ], {encoding: 'utf8'});

  if (probe.status !== 0) {
    throw new Error(`FFPROBE_AUDIO_FAILED:${filePath}:${probe.stderr || probe.stdout}`);
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
  const bitDepth = rawBits > 0 ? rawBits : 24; // Default to 24-bit for PCM
  const channels = Number(stream?.channels || 2);
  const durationSeconds = Number(stream?.duration || data.format?.duration || 0);
  const formatName = stream?.codec_name || data.format?.format_name || 'unknown';
  const sha = sha256File(filePath);

  const isValidBroadcastQuality = sampleRate >= 44100 && bitDepth >= 16;

  return {
    sampleRate,
    bitDepth,
    channels,
    durationSeconds,
    formatName,
    sha256: sha,
    isValidBroadcastQuality
  };
}

export function convertToBroadcastWav(inputPath: string, outputPath: string): AudioMetadata {
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});

  const result = spawnSync('ffmpeg', [
    '-y',
    '-i', inputPath,
    '-ar', '48000',
    '-ac', '2',
    '-c:a', 'pcm_s24le',
    outputPath
  ], {encoding: 'utf8'});

  if (result.status !== 0) {
    throw new Error(`FFMPEG_CONVERSION_FAILED:${inputPath} -> ${outputPath}:${result.stderr}`);
  }

  return probeAudio(outputPath);
}
