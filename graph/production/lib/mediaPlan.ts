import { createHash } from 'node:crypto';
import type { HslLongFormProjectPlan, HslSceneBeat, MediaPlan, MediaPlanBeat, MediaPolicy, MotionIntent } from '../../../hsl/core/types';
import type { State } from '../state';

export type { MediaPolicy, MediaPlan, MediaPlanBeat, MediaProvider, MotionIntent } from '../../../hsl/core/types';

export const MEDIA_PLAN_SCHEMA = 'hsl-media-plan/v1' as const;
export const MEDIA_FPS = 30 as const;
export const MEDIA_TAKE_SECONDS = 5 as const;
const policies: readonly MediaPolicy[] = ['stills', 'local-motion', 'firefly-hybrid'];

function assertPolicy(policy: unknown): asserts policy is MediaPolicy {
  if (!policies.includes(policy as MediaPolicy)) throw new Error(`MEDIA_POLICY_INVALID:${String(policy)}`);
}

/** Structural input permits older checkpoints whose graph options lack mediaPolicy. */
export function resolveMediaPolicy(s: { options: { graph: { mediaPolicy?: MediaPolicy; mediaMode?: string } } }): MediaPolicy {
  const graph = s.options.graph;
  const policy = graph.mediaPolicy ?? (graph.mediaMode === 'legacy' ? 'local-motion' : 'firefly-hybrid');
  assertPolicy(policy);
  if (graph.mediaMode === 'legacy' && policy === 'firefly-hybrid') throw new Error('MEDIA_POLICY_MODE_CONFLICT:legacy:firefly-hybrid');
  return policy;
}

