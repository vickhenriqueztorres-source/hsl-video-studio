import fs from 'node:fs';
import path from 'node:path';
import type { ComplianceReport, ComplianceRuleResult, ComplianceOptions } from '../../spec/hsl-compliance-checker';
import type { HslLongFormProjectPlan } from '../../hsl/core/types';
import { loadEvidencePackage, validateEvidencePackage } from '../../graph/production/lib/evidenceRegistry';

const PROHIBITED_WORDS = [
  'imperdivel', 'imperdível',
  'voce nao vai acreditar', 'você não vai acreditar',
  'chocante',
  'surreal',
  'segredo revelado',
  'truque infalivel', 'truque infalível',
  'bomba',
];

export class BrechaComplianceChecker {
  public static checkCompliance(
    episodeId: string = 'BRECHA_EPISODE_001',
    options: ComplianceOptions = {},
    root: string = process.cwd()
  ): ComplianceReport {
    const results: ComplianceRuleResult[] = [];
    const runDir = path.join(root, 'runs', episodeId);
    const plan = options.plan ?? (fs.existsSync(path.join(runDir, 'scene-plan.json'))
      ? JSON.parse(fs.readFileSync(path.join(runDir, 'scene-plan.json'), 'utf8'))
      : null);

    // Rule 1: 4-Act Structure
    const has4Acts = plan?.acts && plan.acts.length === 4;
    results.push({
      ruleId: 'RULE_BRECHA_ACT_STRUCTURE',
      name: 'Estrutura Editorial Canônica em 4 Atos',
      prdClause: 'Diretriz Editorial BRECHA 4 Atos',
      expected: '4 atos (Superfície, Anomalia, Momento da Brecha, Impacto & Sobrevivência)',
      measured: plan?.acts ? `${plan.acts.length} atos detectados` : 'Plano ausente',
      passed: Boolean(has4Acts),
      failureReason: has4Acts ? undefined : 'Episódio BRECHA deve conter exatamente os 4 atos canônicos.'
    });

    // Rule 2: Portuguese Narration
    const allScripts = plan?.beats?.map((b: any) => b.voiceoverScript).join(' ') ?? '';
    const hasEnglishSlips = /\b(the|this system|hydrant manifold|pipeline to|subsea cable)\b/i.test(allScripts);
    const hasPortugueseWords = /\b(celular|banco|fraude|golpe|sistema|vítima|segurança|tempo|minutos)\b/i.test(allScripts);
    const isPortuguese = !hasEnglishSlips && hasPortugueseWords;
    results.push({
      ruleId: 'RULE_BRECHA_LOCALE_PORTUGUESE',
      name: 'Roteiro e Narração em Português Brasileiro (pt-BR)',
      prdClause: 'Identidade Editorial BRECHA — Idioma Nativo',
      expected: 'Texto 100% em pt-BR natural, sem vazamento de frases em inglês',
      measured: isPortuguese ? 'Roteiro validado em português natural' : (hasEnglishSlips ? 'Detectadas frases residuais em inglês' : 'Roteiro não parece em português'),
      passed: isPortuguese,
      failureReason: isPortuguese ? undefined : 'O roteiro contém termos em inglês ou vocabulário não compatível com pt-BR.'
    });

    // Rule 3: Prohibited Sensationalist Vocabulary
    const normalizedText = allScripts.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const foundProhibited = PROHIBITED_WORDS.filter(w => normalizedText.includes(w.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
    const passedVocab = foundProhibited.length === 0;
    results.push({
      ruleId: 'RULE_BRECHA_PROHIBITED_VOCABULARY',
      name: 'Vocabulário Proibido / Antiamarelismo',
      prdClause: 'Política Editorial de Credibilidade Jornalística',
      expected: 'Zero termos sensacionalistas proibidos',
      measured: passedVocab ? 'Linguagem sóbria e factual validada' : `Detectados termos proibidos: ${foundProhibited.join(', ')}`,
      passed: passedVocab,
      failureReason: passedVocab ? undefined : `Roteiro contém termos sensacionalistas proibidos: ${foundProhibited.join(', ')}`
    });

    // Rule 4: Reconstruction Labels
    const reconstructionBeats = plan?.beats?.filter((b: any) => b.isReconstruction) ?? [];
    const missingLabels = reconstructionBeats.filter((b: any) => !b.telemetryLabel || !/reconstitui|ilustrativa/i.test(b.telemetryLabel));
    const passedReconstruction = missingLabels.length === 0;
    results.push({
      ruleId: 'RULE_BRECHA_RECONSTRUCTION_LABELS',
      name: 'Rotulagem de Reconstituições e Cenas Ilustrativas',
      prdClause: 'Transparência Visual e Conformidade Jornalística',
      expected: 'Todas as cenas de reconstituição contêm rotulagem visual explícita',
      measured: passedReconstruction
        ? `${reconstructionBeats.length} cenas de reconstituição devidamente rotuladas`
        : `${missingLabels.length} cenas de reconstituição sem rótulo adequado`,
      passed: passedReconstruction,
      failureReason: passedReconstruction ? undefined : 'Cenas de reconstituição sem disclaimer visual explícito.'
    });

    // Rule 5: Evidence Registry
    const evidencePkg = loadEvidencePackage(runDir);
    let passedEvidence = false;
    let evidenceMeasured = 'evidence-package.json não encontrado';
    if (evidencePkg) {
      const validation = validateEvidencePackage(evidencePkg);
      if (validation.valid && evidencePkg.sources.length > 0) {
        passedEvidence = true;
        evidenceMeasured = `${evidencePkg.sources.length} fontes e ${evidencePkg.claims.length} alegações verificadas`;
      } else {
        evidenceMeasured = `Erros no pacote de evidências: ${validation.errors.join('; ')}`;
      }
    }
    results.push({
      ruleId: 'RULE_BRECHA_EVIDENCE_INTEGRITY',
      name: 'Integridade de Evidências e Fontes Jornalísticas',
      prdClause: 'Dossiê Técnico de Fontes Primárias e Secundárias',
      expected: 'Pacote de evidências válido com fontes primárias ou secundárias registradas',
      measured: evidenceMeasured,
      passed: passedEvidence,
      failureReason: passedEvidence ? undefined : 'Falha na verificação de integridade do pacote de evidências.'
    });

    // Rule 6: Master Video Container & Provenance
    const masterPath = options.expectedMasterPath ?? path.join(root, 'out', `${episodeId.toLowerCase()}.mp4`);
    let videoPassed = false;
    let videoMeasured = 'Arquivo master não encontrado';
    if (fs.existsSync(masterPath) && fs.statSync(masterPath).size > 1000000) {
      videoPassed = true;
      videoMeasured = `Master verificado no disco (${(fs.statSync(masterPath).size / (1024 * 1024)).toFixed(1)} MB)`;
    }
    results.push({
      ruleId: 'RULE_BRECHA_MASTER_DELIVERABLE',
      name: 'Entregável Master de Vídeo',
      prdClause: 'Renderização Concluída e Íntegra',
      expected: 'Arquivo MP4 master renderizado com tamanho > 1MB',
      measured: videoMeasured,
      passed: videoPassed,
      failureReason: videoPassed ? undefined : 'Arquivo de vídeo master ausente ou corrompido.'
    });

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;

    return {
      episodeId,
      timestamp: new Date().toISOString(),
      passed: failedCount === 0,
      totalRules: results.length,
      passedRules: passedCount,
      failedRules: failedCount,
      results
    };
  }
}
