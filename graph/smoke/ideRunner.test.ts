import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from '../checkpointer';
import { runIdeTask, taskDirectory } from '../ide/ideRunner';
import { extractFinalJson } from '../ide/drivers/codex';
import { runProcess, unavailableReason } from '../ide/drivers/process';
import { IdeTask } from '../ide/types';

async function main() {
  const stamp = `unit-${Date.now()}`;
  const fixture = path.join(REPO_ROOT, 'runs', stamp, 'fixture');
  fs.mkdirSync(fixture, { recursive: true });
  const js = path.join(fixture, 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
  fs.mkdirSync(path.dirname(js), { recursive: true });
  fs.writeFileSync(js, `
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('--sandbox read-only --output-schema --output-last-message --ephemeral --json --ignore-user-config');
} else {
  if (args[args.indexOf('--sandbox') + 1] !== 'read-only') process.exit(91);
  const output = args[args.indexOf('-o') + 1];
  const schema = args[args.indexOf('--output-schema') + 1];
  if (!fs.existsSync(schema)) process.exit(92);
  if (output.includes('quota')) { console.error('quota exceeded'); process.exit(1); }
  if (output.includes('stale')) process.exit(1);
  const attempt = path.basename(path.dirname(output));
  const data = attempt === '1' ? {score: 200} : {score: 80, verdict:'revise', issues:[]};
  fs.writeFileSync(output, JSON.stringify(data));
  process.exit(attempt === '2' ? 7 : 0);
}
`);
  if (process.platform === 'win32') fs.writeFileSync(path.join(fixture, 'codex.cmd'), '@echo off\n');
  else fs.writeFileSync(path.join(fixture, 'codex'), `#!${process.execPath}\nrequire(${JSON.stringify(js)});\n`, { mode: 0o755 });
  const base: IdeTask = {
    threadId: stamp, node: 'ide_task', attempt: 1, provider: 'codex', timeoutMs: 5000,
    promptTemplate: 'graph/smoke/prompts/hello-review.md',
    schemaPath: 'graph/smoke/schemas/hello-review.schema.json', readOnly: true,
  };
  const priorPath = process.env.PATH;
  try {
    process.env.PATH = fixture + path.delimiter + (priorPath ?? '');
    const retry = await runIdeTask(base);
    assert.equal(retry.ok, true);
    assert.equal(retry.exitCode, 7, 'valid output wins over a nonzero CLI exit');
    assert.equal(path.basename(path.dirname(retry.outputPath)), '2');
    const retryPrompt = fs.readFileSync(path.join(path.dirname(retry.outputPath), 'prompt.md'), 'utf8');
    assert.match(retryPrompt, /Erros da tentativa anterior/);
    assert.match(retryPrompt, /must be <= 100/);
    assert.ok(retryPrompt.trimEnd().endsWith('Não escreva nada além do JSON nesse arquivo.'));
    const quota = await runIdeTask({ ...base, threadId: stamp + '-quota' });
    assert.equal(quota.skipped, true);
    assert.match(quota.reason ?? '', /cota/);
    assert.equal(fs.existsSync(taskDirectory({ ...base, threadId: stamp + '-quota', attempt: 2 })), false);
    const staleTask = { ...base, threadId: stamp + '-stale' };
    const staleFolder = taskDirectory(staleTask);
    fs.mkdirSync(staleFolder, { recursive: true });
    fs.writeFileSync(path.join(staleFolder, 'output.json'), JSON.stringify({ score: 100, verdict: 'approve', issues: [] }));
    const stale = await runIdeTask(staleTask);
    assert.equal(stale.ok, false, 'stale output must not make a failed CLI pass');
    process.env.PATH = fixture;
    const missing = await runIdeTask({ ...base, threadId: stamp + '-missing', provider: 'antigravity' });
    assert.equal(missing.skipped, true);
    await assert.rejects(() => runIdeTask({ ...base, provider: 'manual' }), /nos separados/);
    assert.throws(() => taskDirectory({ ...base, threadId: '../escape' }), /invalido/);
  } finally { process.env.PATH = priorPath; }
  const timeout = await runProcess({ command: process.execPath, prefix: [] },
    ['-e', 'setInterval(() => {}, 1000)'], REPO_ROOT, 200);
  assert.equal(timeout.timedOut, true);
  assert.ok(timeout.durationMs < 10_000);
  const missingProcess = await runProcess({ command: path.join(fixture, 'missing.exe'), prefix: [] }, [], REPO_ROOT, 1000);
  assert.equal(missingProcess.errorCode, 'ENOENT');
  assert.match(unavailableReason(missingProcess) ?? '', /ENOENT/);
  const events = [
    { type: 'item.completed', item: { type: 'agent_message', text: '{"score":80}' } },
    { type: 'item.completed', item: { type: 'command_execution', text: '{"score":0}' } },
    { score: 1 },
  ].map(e => JSON.stringify(e)).join('\n');
  assert.deepEqual(extractFinalJson(events), { score: 80 });
  console.log('PASS: retry + AJV errors + nonzero exit + quota + stale output + missing CLI + manual context + path guard + timeout + final JSON extraction');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
