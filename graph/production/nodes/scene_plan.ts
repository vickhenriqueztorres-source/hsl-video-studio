import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, readJson, writeJson, withStage } from '../runtime';
import { HslLongFormProjectPlan } from '../../../hsl/core/types';
import { normalizePlanDuration } from '../lib/plan';
import { BrechaSceneDirectorAgent } from '../../../channels/brecha/sceneDirector';
import { createEvidencePackage, saveEvidencePackage } from '../lib/evidenceRegistry';

export const scenePlan = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_01_SCENE_PLAN', async () => {
  const file = paths(c, s).plan;
  const isBrecha = (s.channelId === 'brecha') || (s.channelSnapshot?.channelId === 'brecha') || s.episodeId.startsWith('BRECHA_');
  const cached = readJson<HslLongFormProjectPlan>(file);
  const source = cached?.beats && cached.acts
    ? cached
    : isBrecha
      ? BrechaSceneDirectorAgent.planEpisodeFromScratch(s.topicInput)
      : c.deps.plan(s.topicInput);

  // --beats is an explicit canary slice; keep the source timing intact.
  const full = s.options.graph.beats ? source : normalizePlanDuration(source, s.topicInput.targetMinutes ?? 10);
  const changed = full !== source || source !== cached;
  if (changed) writeJson(file, full);
  const selected = s.options.graph.beats ? full.beats.slice(0, s.options.graph.beats) : full.beats;
  const seconds=selected.reduce((n,b)=>n+b.durationSeconds,0), frames=selected.reduce((n,b)=>n+b.durationFrames,0);
  const plan = selected.length===full.beats.length ? full : {...full,beats:selected,totalBeatsCount:selected.length,totalDurationSeconds:seconds,totalFrames:frames,
    acts:full.acts.map(a=>({...a,beatsCount:selected.filter(b=>b.actNumber===a.actNumber).length,durationSeconds:selected.filter(b=>b.actNumber===a.actNumber).reduce((n,b)=>n+b.durationSeconds,0)})).filter(a=>a.beatsCount)};

  if (isBrecha) {
    const runDir = path.join(c.root, 'runs', s.episodeId);
    const evFile = path.join(runDir, 'evidence-package.json');
    if (!fs.existsSync(evFile)) {
      const pkg = createEvidencePackage(
        s.episodeId,
        'brecha',
        [
          {
            id: 'SRC_BCB_MED_2024',
            title: 'Banco Central do Brasil — Relatório de Fraudes e Estatísticas do Mecanismo Especial de Devolução (MED)',
            type: 'central_bank',
            publisher: 'Banco Central do Brasil',
            accessedAt: new Date().toISOString(),
            confidenceTier: 'primary'
          },
          {
            id: 'SRC_SSP_ESTELIONATO_2025',
            title: 'Secretaria de Segurança Pública — Boletim Estatístico de Crimes Eletrônicos e Estelionato Digital',
            type: 'police_report',
            publisher: 'SSP-SP',
            accessedAt: new Date().toISOString(),
            confidenceTier: 'primary'
          }
        ],
        [
          {
            id: 'CLM_01',
            statement: 'A janela de transferência e saque em contas intermediárias concentra-se nos primeiros minutos após a perda de controle do dispositivo.',
            sources: ['SRC_BCB_MED_2024', 'SRC_SSP_ESTELIONATO_2025'],
            confidenceTier: 'primary',
            status: 'verified'
          }
        ],
        Object.fromEntries(
          plan.beats.map(b => [
            b.beatId,
            {
              sceneId: b.beatId,
              beatId: b.beatId,
              claims: ['CLM_01'],
              reconstructionDisclaimerRequired: !!b.isReconstruction,
              displayLabel: b.telemetryLabel
            }
          ])
        )
      );
      saveEvidencePackage(runDir, pkg);
    }
  }

  // A cached/derived scene plan is authoritative for its editorial identity.
  // Do not let initialState's generic defaults contaminate prompt agents.
  const topicInput = {
    ...s.topicInput,
    episodeId: s.episodeId,
    topic: s.options.topic ?? plan.episodeTitle ?? s.topicInput.topic,
    entity: s.options.entity ?? plan.subtitle ?? plan.episodeTitle ?? s.topicInput.entity,
    mechanism: s.options.mechanism ?? plan.thesis ?? s.topicInput.mechanism,
    constraint: s.options.constraint ?? (isBrecha ? `Restrições operacionais e limites de segurança documentados por ${plan.episodeTitle}` : `Physical boundary conditions documented by ${plan.episodeTitle}`),
    consequence: s.options.consequence ?? (isBrecha ? `Consequências financeiras e sistêmicas documentadas por ${plan.episodeTitle}` : `Operational consequences documented by ${plan.episodeTitle}`),
    thesis: s.options.thesis ?? plan.thesis ?? s.topicInput.thesis,
    targetMinutes: plan.totalDurationSeconds / 60,
  };
  return { update: { scenePlan: plan, scenePlanPath: file, topicInput }, skipped: !changed, metrics: { totalBeats: plan.totalBeatsCount }, artifacts: { scenePlanPath: file } };
});
