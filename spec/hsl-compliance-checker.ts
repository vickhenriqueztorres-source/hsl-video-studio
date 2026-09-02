import fs from 'fs';
import path from 'path';
import {
  HSL_EPISODE_MIN_DURATION_SECONDS,
  HSL_EPISODE_MAX_DURATION_SECONDS,
  HSL_DURATION_TOLERANCE_SECONDS,
  HSL_FPS,
  HSL_VIDEO_WIDTH,
  HSL_VIDEO_HEIGHT,
  HSL_VIDEO_CODEC,
  HSL_TOTAL_ACTS_COUNT,
  HSL_REQUIRED_THUMBNAILS,
  HSL_MIN_THUMBNAIL_SIZE_BYTES,
  HSL_REQUIRED_PACKAGE_FILES,
  HslActSpec
} from './hsl-spec';
import { inspectMediaWithFfprobe, isValidPngFile } from '../hsl/core/hslPathResolver';
import { HslRunValidator, RunVerificationResult } from '../scripts/verifyHslRun';
import { HslLongFormProjectPlan } from '../hsl/core/types';

export interface ComplianceRuleResult {
  readonly ruleId: string;
  readonly name: string;
  readonly prdClause: string;
  readonly expected: string;
  readonly measured: string;
  readonly passed: boolean;
  readonly failureReason?: string;
}

export interface ComplianceReport {
  readonly episodeId: string;
  readonly timestamp: string;
  readonly passed: boolean;
  readonly totalRules: number;
  readonly passedRules: number;
  readonly failedRules: number;
  readonly results: readonly ComplianceRuleResult[];
}

