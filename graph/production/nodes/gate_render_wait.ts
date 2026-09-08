import { interrupt } from '@langchain/langgraph';
import { NodeFn } from '../runtime';
export const gateRenderWait: NodeFn = s => {
  const started = Date.now();
  if (!s.options.graph.gates.render) return { timings: [{ node: 'gate_render_wait', startedAt: new Date(started).toISOString(), endedAt: new Date().toISOString(), ms: Date.now() - started, status: 'skipped' }] };
  const answer = interrupt({ gate: 'render', summary: { episodeId: s.episodeId, gatekeeper: s.gatekeeper } }) as { decision: string };
  if (!answer || !['proceed', 'abort'].includes(answer.decision)) throw new Error('decision deve ser proceed ou abort');
  return { gateDecisions: [{ gate: 'render', decision: answer.decision as 'proceed' | 'abort', at: new Date().toISOString() }],
    ...(answer.decision === 'abort' ? { productionStatus: 'ABORTED' as const } : {}),
    timings: [{ node: 'gate_render_wait', startedAt: new Date(started).toISOString(), endedAt: new Date().toISOString(), ms: Date.now() - started }] };
};
