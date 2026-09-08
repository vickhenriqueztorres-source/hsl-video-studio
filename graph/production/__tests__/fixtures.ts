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
  fs.writeFileSync(file, JSON.stringify({ durationSeconds: image ? 0 : duration, width: 1920, height: 1080, codecName: 'h264', hasVideo: !file.endsWith('.mp3') && !file.endsWith('.wav'), hasAudio: file.endsWith('.mp3') || file.endsWith('.wav') }) + ' '.repeat(120000));
}
export function fixtures(root: string, episodeId: string, opts: MockOptions = {}) {
  const calls: Record<string, number> = {};
  const called = (name: string) => { calls[name] = (calls[name] ?? 0) + 1; };
  const run = path.join(root, 'runs', episodeId);
  fs.mkdirSync(run, { recursive: true });
  if (!opts.noCache && !fs.existsSync(path.join(run, 'audio/narration-master.wav'))) media(path.join(run, 'audio/narration-master.wav'));
  const musicFile = path.join(root, 'public/audio/music/cinematic/suspense/suspense_oppressive_gloom.mp3');
  if (!fs.existsSync(musicFile)) media(musicFile);
  const initial = initialState({ episodeId });
  const plan = HslSceneDirectorAgent.planEpisodeFromScratch(initial.topicInput!);
  const smallPlan = { ...plan, beats: plan.beats.slice(0, 3).map((b, i) => ({ ...b,
    visualMode: i === 0 ? 'generated_image_35mm' as const : 'firefly_video' as const,
    infographicArchetype: undefined,
    promptSubject: i === 0 ? 'A quiet airport apron at dawn' : i === 1 ? 'A fuel hose coupling beside an aircraft wing' : 'A schematic diagram of airport fuel pipes',
    motionIntent: i === 0 ? 'none' as const : 'camera' as const,
    motionReason: i === 0 ? 'Static establishing image' : 'Reveal the physical coupling with a continuous camera move',
  })), totalBeatsCount: 3 };
  let held = 0;
  const deps: Partial<Dependencies> = {
    codexAccount:async()=>({authenticated:true}),
    generateImages:async()=>({kind:'IMAGE_GENERATION_RECOVERY',reason:'fixture: no external image generation'}),
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
    levelNarration: (input, output) => { called('levelNarration'); media(output, false, readJson<any>(input)?.durationSeconds ?? 600); return output; },
    validateNarration: () => ({ status: 'NARRATION_AUDIO_QA_PASS', integrated_lufs: -16, true_peak_dbtp: -1.5, loudness_range_lu: 3, sample_rate: 48000, channels: 2, codec: 'pcm_s16le' }),
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
    renderChunk: async (_root, _episode, index, range) => {
      called('chunk' + index);
      if (opts.killWave && index >= 2) {
        held++; if (held === 2) process.send?.({ readyToKill: true });
        await new Promise<void>(() => {});
      }
      media(chunkPath(root, episodeId, index), false, (range[1] - range[0] + 1) / 30); return result();
    },
    concatChunks: async (list, out) => {
      called('concat');
      const files = fs.readFileSync(list, 'utf8').split(/\r?\n/).filter(Boolean).map(line => line.slice(6, -1));
      const duration = files.reduce((total, file) => total + (readJson<any>(file)?.durationSeconds ?? 0), 0);
      media(out, false, duration); return result();
    },
    atempo: async (input, factor, out) => { called('atempo'); media(out, false, (readJson<any>(input)?.durationSeconds ?? 0) / factor); return result(); },
    syncNarration: async (_input, duration, out) => { called('syncNarration'); media(out, false, duration); return result(); },
    renderSfx: async (_root, _planPath, out, _totalSeconds, _context) => {
      const qaPath = path.join(path.dirname(out), 'soundfx-qa.json');
      if (fs.existsSync(out)) return { resolved: [], unresolved: [], planPath: _planPath, qaPath, cached: true };
      called('renderSfx');
      media(out, false, 600);
      writeJson(qaPath, { status: 'SFX_QA_PASS', cue_count: 5 });
      return { resolved: [], unresolved: [], planPath: _planPath, qaPath };
    },
    muxFinal: async (visual, _m, _n, out) => { called('mux'); media(out, false, readJson<any>(visual)?.durationSeconds ?? 0); return result(); },
    muxFinalWithSfx: async (visual, _m, _n, _sfx, out) => { called('mux'); media(out, false, readJson<any>(visual)?.durationSeconds ?? 0); return result(); },
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
