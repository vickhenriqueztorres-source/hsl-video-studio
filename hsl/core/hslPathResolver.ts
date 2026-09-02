import path from 'path';
import fs from 'fs';
import {spawnSync} from 'child_process';

/**
 * Resolução determinística e canônica de caminhos entre o scene-plan.json (relativo ao staticFile)
 * e o filesystem real (diretório public/).
 */
export function resolvePlanAssetToDiskPath(relativePlanPath: string, rootDir: string = process.cwd()): string {
  if (!relativePlanPath) {
    throw new Error('RESOLVE_ASSET_ERROR: Caminho relativo do plano não pode ser vazio.');
  }
  const normalized = relativePlanPath.replace(/^[/\\]+/, '').replace(/\\/g, '/');
  const directPath = path.resolve(rootDir, normalized);
  if (fs.existsSync(directPath)) return directPath;
  const publicPath = path.resolve(rootDir, 'public', normalized);
  if (fs.existsSync(publicPath)) return publicPath;
  return directPath;
}

export interface FfprobeMediaInfo {
  readonly durationSeconds: number;
  readonly width?: number;
  readonly height?: number;
  readonly codecName?: string;
  readonly hasAudio: boolean;
  readonly hasVideo: boolean;
}

/**
 * Inspeciona arquivo de mídia via ffprobe determinístico.
 */
export function inspectMediaWithFfprobe(filePath: string): FfprobeMediaInfo {
  if (!fs.existsSync(filePath)) {
    throw new Error(`FFPROBE_ERROR: Arquivo não encontrado no disco: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    throw new Error(`FFPROBE_ERROR: Arquivo possui 0 bytes: ${filePath}`);
  }

  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-show_entries', 'stream=codec_type,width,height,codec_name',
    '-of', 'json',
    filePath
  ], {encoding: 'utf8'});

  if (result.error || result.status !== 0) {
    throw new Error(`FFPROBE_ERROR: Falha ao inspecionar ${filePath}: ${result.stderr || result.error?.message}`);
  }

  try {
    const data = JSON.parse(result.stdout);
    const duration = parseFloat(data.format?.duration || '0');
    const streams = Array.isArray(data.streams) ? data.streams : [];
    const videoStream = streams.find((s: any) => s.codec_type === 'video');
    const audioStream = streams.find((s: any) => s.codec_type === 'audio');

    return {
      durationSeconds: duration,
      width: videoStream?.width ? parseInt(videoStream.width, 10) : undefined,
      height: videoStream?.height ? parseInt(videoStream.height, 10) : undefined,
      codecName: videoStream?.codec_name || audioStream?.codec_name,
      hasVideo: Boolean(videoStream),
      hasAudio: Boolean(audioStream)
    };
  } catch (err: any) {
    throw new Error(`FFPROBE_JSON_PARSE_ERROR em ${filePath}: ${err.message}`);
  }
}

/**
 * Validação de integridade do Header PNG (Magic Bytes: 89 50 4E 47 0D 0A 1A 0A).
 */
export function isValidPngFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  if (stat.size < 8) return false;

  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(8);
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);

  return (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}
