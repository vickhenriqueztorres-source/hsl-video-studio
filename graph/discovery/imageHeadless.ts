import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { REPO_ROOT } from '../checkpointer';
import { prepareAndRunIdeTask } from '../ide/ideRunner';
import { IdeProvider } from '../ide/types';

interface PngEvidence { valid: boolean; width?: number; height?: number; reason?: string }

function inspectPng(file: string): PngEvidence {
  if (!fs.existsSync(file)) return { valid: false, reason: 'arquivo ausente' };
  const data = fs.readFileSync(file);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (data.length < 24 || !data.subarray(0, 8).equals(signature) || data.toString('ascii', 12, 16) !== 'IHDR') {
    return { valid: false, reason: 'assinatura PNG/IHDR inválida' };
  }
  const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
  return width >= 1280 && height >= 720
    ? { valid: true, width, height }
    : { valid: false, width, height, reason: 'dimensões abaixo de 1280x720' };
}

async function main(): Promise<void> {
  const root = path.join(REPO_ROOT, 'runs', 'phase2-discovery', 'image-headless');
  const receipt = path.join(root, 'results.json');
  if (fs.existsSync(receipt)) throw new Error(`PHASE2_IMAGE_DISCOVERY_ALREADY_RAN: ${receipt}`);
  fs.mkdirSync(root, { recursive: true });
  const results = [];
  for (const provider of ['antigravity', 'codex'] as IdeProvider[]) {
    const expectedPath = path.join(root, `${provider}.png`);
    const threadId = `phase2-image-${provider}-${Date.now()}-${randomUUID().slice(0, 6)}`;
    const preparation = await prepareAndRunIdeTask({
      threadId, node: 'image_headless', attempt: 1, maxAttempts: 1, provider,
      promptTemplate: 'graph/discovery/prompts/image-headless.md',
      schemaPath: 'graph/discovery/schemas/image-headless.schema.json',
      vars: { provider, expectedPath }, ioMode: 'file', readOnly: provider === 'codex', timeoutMs: 600_000,
    });
    results.push({ provider, threadId, expectedPath, png: inspectPng(expectedPath), result: preparation.headlessResult,
      promptPath: preparation.prepared.promptPath, logPath: preparation.prepared.logPath });
  }
  fs.writeFileSync(receipt, JSON.stringify({ ranAt: new Date().toISOString(), attemptsPerProvider: 1, results }, null, 2) + '\n');
  console.log(JSON.stringify({ receipt, results }, null, 2));
}

if (require.main === module) main().catch(error => { console.error(error instanceof Error ? error.stack || error.message : String(error)); process.exitCode = 1; });
