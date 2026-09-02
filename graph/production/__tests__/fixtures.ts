import fs from 'node:fs';
import path from 'node:path';
import { realDependencies, Dependencies } from '../deps';
import { HslSceneDirectorAgent } from '../../../hsl/core/hslSceneDirectorAgent';
import { initialState } from '../state';
import { readJson, writeJson } from '../runtime';
import { chunkPath } from '../lib/remotion';
import { HSL_REQUIRED_THUMBNAILS } from '../../../spec/hsl-spec';
export interface MockOptions { failedBeat?: boolean; blocked?: boolean; badCompliance?: boolean; killWave?: boolean; noCache?: boolean }
export function media(file: string, image = false, duration = 600) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ durationSeconds: image ? 0 : duration, width: 1920, height: 1080, codecName: 'h264', hasVideo: !file.endsWith('.mp3'), hasAudio: file.endsWith('.mp3') }) + ' '.repeat(120000));
}
export function fixtures(root: string, episodeId: string, opts: MockOptions = {}) {
  const calls: Record<string, number> = {};
  const called = (name: string) => { calls[name] = (calls[name] ?? 0) + 1; };
  const run = path.join(root, 'runs', episodeId);
  fs.mkdirSync(run, { recursive: true });
  if (!opts.noCache && !fs.existsSync(path.join(run, 'audio/narration.mp3'))) media(path.join(run, 'audio/narration.mp3'));
  const initial = initialState({ episodeId });
  const plan = HslSceneDirectorAgent.planEpisodeFromScratch(initial.topicInput!);
  const smallPlan = { ...plan, beats: plan.beats.slice(0, 3).map((b, i) => ({ ...b, visualMode: i === 0 ? 'generated_image_35mm' as const : 'firefly_video' as const })), totalBeatsCount: 3 };
  let held = 0;
  const deps: Partial<Dependencies> = {
    plan: () => { called('plan'); return smallPlan; },
    frames: async (_episode, beats) => {
      called('frames');
      for (let i = 0; i < beats.length; i++) {
        if (opts.failedBeat && i === 1) continue;
        for (const prefix of ['runs', 'public/runs']) media(path.join(root, prefix, episodeId, 'frames', beats[i].beatId + '.png'), true);
      }
      if (opts.failedBeat) throw new Error('mock image beat failed');
      return { totalGenerated: beats.length, outputDirectory: path.join(run, 'frames'), generatedFrames: [] };
    },
    videos: async (_episode, beats) => {
      called('videos');
      const videoBeats = beats.filter(b => b.visualMode === 'firefly_video');
      for (const beat of videoBeats) for (const prefix of ['runs', 'public/runs']) media(path.join(root, prefix, episodeId, 'videos', beat.beatId + '.mp4'));
      const guideJsonPath = path.join(run, 'firefly-guide.json'); writeJson(guideJsonPath, { takes: videoBeats });
      return { totalVideoBeats: videoBeats.length, guideJsonPath, videoOutputDirectory: path.join(run, 'videos'), completedTakes: [] };
    },
    narrate: async o => { called('narrate'); media(o.outputPath!); return o.outputPath!; },
    sound: (_input, tsx, json) => { called('sound'); writeJson(json, { scenes: [] }); fs.mkdirSync(path.dirname(tsx), { recursive: true }); fs.writeFileSync(tsx, '// fixture'); return { plan: {} as any, tsxCode: '// fixture' }; },
    gatekeeper: async () => {
      called('gatekeeper');
      const result = { episodeId, passed: !opts.blocked, autoRecovered: false, verifiedBeatsCount: opts.blocked ? 2 : 3, totalBeatsCount: 3, statePath: path.join(root, 'HSL_EXECUTION_STATE.json'), blocked_reason: opts.blocked ? 'mock physical gate blocked' : undefined };
      const state = { gatekeeperStatus: result.passed ? 'PASSED' : 'BLOCKED', validBeats: result.verifiedBeatsCount, totalBeats: 3, autoRecovered: false };
      writeJson(path.join(run, 'HSL_EXECUTION_STATE.json'), state); writeJson(result.statePath, state); return result;
    },
    inspect: file => { const data = readJson<ReturnType<Dependencies['inspect']>>(file); if (!data) throw new Error('bad mock media'); return data; },
    isPng: file => fs.existsSync(file),
    cleanRemotionTemp: () => { called('clean'); }, prunePublicRuns: () => { called('prune'); },
    syncCurrentRunAssets: () => {},
    ensureRunning: async () => ({ baseUrl: 'http://127.0.0.1:29999' }),
    responds: async url => url === 'http://127.0.0.1:29999', closeAssetServer: async () => {},
    bundleRemotion: async () => { called('bundle'); fs.mkdirSync(path.join(root, 'build'), { recursive: true }); fs.writeFileSync(path.join(root, 'build/index.html'), 'fixture'); return result(); },
    renderChunk: async (_root, _episode, index) => {
      called('chunk' + index);
      if (opts.killWave && index >= 2) {
        held++; if (held === 2) process.send?.({ readyToKill: true });
        await new Promise<void>(() => {});
      }
      media(chunkPath(root, episodeId, index)); return result();
    },
    concatChunks: async (_list, out) => { called('concat'); media(out); return result(); },
    atempo: async (_in, _factor, out) => { called('atempo'); media(out); return result(); },
    muxFinal: async (_v, _m, _n, out) => { called('mux'); media(out); return result(); },
    package: input => { called('package'); return { episodeId: input.episodeId } as any; },
    exportPackage: pkg => {
      called('exportPackage'); writeJson(path.join(run, 'publication-package.json'), pkg); fs.writeFileSync(path.join(run, 'YOUTUBE_PUBLICATION_PACKAGE.md'), '# mock package');
      for (const f of HSL_REQUIRED_THUMBNAILS) media(path.join(run, 'thumbnails', f), true);
    },
    compliance: () => { called('compliance'); return { episodeId, timestamp: new Date().toISOString(), passed: !opts.badCompliance, totalRules: 1, passedRules: opts.badCompliance ? 0 : 1, failedRules: opts.badCompliance ? 1 : 0,
      results: [{ ruleId: 'MOCK_RULE', name: 'mock', prdClause: 'mock', expected: 'ok', measured: 'ok', passed: !opts.badCompliance }] }; },
  };
  return { deps, calls };
}
function result() { return { exitCode: 0, stdout: '', stderr: '', timedOut: false, durationMs: 1 }; }