/** Cover every timeline frame. There is no implicit hold or slow-down allowance. */
export function mediaTakeCount(durationFrames: number): number {
  if (!Number.isSafeInteger(durationFrames) || durationFrames <= 0) throw new Error('MEDIA_PLAN_DURATION_INVALID');
  return Math.ceil(durationFrames / (MEDIA_FPS * MEDIA_TAKE_SECONDS));
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).filter(key => object[key] !== undefined).sort().map(key => `${JSON.stringify(key)}:${canonical(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
function hash(value: unknown): string { return createHash('sha256').update(canonical(value)).digest('hex'); }

function validateTimeline(plan: HslLongFormProjectPlan): void {
  if (!plan?.episodeId || !Array.isArray(plan.beats) || !plan.beats.length) throw new Error('MEDIA_PLAN_SCENES_EMPTY');
  const ids = new Set<string>();
  for (const beat of plan.beats) {
    if (typeof beat.beatId !== 'string' || !beat.beatId.trim() || ids.has(beat.beatId)) throw new Error(`MEDIA_PLAN_BEAT_ID_INVALID:${beat.beatId}`);
    ids.add(beat.beatId);
    if (beat.sourceBeatId !== undefined && (typeof beat.sourceBeatId !== 'string' || !beat.sourceBeatId.trim())) throw new Error(`MEDIA_PLAN_SOURCE_ID_INVALID:${beat.beatId}`);
    if (!Number.isSafeInteger(beat.durationFrames) || beat.durationFrames <= 0 || !Number.isFinite(beat.durationSeconds)
      || Math.abs(beat.durationSeconds * MEDIA_FPS - beat.durationFrames) > 1e-6) throw new Error(`MEDIA_PLAN_DURATION_INVALID:${beat.beatId}`);
    if (!['firefly_video', 'generated_image_35mm', 'vector_remotion', 'motion_image_diagram'].includes(beat.visualMode)) throw new Error(`MEDIA_PLAN_VISUAL_MODE_INVALID:${beat.beatId}`);
    if (beat.mediaProvider !== undefined && !['none', 'local-ffmpeg', 'firefly-kling', 'remotion-authored'].includes(beat.mediaProvider)) throw new Error(`MEDIA_PLAN_PROVIDER_INVALID:${beat.beatId}`);
  }
  const frames = plan.beats.reduce((sum, beat) => sum + beat.durationFrames, 0);
  if (!Number.isSafeInteger(plan.totalFrames) || frames !== plan.totalFrames || plan.totalBeatsCount !== plan.beats.length
    || !Number.isFinite(plan.totalDurationSeconds) || Math.abs(plan.totalDurationSeconds * MEDIA_FPS - frames) > 1e-6) {
    throw new Error('MEDIA_PLAN_TIMELINE_MISMATCH:normalize-before-planning');
  }
}

// Cached scene-director plans have no promptSubject. Their cinematic prefix has
// generic typography instructions, so only specific diagram/telemetry content
// is excluded here (never the generic prefix).
const diagramContent = /\b(diagrams?|schematic|cutaway|cross[- ]section|wireframe|heatmaps?|equations?|blueprint|infographic|flow chart|network map|world map|topographic|holographic|simulation|computational fluid dynamics|telemetry|dashboard|spectrum analyzer|typography card|identity card|countdown timer)\b|\b3d\b.*\b(animation|visualization|graphic|model|map)\b/i;

type Motion = { intent: MotionIntent; reason: string };
function motionFor(beat: HslSceneBeat): Motion {
  const subject = beat.promptSubject?.trim() || beat.cinematicPrompt?.trim() || '';
  if (beat.infographicArchetype || beat.visualMode === 'vector_remotion' || beat.visualMode === 'motion_image_diagram' || diagramContent.test(subject)) {
    return { intent: 'none', reason: 'Preserve infographic, diagram, or telemetry precision; no generated video.' };
  }
  if (!subject) {
    if (beat.visualMode === 'firefly_video' || (beat.motionIntent && beat.motionIntent !== 'none')) throw new Error(`MEDIA_PLAN_VIDEO_MALFORMED:${beat.beatId}:missing-subject`);
    return { intent: 'none', reason: 'No explicit physical subject available for motivated motion.' };
  }
  if (beat.motionIntent !== undefined) {
    if (!['none', 'camera', 'physical'].includes(beat.motionIntent) || !beat.motionReason?.trim()) throw new Error(`MEDIA_PLAN_MOTION_METADATA_INVALID:${beat.beatId}`);
    // An authored video is retained unless explicitly malformed. Projected local
    // video is distinguishable by provider and is never relabelled as Firefly.
    if (beat.motionIntent !== 'none' || beat.visualMode !== 'firefly_video') return { intent: beat.motionIntent, reason: beat.motionReason };
  }
  if (beat.visualMode === 'firefly_video') return {
    intent: beat.narrativeRole === 'KINETIC_FLOW' ? 'physical' : 'camera',
    reason: 'Preserve the explicitly authored video beat and its continuous motion.',
  };
  // Deterministic migration for older all-image plans, independent of beat IDs
  // that normalization may already have renumbered. Never promote for a quota.
  if (beat.narrativeRole === 'KINETIC_FLOW') return { intent: 'physical', reason: 'KINETIC_FLOW physical scene: show the continuous process described by the narrative.' };
  if ((beat.narrativeRole === 'MONUMENTAL_HOOK' || beat.pacingType === 'HERO_EXPLORATION') && beat.cameraMovement !== 'LOCKED_TELEMETRY') {
    return { intent: 'camera', reason: `Reveal the physical setting with ${beat.cameraMovement} during the hook or hero exploration.` };
  }
  return { intent: 'none', reason: 'No explicit narrative requirement for physical action or a hook/hero camera reveal.' };
}

/** Pure planning over the final normalized timeline; never generates media. */
export function planMedia(plan: HslLongFormProjectPlan, policy: MediaPolicy, authoredBeatIds: ReadonlySet<string> = new Set()): { scenePlan: HslLongFormProjectPlan; mediaPlan: MediaPlan } {
  assertPolicy(policy);
  validateTimeline(plan);
  const entries: MediaPlanBeat[] = [];
  const beats: HslSceneBeat[] = plan.beats.map(beat => {
    const motion = motionFor(beat);
    const authored = authoredBeatIds.has(beat.beatId);
    const provider = authored ? 'remotion-authored' : policy === 'stills' || motion.intent === 'none' ? 'none'
      : policy === 'local-motion' || beat.mediaProvider === 'local-ffmpeg' ? 'local-ffmpeg' : 'firefly-kling';
    const sourceBeatId = beat.sourceBeatId ?? beat.beatId;
    entries.push({ beatId: beat.beatId, sourceBeatId, provider,
      motionIntent: provider === 'none' ? 'none' : authored ? 'physical' : motion.intent,
      reason: authored ? 'Authored Remotion scene selected from the script by the motion squad.' : policy === 'stills' ? `Stills policy: ${motion.reason}` : motion.reason,
      durationFrames: beat.durationFrames, takeCount: provider === 'firefly-kling' ? mediaTakeCount(beat.durationFrames) : 0,
    });
    return { ...beat, sourceBeatId, mediaProvider: provider, motionIntent: authored ? 'physical' : motion.intent,
      motionReason: authored ? 'Code-authored motion derived from the approved script.' : motion.reason,
      ...(authored ? { outputVideoPath: `public/runs/${plan.episodeId}/motion/${beat.beatId}.mp4` } : {}),
      visualMode: provider !== 'none' ? 'firefly_video' : beat.visualMode === 'firefly_video' ? 'generated_image_35mm' : beat.visualMode,
    };
  });
  const scenePlan: HslLongFormProjectPlan = { ...plan, beats };
  const firefly = entries.filter(beat => beat.provider === 'firefly-kling');
  const authored = entries.filter(beat => beat.provider === 'remotion-authored');
  if (policy === 'firefly-hybrid' && !firefly.length && !authored.length) throw new Error('MEDIA_PLAN_REQUIRED_PROVIDER_EMPTY');
  const body: Omit<MediaPlan, 'hash'> = {
    schema: MEDIA_PLAN_SCHEMA, scenePlanHash: hash(scenePlan), episodeId: plan.episodeId, policy,
    fps: MEDIA_FPS, takeSeconds: MEDIA_TAKE_SECONDS, coveragePolicy: 'full-coverage-trim', beats: entries,
    totalFrames: plan.totalFrames, totalBeats: beats.length, totalTakes: firefly.reduce((sum, beat) => sum + beat.takeCount, 0),
    fireflyBeatIds: firefly.map(beat => beat.beatId),
    localMotionBeatIds: entries.filter(beat => beat.provider === 'local-ffmpeg').map(beat => beat.beatId),
    stillBeatIds: entries.filter(beat => beat.provider === 'none').map(beat => beat.beatId),
    ...(authored.length ? { authoredBeatIds: authored.map(beat => beat.beatId) } : {}),
    fireflyFrames: firefly.reduce((sum, beat) => sum + beat.durationFrames, 0),
  };
  return { scenePlan, mediaPlan: { ...body, hash: hash(body) } };
}

/** Verify the exact ordered ID/duration/provider contract and its content hash. */
export function validateMediaPlan(scenePlan: HslLongFormProjectPlan, mediaPlan: MediaPlan): void {
  if (!mediaPlan || mediaPlan.schema !== MEDIA_PLAN_SCHEMA || !Array.isArray(mediaPlan.beats)) throw new Error('MEDIA_PLAN_SCHEMA_INVALID');
  validateTimeline(scenePlan);
  assertPolicy(mediaPlan.policy);
  if (mediaPlan.beats.length !== scenePlan.beats.length || mediaPlan.beats.some((beat, index) => beat.beatId !== scenePlan.beats[index].beatId)) throw new Error('MEDIA_PLAN_BEAT_SET_MISMATCH');
  if (mediaPlan.beats.some((beat, index) => beat.durationFrames !== scenePlan.beats[index].durationFrames)) throw new Error('MEDIA_PLAN_DURATION_MISMATCH');
  const authored = new Set(mediaPlan.authoredBeatIds ?? mediaPlan.beats.filter(beat => beat.provider === 'remotion-authored').map(beat => beat.beatId));
  const expected = planMedia(scenePlan, mediaPlan.policy, authored);
  if (canonical(expected.scenePlan) !== canonical(scenePlan)) throw new Error('MEDIA_PLAN_SCENE_PROJECTION_MISMATCH');
  if (canonical(expected.mediaPlan) !== canonical(mediaPlan)) throw new Error('MEDIA_PLAN_CONTRACT_MISMATCH');
}

export function assertMediaPlan(s: Pick<State, 'scenePlan' | 'mediaPlan' | 'options'>): MediaPlan {
  if (!s.scenePlan || !s.mediaPlan) throw new Error('MEDIA_PLAN_MISSING');
  if (s.mediaPlan.policy !== resolveMediaPolicy(s)) throw new Error('MEDIA_PLAN_POLICY_MISMATCH');
  validateMediaPlan(s.scenePlan, s.mediaPlan);
  return s.mediaPlan;
}
