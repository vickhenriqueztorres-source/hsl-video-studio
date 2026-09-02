import path from 'node:path';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { createCheckpointer } from '../checkpointer';
import { prepareAndRunIdeTask, validateIdeOutput } from '../ide/ideRunner';
import { runManual } from '../ide/drivers/manual';
import { IdeProvider, IdeResult, PreparedTask } from '../ide/types';

export const SmokeState = Annotation.Root({
  threadId: Annotation<string>,
  mode: Annotation<IdeProvider>,
  ideTaskDir: Annotation<string>,
  idePrepared: Annotation<PreparedTask>,
  ideHeadlessResult: Annotation<IdeResult | undefined>,
  ideResults: Annotation<IdeResult[]>({ reducer: (left, right) => left.concat(right), default: () => [] }),
  verdict: Annotation<'PASS' | 'SKIPPED' | 'FAIL'>,
});

export function createSmokeGraph(checkpointer: ReturnType<typeof createCheckpointer>) {
  return new StateGraph(SmokeState)
    .addNode('ide_prepare', async state => {
      const { prepared, headlessResult } = await prepareAndRunIdeTask({
        threadId: state.threadId, node: 'ide_task', attempt: 1, provider: state.mode,
        promptTemplate: 'graph/smoke/prompts/hello-review.md',
        schemaPath: 'graph/smoke/schemas/hello-review.schema.json',
        readOnly: state.mode === 'codex',
      });
      return { ideTaskDir: path.dirname(prepared.outputPath), idePrepared: prepared, ideHeadlessResult: headlessResult };
    })
    .addNode('ide_wait', state => {
      // HARD RULE: no spawn, filesystem writes or non-idempotent effects here.
      if (state.mode !== 'manual' && !state.ideHeadlessResult?.skipped) {
        return { ideResults: [state.ideHeadlessResult!] };
      }
      const started = Date.now();
      const response = runManual(state.idePrepared, state.ideHeadlessResult?.reason);
      const result = validateIdeOutput(state.idePrepared, response, Date.now() - started);
      return { ideResults: [{ ...result, completionMode: 'manual' as const }] };
    })
    .addNode('summarize', state => {
      const results = state.ideResults;
      const verdict = results.some(r => !r.ok && !r.skipped) || !results.length ? 'FAIL' :
        results.some(r => r.skipped) ? 'SKIPPED' : 'PASS';
      return { verdict };
    })
    .addEdge(START, 'ide_prepare')
    .addEdge('ide_prepare', 'ide_wait')
    .addEdge('ide_wait', 'summarize')
    .addEdge('summarize', END)
    .compile({ checkpointer });
}
