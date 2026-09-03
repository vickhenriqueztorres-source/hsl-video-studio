import path from 'node:path';
import type { VisualPrompt, VideoTake } from '../../state';

export const KLING_MODEL = 'Kling 2.5 Turbo' as const;
export const TAKE_SECONDS = 5 as const;
export const SPLIT_OVER = 5.5 as const;

export function takeCount(durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error('durationSeconds inválido');
  return durationSeconds <= SPLIT_OVER ? 1 : Math.ceil(durationSeconds / TAKE_SECONDS);
}

export function planTakes(prompts: readonly VisualPrompt[], images: ReadonlyMap<string, string>, outputDir: string): VideoTake[] {
  return prompts.flatMap(prompt => {
    const image = images.get(prompt.beatId);
    if (!image) throw new Error(`FIREFLY_FIRST_FRAME_MISSING:${prompt.beatId}`);
    return Array.from({ length: takeCount(prompt.durationSeconds) }, (_, offset) => {
      const takeIndex = offset + 1;
      const key = `${prompt.beatId}-take-${takeIndex}`;
      const previous = `${prompt.beatId}-take-${takeIndex - 1}`;
      return {
        beatId: prompt.beatId, takeIndex, ...(takeIndex > 1 ? { dependsOnTake: previous } : {}),
        requestedSeconds: TAKE_SECONDS, firstFrameSource: takeIndex === 1 ? 'image' as const : 'previous-take' as const,
        firstFramePath: takeIndex === 1 ? image : path.join(outputDir, `${previous}-last-frame.png`),
        outputPath: path.join(outputDir, `${key}.mp4`), status: 'pending' as const,
      };
    });
  });
}

export function agentGuide(prompt: VisualPrompt, take: VideoTake) {
  return { defaults: { model: KLING_MODEL, resolution: '1080p', aspect_ratio: '16:9', duration_seconds: TAKE_SECONDS, generate_audio: false },
    items: [{ name: `${take.beatId}-take-${take.takeIndex}`, image: take.firstFramePath,
      prompt: prompt.videoPrompt, model: KLING_MODEL, resolution: '1080p', aspect_ratio: '16:9', duration_seconds: TAKE_SECONDS, generate_audio: false }] };
}