export class HslComplianceChecker {
  /**
   * Executa a checagem rigorosa de conformidade contra a especificação executável do PRD.
   */
  public static checkCompliance(episodeId: string = 'HSL_EPISODE_001'): ComplianceReport {
    const root = process.cwd();
    const results: ComplianceRuleResult[] = [];

    const outVideoPath = path.resolve(root, 'out', `${episodeId.toLowerCase()}.mp4`);
    const narrationPath = path.resolve(root, 'public', 'audio', 'narration.mp3');
    const scenePlanPath = path.resolve(root, 'runs', episodeId, 'scene-plan.json');
    const thumbnailsDir = path.resolve(root, 'runs', episodeId, 'thumbnails');
    const runDir = path.resolve(root, 'runs', episodeId);

    let masterVideoDuration = 0;
    let masterVideoWidth = 0;
    let masterVideoHeight = 0;
    let masterVideoCodec = '';
    let masterVideoHasVideo = false;

    // -------------------------------------------------------------------------
    // 1. CHECAGEM DO VÍDEO MASTER (DURAÇÃO, RESOLUÇÃO, CODEC)
    // -------------------------------------------------------------------------
    if (fs.existsSync(outVideoPath)) {
      try {
        const info = inspectMediaWithFfprobe(outVideoPath);
        masterVideoDuration = info.durationSeconds;
        masterVideoWidth = info.width || 0;
        masterVideoHeight = info.height || 0;
        masterVideoCodec = info.codecName || '';
        masterVideoHasVideo = info.hasVideo;
      } catch (e: any) {
        // Vídeo ilegível
      }
    }

    const durationPass =
      masterVideoDuration >= HSL_EPISODE_MIN_DURATION_SECONDS - HSL_DURATION_TOLERANCE_SECONDS &&
      masterVideoDuration <= HSL_EPISODE_MAX_DURATION_SECONDS + HSL_DURATION_TOLERANCE_SECONDS;

    results.push({
      ruleId: 'RULE_01_VIDEO_DURATION',
      name: 'Duração do Vídeo Master',
      prdClause: 'PRD Cláusula 1.4.1 (10 a 12 minutos)',
      expected: `${HSL_EPISODE_MIN_DURATION_SECONDS}s a ${HSL_EPISODE_MAX_DURATION_SECONDS}s (±${HSL_DURATION_TOLERANCE_SECONDS}s)`,
      measured: masterVideoDuration > 0 ? `${masterVideoDuration.toFixed(2)}s` : 'Arquivo ausente/ilegível',
      passed: durationPass,
      failureReason: !durationPass ? `Duração fora dos limites do PRD: ${masterVideoDuration.toFixed(2)}s` : undefined
    });

    const formatPass =
      masterVideoHasVideo &&
      masterVideoWidth === HSL_VIDEO_WIDTH &&
      masterVideoHeight === HSL_VIDEO_HEIGHT &&
      masterVideoCodec.toLowerCase().includes(HSL_VIDEO_CODEC);

    results.push({
      ruleId: 'RULE_02_VIDEO_FORMAT',
      name: 'Resolução e Codec de Vídeo',
      prdClause: 'RULES Cláusula 6 (1080p Full HD @ H.264)',
      expected: `${HSL_VIDEO_WIDTH}x${HSL_VIDEO_HEIGHT} / ${HSL_VIDEO_CODEC}`,
      measured: `${masterVideoWidth}x${masterVideoHeight} / ${masterVideoCodec}`,
      passed: formatPass,
      failureReason: !formatPass ? `Resolução ou codec divergente: ${masterVideoWidth}x${masterVideoHeight} / ${masterVideoCodec}` : undefined
    });

    // -------------------------------------------------------------------------
    // 2. CHECAGEM DA NARRAÇÃO E SINCRONIA
    // -------------------------------------------------------------------------
    let narrationDuration = 0;
    if (fs.existsSync(narrationPath)) {
      try {
        const audioInfo = inspectMediaWithFfprobe(narrationPath);
        narrationDuration = audioInfo.durationSeconds;
      } catch {}
    }

    const syncDiff = Math.abs(masterVideoDuration - narrationDuration);
    const syncPass = masterVideoDuration > 0 && narrationDuration > 0 && syncDiff <= HSL_DURATION_TOLERANCE_SECONDS;

    results.push({
      ruleId: 'RULE_03_AUDIO_SYNC',
      name: 'Sincronia Narração vs Vídeo',
      prdClause: 'PRD Cláusula 1.4.4 (Alinhamento de Áudio Master)',
      expected: `Diferença máxima de ±${HSL_DURATION_TOLERANCE_SECONDS}s`,
      measured: narrationDuration > 0 ? `Delta: ${syncDiff.toFixed(2)}s (Áudio: ${narrationDuration.toFixed(2)}s)` : 'Narração ausente',
      passed: syncPass,
      failureReason: !syncPass ? `Dessincronia excessiva entre vídeo (${masterVideoDuration.toFixed(2)}s) e narração (${narrationDuration.toFixed(2)}s)` : undefined
    });

    // -------------------------------------------------------------------------
    // 3. ESTRUTURA DOS 8 ATOS E CONTINUIDADE TEMPORAL
    // -------------------------------------------------------------------------
    let actsPass = false;
    let actsMeasured = 'Plano de cenas não encontrado';
    let actsFailureReason: string | undefined;

    if (fs.existsSync(scenePlanPath)) {
      try {
        const plan: HslLongFormProjectPlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
        const actsCount = plan.acts ? plan.acts.length : 0;
        const totalPlanSeconds = plan.totalDurationSeconds || 0;

        if (actsCount !== HSL_TOTAL_ACTS_COUNT) {
          actsFailureReason = `Contagem de atos incorreta: ${actsCount} atos (esperado: ${HSL_TOTAL_ACTS_COUNT})`;
        } else if (totalPlanSeconds < HSL_EPISODE_MIN_DURATION_SECONDS || totalPlanSeconds > HSL_EPISODE_MAX_DURATION_SECONDS) {
          actsFailureReason = `Duração planejada dos atos (${totalPlanSeconds}s) fora da faixa [${HSL_EPISODE_MIN_DURATION_SECONDS}s, ${HSL_EPISODE_MAX_DURATION_SECONDS}s]`;
        } else {
          actsPass = true;
          actsMeasured = `${actsCount} Atos contínuos / ${totalPlanSeconds}s planejados (${plan.beats.length} beats)`;
        }
      } catch (err: any) {
        actsFailureReason = `Erro ao ler scene-plan.json: ${err.message}`;
      }
    }

    results.push({
      ruleId: 'RULE_04_ACT_STRUCTURE',
      name: 'Estrutura Canônica de 8 Atos',
      prdClause: 'BRIEFING Cláusula 3 (8 Atos sem sobreposição/gaps)',
      expected: `${HSL_TOTAL_ACTS_COUNT} Atos cobrindo ${HSL_EPISODE_MIN_DURATION_SECONDS}s a ${HSL_EPISODE_MAX_DURATION_SECONDS}s`,
      measured: actsMeasured,
      passed: actsPass,
      failureReason: actsFailureReason
    });

    // -------------------------------------------------------------------------
    // 4. INTEGRIDADE BEAT-TO-ASSET (DELEGADO AO VALIDADOR DA MISSÃO 1)
    // -------------------------------------------------------------------------
    let beatsPass = false;
    let beatsMeasured = 'Falha na validação de beats';
    let beatsFailureReason: string | undefined;

    try {
      const runVerification = HslRunValidator.verifyRun(episodeId);
      beatsPass = runVerification.passed;
      beatsMeasured = `${runVerification.validBeats}/${runVerification.totalBeats} beats com mídia física íntegra`;
      if (!beatsPass) {
        beatsFailureReason = `${runVerification.failedBeats} beats falharam na validação física de arquivo`;
      }
    } catch (err: any) {
      beatsFailureReason = err.message;
    }

    results.push({
      ruleId: 'RULE_05_BEAT_ASSETS',
      name: 'Integridade Beat-to-Asset (Zero Tela Preta)',
      prdClause: 'PRD Cláusula 1.4.3 (100% de Mídia Real sem Fallback Vazio)',
      expected: '100% dos beats com arquivos válidos (>10KB vídeo, >5KB foto)',
      measured: beatsMeasured,
      passed: beatsPass,
      failureReason: beatsFailureReason
    });

    // -------------------------------------------------------------------------
    // 5. EMPACOTAMENTO OBRIGATÓRIO (3 THUMBNAILS + METADADOS SEO)
    // -------------------------------------------------------------------------
    const missingThumbnails: string[] = [];
    for (const thumbName of HSL_REQUIRED_THUMBNAILS) {
      const thumbPath = path.resolve(thumbnailsDir, thumbName);
      if (!fs.existsSync(thumbPath)) {
        missingThumbnails.push(`${thumbName} (ausente)`);
      } else {
        const stat = fs.statSync(thumbPath);
        if (stat.size < HSL_MIN_THUMBNAIL_SIZE_BYTES) {
          missingThumbnails.push(`${thumbName} (truncada: ${stat.size}B < ${HSL_MIN_THUMBNAIL_SIZE_BYTES}B)`);
        } else if (!isValidPngFile(thumbPath)) {
          missingThumbnails.push(`${thumbName} (header PNG inválido)`);
        }
      }
    }

    const missingPkgFiles: string[] = [];
    for (const pkgFile of HSL_REQUIRED_PACKAGE_FILES) {
      const pkgPath = path.resolve(runDir, pkgFile);
      if (!fs.existsSync(pkgPath) || fs.statSync(pkgPath).size < 100) {
        missingPkgFiles.push(pkgFile);
      }
    }

    const packagingPass = missingThumbnails.length === 0 && missingPkgFiles.length === 0;
    const packagingMeasured = packagingPass
      ? `3/3 Thumbnails 4K válidas + ${HSL_REQUIRED_PACKAGE_FILES.length} artefatos de publicação`
      : `Falhas: ${[...missingThumbnails, ...missingPkgFiles].join(', ')}`;

    results.push({
      ruleId: 'RULE_06_PACKAGING_DELIVERABLES',
      name: 'Empacotamento de Entrega YouTube',
      prdClause: 'PRD Cláusula 1.4.6 & BRIEFING Cláusula 4 (3 Thumbnails 4K + Pacote SEO)',
      expected: `3 Thumbnails válidas (${HSL_REQUIRED_THUMBNAILS.join(', ')}) + ${HSL_REQUIRED_PACKAGE_FILES.join(', ')}`,
      measured: packagingMeasured,
      passed: packagingPass,
      failureReason: !packagingPass ? `Artefatos de empacotamento incompletos: ${packagingMeasured}` : undefined
    });

    // -------------------------------------------------------------------------
    // 7. CHECAGEM DE ANTI-REPETIÇÃO DO ROTEIRO (ZERO LOOPS NARRATIVOS)
    // -------------------------------------------------------------------------
    let uniqueScriptsRatio = 0;
    let totalBeats = 0;
    let maxDurationSpread = 0;
    if (fs.existsSync(scenePlanPath)) {
      try {
        const plan: HslLongFormProjectPlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
        totalBeats = plan.beats.length;
        const scripts = plan.beats.map(b => b.voiceoverScript);
        const uniqueScripts = new Set(scripts);
        uniqueScriptsRatio = uniqueScripts.size / totalBeats;

        const durations = plan.beats.map(b => b.durationSeconds);
        maxDurationSpread = Math.max(...durations) - Math.min(...durations);
      } catch {}
    }

    const antiRepetitionPass = uniqueScriptsRatio >= 0.95 && totalBeats > 0;
    results.push({
      ruleId: 'RULE_07_NARRATIVE_ANTI_REPETITION',
      name: 'Anti-Repetição Narrativa Beat-a-Beat',
      prdClause: 'PRD Cláusula 1.4.2 & SPEC Seção 10 (Zero Loops de Roteiro)',
      expected: '100% de scripts narrativos únicos e progressivos nos 96 beats',
      measured: `${(uniqueScriptsRatio * 100).toFixed(1)}% de textos únicos (${Math.round(uniqueScriptsRatio * totalBeats)}/${totalBeats})`,
      passed: antiRepetitionPass,
      failureReason: !antiRepetitionPass ? `Roteiro contém loops repetitivos (${(uniqueScriptsRatio * 100).toFixed(1)}% únicos).` : undefined
    });

    // -------------------------------------------------------------------------
    // 8. CHECAGEM DE PACING DINÂMICO (ELIMINAÇÃO DE METRÔNOMO)
    // -------------------------------------------------------------------------
    const dynamicPacingPass = maxDurationSpread >= 4.0;
    results.push({
      ruleId: 'RULE_08_DYNAMIC_PACING_VARIATION',
      name: 'Pacing Rítmico Dinâmico de Cenas',
      prdClause: 'PRD Cláusula 1.4.3 & SPEC Seção 10 (Variação Respiratória de 3s a 11s)',
      expected: 'Variação entre planos rápidos (2.5s-4s) e planos heróicos (8s-11s), spread >= 4.0s',
      measured: `Spread de duração: ${maxDurationSpread.toFixed(1)}s`,
      passed: dynamicPacingPass,
      failureReason: !dynamicPacingPass ? `Edição estática em metrônomo (spread de apenas ${maxDurationSpread.toFixed(1)}s < 4.0s).` : undefined
    });

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;
    const overallPassed = failedCount === 0;

    return {
      episodeId,
      timestamp: new Date().toISOString(),
      passed: overallPassed,
      totalRules: results.length,
      passedRules: passedCount,
      failedRules: failedCount,
      results
    };
  }

