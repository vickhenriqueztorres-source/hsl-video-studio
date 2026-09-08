// Read-only source inspection. Writes evidence only beside this script.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const Database = require('better-sqlite3');
const root = path.resolve(__dirname, '../../..');
const episode = 'HSL_EPISODE_003';
const read = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const digest = rel => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
const write = (name, data) => fs.writeFileSync(path.join(__dirname, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n');
const run = (exe, args) => {
  const p = spawnSync(exe, args, {cwd: root, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024, timeout: 180000, windowsHide: true});
  if (p.error || p.status !== 0) throw new Error(`${exe}: ${p.error || p.stderr}`);
  return p;
};
const probe = rel => JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,duration,nb_frames,sample_rate,channels', '-of', 'json', rel]).stdout);
const db = new Database(path.join(root, 'database/langgraph-checkpoints.sqlite'), {readonly: true, fileMustExist: true});
const rows = db.prepare('SELECT checkpoint_id, checkpoint FROM checkpoints WHERE thread_id=? ORDER BY checkpoint_id').all(episode + '@v2');
const first = JSON.parse(rows[0].checkpoint.toString());
const last = JSON.parse(rows.at(-1).checkpoint.toString());
db.close();
const v = last.channel_values;
const plan = read(`runs/${episode}/scene-plan.json`);
const events = fs.readFileSync(path.join(root, `runs/${episode}/graph/node-events.jsonl`), 'utf8').trim().split('\n').map(JSON.parse);
const files = [`runs/${episode}/scene-plan.json`, `runs/${episode}/run-manifest.json`, `runs/${episode}/graph/compliance.json`, `out/${episode.toLowerCase()}.mp4`, `runs/${episode}/audio/narration.mp3`];
const evidence = {
  collectedAt: new Date().toISOString(), episode,
  scope: 'No pipeline execution, provider calls, source edits or checkpoint writes; current files may differ from execution-time files.',
  checkpoints: {count: rows.length, firstTimestamp: first.ts, lastTimestamp: last.ts, lastId: rows.at(-1).checkpoint_id},
  state: {targetMinutes: v.options.targetMinutes, mediaMode: v.options.graph.mediaMode, testRender: v.options.graph.testRender, offline: v.options.graph.offline, maxGenerations: v.options.graph.maxGenerations, storageMode: v.options.graph.storageMode, productionStatus: v.productionStatus, frames: v.frames.length, videos: v.videos.length, videoTakes: v.videoTakes.length, generationCount: v.generationCount, sfxTrackPath: v.sfxTrackPath, narration: v.narration, preMux: v.preMux, renderChunks: v.renderChunks},
  plan: {title: plan.episodeTitle, targetMinutes: plan.targetMinutes, totalFrames: plan.totalFrames, totalDurationSeconds: plan.totalDurationSeconds, beats: plan.beats.length, sumFrames: plan.beats.reduce((n,b) => n+b.durationFrames,0), sumSeconds: plan.beats.reduce((n,b) => n+b.durationSeconds,0), modes: plan.beats.reduce((m,b) => (m[b.visualMode]=(m[b.visualMode]||0)+1,m),{}), wordCount: plan.beats.map(b=>b.voiceoverScript).join(' ').split(/\s+/).length, promptsWithTypography: plan.beats.filter(b=>/typograph|text overlay/i.test(b.cinematicPrompt)).length},
  inventory: Object.fromEntries(['frames','start-frames','videos','temp-universal-svg-frames','images','firefly'].map(dir => {const p=path.join(root,'runs',episode,dir);return [dir,fs.existsSync(p)?fs.readdirSync(p).length:0];})),
  startFrameManifest: read(`runs/${episode}/start-frame-manifest.json`),
  fireflyGuide: read(`runs/${episode}/firefly-guide.json`),
  timings: events.filter(e=>e.type==='timing').map(({node,status,ms,startedAt,endedAt})=>({node,status,ms,startedAt,endedAt})),
  errors: events.filter(e=>e.type==='error').map(({node,message,at})=>({node,message,at})),
  hashes: files.map(file=>({file,sha256:digest(file),mtime:fs.statSync(path.join(root,file)).mtime.toISOString()})),
  media: {}
};
for (const rel of [`out/${episode.toLowerCase()}.mp4`, `runs/${episode}/audio/narration.mp3`, `runs/${episode}/audio/narration_synced.mp3`, `runs/${episode}/audio/narration_test.mp3`]) evidence.media[rel] = probe(rel);
write('evidence.json', evidence);
console.log('Checkpoint, plan and ffprobe evidence saved.');
for (const second of [359,361,599]) {
  run('ffmpeg', ['-y','-hide_banner','-loglevel','error','-ss',String(second),'-i',`out/${episode.toLowerCase()}.mp4`,'-frames:v','1','-vf','scale=960:-1',path.join(__dirname,`video-${second}s.png`)]);
}
const black = run('ffmpeg', ['-hide_banner','-nostdin','-ss','350','-i',`out/${episode.toLowerCase()}.mp4`,'-an','-vf','scale=320:-1,blackdetect=d=1:pic_th=0.98:pix_th=0.10','-f','null','-']);
write('blackdetect.txt', 'Input seek: 350 seconds; add 350 to filter timestamps. Scaled to 320px for detection.\n' + black.stderr);
for (const [tag, input] of [['master',`out/${episode.toLowerCase()}.mp4`],['narration',`runs/${episode}/audio/narration.mp3`]]) {
  const result = run('ffmpeg', ['-hide_banner','-nostdin','-i',input,'-vn','-af','silencedetect=noise=-45dB:d=3','-f','null','-']);
  write(`silencedetect-${tag}.txt`, result.stderr);
  console.log(tag, result.stderr.split(/\r?\n/).filter(l=>l.includes('silence_')).join('\n'));
}
console.log(black.stderr.split(/\r?\n/).filter(l=>l.includes('black_')).join('\n'));
console.log(JSON.stringify({plan:evidence.plan,state:evidence.state,media:evidence.media},null,2));
