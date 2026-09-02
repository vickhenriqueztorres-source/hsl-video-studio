import { interrupt } from '@langchain/langgraph';
import { NodeFn } from '../runtime';
export const gatePublishWait: NodeFn = s => {
  const started = Date.now();
  if (!s.options.graph.gates.publish) return { timings: [{ node: 'gate_publish_wait', startedAt: new Date(started).toISOString(), endedAt: new Date().toISOString(), ms: Date.now() - started, status: 'skipped' }] };
  const answer = interrupt({ gate: 'publish', summary: { episodeId: s.episodeId, finalVideo: s.finalVideo, compliance: s.compliance } }) as { decision: string };
  if (!answer || !['proceed', 'abort'].includes(answer.decision)) throw new Error('decision deve ser proceed ou abort');
  return { gateDecisions: [{ gate: 'publish', decision: answer.decision as 'proceed' | 'abort', at: new Date().toISOString() }],
    ...(answer.decision === 'abort' ? { productionStatus: 'ABORTED' as const } : {}),
    timings: [{ node: 'gate_publish_wait', startedAt: new Date(started).toISOString(), endedAt: new Date().toISOString(), ms: Date.now() - started }] };
};