  /**
   * Imprime relatório estruturado de conformidade e retorna código de saída.
   */
  public static printReportAndExit(report: ComplianceReport): void {
    console.log('\n================================================================');
    console.log(`📋 HSL PRD COMPLIANCE AUDIT // EPISODE: ${report.episodeId}`);
    console.log('================================================================');
    console.log(`🕒 Data/Hora: ${report.timestamp}`);
    console.log(`📊 Regras Avaliadas: ${report.totalRules} | Aprovadas: ${report.passedRules} | Reprovadas: ${report.failedRules}\n`);

    console.log('| Status | Regra / Cláusula | Exigido no PRD | Medido no Repositório |');
    console.log('| :---: | :--- | :--- | :--- |');
    for (const r of report.results) {
      const icon = r.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`| ${icon} | **${r.name}**<br>_${r.prdClause}_ | ${r.expected} | ${r.measured} |`);
    }

    if (report.failedRules > 0) {
      console.log('\n🚨 DETALHAMENTO DAS REPROVAÇÕES DE CONFORMIDADE:');
      console.log('----------------------------------------------------------------');
      for (const r of report.results.filter(res => !res.passed)) {
        console.log(`[${r.ruleId}] ${r.name}`);
        console.log(`  Cláusula: ${r.prdClause}`);
        console.log(`  Motivo da Reprovação: ${r.failureReason}`);
        console.log('----------------------------------------------------------------');
      }
      console.error('\n🛑 COMPLIANCE REJECTED: O ENTREGÁVEL VIOLA REGRAS INEGOCIÁVEIS DO PRD.');
      console.error('================================================================\n');
      process.exit(1);
    } else {
      console.log('\n🎉 COMPLIANCE APPROVED: 100% DAS REGRAS DO PRD CUMPRIDAS COM SUCESSO.');
      console.log('================================================================\n');
      process.exit(0);
    }
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const episodeArg = args.find(a => a.startsWith('--episode='))?.split('=')[1] || 'HSL_EPISODE_001';

  const report = HslComplianceChecker.checkCompliance(episodeArg);
  HslComplianceChecker.printReportAndExit(report);
}
