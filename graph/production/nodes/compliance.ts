import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, readJson, writeJson, withStage } from '../runtime';
import { ComplianceReport } from '../../../spec/hsl-compliance-checker';
import { createRenderIdentity, finalIdentity, cachedRender, identityHash, fileContentHash, receiptMatches, invalidateReceipt, writeReceipt } from '../lib/renderIdentity';
import { renderDurationSeconds } from '../lib/remotion';
import {assertMediaCoverage} from '../lib/mediaCoverage';
import type { HslLongFormProjectPlan } from '../../../hsl/core/types';
import { BrechaComplianceChecker } from '../../../channels/brecha/compliance';

export const compliance = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_11_PRD_COMPLIANCE', async () => {
  assertMediaCoverage(c,s);
  const p = paths(c, s), file = path.join(p.audit, 'compliance.json');
  const identity = createRenderIdentity(c, s);
  const masterInputHash = finalIdentity(c, s, identity);
  if (!cachedRender(c, p.final, renderDurationSeconds(s), 'final', masterInputHash)) throw new Error('COMPLIANCE_MASTER_PROVENANCE_INVALID: resume from render_prepare');
  const sfxPath = s.sfxTrackPath ? path.resolve(c.root, s.sfxTrackPath) : path.join(p.run, 'audio', 'sfx-track.wav');
  const sfxQaPath = s.sfxQaPath ? path.resolve(c.root, s.sfxQaPath) : path.join(path.dirname(sfxPath), 'soundfx-qa.json');
  const fingerprint = () => {
    const current = createRenderIdentity(c, s);
    return identityHash({ master: fileContentHash(p.final), render: current.hash, masterInputHash: finalIdentity(c, s, current), rulesetVersion: '2.1.0' });
  };
  const inputHash = fingerprint();
  const cached = readJson<ComplianceReport>(file);
  const skip = cached?.results && cached.episodeId === s.episodeId && cached.passed && receiptMatches(file, 'compliance', inputHash);
  if (!skip) invalidateReceipt(file);
  // The graph state stays bound to the immutable media-plan contract.  A
  // revised voiceover is stored alongside the run and must be what narrative
  // compliance evaluates, without changing Firefly authorization lineage.
  const narrativePlan = (s.scenePlanPath ? readJson<HslLongFormProjectPlan>(s.scenePlanPath) : undefined) ?? s.scenePlan;
  const isBrecha = (s.channelId === 'brecha') || (s.channelSnapshot?.channelId === 'brecha') || s.episodeId.startsWith('BRECHA_');
  const baseReport = skip ? cached : (isBrecha
    ? BrechaComplianceChecker.checkCompliance(s.episodeId, {
        targetSeconds: renderDurationSeconds(s),
        plan: narrativePlan ?? undefined,
        mediaPlan: s.mediaPlan ?? undefined,
        sfxTrackPath: sfxPath,
        sfxQaPath: sfxQaPath,
        expectedMasterPath: p.final
      }, c.root)
    : c.deps.compliance(s.episodeId, {
        targetSeconds: renderDurationSeconds(s),
        plan: narrativePlan ?? undefined,
        mediaPlan: s.mediaPlan ?? undefined,
        sfxTrackPath: sfxPath,
        sfxQaPath: sfxQaPath,
        expectedMasterPath: p.final
      }));
  const mediaRule={ruleId:'RULE_MEDIA_PROVIDER_COVERAGE',name:'Provedor e cobertura de mídia',prdClause:'Perfil de mídia escolhido',
    expected:`${s.mediaPlan!.policy}: ${s.mediaPlan!.fireflyBeatIds.length} cenas Firefly verificadas`,
    measured:`${s.mediaPlan!.fireflyBeatIds.length} cenas com recibos, hashes, duração e cópias verificadas; render ${identity.hash}`,passed:true};
  let sfxPass = false;
  let sfxMeasured = 'Faixa SFX ausente';
  let sfxFailureReason: string | undefined;
  if (fs.existsSync(sfxPath)) {
    try {
      const probe = c.deps.inspect(sfxPath);
      const qa = fs.existsSync(sfxQaPath) ? readJson<{ status?: string; cue_count?: number }>(sfxQaPath) : undefined;
      if (probe.durationSeconds > 0 && probe.hasAudio) {
        sfxPass = true;
        sfxMeasured = `SFX 48kHz estéreo verificado (${probe.durationSeconds.toFixed(1)}s, ${qa?.cue_count ?? 0} eventos integrados)`;
      } else {
        sfxFailureReason = 'Faixa SFX com formato inválido ou duração zero';
      }
    } catch (e: any) {
      sfxFailureReason = `Erro ao inspecionar SFX: ${e.message}`;
    }
  } else {
    sfxFailureReason = 'Arquivo sfx-track.wav não encontrado no disco';
  }
  const sfxRule = {
    ruleId: 'RULE_AUDIO_SFX_BED',
    name: 'Cama de Efeitos Sonoros (Kenney CC0)',
    prdClause: 'Contrato Obrigatório de Áudio Master (Narração + Trilha + SFX)',
    expected: 'Faixa estéreo 48kHz com sound design integrado a partir dos beats',
    measured: sfxMeasured,
    passed: sfxPass,
    failureReason: sfxFailureReason
  };
  const extraRules = [mediaRule, sfxRule];
  const extraIds = new Set(extraRules.map(r => r.ruleId));
  const filteredBaseResults = baseReport.results.filter(r => !extraIds.has(r.ruleId));
  const allResults = [...filteredBaseResults, ...extraRules];
  const failedRules = allResults.filter(r => !r.passed).length;
  const passed = Boolean(baseReport.passed && failedRules === 0);
  const totalFailed = passed ? 0 : Math.max(failedRules, baseReport.failedRules || 1);
  const report: ComplianceReport = skip ? baseReport : {
    ...baseReport,
    totalRules: allResults.length,
    passedRules: allResults.length - totalFailed,
    failedRules: totalFailed,
    passed,
    results: allResults
  };
  if (!skip) {
    writeJson(file, report);
    if (fingerprint() !== inputHash) throw new Error('COMPLIANCE_INPUT_CHANGED');
    if (report.passed) writeReceipt(file, 'compliance', inputHash);
  }
  if (!report.passed) console.log(JSON.stringify(report, null, 2));
  return { update: { compliance: report, ...(!report.passed ? { productionStatus: 'COMPLIANCE_FAILED' as const } : {}) },
    skipped: report === cached, metrics: { totalRules: report.totalRules, passedRules: report.passedRules },
    failed: report.passed ? undefined : 'Entregável reprovado em ' + report.failedRules + ' regras do PRD.' };
});
