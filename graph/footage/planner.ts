import { createHash } from 'node:crypto';
import type { HslLongFormProjectPlan } from '../../hsl/core/types';
import type { FootageBrief, FootageOptions } from './contracts';

export const DEFAULT_FOOTAGE_OPTIONS: FootageOptions = {
  mode:'off', sources:['pexels','pixabay','wikimedia','nasa','archive'], maxTimelineShare:0.15, maxCandidatesPerBeat:6,
  maxQueryVariantsPerBeat:2, maxDownloadsPerBeat:2, downloadConcurrency:2,
  maxSearchRequestsPerEpisode:200, maxDownloadBytesPerEpisode:1024*1024*1024,
  sourceAudio:'mute', fallback:'original-provider',
  targetVisualModes:['firefly_video','generated_image_35mm'],
};

export function resolveFootageOptions(value?: Partial<FootageOptions>): FootageOptions {
  return {
    ...DEFAULT_FOOTAGE_OPTIONS,
    ...(value ?? {}),
    sources: value?.sources ? [...value.sources] : [...DEFAULT_FOOTAGE_OPTIONS.sources],
    targetVisualModes: value?.targetVisualModes ? [...value.targetVisualModes] : [...(DEFAULT_FOOTAGE_OPTIONS.targetVisualModes ?? ['firefly_video','generated_image_35mm'])],
  };
}

const excludedVisual = /\b(diagram|schematic|cutaway|cross[- ]section|wireframe|heatmap|equation|blueprint|infographic|flow chart|network map|telemetry|dashboard|typography|simulation|3d model)\b/i;
const stop = new Set(['the','a','an','of','to','and','or','with','from','in','on','at','for','into','over','under','documentary','cinematic','shot','footage','real','showing','shows','wide','close','macro','camera','view','dramatic']);

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>;
    return `{${Object.keys(item).filter(k => item[k] !== undefined).sort().map(k => `${JSON.stringify(k)}:${canonical(item[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export const footageHash = (value: unknown) => createHash('sha256').update(canonical(value)).digest('hex');

function queryFrom(subject: string): string {
  const words = subject.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/)
    .filter(word => word.length > 2 && !stop.has(word));
  return [...new Set(words)].slice(0, 8).join(' ').slice(0, 100).trim();
}

/** Pure, deterministic opportunity planning. It never contacts a provider. */
export function planFootage(
  plan: HslLongFormProjectPlan,
  channelId: string,
  options: FootageOptions,
  reservedBeatIds: ReadonlySet<string> = new Set(),
): FootageBrief[] {
  if (options.mode === 'off') return [];
  const allowedModes = new Set(options.targetVisualModes ?? ['firefly_video', 'generated_image_35mm']);
  const frameBudget = Math.floor(plan.totalFrames * options.maxTimelineShare);
  let used = 0;
  const briefs: FootageBrief[] = [];
  for (const beat of plan.beats) {
    const subject = (beat.promptSubject || beat.cinematicPrompt || '').trim();
    const eligible = !reservedBeatIds.has(beat.beatId)
      && allowedModes.has(beat.visualMode as any)
      && !beat.infographicArchetype
      && !excludedVisual.test(subject)
      && used + beat.durationFrames <= frameBudget;
    if (!eligible) continue;
    const primary = queryFrom(subject);
    if (!primary) continue;
    const queries = [primary];
    const topicQuery = queryFrom(`${plan.episodeTitle} ${primary}`);
    if (topicQuery && topicQuery !== primary && options.maxQueryVariantsPerBeat > 1) queries.push(topicQuery);
    const body: Omit<FootageBrief, 'hash'> = {
      schema: 'hsl-footage-brief/v1', episodeId: plan.episodeId, channelId,
      beatId: beat.beatId, sourceBeatId: beat.sourceBeatId ?? beat.beatId,
      objective: subject, narration: beat.voiceoverScript, usage: 'illustrative_broll',
      queries: queries.slice(0, options.maxQueryVariantsPerBeat),
      exclusions: ['CGI', 'AI-generated imagery', 'logos as primary subject', 'unrelated people', 'burned-in text'],
      durationFrames: beat.durationFrames, durationSeconds: beat.durationFrames / 30,
      fallback: 'original-provider',
    };
    briefs.push({ ...body, hash: footageHash(body) });
    used += beat.durationFrames;
  }
  return briefs;
}

export function validateFootageOptions(options: FootageOptions): void {
  if (!['off','suggest','auto'].includes(options.mode)) throw new Error('FOOTAGE_MODE_INVALID');
  const supported=['pexels','pixabay','wikimedia','nasa','archive'];
  if (!Array.isArray(options.sources) || !options.sources.length || options.sources.some(source => !supported.includes(source)) || new Set(options.sources).size!==options.sources.length) throw new Error('FOOTAGE_SOURCE_INVALID');
  if (!Number.isFinite(options.maxTimelineShare) || options.maxTimelineShare < 0 || options.maxTimelineShare > 0.5) throw new Error('FOOTAGE_SHARE_INVALID');
  if (options.targetVisualModes && (!Array.isArray(options.targetVisualModes) || options.targetVisualModes.some(m => !['firefly_video', 'generated_image_35mm'].includes(m)))) {
    throw new Error('FOOTAGE_TARGET_MODES_INVALID');
  }
  for (const key of ['maxCandidatesPerBeat','maxQueryVariantsPerBeat','maxDownloadsPerBeat','downloadConcurrency','maxSearchRequestsPerEpisode','maxDownloadBytesPerEpisode'] as const) {
    if (!Number.isSafeInteger(options[key]) || options[key] < 1) throw new Error(`FOOTAGE_OPTION_INVALID:${key}`);
  }
  if (options.sourceAudio !== 'mute' || options.fallback !== 'original-provider') throw new Error('FOOTAGE_POLICY_INVALID');
}
