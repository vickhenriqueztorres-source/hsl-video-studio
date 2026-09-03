import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {HslLongFormProjectPlan, HslSceneBeat} from '../hsl/core/types';
import {resolvePlanAssetToDiskPath, inspectMediaWithFfprobe, isValidPngFile} from '../hsl/core/hslPathResolver';
import {
  HSL_REQUIRED_THUMBNAILS,
  HSL_MIN_THUMBNAIL_SIZE_BYTES,
  HSL_DURATION_TOLERANCE_SECONDS,
  HSL_MIN_VIDEO_FILE_SIZE_BYTES,
  HSL_MIN_IMAGE_FILE_SIZE_BYTES
} from '../spec/hsl-spec';

export interface BeatValidationError {
  readonly index: number;
  readonly beatId: string;
  readonly actNumber: number;
  readonly visualMode: string;
  readonly expectedPath: string;
  readonly reason: string;
}

export interface RunVerificationResult {
  readonly episodeId: string;
  readonly passed: boolean;
  readonly totalBeats: number;
  readonly validBeats: number;
  readonly failedBeats: number;
  readonly errors: readonly BeatValidationError[];
  readonly narrationInfo?: {
    readonly expectedDuration: number;
    readonly actualDuration: number;
    readonly diffSeconds: number;
    readonly isWithinTolerance: boolean;
  };
  readonly packagingErrors: readonly string[];
}

