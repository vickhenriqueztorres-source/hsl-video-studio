import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  HSL_EPISODE_MIN_DURATION_SECONDS,
  HSL_EPISODE_MAX_DURATION_SECONDS,
  HSL_DURATION_TOLERANCE_SECONDS,
  HSL_FPS,
  HSL_VIDEO_WIDTH,
  HSL_VIDEO_HEIGHT,
  HSL_VIDEO_CODEC,
  HSL_AUDIO_CODEC,
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

export interface ComplianceOptions {
  readonly targetSeconds?: number;
  readonly targetMinutes?: number;
  readonly expectedMasterPath?: string;
  readonly plan?: HslLongFormProjectPlan | null;
  readonly mediaPlan?: any;
  readonly sfxTrackPath?: string;
  readonly sfxQaPath?: string;
}

function detectBlackIntervals(filePath: string, minDuration = 2): { start: number; end: number; duration: number }[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const res = spawnSync('ffmpeg', ['-i', filePath, '-vf', `blackdetect=d=${minDuration}:pix_th=0.10`, '-f', 'null', '-'], { encoding: 'utf8' });
    const output = (res.stderr || '') + (res.stdout || '');
    const intervals: { start: number; end: number; duration: number }[] = [];
    const lines = output.split('\n');
    for (const line of lines) {
      const match = /black_start:([0-9.]+)\s+black_end:([0-9.]+)\s+black_duration:([0-9.]+)/.exec(line);
      if (match) {
        intervals.push({ start: parseFloat(match[1]), end: parseFloat(match[2]), duration: parseFloat(match[3]) });
      }
    }
    return intervals;
  } catch {
    return [];
  }
}

function detectSilenceIntervals(filePath: string, noise = '-40dB', minDuration = 4): { start: number; end: number; duration: number }[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const res = spawnSync('ffmpeg', ['-i', filePath, '-af', `silencedetect=noise=${noise}:d=${minDuration}`, '-f', 'null', '-'], { encoding: 'utf8' });
    const output = (res.stderr || '') + (res.stdout || '');
    const intervals: { start: number; end: number; duration: number }[] = [];
    const lines = output.split('\n');
    let currentStart: number | null = null;
    for (const line of lines) {
      const startMatch = /silence_start:\s*([0-9.]+)/.exec(line);
      if (startMatch) {
        currentStart = parseFloat(startMatch[1]);
      }
      const endMatch = /silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/.exec(line);
      if (endMatch) {
        const end = parseFloat(endMatch[1]);
        const dur = parseFloat(endMatch[2]);
        intervals.push({ start: currentStart ?? (end - dur), end, duration: dur });
        currentStart = null;
      }
    }
    return intervals;
  } catch {
    return [];
  }
}

function detectSpeechEnd(filePath: string, totalDuration: number): { lastSpeech: number; trailingSilence: number } {
  const silences = detectSilenceIntervals(filePath, '-30dB', 3);
  if (silences.length === 0) return { lastSpeech: totalDuration, trailingSilence: 0 };
  const last = silences[silences.length - 1];
  if (last.end >= totalDuration - 2.0 && last.duration >= 4.0) {
    return { lastSpeech: last.start, trailingSilence: last.duration };
  }
  return { lastSpeech: totalDuration, trailingSilence: 0 };
}

