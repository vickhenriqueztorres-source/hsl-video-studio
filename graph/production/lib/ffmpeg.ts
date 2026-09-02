import fs from 'node:fs';
import path from 'node:path';
import { spawnTool, requireSuccess } from '../../lib/proc';
export function createFfmpeg(root: string) {
  const run = (args: string[]) => spawnTool('ffmpeg', args, { cwd: root, logPath: path.join(root, 'out', 'graph-ffmpeg.log') });
  return {
    concatChunks: async (listPath: string, outPath: string) => requireSuccess(await run(['-y', '-nostdin', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outPath]), 'FFMPEG_CONCAT_FATAL'),
    atempo: (inPath: string, factor: number, outPath: string) => run(['-y', '-hide_banner', '-loglevel', 'error', '-i', inPath, '-filter:a', `atempo=${factor.toFixed(4)}`, outPath]),
    muxFinal: async (visualPath: string, musicPath: string, narrationPath: string, outPath: string, bitrate: string) => requireSuccess(await run(['-y', '-hide_banner', '-loglevel', 'error', '-i', visualPath, '-stream_loop', '-1', '-i', musicPath, '-i', narrationPath, '-filter_complex', '[1:a]volume=0.04[bg];[2:a]volume=1.0[voice];[bg][voice]amix=inputs=2:duration=first[aout]', '-map', '0:v:0', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', bitrate, '-shortest', outPath]), 'FFMPEG_MUX_FATAL'),
  };
}
export function writeConcatList(listPath: string, chunks: string[]) {
  fs.writeFileSync(listPath, chunks.map(f => `file '${path.resolve(f).replace(/\\/g, '/')}'\n`).join(''), 'utf8');
}
export const concatChunks = (listPath: string, outPath: string) => createFfmpeg(process.cwd()).concatChunks(listPath, outPath);
export const atempo = (inPath: string, factor: number, outPath: string) => createFfmpeg(process.cwd()).atempo(inPath, factor, outPath);
export const muxFinal = (visualPath: string, musicPath: string, narrationPath: string, outPath: string, bitrate: string) => createFfmpeg(process.cwd()).muxFinal(visualPath, musicPath, narrationPath, outPath, bitrate);
export async function probe(file: string) {
  const result = requireSuccess(await spawnTool('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file], { cwd: path.dirname(file), logPath: file + '.ffprobe.log' }), 'FFPROBE_ERROR');
  const data = JSON.parse(result.stdout);
  const streams: { codec_type: string; codec_name: string; width?: number; height?: number }[] = data.streams ?? [];
  const video = streams.find(s => s.codec_type === 'video');
  return { duration: Number(data.format?.duration ?? 0), width: video?.width, height: video?.height,
    videoCodec: video?.codec_name, audioCodec: streams.find(s => s.codec_type === 'audio')?.codec_name, streams: streams.length };
}
