import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { Context, NodeFn, paths, validMedia, copyFile, withStage, manifest, readJson, writeJson } from '../runtime';
import type { HslLongFormProjectPlan } from '../../../hsl/core/types';

interface NarrationReceipt {
  schema: 'hsl.narration.receipt.v1';
  scriptSha256: string;
  sourceSha256: string;
  masterSha256: string;
  provider: string;
  voice?: string;
  model?: string;
  createdAt: string;
}

interface ProviderReceipt { provider?: string; voice?: string; model?: string; textSha256?: string }

function digestText(value: string): string { return createHash('sha256').update(value, 'utf8').digest('hex'); }
function digestFile(file: string): string { return createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function removeIfExists(file: string) { try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch {} }

function narrationText(scripts: readonly string[]): string {
  if (!scripts.length) throw new Error('NARRATION_SCRIPT_EMPTY');
  const cleaned = scripts.map(script => script.replace(/\s+/g, ' ').trim());
  if (cleaned.some(script => /\bSCENE[_\s-]*\d+\b/i.test(script))) throw new Error('NARRATION_SCRIPT_CONTAINS_INTERNAL_SCENE_ID');
  if (cleaned.some(script => /maps another layer/i.test(script))) throw new Error('NARRATION_SCRIPT_GENERIC_PLACEHOLDER');
  const canonical = cleaned.map(script => script.toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, ' ').trim());
  if (new Set(canonical).size !== canonical.length) throw new Error('NARRATION_SCRIPT_DUPLICATE_BEATS');
  const words = canonical.map(script => new Set(script.split(' ').filter(word => word.length > 2)));
  for (let index = 1; index < words.length; index++) {
    const intersection = [...words[index]].filter(word => words[index - 1].has(word)).length;
    const union = new Set([...words[index - 1], ...words[index]]).size;
    const similarity = union ? intersection / union : 1;
    if (similarity >= 0.72) throw new Error(`NARRATION_SCRIPT_SEMANTIC_LOOP:${index}:${similarity.toFixed(2)}`);
  }
  return cleaned.join(' ');
}

export const narration = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_04_NARRATION', async () => {
  const p = paths(c, s);
  // The visual/media plan remains immutable after paid provider dispatches.
  // A narration-only revision lives in scene-plan.json and is allowed to
  // change without rewriting Firefly authorization lineage.
  const narrativePlan = readJson<HslLongFormProjectPlan>(p.plan) ?? s.scenePlan;
  const text = narrationText(narrativePlan?.beats.map(beat => beat.voiceoverScript) ?? []);
  const scriptSha256 = digestText(text);
  const receipt = readJson<NarrationReceipt>(p.narrationReceipt);
  let cache = false;

  if (receipt?.schema === 'hsl.narration.receipt.v1' && receipt.scriptSha256 === scriptSha256 && validMedia(c, p.narration, 'audio')) {
    try {
      cache = digestFile(p.narration) === receipt.masterSha256;
      if (cache) c.deps.validateNarration(p.narration);
    } catch { cache = false; }
  }
  if (s.options.graph.offline && !cache) throw new Error('narration cache ausente em modo offline: NARRATION_VERIFIED_CACHE_REQUIRED_OFFLINE');

  if (!cache) {
    const audioDir = path.dirname(p.narration);
    const id = randomUUID();
    const stagedSource = path.join(audioDir, `.narration-source.${id}.mp3`);
    const stagedMaster = path.join(audioDir, `.narration-master.${id}.wav`);
    const providerReceiptPath = `${stagedSource}.provider.json`;
    fs.mkdirSync(audioDir, { recursive: true });
    try {
      await c.deps.narrate({ text, outputPath: stagedSource });
      if (!validMedia(c, stagedSource, 'audio')) throw new Error('NARRATION_SOURCE_INVALID_MEDIA');
      c.deps.levelNarration(stagedSource, stagedMaster);
      if (!validMedia(c, stagedMaster, 'audio')) throw new Error('NARRATION_MASTER_INVALID_MEDIA');
      const qa = c.deps.validateNarration(stagedMaster);
      const provider = readJson<ProviderReceipt>(providerReceiptPath);
      if (provider?.textSha256 && provider.textSha256 !== scriptSha256) throw new Error('NARRATION_PROVIDER_RECEIPT_TEXT_MISMATCH');
      copyFile(stagedSource, p.narrationSource);
      copyFile(stagedSource, p.legacyNarration);
      copyFile(stagedMaster, p.narration);
      writeJson(p.narrationQa, qa);
      writeJson(p.narrationReceipt, {
        schema: 'hsl.narration.receipt.v1', scriptSha256,
        sourceSha256: digestFile(p.narrationSource), masterSha256: digestFile(p.narration),
        provider: provider?.provider || 'unreported', voice: provider?.voice, model: provider?.model,
        createdAt: new Date().toISOString()
      } satisfies NarrationReceipt);
    } finally {
      removeIfExists(stagedSource); removeIfExists(stagedMaster); removeIfExists(providerReceiptPath);
    }
  }

  if (!validMedia(c, p.narration, 'audio')) throw new Error('NARRATION_INVALID_MEDIA');
  const qa = c.deps.validateNarration(p.narration);
  writeJson(p.narrationQa, qa);
  copyFile(p.narration, p.publicNarration);
  const info = c.deps.inspect(p.narration);
  const original = manifest(c, s).getData().artifacts.narrationDurationSeconds ?? info.durationSeconds;
  return {
    update: { narration: { path: p.narration, publicCopyPath: p.publicNarration, durationSeconds: info.durationSeconds } },
    skipped: cache, metrics: { durationSeconds: original, scriptSha256, qa },
    artifacts: { narrationAudioPath: p.narration, narrationDurationSeconds: original }
  };
});
