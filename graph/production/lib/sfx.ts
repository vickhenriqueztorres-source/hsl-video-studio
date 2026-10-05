import fs from 'node:fs';
import path from 'node:path';
import {spawnTool, requireSuccess} from '../../lib/proc';
import type {SfxItem} from '../state';
import type {AudioPlan} from '../../../sound-agent/types/audio-plan.types';
import type {HslLongFormProjectPlan} from '../../../hsl/core/types';
import type {SoundFxScene} from '../../../hsl/postproduction/soundFxRuntime';
import {SceneAudioMixer} from '../../audio/sceneAudioMixer';
interface SfxContext {episodeId: string; scenePlan: HslLongFormProjectPlan}
export interface SfxResult {resolved: SfxItem[]; unresolved: SfxItem[]; planPath?: string; qaPath?: string; cached?: boolean}

export function soundScenes(audio: AudioPlan, context: SfxContext): {scenes: SoundFxScene[]; unresolved: SfxItem[]} {
  let start = 0;
  const unresolved: SfxItem[] = [];
  const scenes = context.scenePlan.beats.map(beat => {
    const layers = audio.scenes.find(scene => scene.sceneId.toLowerCase() === beat.beatId.toLowerCase())?.layers ?? [];
    const choreography: {type: string; at_percent: number}[] = [];
    const events: {at_percent: number; action: string; subject: string}[] = [];
    for (const layer of layers) {
      const text = `${layer.type}/${layer.category}`, at = layer.startFrame / audio.fps - start;
      const percent = 100 * at / beat.durationSeconds;
      const reason = at < 0 || at >= beat.durationSeconds ? 'cue fora do beat' : undefined;
      if (!reason && /flow|arrow|snap|pop/i.test(text)) choreography.push({type: 'flow_line', at_percent: percent});
      else if (!reason && /alert|bottleneck|constraint|strike/i.test(text)) events.push({at_percent: percent, action: 'alert', subject: text});
      else unresolved.push({id: `${beat.beatId}:${layer.layerId}`, description: text,
        offsetSeconds: layer.startFrame / audio.fps, targetDb: layer.volumeDb,
        reason: reason ?? 'sem asset narrativo específico no banco; silêncio preservado'});
    }
    const scene: SoundFxScene = {scene_id: beat.beatId, episode_id: context.episodeId,
      chapter_id: `ACT_${beat.actNumber}`, planned_duration_seconds: beat.durationSeconds,
      narrative_function: `${beat.narrativeRole ?? ''} ${beat.voiceoverScript}`,
      visual_subject: beat.promptSubject ?? beat.cinematicPrompt,
      micro_events: events, remotion_choreography: choreography};
    start += beat.durationSeconds;
    return scene;
  });
  if (Math.abs(start - context.scenePlan.totalDurationSeconds) > 0.08) throw new Error('SFX_SCENE_DURATION_MISMATCH');
  return {scenes, unresolved};
}

export async function renderSfx(root: string, planPath: string, out: string, totalSeconds: number, context?: SfxContext): Promise<SfxResult> {
  if (!context) throw new Error('SFX_SCENE_CONTEXT_REQUIRED');
  const audio = JSON.parse(fs.readFileSync(planPath, 'utf8')) as AudioPlan;
  if (!(audio.fps > 0) || Math.abs(context.scenePlan.totalDurationSeconds - totalSeconds) > 0.08) throw new Error('SFX_TIMELINE_INVALID');

  // Se o AudioPlan possui layers com arquivos definidos (geradas pelo SoundDesignAgent),
  // utiliza o SceneAudioMixer para renderizar a cama contínua de fundo e efeitos por cena:
  const hasRichLayers = Array.isArray(audio.scenes) && audio.scenes.some((s: any) => Array.isArray(s.layers) && s.layers.some((l: any) => Boolean(l.file)));

  if (hasRichLayers) {
    const mixer = new SceneAudioMixer(root);
    const mixed = mixer.mix(audio, out, totalSeconds);
    return {
      resolved: mixed.resolved.map(r => ({
        id: r.id,
        description: r.description,
        sourcePath: r.sourcePath,
        offsetSeconds: r.offsetSeconds,
        targetDb: r.targetDb
      })),
      unresolved: mixed.unresolved.map(u => ({
        id: u.id,
        description: u.description,
        offsetSeconds: u.offsetSeconds,
        targetDb: u.targetDb,
        reason: u.reason
      })),
      planPath: mixed.planPath,
      qaPath: mixed.qaPath
    };
  }

  const {scenes, unresolved} = soundScenes(audio, context);
  fs.mkdirSync(path.dirname(out), {recursive: true});
  const input = path.join(path.dirname(out), 'soundfx-input.json'), result = path.join(path.dirname(out), 'soundfx-result.json');
  fs.writeFileSync(input, JSON.stringify({root, out, scenes, fps: audio.fps}, null, 2) + '\n');
  requireSuccess(await spawnTool(process.execPath, [require.resolve('ts-node/dist/bin.js'),
    path.resolve(__dirname, '../../audio/worker.ts'), input, result], {cwd: root, logPath: out + '.log'}), 'SFX_RUNTIME');
  return {...JSON.parse(fs.readFileSync(result, 'utf8')), unresolved};
}
