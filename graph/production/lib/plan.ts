import type { HslLongFormProjectPlan, HslSceneBeat } from '../../../hsl/core/types';

const FPS = 30;

function allocate(total: number, weights: readonly number[], minimum = 0): number[] {
  if (!Number.isSafeInteger(total) || total < minimum * weights.length) throw new Error('PLAN_ALLOCATION_INVALID');
  const remaining = total - minimum * weights.length;
  const sum = weights.reduce((n, value) => n + Math.max(0, value), 0) || weights.length;
  const raw = weights.map(value => remaining * (Math.max(0, value) / sum));
  const result = raw.map(value => Math.floor(value) + minimum);
  let missing = total - result.reduce((n, value) => n + value, 0);
  const order = raw.map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let i = 0; i < missing; i++) result[order[i % order.length].index]++;
  return result;
}

function evenlySelect<T>(items: readonly T[], count: number): T[] {
  if (count >= items.length) return [...items];
  if (count === 1) return [items[Math.floor(items.length / 2)]];
  const used = new Set<number>();
  const selected: T[] = [];
  for (let i = 0; i < count; i++) {
    let index = Math.round(i * (items.length - 1) / (count - 1));
    while (used.has(index) && index + 1 < items.length) index++;
    used.add(index); selected.push(items[index]);
  }
  return selected;
}

/**
 * The legacy scene director owns a canonical ten-minute storyboard. It updates
 * the plan header for shorter requests but retains all canonical beats. The
 * production graph normalizes that result without changing the legacy engine.
 */
export function normalizePlanDuration(plan: HslLongFormProjectPlan, targetMinutes: number): HslLongFormProjectPlan {
  const targetFrames = Math.round(targetMinutes * 60 * FPS);
  const sourceFrames = plan.beats.reduce((n, beat) => n + beat.durationFrames, 0);
  if (!targetFrames || !sourceFrames) throw new Error('PLAN_DURATION_INVALID');
  if (targetFrames === sourceFrames && plan.totalFrames === sourceFrames && plan.totalBeatsCount === plan.beats.length) return plan;

  const beatsByAct = plan.acts.map(act => plan.beats.filter(beat => beat.actNumber === act.actNumber));
  const activeActs = beatsByAct.map((beats, index) => ({beats, index})).filter(x => x.beats.length);
  const targetBeatCount = Math.max(activeActs.length, Math.min(plan.beats.length, Math.round(plan.beats.length * targetFrames / sourceFrames)));
  const activeCounts = allocate(targetBeatCount, activeActs.map(x => x.beats.length), 1);
  const counts = beatsByAct.map(() => 0); activeActs.forEach((x, index) => { counts[x.index] = activeCounts[index]; });
  const selected = beatsByAct.flatMap((beats, index) => evenlySelect(beats, Math.min(counts[index], beats.length)));
  const frameAllocations = allocate(targetFrames, selected.map(beat => beat.durationFrames), 1);

  const beats: HslSceneBeat[] = selected.map((beat, index) => {
    const beatId = `SCENE_${String(index + 1).padStart(3, '0')}`;
    const durationFrames = frameAllocations[index];
    return {
      ...beat,
      beatId,
      durationFrames,
      durationSeconds: durationFrames / FPS,
      outputFramePath: `runs/${plan.episodeId}/frames/${beatId}.png`,
      outputVideoPath: `runs/${plan.episodeId}/videos/${beatId}.mp4`,
    };
  });
  const acts = plan.acts.map(act => {
    const actBeats = beats.filter(beat => beat.actNumber === act.actNumber);
    return { ...act, beatsCount: actBeats.length, durationSeconds: actBeats.reduce((n, beat) => n + beat.durationSeconds, 0) };
  });
  return { ...plan, targetMinutes, totalDurationSeconds: targetFrames / FPS, totalFrames: targetFrames, totalBeatsCount: beats.length, acts, beats };
}
