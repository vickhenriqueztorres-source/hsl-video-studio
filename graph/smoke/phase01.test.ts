import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createCheckpointer, REPO_ROOT } from '../checkpointer';
import { prepareIdeTask } from '../ide/ideRunner';
import { extractAntigravityJson, inlineAntigravityContext } from '../ide/drivers/antigravity';
import { createSmokeGraph } from './smokeGraph';
import { executeSmoke, saveHistory } from './runSmoke';
import { IdeTask } from '../ide/types';

async function main() {
  const prefix = `phase01-${Date.now()}`;
  const fixture = path.join(REPO_ROOT, 'runs', prefix);
  fs.mkdirSync(fixture, { recursive: true });
  const good = { score: 80, verdict: 'revise', issues: [{ severity: 'low', message: 'A string can contain {braces} and "quotes".' }] };
  for (const field of ['result', 'response', 'content', 'text']) {
    assert.deepEqual(extractAntigravityJson('log\n' + JSON.stringify({ [field]: JSON.stringify(good), usage: { total: 12 } })), good);
  }
  assert.deepEqual(extractAntigravityJson('```json\n' + JSON.stringify(good, null, 2) + '\n```'), good);
  assert.deepEqual(extractAntigravityJson(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(good) }] })), good);
  assert.equal(extractAntigravityJson('{"conversation_id":"x","status":"CANCELED","response":"","usage":{}}'), undefined);
  assert.deepEqual(extractAntigravityJson(JSON.stringify(good) + '\n{"score":200}'), { score: 200 }, 'do not hide a later schema-invalid answer');
  const contextPath = path.join(fixture, 'scene.txt');
  fs.writeFileSync(contextPath, 'Cenario conhecido: trem e ponte.');
  const task: IdeTask = { threadId: prefix, provider: 'antigravity', node: 'ide_task', attempt: 1,
    promptTemplate: 'graph/smoke/prompts/hello-review.md', schemaPath: 'graph/smoke/schemas/hello-review.schema.json', contextFiles: [contextPath] };
  assert.match(inlineAntigravityContext(task, REPO_ROOT), /```file path=/);
  assert.throws(() => inlineAntigravityContext({ ...task, contextLimitBytes: 2 }, REPO_ROOT), /Contexto excede/);
  const largeContext = path.join(fixture, 'large.txt');
  fs.writeFileSync(largeContext, 'a'.repeat(200 * 1024 + 1));
  assert.throws(() => inlineAntigravityContext({ ...task, contextFiles: [largeContext] }, REPO_ROOT), /204801 > 204800/);
  const prepared = prepareIdeTask(task);
  const original = fs.readFileSync(prepared.promptPath, 'utf8');
  const mtime = fs.statSync(prepared.promptPath).mtimeMs;
  assert.match(original, /Cenario conhecido/);
  assert.match(original, /Responda APENAS com o JSON final/);
  assert.match(original, /"\$schema"/);
  fs.writeFileSync(contextPath, 'Changed original must not change the saved task.');
  prepareIdeTask(task);
  assert.equal(fs.readFileSync(prepared.promptPath, 'utf8'), original);
  assert.equal(fs.statSync(prepared.promptPath).mtimeMs, mtime);

  for (const scenario of ['manual', 'invalid', 'fallback'] as const) {
    const threadId = `${prefix}-${scenario}`;
    const beforePath = process.env.PATH;
    if (scenario === 'fallback') process.env.PATH = ''; // No real CLI calls in this test.
    let saver = createCheckpointer();
    try {
      let graph = createSmokeGraph(saver);
      const paused = await executeSmoke(graph, threadId, scenario === 'fallback' ? 'antigravity' : 'manual');
      assert.deepEqual(paused.next, ['ide_wait']);
      assert.equal(paused.tasks.flatMap(t => t.interrupts).length, 1);
      if (scenario === 'fallback') assert.equal(paused.values.ideHeadlessResult.skipped, true);
      const paths = paused.values.idePrepared;
      const protectedPaths = [paths.promptPath, paths.schemaPath, paths.logPath];
      const before = protectedPaths.map(file => ({ file, content: fs.readFileSync(file, 'utf8'), mtime: fs.statSync(file).mtimeMs }));
      await saveHistory(graph, threadId, 'checkpoint-history.paused.json');
      fs.writeFileSync(paths.outputPath, JSON.stringify(scenario === 'invalid' ? { score: 200 } : good));
      const outputTime = fs.statSync(paths.outputPath).mtimeMs;
      // Reopen SQLite and rebuild the graph to prove resume uses durable state.
      saver.db.close();
      saver = createCheckpointer();
      graph = createSmokeGraph(saver);
      const completed = await executeSmoke(graph, threadId);
      assert.equal(completed.values.verdict, scenario === 'invalid' ? 'FAIL' : 'PASS');
      assert.equal(completed.values.ideResults.length, 1);
      if (scenario === 'invalid') assert.equal(completed.values.ideResults[0].validationErrors.length, 3);
      for (const item of before) {
        assert.equal(fs.readFileSync(item.file, 'utf8'), item.content);
        assert.equal(fs.statSync(item.file).mtimeMs, item.mtime);
      }
      assert.equal(fs.statSync(paths.outputPath).mtimeMs, outputTime);
      const audit = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'runs', threadId, 'node-executions.json'), 'utf8')) as { name: string }[];
      assert.equal(audit.filter(event => event.name === 'ide_prepare').length, 1);
      assert.equal(audit.filter(event => event.name === 'ide_wait').length, 2);
      await saveHistory(graph, threadId);
      console.log(`PASS ${scenario}: ide_prepare=1 ide_wait=2; preparation/output unchanged; verdict=${completed.values.verdict}`);
    } finally { if (saver.db.open) saver.db.close(); process.env.PATH = beforePath; }
  }
  console.log('PASS stdout envelopes, JSON extraction, context limits, immutable preparation, durable resume, skipped fallback, negative validation.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
