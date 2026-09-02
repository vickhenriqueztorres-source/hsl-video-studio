import fs from 'node:fs';
import path from 'node:path';
import { RunManifestData } from '../../hsl/core/hslRunManifest';
import { ComplianceReport } from '../../spec/hsl-compliance-checker';
import { REPO_ROOT } from '../checkpointer';
import { probe } from './lib/ffmpeg';
import { readJson, writeJson } from './runtime';
export interface ParityRow { item: string; status: 'igual' | 'diferente' | 'ignorado-volátil'; reference?: unknown; graph?: unknown }
const STAGE_ORDER = ['STAGE_01_SCENE_PLAN', 'STAGE_02_IMAGE_FRAMES', 'STAGE_03_FIREFLY_VIDEOS', 'STAGE_04_NARRATION', 'STAGE_05_SOUND_DESIGN', 'STAGE_06_PRE_RENDER_GATE', 'STAGE_07_REMOTION_RENDER', 'STAGE_08_PRE_MUX_GATE', 'STAGE_09_FFMPEG_MUX', 'STAGE_10_PACKAGING', 'STAGE_11_PRD_COMPLIANCE'] as const;
type StageId = typeof STAGE_ORDER[number];
const ARTIFACT_STAGE: Record<string, number> = {
  thumbnails: 0, scenePlanPath: 1, framesCount: 2, videosCount: 3,
  narrationAudioPath: 4, narrationDurationSeconds: 4, visualTrackPath: 7,
  masterVideoPath: 9, masterVideoDurationSeconds: 9, publicationPackagePath: 10,
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export function resolveUntil(value?: string): StageId | undefined {
  if (!value) return undefined;
  const found = STAGE_ORDER.find(id => id === value || id.startsWith(value + '_'));
  if (!found) throw new Error(`Estágio desconhecido em --until: ${value}`);
  return found;
}
export function compareManifests(reference: RunManifestData, current: RunManifestData, until?: StageId): ParityRow[] {
  const rows: ParityRow[] = [];
  const add = (item: string, a: unknown, b: unknown, equal = same(a, b)) => rows.push({ item, status: equal ? 'igual' : 'diferente', reference: a, graph: b });
  const last = until ? STAGE_ORDER.indexOf(until) + 1 : STAGE_ORDER.length;
  const stageIds = STAGE_ORDER.slice(0, last);
  add('manifest.stageIds até ' + (until ?? 'STAGE_11'), Object.keys(reference.stages).filter(id => stageIds.includes(id as StageId)), Object.keys(current.stages).filter(id => stageIds.includes(id as StageId)));
  if (until) rows.push({ item: 'manifest.overallStatus (execução parcial)', status: 'ignorado-volátil', reference: reference.overallStatus, graph: current.overallStatus });
  else add('manifest.overallStatus', reference.overallStatus, current.overallStatus);
  add('manifest.episodeId', reference.episodeId, current.episodeId);
  for (const id of stageIds as readonly (keyof RunManifestData['stages'])[]) {
    const a = reference.stages[id], b = current.stages[id];
    add(id + '.status', a.status, b?.status);
    add(id + '.metricKeys', Object.keys(a.metrics ?? {}).sort(), Object.keys(b?.metrics ?? {}).sort());
    for (const metric of ['totalBeats', 'totalGenerated', 'totalVideos', 'verifiedBeats', 'totalRules', 'passedRules', 'autoRecovered']) {
      if (metric in (a.metrics ?? {}) || metric in (b?.metrics ?? {})) add(id + '.' + metric, a.metrics?.[metric], b?.metrics?.[metric]);
    }
    if ('durationSeconds' in (a.metrics ?? {})) add(id + '.durationSeconds (±0.05s)', a.metrics?.durationSeconds, b?.metrics?.durationSeconds, Math.abs(a.metrics!.durationSeconds - b?.metrics?.durationSeconds) <= 0.05);
    rows.push({ item: id + '.timestamps/duração do estágio', status: 'ignorado-volátil' });
  }
  const rootOf = (m: RunManifestData) => m.artifacts.scenePlanPath?.replace(/\\/g, '/').replace(/\/runs\/[^/]+\/scene-plan\.json$/, '') ?? '';
  const normalize = (v: unknown, root: string) => typeof v === 'string' ? v.replace(/\\/g, '/').replace(root + '/', '') : v;
  const referenceArtifactKeys = Object.keys(reference.artifacts).filter(key => (ARTIFACT_STAGE[key] ?? 11) <= last).sort();
  const currentArtifactKeys = Object.keys(current.artifacts).filter(key => (ARTIFACT_STAGE[key] ?? 11) <= last).sort();
  add('manifest.artifactKeys até ' + (until ?? 'STAGE_11'), referenceArtifactKeys, currentArtifactKeys);
  for (const key of referenceArtifactKeys as (keyof RunManifestData['artifacts'])[]) {
    const a = reference.artifacts[key], b = current.artifacts[key];
    if (key === 'narrationDurationSeconds') add('artifacts.' + key + ' (±0.05s)', a, b, typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= 0.05);
    else if (key === 'masterVideoDurationSeconds') add('artifacts.' + key + ' (±0.1s)', a, b, typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= 0.1);
    else add('artifacts.' + key, normalize(a, rootOf(reference)), normalize(b, rootOf(current)));
  }
  rows.push({ item: 'timestamps globais, baseUrl/porta, prefixo absoluto de root', status: 'ignorado-volátil' });
  return rows;
}
export function referencePrefix(episodeId: string) { return /^HSL_EPISODE_(\d+)$/.test(episodeId) ? 'ep' + episodeId.slice('HSL_EPISODE_'.length) : episodeId.toLowerCase(); }
export async function parity(argv = process.argv.slice(2)) {
  const args: Record<string, string> = {};
  if (argv[0] === 'parity') argv = argv.slice(1);
  for (let i = 0; i < argv.length; i += 2) {
    if (!['--episode', '--reference-dir', '--reference-manifest', '--reference-video', '--reference-compliance', '--until'].includes(argv[i]) || !argv[i + 1]) throw new Error('Argumentos de paridade inválidos');
    args[argv[i]] = argv[i + 1];
  }
  const episodeId = args['--episode'] ?? 'HSL_EPISODE_011';
  const until = resolveUntil(args['--until']);
  const dir = path.resolve(args['--reference-dir'] ?? path.join(REPO_ROOT, 'docs/graph/reference'));
  const prefix = referencePrefix(episodeId);
  const manifestPath = path.resolve(args['--reference-manifest'] ?? path.join(dir, prefix + '-run-manifest.json'));
  const reference = readJson<RunManifestData>(manifestPath);
  const current = readJson<RunManifestData>(path.join(REPO_ROOT, 'runs', episodeId, 'run-manifest.json'));
  if (!reference || !current) throw new Error(`Manifest de referência ou do grafo ausente/inválido: ${manifestPath}`);
  const rows = compareManifests(reference, current, until);
  const referenceVideo = args['--reference-video'] ?? path.join(dir, prefix + '-reference.mp4');
  // A tiny, versioned ffprobe snapshot allows parity after large media is archived.
  const probeSnapshot = path.join(dir, prefix + '-ffprobe.json');
  const refVideo = !until || STAGE_ORDER.indexOf(until) >= 8 ? (fs.existsSync(referenceVideo) ? await probe(path.resolve(referenceVideo)) : !args['--reference-video'] ? readJson<Awaited<ReturnType<typeof probe>>>(probeSnapshot) : undefined) : undefined;
  const video = current.artifacts.masterVideoPath;
  if (!until || STAGE_ORDER.indexOf(until) >= 8) {
    if (!refVideo || !video || !fs.existsSync(video)) rows.push({ item: 'vídeo final/ffprobe disponível', status: 'diferente', reference: referenceVideo, graph: video });
    else {
      const actual = await probe(video);
      for (const key of ['duration', 'width', 'height', 'videoCodec', 'audioCodec', 'streams'] as const) {
        const equal = key === 'duration' ? Math.abs(refVideo.duration - actual.duration) <= 0.1 : same(refVideo[key], actual[key]);
        rows.push({ item: 'ffprobe.' + key, status: equal ? 'igual' : 'diferente', reference: refVideo[key], graph: actual[key] });
      }
    }
  } else rows.push({ item: 'vídeo final/ffprobe (fora do recorte)', status: 'ignorado-volátil' });
  const refCompliance = readJson<ComplianceReport>(path.resolve(args['--reference-compliance'] ?? path.join(dir, prefix + '-compliance.json')));
  const compliance = readJson<ComplianceReport>(path.join(REPO_ROOT, 'runs', episodeId, 'graph', 'compliance.json'));
  const rules = (r: ComplianceReport) => r.results.map(x => [x.ruleId, x.passed]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  if (!until || STAGE_ORDER.indexOf(until) >= 10) rows.push({ item: 'compliance.ruleIds/pass', status: refCompliance && compliance && same(rules(refCompliance), rules(compliance)) ? 'igual' : 'diferente', reference: refCompliance && rules(refCompliance), graph: compliance && rules(compliance) });
  else rows.push({ item: 'compliance.ruleIds/pass (fora do recorte)', status: 'ignorado-volátil' });
  console.table(rows);
  writeJson(path.join(REPO_ROOT, 'runs', episodeId, 'graph', 'parity.json'), rows);
  return rows.some(r => r.status === 'diferente') ? 1 : 0;
}
if (require.main === module) parity().then(code => { process.exitCode = code; }).catch(e => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; });
