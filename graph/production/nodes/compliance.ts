import path from 'node:path';
import { Context, NodeFn, paths, readJson, writeJson, withStage } from '../runtime';
import { ComplianceReport } from '../../../spec/hsl-compliance-checker';
export const compliance = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_11_PRD_COMPLIANCE', async () => {
  const file = path.join(paths(c, s).audit, 'compliance.json');
  const cached = readJson<ComplianceReport>(file);
  const report = cached?.results && cached.episodeId === s.episodeId ? cached : c.deps.compliance(s.episodeId);
  if (report !== cached) writeJson(file, report);
  if (!report.passed) console.log(JSON.stringify(report, null, 2));
  return { update: { compliance: report, ...(!report.passed ? { productionStatus: 'COMPLIANCE_FAILED' as const } : {}) },
    skipped: report === cached, metrics: { totalRules: report.totalRules, passedRules: report.passedRules },
    failed: report.passed ? undefined : 'Entregável reprovado em ' + report.failedRules + ' regras do PRD.' };
});
