import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { KENNEY_SFX_SELECTIONS, KENNEY_SFX_PACKS } from '../../config/kenneySoundFxCatalog';

export async function digest(file: string, algorithm = 'sha256'): Promise<string> {
  const hash = crypto.createHash(algorithm);
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
export function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => {
    if (e.isSymbolicLink()) throw new Error(`AUDIO_IMPORT_SYMLINK:${e.name}`);
    const file = path.join(dir, e.name);
    return e.isDirectory() ? walk(file) : [file];
  });
}
const slash = (s: string) => s.replace(/\\/g, '/');
async function copyVerified(from: string, to: string) {
  const sha256 = await digest(from);
  fs.mkdirSync(path.dirname(to), {recursive: true});
  if (fs.existsSync(to)) {
    if (await digest(to) !== sha256) throw new Error(`AUDIO_IMPORT_DESTINATION_DIFFERS:${to}`);
  } else fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL);
  if (await digest(to) !== sha256) throw new Error(`AUDIO_IMPORT_COPY_HASH:${to}`);
  return {sha256, sizeBytes: fs.statSync(to).size};
}

export async function importSoundProject(root: string, source: string, skill?: string) {
  if (path.resolve(source) === path.resolve(root)) throw new Error('AUDIO_IMPORT_SAME_ROOT');
  const bank = path.join(root, 'assets/audio-library');
  const software: object[] = [];
  const files = ['sfx-agent', 'sound-agent', 'music-agent'].flatMap(dir => walk(path.join(source, dir)))
    .concat(['hsl/postproduction/soundFxRuntime.ts', 'config/kenneySoundFxCatalog.ts',
      'scripts/fetchKenneySfx.ts', 'scripts/runSfxAgent.ts', 'scripts/runMusicAgent.ts',
      'scripts/buildMilkAudioBeds.ts', 'scripts/hslVideoExampleSoundFxRemix.ts',
      'tests/sfx_agent.test.ts', 'tests/sound_agent.test.ts', 'tests/music_agent.test.ts']
      .map(rel => path.join(source, rel)).filter(fs.existsSync));
  for (const from of files) {
    const rel = slash(path.relative(source, from)), to = path.join(root, rel);
    const sourceHash = await digest(from);
    // Episode-specific recipes are evidence, not a second executable visual pipeline.
    const example = rel === 'scripts/buildMilkAudioBeds.ts';
    const differs = fs.existsSync(to) && await digest(to) !== sourceHash;
    let status: string;
    if (differs || example) {
      await copyVerified(from, path.join(root, 'graph/audio/source-snapshot', rel + '.txt'));
      status = example ? 'recipe-preserved' : 'local-version-preserved-source-snapshotted';
    } else { await copyVerified(from, to); status = 'local-identical'; }
    software.push({path: rel, sourceSha256: sourceHash, status});
  }
  for (const from of walk(path.join(source, '.codex/agents'))) {
    const rel = slash(path.relative(source, from));
    const hash = await copyVerified(from, path.join(root, 'graph/audio/source-snapshot', rel + '.txt'));
    software.push({path: rel, ...hash, status: 'configuration-preserved-not-activated'});
  }
  if (skill) for (const from of walk(skill)) {
    await copyVerified(from, path.join(root, '.agents/skills/hsl-soundfx-design', path.relative(skill, from)));
  }
  const items: any[] = [];
  for (const from of walk(path.join(source, 'assets/soundfx'))) {
    const rel = slash(path.relative(path.join(source, 'assets/soundfx'), from));
    await copyVerified(from, path.join(root, 'assets/soundfx', rel));
    const dest = path.join(bank, 'sources', rel);
    const hash = await copyVerified(from, dest);
    items.push({path: slash(path.relative(root, dest)), ...hash, role: 'source', license: 'CC0-1.0'});
  }
  const episode = path.join(source, 'runs/leite-cadeia-frio/LEITE-VISUALS-20260901');
  for (const from of walk(path.join(episode, 'postproduction/soundfx/assets'))) {
    const dest = path.join(bank, 'sfx/kenney', path.basename(from));
    const selection = KENNEY_SFX_SELECTIONS.find(s => s.canonicalName === path.basename(from));
    if (!selection) throw new Error(`AUDIO_IMPORT_UNKNOWN_DERIVATIVE:${from}`);
    const hash = await copyVerified(from, dest);
    items.push({path: slash(path.relative(root, dest)), ...hash, role: 'sfx', cueType: selection.cueType,
      license: 'CC0-1.0', sourceSha256: selection.sourceSha256,
      sourcePageUrl: KENNEY_SFX_PACKS.find(p => p.id === selection.packId)!.pageUrl});
  }
  const examples = ['postproduction/soundfx/soundfx-plan.json', 'postproduction/soundfx/soundfx-qa.json',
    'postproduction/soundfx/soundfx-bed.wav', 'audio/sfx/bed.mp3', 'audio/music/bed.mp3', 'audio/room-tone/bed.mp3'];
  for (const rel of examples) {
    const from = path.join(episode, rel);
    if (!fs.existsSync(from)) throw new Error(`AUDIO_IMPORT_EXAMPLE_MISSING:${rel}`);
    const dest = path.join(bank, 'examples/leite', rel);
    const hash = await copyVerified(from, dest);
    items.push({path: slash(path.relative(root, dest)), ...hash, role: 'episode-example',
      license: rel.includes('/music/') || rel.includes('/room-tone/') ? 'project-generated-see-recipe' : 'KENNEY_CC0_DERIVATIVE'});
  }
  const original = path.join(bank, 'examples/leite/postproduction/soundfx/soundfx-plan.json');
  const plan = JSON.parse(fs.readFileSync(original, 'utf8'));
  plan.cues = plan.cues.map((cue: any) => ({...cue,
    asset_path: `assets/audio-library/sfx/kenney/${path.win32.basename(cue.asset_path)}`}));
  const localPlan = path.join(bank, 'examples/leite/soundfx-plan.local.json');
  fs.writeFileSync(localPlan, JSON.stringify(plan, null, 2) + '\n');
  items.push({path: slash(path.relative(root, localPlan)), sha256: await digest(localPlan),
    sizeBytes: fs.statSync(localPlan).size, role: 'portable-example-plan', license: 'KENNEY_CC0_DERIVATIVE'});
  const result = {schema: 'hsl.audio-library.v1', items,
    totalBytes: items.reduce((n, item) => n + item.sizeBytes, 0)};
  fs.writeFileSync(path.join(bank, 'library-index.json'), JSON.stringify(result, null, 2) + '\n');
  fs.mkdirSync(path.join(root, 'docs/graph'), {recursive: true});
  fs.writeFileSync(path.join(root, 'docs/graph/AUDIO-IMPORT.json'), JSON.stringify({software, ...result}, null, 2) + '\n');
  return result;
}
if (require.main === module) {
  const args = process.argv.slice(2), value = (name: string) => args[args.indexOf(name) + 1];
  if (!args.includes('--source')) throw new Error('Use --source <project> [--skill <skill-directory>]');
  importSoundProject(process.cwd(), path.resolve(value('--source')), args.includes('--skill') ? value('--skill') : undefined)
    .then(r => console.log(JSON.stringify({files: r.items.length, bytes: r.totalBytes})))
    .catch(e => { console.error(e.message); process.exitCode = 1; });
}