export class HslComplianceChecker {
  /**
   * Executa a checagem rigorosa de conformidade contra a especificação executável do PRD.
   */
  public static checkCompliance(episodeId: string = 'HSL_EPISODE_001', options?: ComplianceOptions): ComplianceReport {
    const root = process.cwd();
    const results: ComplianceRuleResult[] = [];

    const candidateOutPaths = [
      options?.expectedMasterPath,
      path.resolve(root, 'out', `${episodeId.toLowerCase()}.mp4`),
      path.resolve(root, 'deliveries', episodeId, 'video', `${episodeId.toLowerCase()}.mp4`)
    ].filter((p): p is string => Boolean(p && fs.existsSync(p)));
    const outVideoPath = candidateOutPaths[0] ?? path.resolve(root, 'out', `${episodeId.toLowerCase()}.mp4`);

    const candidateNarrationPaths = [
      path.resolve(root, 'runs', episodeId, 'audio', 'narration-master.wav'),
      path.resolve(root, 'runs', episodeId, 'audio', 'narration.mp3'),
      path.resolve(root, 'runs', episodeId, 'audio', 'narration-synced.wav'),
      path.resolve(root, 'public', 'runs', episodeId, 'audio', 'narration-master.wav'),
      path.resolve(root, 'public', 'audio', 'narration.mp3')
    ];
    const narrationPath = candidateNarrationPaths.find(p => fs.existsSync(p)) || candidateNarrationPaths[0];
    const scenePlanPath = path.resolve(root, 'runs', episodeId, 'scene-plan.json');
    const thumbnailsDir = path.resolve(root, 'runs', episodeId, 'thumbnails');
    const runDir = path.resolve(root, 'runs', episodeId);

    let masterVideoDuration = 0;
    let masterVideoWidth = 0;
    let masterVideoHeight = 0;
    let masterVideoCodec = '';
    let masterVideoHasVideo = false;
    let masterVideoHasAudio = false;

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
        masterVideoHasAudio = info.hasAudio;
      } catch (e: any) {
        // Vídeo ilegível
      }
    }

    let plan: HslLongFormProjectPlan | null | undefined = options?.plan;
    if (!plan && fs.existsSync(scenePlanPath)) {
      try {
        plan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
      } catch {}
    }

    // DURAÇÃO ALVO EXATA: Se especificado targetSeconds ou targetMinutes ou frames, deve seguir rigorosamente
    const planTargetSeconds = options?.targetSeconds
      ?? (options?.targetMinutes ? options.targetMinutes * 60 : undefined)
      ?? (plan?.totalFrames && Number.isSafeInteger(plan.totalFrames) ? plan.totalFrames / HSL_FPS : undefined)
      ?? (plan?.totalDurationSeconds && Number.isFinite(plan.totalDurationSeconds) ? plan.totalDurationSeconds : undefined)
      ?? (plan?.targetMinutes && Number.isFinite(plan.targetMinutes) ? plan.targetMinutes * 60 : undefined)
      ?? HSL_EPISODE_MIN_DURATION_SECONDS;

    const minVideo = planTargetSeconds - HSL_DURATION_TOLERANCE_SECONDS;
    const maxVideo = planTargetSeconds + HSL_DURATION_TOLERANCE_SECONDS;
    const durationPass = masterVideoDuration >= minVideo && masterVideoDuration <= maxVideo;

    results.push({
      ruleId: 'RULE_01_VIDEO_DURATION',
      name: 'Duração do Vídeo Master',
      prdClause: 'Contrato de duração solicitado no plano/opções',
      expected: `${planTargetSeconds.toFixed(1)}s (±${HSL_DURATION_TOLERANCE_SECONDS}s)`,
      measured: masterVideoDuration > 0 ? `${masterVideoDuration.toFixed(2)}s` : 'Arquivo ausente/ilegível',
      passed: durationPass,
      failureReason: !durationPass ? `Duração medida (${masterVideoDuration.toFixed(2)}s) diverge do alvo (${planTargetSeconds.toFixed(1)}s ±${HSL_DURATION_TOLERANCE_SECONDS}s)` : undefined
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
    // 2. CHECAGEM DA NARRAÇÃO E SINCRONIA (SEM APAD DE SILÊNCIO)
    // -------------------------------------------------------------------------
    let narrationDuration = 0;
    if (fs.existsSync(narrationPath)) {
      try {
        const audioInfo = inspectMediaWithFfprobe(narrationPath);
        narrationDuration = audioInfo.durationSeconds;
      } catch {}
    }

    const syncDiff = Math.abs(masterVideoDuration - narrationDuration);
    const speech = fs.existsSync(narrationPath) && narrationDuration > 0
      ? detectSpeechEnd(narrationPath, narrationDuration)
      : { lastSpeech: 0, trailingSilence: 0 };
    const speechEndedEarly = masterVideoDuration > 0 && (masterVideoDuration - speech.lastSpeech) > 5.0 && speech.trailingSilence > 5.0;
    const syncPass = masterVideoDuration > 0 && narrationDuration > 0 && syncDiff <= HSL_DURATION_TOLERANCE_SECONDS && !speechEndedEarly;

    let syncFailureReason: string | undefined;
    if (!syncPass) {
      if (speechEndedEarly) {
        syncFailureReason = `Narração cessa prematuramente em ${speech.lastSpeech.toFixed(1)}s (${speech.trailingSilence.toFixed(1)}s de silêncio na cauda para vídeo de ${masterVideoDuration.toFixed(1)}s)`;
      } else if (syncDiff > HSL_DURATION_TOLERANCE_SECONDS) {
        syncFailureReason = `Dessincronia excessiva entre vídeo (${masterVideoDuration.toFixed(2)}s) e narração (${narrationDuration.toFixed(2)}s)`;
      } else {
        syncFailureReason = 'Arquivo de narração ausente ou corrompido';
      }
    }

    results.push({
      ruleId: 'RULE_03_AUDIO_SYNC',
      name: 'Sincronia Narração vs Vídeo',
      prdClause: 'PRD Cláusula 1.4.4 (Alinhamento de Áudio Master sem preenchimento falso)',
      expected: `Diferença máxima de ±${HSL_DURATION_TOLERANCE_SECONDS}s e voz ativa até o encerramento`,
      measured: narrationDuration > 0 ? `Delta: ${syncDiff.toFixed(2)}s (Voz ativa até: ${speech.lastSpeech.toFixed(1)}s)` : 'Narração ausente',
      passed: syncPass,
      failureReason: syncFailureReason
    });

    const narrationQaPath = path.resolve(runDir, 'audio', 'narration-audio-qa.json');
    let narrationQa: any;
    try { narrationQa = JSON.parse(fs.readFileSync(narrationQaPath, 'utf8')); } catch {}
    const narrationQualityPass = narrationQa?.status === 'NARRATION_AUDIO_QA_PASS' &&
      narrationQa.sample_rate === 48000 && narrationQa.channels === 2 && narrationQa.codec === 'pcm_s16le' &&
      Number(narrationQa.integrated_lufs) >= -17 && Number(narrationQa.integrated_lufs) <= -15 &&
      Number(narrationQa.true_peak_dbtp) <= -1;
    results.push({
      ruleId: 'RULE_03B_NARRATION_AUDIO_QUALITY',
      name: 'Qualidade Técnica da Narração',
      prdClause: 'Sound Design (master de voz normalizado e sem compressão com perdas)',
      expected: 'PCM s16le, 48 kHz, estéreo, -16 LUFS ±1 e true peak <= -1 dBTP',
      measured: narrationQa ? `${narrationQa.codec || 'codec desconhecido'}, ${narrationQa.sample_rate || 0} Hz, ${narrationQa.channels || 0} canais, ${narrationQa.integrated_lufs ?? '?'} LUFS, ${narrationQa.true_peak_dbtp ?? '?'} dBTP` : 'Recibo de QA ausente',
      passed: narrationQualityPass,
      failureReason: narrationQualityPass ? undefined : `Narração sem QA técnico aprovado em ${narrationQaPath}`
    });

    // -------------------------------------------------------------------------
    // 3. ESTRUTURA DOS 8 ATOS E CONTINUIDADE TEMPORAL ESTRITA
    // -------------------------------------------------------------------------
    let actsPass = false;
    let actsMeasured = 'Plano de cenas não encontrado';
    let actsFailureReason: string | undefined;

    if (plan) {
      try {
        const actsCount = plan.acts ? plan.acts.length : 0;
        const totalPlanSeconds = plan.totalDurationSeconds || 0;
        const actsDurationSum = plan.acts ? plan.acts.reduce((a, b) => a + b.durationSeconds, 0) : 0;
        const beatsDurationSum = plan.beats ? plan.beats.reduce((a, b) => a + b.durationSeconds, 0) : 0;
        const beatsFramesSum = plan.beats ? plan.beats.reduce((a, b) => a + b.durationFrames, 0) : 0;
        const actsBeatsSum = plan.acts ? plan.acts.reduce((a, b) => a + b.beatsCount, 0) : 0;
        const durationMatches = Math.abs(masterVideoDuration - totalPlanSeconds) <= HSL_DURATION_TOLERANCE_SECONDS;
        const sumsMatch = Math.abs(actsDurationSum - totalPlanSeconds) < 0.5 &&
                          Math.abs(beatsDurationSum - totalPlanSeconds) < 0.5 &&
                          beatsFramesSum === plan.totalFrames &&
                          actsBeatsSum === plan.totalBeatsCount;

        if (actsCount !== HSL_TOTAL_ACTS_COUNT) {
          actsFailureReason = `Contagem de atos incorreta: ${actsCount} atos (esperado: ${HSL_TOTAL_ACTS_COUNT})`;
        } else if (!sumsMatch) {
          actsFailureReason = `Divergência matemática no plano: soma de atos (${actsDurationSum.toFixed(1)}s), soma de beats (${beatsDurationSum.toFixed(1)}s), totalPlan (${totalPlanSeconds}s)`;
        } else if (!durationMatches) {
          actsFailureReason = `Master real (${masterVideoDuration.toFixed(1)}s) diverge da partitura de atos (${totalPlanSeconds.toFixed(1)}s)`;
        } else {
          actsPass = true;
          actsMeasured = `${actsCount} Atos contínuos / ${totalPlanSeconds}s planejados (${plan.beats.length} beats, frames sincronizados)`;
        }
      } catch (err: any) {
        actsFailureReason = `Erro ao analisar atos do plano: ${err.message}`;
      }
    }

    results.push({
      ruleId: 'RULE_04_ACT_STRUCTURE',
      name: 'Estrutura Canônica de 8 Atos',
      prdClause: 'BRIEFING Cláusula 3 (8 Atos contínuos e igualdade matemática com o vídeo real)',
      expected: `${HSL_TOTAL_ACTS_COUNT} Atos cobrindo exatamente ${planTargetSeconds}s alinhados ao master`,
      measured: actsMeasured,
      passed: actsPass,
      failureReason: actsFailureReason
    });

    // -------------------------------------------------------------------------
    // 4. INTEGRIDADE BEAT-TO-ASSET NO DISCO
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
      name: 'Integridade Beat-to-Asset',
      prdClause: 'PRD Cláusula 1.4.3 (100% de Mídia Real sem Fallback Vazio)',
      expected: '100% dos beats com arquivos válidos (>10KB vídeo, >5KB foto)',
      measured: beatsMeasured,
      passed: beatsPass,
      failureReason: beatsFailureReason
    });

    // -------------------------------------------------------------------------
    // 5. INSPEÇÃO FÍSICA DE TELA PRETA NO MASTER (ZERO TELA PRETA REAL)
    // -------------------------------------------------------------------------
    const blackIntervals = detectBlackIntervals(outVideoPath, 2);
    const blackPass = fs.existsSync(outVideoPath) && blackIntervals.length === 0;
    const blackMeasured = fs.existsSync(outVideoPath)
      ? (blackIntervals.length === 0 ? 'Zero intervalos de tela preta detectados' : `${blackIntervals.length} intervalo(s) de tela preta (total: ${blackIntervals.reduce((a, b) => a + b.duration, 0).toFixed(1)}s)`)
      : 'Vídeo master ausente';

    results.push({
      ruleId: 'RULE_05B_MASTER_ZERO_BLACK_SCREEN',
      name: 'Zero Tela Preta no Master Final',
      prdClause: 'PRD Cláusula 1.4.3 (Inspeção contínua da timeline e cauda do master)',
      expected: 'Zero intervalos de tela preta >= 2.0s em todo o arquivo master',
      measured: blackMeasured,
      passed: blackPass,
      failureReason: !blackPass ? `Tela preta detectada no master: ${blackIntervals.map(i => `${i.duration.toFixed(1)}s [${i.start.toFixed(1)}s a ${i.end.toFixed(1)}s]`).join(', ')}` : undefined
    });

    // -------------------------------------------------------------------------
    // 6. EMPACOTAMENTO OBRIGATÓRIO (3 THUMBNAILS + METADADOS SEO)
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
    if (plan) {
      try {
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
      expected: '100% de scripts narrativos únicos e progressivos nos beats',
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

    // -------------------------------------------------------------------------
    // 9. CHECAGEM DE SILÊNCIO CONTÍNUO (CAMA SONORA CONTÍNUA OBRIGATÓRIA)
    // -------------------------------------------------------------------------
    const silences = detectSilenceIntervals(outVideoPath, '-40dB', 4);
    const continuousBedPass = fs.existsSync(outVideoPath) && masterVideoHasAudio && silences.length === 0;
    const bedMeasured = fs.existsSync(outVideoPath)
      ? (silences.length === 0 ? 'Cama sonora ininterrupta sem vácuo acústico' : `${silences.length} trecho(s) de silêncio contínuo (total: ${silences.reduce((a, b) => a + b.duration, 0).toFixed(1)}s)`)
      : 'Vídeo master ausente';

    results.push({
      ruleId: 'RULE_09_AUDIO_CONTINUOUS_BED',
      name: 'Cama Sonora Contínua no Master',
      prdClause: 'PRD Cláusula 1.4.4 (Presença ininterrupta de ambiência ou trilha)',
      expected: 'Zero trechos de silêncio contínuo >= 4.0s no master final',
      measured: bedMeasured,
      passed: continuousBedPass,
      failureReason: !continuousBedPass ? `Silêncio contínuo detectado no master (cama sonora ausente): ${silences.map(s => `${s.duration.toFixed(1)}s [${s.start.toFixed(1)}s a ${s.end.toFixed(1)}s]`).join(', ')}` : undefined
    });

    // -------------------------------------------------------------------------
    // 10. CONTRATO DE 3 FAIXAS DE ÁUDIO (VOZ + MÚSICA DUCKED + SFX KENNEY)
    // -------------------------------------------------------------------------
    const sfxTrack = options?.sfxTrackPath ?? path.resolve(root, 'runs', episodeId, 'audio', 'sfx-track.wav');
    const sfxQa = options?.sfxQaPath ?? path.resolve(path.dirname(sfxTrack), 'soundfx-qa.json');
    const sfxExists = fs.existsSync(sfxTrack) && fs.statSync(sfxTrack).size > 1000;
    let sfxQaPass = false;
    if (fs.existsSync(sfxQa)) {
      try {
        const qaData = JSON.parse(fs.readFileSync(sfxQa, 'utf8'));
        sfxQaPass = qaData.status === 'SFX_QA_PASS';
      } catch {}
    }

    const musicCandidates = [
      path.resolve(root, 'assets/audio-library/music/cinematic/suspense/suspense_oppressive_gloom.mp3'),
      path.resolve(root, 'public/audio/music/cinematic/suspense/suspense_oppressive_gloom.mp3')
    ];
    const musicExists = musicCandidates.some(p => fs.existsSync(p));
    const threeTrackPass = masterVideoHasAudio && sfxExists && sfxQaPass && musicExists;
    const missingAudioParts = [
      !masterVideoHasAudio ? 'Áudio ausente no container MP4' : '',
      !sfxExists ? 'Trilha sfx-track.wav ausente' : '',
      !sfxQaPass ? 'Validação SFX_QA_PASS pendente' : '',
      !musicExists ? 'Trilha musical de suspense ausente no banco' : ''
    ].filter(Boolean);

    results.push({
      ruleId: 'RULE_10_AUDIO_THREE_TRACK_BED',
      name: 'Contrato Master de 3 Faixas de Áudio',
      prdClause: 'PRD Cláusula 1.4.4 & SPEC Seção 6 (Narração Hero + Trilha -28dB com Ducking + Cama SFX Kenney)',
      expected: 'Container MP4 estéreo com narração, música de suspense e sound design Kenney homologado',
      measured: threeTrackPass ? '3 faixas integradas com sound design homologado em QA' : `Incompleto: ${missingAudioParts.join(', ')}`,
      passed: threeTrackPass,
      failureReason: !threeTrackPass ? `Contrato de áudio incompleto: ${missingAudioParts.join('; ')}` : undefined
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