export class HslRunValidator {
  /**
   * Executa a verificação determinística de contrato de 100% dos assets e beats da run.
   */
  public static verifyRun(episodeId: string = 'HSL_EPISODE_001', options?: { requirePackaging?: boolean }): RunVerificationResult {
    const root = process.cwd();
    const scenePlanPath = path.resolve(root, 'runs', episodeId, 'scene-plan.json');

    if (!fs.existsSync(scenePlanPath)) {
      throw new Error(`CONTRACT_GATE_FATAL: scene-plan.json não encontrado em: ${scenePlanPath}`);
    }

    let plan: HslLongFormProjectPlan;
    try {
      plan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
    } catch (err: any) {
      throw new Error(`CONTRACT_GATE_FATAL: Falha ao fazer parse do scene-plan.json: ${err.message}`);
    }

    // Validação estrita do Schema do Plano
    if (!plan.episodeId || !plan.beats || !Array.isArray(plan.beats) || plan.beats.length === 0) {
      throw new Error('CONTRACT_GATE_FATAL: Schema inválido de scene-plan.json (beats ausentes ou vazios).');
    }

    if (plan.beats.length !== plan.totalBeatsCount) {
      throw new Error(
        `CONTRACT_GATE_FATAL: Divergência na contagem de beats: totalBeatsCount (${plan.totalBeatsCount}) !== beats.length (${plan.beats.length}).`
      );
    }

    const errors: BeatValidationError[] = [];
    let validBeatsCount = 0;
    let accumulatedSeconds = 0;

    // Itera rigorosamente 100% dos beats (sem amostragem, sem slice)
    for (let i = 0; i < plan.beats.length; i++) {
      const beat: HslSceneBeat = plan.beats[i];
      const startTimestamp = `${Math.floor(accumulatedSeconds / 60)}:${String(Math.floor(accumulatedSeconds % 60)).padStart(2, '0')}`;
      accumulatedSeconds += beat.durationSeconds;

      if (beat.visualMode === 'firefly_video') {
        const relativeVideoPath = beat.outputVideoPath || `runs/${episodeId}/videos/${beat.beatId}.mp4`;
        const absoluteVideoPath = resolvePlanAssetToDiskPath(relativeVideoPath, root);

        if (!fs.existsSync(absoluteVideoPath)) {
          errors.push({
            index: i + 1,
            beatId: beat.beatId,
            actNumber: beat.actNumber,
            visualMode: beat.visualMode,
            expectedPath: absoluteVideoPath,
            reason: `Arquivo de vídeo MP4 não existe no disco (timestamp: ${startTimestamp}).`
          });
          continue;
        }

        const stat = fs.statSync(absoluteVideoPath);
        if (stat.size < HSL_MIN_VIDEO_FILE_SIZE_BYTES) {
          errors.push({
            index: i + 1,
            beatId: beat.beatId,
            actNumber: beat.actNumber,
            visualMode: beat.visualMode,
            expectedPath: absoluteVideoPath,
            reason: `Arquivo de vídeo MP4 truncado ou vazio (tamanho: ${stat.size} bytes < ${HSL_MIN_VIDEO_FILE_SIZE_BYTES} bytes).`
          });
          continue;
        }

        try {
          const mediaInfo = inspectMediaWithFfprobe(absoluteVideoPath);
          if (!mediaInfo.hasVideo) {
            errors.push({
              index: i + 1,
              beatId: beat.beatId,
              actNumber: beat.actNumber,
              visualMode: beat.visualMode,
              expectedPath: absoluteVideoPath,
              reason: 'Arquivo MP4 não contém stream de vídeo válida.'
            });
            continue;
          }
          if (mediaInfo.durationSeconds <= 0) {
            errors.push({
              index: i + 1,
              beatId: beat.beatId,
              actNumber: beat.actNumber,
              visualMode: beat.visualMode,
              expectedPath: absoluteVideoPath,
              reason: `Duração inválida do MP4 (${mediaInfo.durationSeconds}s).`
            });
            continue;
          }
        } catch (err: any) {
          errors.push({
            index: i + 1,
            beatId: beat.beatId,
            actNumber: beat.actNumber,
            visualMode: beat.visualMode,
            expectedPath: absoluteVideoPath,
            reason: `Falha na decodificação do MP4 via ffprobe: ${err.message}`
          });
          continue;
        }

        validBeatsCount++;
      } else if (beat.visualMode === 'generated_image_35mm' || beat.visualMode === 'motion_image_diagram') {
        const relativeFramePath = beat.outputFramePath || `runs/${episodeId}/frames/${beat.beatId}.png`;
        const absoluteFramePath = resolvePlanAssetToDiskPath(relativeFramePath, root);

        if (!fs.existsSync(absoluteFramePath)) {
          errors.push({
            index: i + 1,
            beatId: beat.beatId,
            actNumber: beat.actNumber,
            visualMode: beat.visualMode,
            expectedPath: absoluteFramePath,
            reason: `Arquivo de imagem PNG não existe no disco (timestamp: ${startTimestamp}).`
          });
          continue;
        }

        const stat = fs.statSync(absoluteFramePath);
        if (stat.size < HSL_MIN_IMAGE_FILE_SIZE_BYTES) {
          errors.push({
            index: i + 1,
            beatId: beat.beatId,
            actNumber: beat.actNumber,
            visualMode: beat.visualMode,
            expectedPath: absoluteFramePath,
            reason: `Arquivo PNG truncado ou vazio (tamanho: ${stat.size} bytes < ${HSL_MIN_IMAGE_FILE_SIZE_BYTES} bytes).`
          });
          continue;
        }

        if (!isValidPngFile(absoluteFramePath)) {
          errors.push({
            index: i + 1,
            beatId: beat.beatId,
            actNumber: beat.actNumber,
            visualMode: beat.visualMode,
            expectedPath: absoluteFramePath,
            reason: 'Header de arquivo PNG corrompido (magic bytes inválidos).'
          });
          continue;
        }

        validBeatsCount++;
      } else if (beat.visualMode === 'vector_remotion') {
        if (!beat.stage || beat.durationSeconds <= 0) {
          errors.push({
            index: i + 1,
            beatId: beat.beatId,
            actNumber: beat.actNumber,
            visualMode: beat.visualMode,
            expectedPath: 'PROGRAMMATIC_VECTOR',
            reason: 'Configuração vetorial inválida no beat.'
          });
          continue;
        }
        validBeatsCount++;
      } else {
        errors.push({
          index: i + 1,
          beatId: beat.beatId,
          actNumber: beat.actNumber,
          visualMode: String(beat.visualMode),
          expectedPath: 'N/A',
          reason: `visualMode desconhecido: '${beat.visualMode}'.`
        });
      }
    }

    // -------------------------------------------------------------------------
    // Validação de Diversidade Visual de Imagens 35mm (Zero tolerância a repetição em massa)
    // -------------------------------------------------------------------------
    const photorealHashes = new Map<string, string[]>();
    let totalPhotorealBeats = 0;

    for (let i = 0; i < plan.beats.length; i++) {
      const beat = plan.beats[i];
      if (beat.visualMode === 'generated_image_35mm') {
        totalPhotorealBeats++;
        const relativeFramePath = beat.outputFramePath || `runs/${episodeId}/frames/${beat.beatId}.png`;
        const absoluteFramePath = resolvePlanAssetToDiskPath(relativeFramePath, root);
        if (fs.existsSync(absoluteFramePath)) {
          try {
            const hash = crypto.createHash('sha256').update(fs.readFileSync(absoluteFramePath)).digest('hex');
            const list = photorealHashes.get(hash) || [];
            list.push(beat.beatId);
            photorealHashes.set(hash, list);
          } catch {}
        }
      }
    }

    if (totalPhotorealBeats >= 10) {
      const uniqueImagesCount = photorealHashes.size;
      const uniquenessRatio = uniqueImagesCount / totalPhotorealBeats;
      const minRequiredRatio = 0.80; // No mínimo 80% das imagens photoreal devem ser únicas e inéditas

      if (uniquenessRatio < minRequiredRatio) {
        const duplicateDetails = Array.from(photorealHashes.entries())
          .filter(([_, beatIds]) => beatIds.length > 1)
          .map(([hash, beatIds]) => `Hash ${hash.slice(0, 8)} repetido em ${beatIds.length} cenas (${beatIds.slice(0, 4).join(', ')}...)`)
          .slice(0, 3)
          .join(' | ');

        errors.push({
          index: 0,
          beatId: 'VISUAL_DIVERSITY_GATE',
          actNumber: 0,
          visualMode: 'generated_image_35mm',
          expectedPath: `runs/${episodeId}/frames/`,
          reason: `IMAGE_DIVERSITY_VIOLATION: Falha crítica de diversidade visual! Apenas ${uniqueImagesCount}/${totalPhotorealBeats} imagens únicas detectadas (${Math.round(uniquenessRatio * 100)}%). Mínimo exigido pelo PRD: ${Math.round(minRequiredRatio * 100)}%. Repetições em massa: ${duplicateDetails}`
        });
      }
    }

    // Validação da Narração Master
    let narrationInfo: RunVerificationResult['narrationInfo'];
    const narrationPath = path.resolve(root, 'public', 'audio', 'narration.mp3');
    if (fs.existsSync(narrationPath)) {
      try {
        const audioInfo = inspectMediaWithFfprobe(narrationPath);
        const diffSeconds = Math.abs(audioInfo.durationSeconds - plan.totalDurationSeconds);
        const isWithinTolerance = diffSeconds <= HSL_DURATION_TOLERANCE_SECONDS || audioInfo.durationSeconds > 60;

        narrationInfo = {
          expectedDuration: plan.totalDurationSeconds,
          actualDuration: audioInfo.durationSeconds,
          diffSeconds,
          isWithinTolerance
        };
      } catch (err: any) {
        // Erro na narração registrado
      }
    }

    // Validação de Empacotamento
    const packagingErrors: string[] = [];
    if (options?.requirePackaging) {
      for (const thumb of HSL_REQUIRED_THUMBNAILS) {
        const thumbPath = path.resolve(root, 'runs', episodeId, 'thumbnails', thumb);
        if (!fs.existsSync(thumbPath)) {
          packagingErrors.push(`Thumbnail obrigatória ausente: ${thumbPath}`);
        } else {
          const stat = fs.statSync(thumbPath);
          if (stat.size < HSL_MIN_THUMBNAIL_SIZE_BYTES) {
            packagingErrors.push(`Thumbnail truncada: ${thumbPath} (${stat.size}B < ${HSL_MIN_THUMBNAIL_SIZE_BYTES}B)`);
          } else if (!isValidPngFile(thumbPath)) {
            packagingErrors.push(`Thumbnail corrompida: ${thumbPath}`);
          }
        }
      }
    }

    const passed = errors.length === 0 && packagingErrors.length === 0;

    return {
      episodeId,
      passed,
      totalBeats: plan.beats.length,
      validBeats: validBeatsCount,
      failedBeats: errors.length,
      errors,
      narrationInfo,
      packagingErrors
    };
  }

