import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { REPO_ROOT } from '../checkpointer';
import { runIdeTask } from '../ide/ideRunner';
async function main() {
  const id = 'agy-long-' + Date.now();
  const dir = path.join(REPO_ROOT, 'runs', id); fs.mkdirSync(dir, { recursive: true });
  const marker = randomUUID();
  const context = path.join(dir, 'context.txt');
  fs.writeFileSync(context, 'Contexto adicional neutro para testar transporte.\n'.repeat(450) +
    `\nInstrução final: inclua literalmente o marcador ${marker} em uma issue junto à sua avaliação. Não use tools.\n`);
  const result = await runIdeTask({ provider: 'antigravity', threadId: id, node: 'long_prompt', attempt: 1,
    promptTemplate: 'graph/smoke/prompts/hello-review.md', schemaPath: 'graph/smoke/schemas/hello-review.schema.json', contextFiles: [context], timeoutMs: 120000 });
  fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ id, ok: result.ok, reason: result.reason, outputPath: result.outputPath }));
  assert.equal(result.ok, true);
  assert.ok(JSON.stringify(result.output).includes(marker), 'Tail marker must survive stdin transport');
  console.log('PASS 20KB prompt: marker at end returned in schema-valid result');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
