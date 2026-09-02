import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Command } from '@langchain/langgraph';
import { createCheckpointer, REPO_ROOT } from '../checkpointer';
import { IdeProvider, IdeResult } from '../ide/types';
import { taskDirectory } from '../ide/ideRunner';
import { createSmokeGraph } from './smokeGraph';

type SmokeGraph = ReturnType<typeof createSmokeGraph>;
interface NodeExecution { phase: 'initial' | 'resume'; step?: number; id?: string; name?: string }

export async function saveHistory(graph: SmokeGraph, threadId: string, fileName = 'checkpoint-history.json') {
  const history = [];
  for await (const entry of graph.getStateHistory({ configurable: { thread_id: threadId } })) {
    history.push({ checkpointId: entry.config.configurable?.checkpoint_id, step: entry.metadata?.step,
      next: entry.next, source: entry.metadata?.source,
      tasks: entry.tasks.map(t => ({ id: t.id, name: t.name, interrupts: t.interrupts.length })),
      resultCount: entry.values.ideResults?.length ?? 0 });
  }
  fs.mkdirSync(path.join(REPO_ROOT, 'runs', threadId), { recursive: true });
  fs.writeFileSync(path.join(REPO_ROOT, 'runs', threadId, fileName), JSON.stringify(history, null, 2) + '\n');
  return history;
}

/** Observability lives in the caller, never as a side effect in ide_wait. */
export async function executeSmoke(graph: SmokeGraph, threadId: string, provider?: IdeProvider) {
  const config = { configurable: { thread_id: threadId } };
  const folder = path.join(REPO_ROOT, 'runs', threadId);
  fs.mkdirSync(folder, { recursive: true });
  const auditPath = path.join(folder, 'node-executions.json');
  const audit: NodeExecution[] = fs.existsSync(auditPath) ? JSON.parse(fs.readFileSync(auditPath, 'utf8')) : [];
  const input: Parameters<SmokeGraph['stream']>[0] = provider ? { threadId, mode: provider } : new Command({ resume: {} });
  for await (const event of await graph.stream(input, { ...config, streamMode: 'debug' })) {
    const debug = event as { type?: string; step?: number; payload?: { id?: string; name?: string } };
    if (debug.type === 'task') audit.push({ phase: provider ? 'initial' : 'resume', step: debug.step, id: debug.payload?.id, name: debug.payload?.name });
  }
  fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2) + '\n');
  return graph.getState(config);
}

async function main() {
  let mode = 'all';
  let resume: string | undefined;
  let withManualAutofill = false;
  for (let i = 2; i < process.argv.length; i++) {
    const flag = process.argv[i];
    if (flag === '--with-manual-autofill') { withManualAutofill = true; continue; }
    const value = process.argv[++i];
    if (!value) throw new Error(`Falta valor para ${flag}.`);
    if (flag === '--mode') mode = value;
    else if (flag === '--resume') resume = value;
    else throw new Error(`Argumento desconhecido: ${flag}`);
  }
  if (!['all', 'manual', 'codex', 'antigravity'].includes(mode)) throw new Error('Modo invalido.');
  const checkpointer = createCheckpointer();
  const graph = createSmokeGraph(checkpointer);
  const rows: (IdeResult & { mode: IdeProvider; threadId: string; verdict: string; autoFilled: boolean })[] = [];
  const modes: IdeProvider[] = mode === 'all' ? ['antigravity', 'codex', 'manual'] : [mode as IdeProvider];
  try {
    for (const provider of (resume ? ['manual'] as IdeProvider[] : modes)) {
      const threadId = resume ?? `smoke-${provider}-${Date.now()}-${randomUUID().slice(0, 6)}`;
      taskDirectory({ threadId, node: 'ide_task', attempt: 1 });
      const config = { configurable: { thread_id: threadId } };
      if (resume) {
        const before = await graph.getState(config);
        if (!before.tasks.some(t => t.interrupts.length > 0)) throw new Error(`Thread ${threadId} inexistente ou sem interrupt pendente.`);
        if (!before.values.idePrepared) throw new Error('Checkpoint da Fase 0 incompativel com os novos nos; crie uma thread da Fase 0.1.');
        await saveHistory(graph, threadId, 'checkpoint-history.before-resume.json');
      }
      console.log(`\nthread_id=${threadId}`);
      let snapshot = await executeSmoke(graph, threadId, resume ? undefined : provider);
      let pending = snapshot.tasks.flatMap(t => t.interrupts);
      let autoFilled = false;
      if (pending.length) {
        await saveHistory(graph, threadId, 'checkpoint-history.paused.json');
        for (const item of pending) console.log('INTERRUPT ' + JSON.stringify(item.value, null, 2));
        console.log(`Preencha output.json e execute: npm run ide-runner:smoke:resume -- ${threadId}`);
        // Never manufacture output for a failed/skipped headless provider.
        if (withManualAutofill && snapshot.values.mode === 'manual') {
          const outputPath = snapshot.values.idePrepared.outputPath;
          fs.writeFileSync(outputPath, JSON.stringify({ score: 80, verdict: 'revise', issues: [
            { severity: 'medium', message: 'Fixture de teste: segundo plano excede a duracao da cena.' },
          ] }, null, 2) + '\n', { flag: 'wx' });
          autoFilled = true;
          console.log('MANUAL_AUTOFILL: fixture sintetica gravada; retomando com Command(resume).');
          snapshot = await executeSmoke(graph, threadId);
          pending = snapshot.tasks.flatMap(t => t.interrupts);
        }
      }
      const state = snapshot.values;
      if (pending.length) {
        rows.push({ ...state.ideHeadlessResult, provider: state.mode, mode: state.mode, threadId,
          verdict: state.ideHeadlessResult?.skipped ? 'SKIPPED/PENDING' : 'PENDING', ok: false, skipped: true,
          reason: state.ideHeadlessResult?.reason ?? 'Manual requer --resume; ainda nao foi validado.',
          durationMs: state.ideHeadlessResult?.durationMs ?? 0,
          outputPath: state.idePrepared.outputPath, autoFilled });
      } else {
        const result = state.ideResults[state.ideResults.length - 1];
        rows.push({ ...result, mode: result.provider, threadId, verdict: state.verdict, autoFilled });
        console.log(`verdict: ${state.verdict}`);
        if (result.completionMode === 'manual') fs.appendFileSync(state.idePrepared.logPath, `[manual-result] ${JSON.stringify(result)}\n`);
      }
      await saveHistory(graph, threadId);
      console.log(`Historico: ${path.join(REPO_ROOT, 'runs', threadId, 'checkpoint-history.json')}`);
    }
    console.table(rows.map(r => ({ mode: r.mode, ok: r.ok, skipped: !!r.skipped, verdict: r.verdict,
      exitCode: r.exitCode ?? '-', durationMs: r.durationMs, autoFilled: r.autoFilled,
      outputPath: r.outputPath, validationErrors: r.validationErrors?.join('; ') ?? '', reason: r.reason ?? '' })));
    fs.writeFileSync(path.join(REPO_ROOT, 'runs', 'smoke-last-results.json'), JSON.stringify(rows, null, 2) + '\n');
    process.exitCode = rows.some(r => !r.ok && !r.skipped) ? 1 : 0;
  } finally { checkpointer.db.close(); }
}

if (require.main === module) main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
