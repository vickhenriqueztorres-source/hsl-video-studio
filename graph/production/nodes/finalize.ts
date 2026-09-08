import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, manifest, writeJson } from '../runtime';
import { NodeError, Timing } from '../state';
import {assertMediaCoverage} from '../lib/mediaCoverage';
import {createRenderIdentity,finalIdentity,cachedRender,identityHash,fileContentHash,receiptMatches} from '../lib/renderIdentity';
import {renderDurationSeconds} from '../lib/remotion';
export const finalize = (c: Context): NodeFn => async s => {
  const status = s.productionStatus === 'RUNNING' ? (s.compliance?.passed ? 'COMPLETED' : 'COMPLIANCE_FAILED') : s.productionStatus;
  if(status==='COMPLETED'){
    assertMediaCoverage(c,s);
    const p=paths(c,s),identity=createRenderIdentity(c,s),masterInputHash=finalIdentity(c,s,identity);
    if(!cachedRender(c,p.final,renderDurationSeconds(s),'final',masterInputHash))throw new Error('FINALIZE_MASTER_PROVENANCE_INVALID');
    const inputHash=identityHash({master:fileContentHash(p.final),render:identity.hash,masterInputHash,rulesetVersion:'2.1.0'});
    if(!receiptMatches(path.join(p.audit,'compliance.json'),'compliance',inputHash))throw new Error('FINALIZE_COMPLIANCE_PROVENANCE_INVALID');
    if(!s.compliance?.passed || (s.compliance.failedRules ?? 0) > 0) throw new Error('FINALIZE_COMPLIANCE_REJECTED: status COMPLETED requires 100% PRD rules passed');
    if(!fs.existsSync(p.final) || fs.statSync(p.final).size < 10000) throw new Error(`FINALIZE_MASTER_EMPTY_OR_CORRUPT: master video deve existir e ter arquivo válido (${p.final})`);
  }
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
