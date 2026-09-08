import fs from 'node:fs';
import path from 'node:path';
import { spawnTool, requireSuccess } from '../../lib/proc';
export function createFfmpeg(root: string) {
  const run = (args: string[]) => spawnTool('ffmpeg', args, { cwd: root, logPath: path.join(root, 'out', 'graph-ffmpeg.log') });
  return {
    concatChunks: async (listPath: string, outPath: string) => requireSuccess(await run(['-y', '-nostdin', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outPath]), 'FFMPEG_CONCAT_FATAL'),
    atempo: (inPath: string, factor: number, outPath: string) => {
      let f = factor;
      const filters: string[] = [];
      while (f < 0.5) { filters.push('atempo=0.5'); f /= 0.5; }
      while (f > 2.0) { filters.push('atempo=2.0'); f /= 2.0; }
      filters.push(`atempo=${f.toFixed(4)}`);
      const codec = /\.wav$/i.test(outPath)
        ? ['-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le']
        : ['-ar', '48000', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k'];
      return run(['-y', '-hide_banner', '-loglevel', 'error', '-i', inPath, '-filter:a', filters.join(','), ...codec, outPath]);
    },
    syncNarration: (inPath: string, targetDuration: number, outPath: string) => run(['-y', '-hide_banner', '-loglevel', 'error', '-i', inPath, '-af', `apad=whole_dur=${targetDuration.toFixed(3)},atrim=0:${targetDuration.toFixed(3)}`, outPath]),
    muxFinal: async (visualPath: string, musicPath: string, narrationPath: string, outPath: string, bitrate: string) => {
      if (!fs.existsSync(visualPath)) throw new Error(`FFMPEG_VISUAL_REQUIRED: ${visualPath}`);
      if (!fs.existsSync(narrationPath)) throw new Error(`FFMPEG_NARRATION_REQUIRED: ${narrationPath}`);
      if (!fs.existsSync(musicPath)) throw new Error(`FFMPEG_MUSIC_REQUIRED: ${musicPath}`);
      const args = ['-y', '-hide_banner', '-loglevel', 'error', '-i', visualPath, '-stream_loop', '-1', '-i', musicPath, '-i', narrationPath, '-filter_complex', '[1:a]volume=0.04[bg];[2:a]volume=1.0[voice];[bg][voice]amix=inputs=2:duration=first[aout]', '-map', '0:v:0', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', bitrate, '-shortest', outPath];
      return requireSuccess(await run(args), 'FFMPEG_MUX_FATAL');
    },
    muxFinalWithSfx: async (visualPath: string, musicPath: string, narrationPath: string, sfxPath: string, outPath: string, bitrate: string) => {
      if (!fs.existsSync(visualPath)) throw new Error(`FFMPEG_VISUAL_REQUIRED: ${visualPath}`);
      if (!fs.existsSync(narrationPath)) throw new Error(`FFMPEG_NARRATION_REQUIRED: ${narrationPath}`);
      if (!fs.existsSync(musicPath)) throw new Error(`FFMPEG_MUSIC_REQUIRED: ${musicPath}`);
      if (!fs.existsSync(sfxPath)) throw new Error(`FFMPEG_SFX_REQUIRED: ${sfxPath}`);
      const args = ['-y','-hide_banner','-loglevel','error','-i',visualPath,'-stream_loop','-1','-i',musicPath,'-i',narrationPath,'-i',sfxPath,'-filter_complex','[1:a]volume=0.04[bg];[2:a]asplit=2[voice][side];[bg][side]sidechaincompress=threshold=0.125:ratio=8:attack=20:release=500[ducked];[3:a]volume=0.70[sfx];[ducked][voice][sfx]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.95[aout]','-map','0:v:0','-map','[aout]','-c:v','copy','-c:a','aac','-b:a',bitrate,'-ar','48000','-ac','2','-shortest',outPath];
      return requireSuccess(await run(args),'FFMPEG_MUX_SFX_FATAL');
    },
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