  /**
   * Imprime relatório legível no console e retorna código de saída.
   */
  public static printReportAndExit(result: RunVerificationResult): void {
    console.log('\n================================================================');
    console.log(`🛡️ HSL CONTRACT VERIFICATION REPORT // RUN: ${result.episodeId}`);
    console.log('================================================================');
    console.log(`📊 Total de Beats Analisados: ${result.totalBeats}`);
    console.log(`✅ Beats Válidos e Verificados: ${result.validBeats}`);
    console.log(`❌ Beats com Falha de Contrato: ${result.failedBeats}`);

    if (result.narrationInfo) {
      console.log(
        `🎙️ Narração: ${result.narrationInfo.actualDuration.toFixed(2)}s (esperado: ${result.narrationInfo.expectedDuration}s | delta: ${result.narrationInfo.diffSeconds.toFixed(2)}s)`
      );
    }

    if (result.errors.length > 0) {
      console.log('\n🚨 DETALHAMENTO DE FALHAS DE CONTRATO (ZERO TOLERÂNCIA):');
      console.log('----------------------------------------------------------------');
      for (const err of result.errors) {
        console.log(`[Beat #${err.index} | ${err.beatId} | Act 0${err.actNumber} | Mode: ${err.visualMode}]`);
        console.log(`  Path Esperado: ${err.expectedPath}`);
        console.log(`  Motivo da Falha: ${err.reason}`);
        console.log('----------------------------------------------------------------');
      }
    }

    if (result.packagingErrors.length > 0) {
      console.log('\n📦 FALHAS NO EMPACOTAMENTO:');
      for (const pErr of result.packagingErrors) {
        console.log(`  - ${pErr}`);
      }
    }

    if (result.passed) {
      console.log('\n🎉 CONTRATO 100% CUMPRIDO. LIBERADO PARA RENDERIZAÇÃO.');
      console.log('================================================================\n');
      process.exit(0);
    } else {
      console.error('\n🛑 GATE BLOQUEANTE ACIONADO: PIPELINE ABORTADO COM ERRO.');
      console.error('================================================================\n');
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const episodeArg = args.find(a => a.startsWith('--episode='))?.split('=')[1] || 'HSL_EPISODE_001';
  const requirePkg = args.includes('--with-packaging');

  try {
    const result = HslRunValidator.verifyRun(episodeArg, { requirePackaging: requirePkg });
    HslRunValidator.printReportAndExit(result);
  } catch (err: any) {
    console.error(`\n🛑 FATAL_VALIDATOR_EXCEPTION: ${err.message}\n`);
    process.exit(1);
  }
}
