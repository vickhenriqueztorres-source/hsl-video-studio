import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, manifest, writeJson } from '../runtime';
import { NodeError, Timing } from '../state';
export const finalize = (c: Context): NodeFn => async s => {
  const status = s.productionStatus === 'RUNNING' ? (s.compliance?.passed ? 'COMPLETED' : 'COMPLIANCE_FAILED') : s.productionStatus;
  const m = manifest(c, s);
  const skipped = status === 'COMPLETED' && m.getData().overallStatus === 'COMPLETED';
  if (status === 'COMPLETED' && m.getData().overallStatus !== 'COMPLETED') m.completeRun();
  await c.deps.closeAssetServer();
  const file = path.join(paths(c, s).audit, 'node-events.jsonl');
  const entries = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : [];
  const errors = entries.filter((x: NodeError & { type: string }) => x.type === 'error').map(({ type, ...rest }) => rest as NodeError)
    .filter((x: NodeError) => !s.errors.some(e => e.node === x.node && e.at === x.at));
  const timings = entries.filter((x: Timing & { type: string }) => x.type === 'timing' && x.status === 'failed').map(({ type, ...rest }) => rest as Timing)
    .filter((x: Timing) => !s.timings.some(e => e.node === x.node && e.startedAt === x.startedAt));
  writeJson(path.join(paths(c, s).audit, 'status.json'), { productionStatus: status });
  return { productionStatus: status, errors, timings, __status: skipped ? 'skipped' : 'ok' };
};
