import fs from 'fs';
import path from 'path';
import { HslRunValidator, RunVerificationResult } from '../../scripts/verifyHslRun';
import { HslImageFrameEngine } from './hslImageFrameEngine';
import { HslFireflyVideoEngine } from './hslFireflyVideoEngine';
import { HslSceneBeat, HslLongFormProjectPlan } from './types';

export interface GatekeeperResult {
  readonly episodeId: string;
  readonly passed: boolean;
  readonly autoRecovered: boolean;
  readonly blocked_reason?: string;
  readonly verifiedBeatsCount: number;
  readonly totalBeatsCount: number;
  readonly narrationDurationSeconds?: number;
  readonly statePath: string;
}

export interface ExecutionStateData {
  readonly episodeId: string;
  readonly timestamp: string;
  readonly gatekeeperStatus: 'PASSED' | 'BLOCKED';
  readonly autoRecovered: boolean;
  readonly totalBeats: number;
  readonly validBeats: number;
  readonly failedBeats: number;
  readonly narrationDurationSeconds: number;
  readonly blocked_reason?: string;
  readonly errors: readonly any[];
}

/**
 * Validador e Gatekeeper Físico Canônico do Pipeline HSL com Auto-Cura.
 */
export async function validateBeforeRender(episodeId: string = 'HSL_EPISODE_001'): Promise<GatekeeperResult> {
  const root = process.cwd();
  const statePath = path.resolve(root, 'HSL_EXECUTION_STATE.json');

  console.log(`\n🛡️ [Gatekeeper] Executando validação física pré-render para ${episodeId}...`);

  // 1. Verificação Física Inicial de 100% dos Beats
  let verification: RunVerificationResult = HslRunValidator.verifyRun(episodeId);
  let autoRecovered = false;

  // 2. Se houver falha de contrato físico, aciona Auto-Cura Autônoma
  if (!verification.passed && verification.errors.length > 0) {
    console.warn(`⚠️ [Gatekeeper] ${verification.failedBeats} assets com falha física detectados. Disparando auto-cura autônoma...`);

    const scenePlanPath = path.resolve(root, 'runs', episodeId, 'scene-plan.json');
    if (fs.existsSync(scenePlanPath)) {
      const plan: HslLongFormProjectPlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
      const missingBeatIds = new Set(verification.errors.map(e => e.beatId));
      const missingBeats: HslSceneBeat[] = plan.beats.filter(b => missingBeatIds.has(b.beatId));

      // Auto-regeneração de frames de imagem
      const missingFrames = missingBeats.filter(b => b.visualMode === 'generated_image_35mm' || b.visualMode === 'motion_image_diagram');
      if (missingFrames.length > 0) {
        console.log(`🔄 [Gatekeeper Auto-Cura] Regenerando ${missingFrames.length} frames de imagem ausentes...`);
        try {
          await HslImageFrameEngine.generateFramesForEpisode(episodeId, plan.beats);
        } catch (err: any) {
          console.error(`❌ [Gatekeeper Auto-Cura] Falha ao regenerar frames: ${err.message}`);
        }
      }

      // Auto-regeneração de takes de vídeo Firefly
      const missingVideos = missingBeats.filter(b => b.visualMode === 'firefly_video');
      if (missingVideos.length > 0) {
        console.log(`🔄 [Gatekeeper Auto-Cura] Regenerando ${missingVideos.length} takes de vídeo ausentes...`);
        try {
          await HslFireflyVideoEngine.processVideoBeatsForEpisode(episodeId, plan.beats);
        } catch (err: any) {
          console.error(`❌ [Gatekeeper Auto-Cura] Falha ao regenerar vídeos: ${err.message}`);
        }
      }

      // 3. Segunda Rodada de Verificação Física Rigorosa (Zero Tolerância)
      verification = HslRunValidator.verifyRun(episodeId);
      autoRecovered = verification.passed;
    }
  }

  // 4. Persistência Atômica do Estado no HSL_EXECUTION_STATE.json
  const blockedReason = !verification.passed
    ? `Falha física de contrato em ${verification.failedBeats} beats: ${verification.errors.map(e => `[${e.beatId}: ${e.reason}]`).join('; ')}`
    : undefined;

  const statePayload: ExecutionStateData = {
    episodeId,
    timestamp: new Date().toISOString(),
    gatekeeperStatus: verification.passed ? 'PASSED' : 'BLOCKED',
    autoRecovered,
    totalBeats: verification.totalBeats,
    validBeats: verification.validBeats,
    failedBeats: verification.failedBeats,
    narrationDurationSeconds: verification.narrationInfo?.actualDuration || 0,
    blocked_reason: blockedReason,
    errors: verification.errors
  };

  fs.writeFileSync(statePath, JSON.stringify(statePayload, null, 2), 'utf8');

  // Sincroniza também no diretório da run
  const runStatePath = path.resolve(root, 'runs', episodeId, 'HSL_EXECUTION_STATE.json');
  fs.mkdirSync(path.dirname(runStatePath), { recursive: true });
  fs.writeFileSync(runStatePath, JSON.stringify(statePayload, null, 2), 'utf8');

  if (!verification.passed) {
    console.error(`🛑 [Gatekeeper: BLOCKED] Validação falhou para ${episodeId}.`);
    console.error(`   Motivo: ${blockedReason}`);
    return {
      episodeId,
      passed: false,
      autoRecovered: false,
      blocked_reason: blockedReason,
      verifiedBeatsCount: verification.validBeats,
      totalBeatsCount: verification.totalBeats,
      narrationDurationSeconds: verification.narrationInfo?.actualDuration,
      statePath
    };
  }

  console.log(`✅ [Gatekeeper: PASSED] 100% dos ${verification.validBeats} assets validados fisicamente no disco.`);
  if (autoRecovered) {
    console.log(`✨ [Gatekeeper: AUTO-HEALED] Assets faltantes foram auto-regenerados e validados com sucesso.`);
  }

  return {
    episodeId,
    passed: true,
    autoRecovered,
    verifiedBeatsCount: verification.validBeats,
    totalBeatsCount: verification.totalBeats,
    narrationDurationSeconds: verification.narrationInfo?.actualDuration,
    statePath
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const episodeArg = args.find(a => a.startsWith('--episode='))?.split('=')[1] || 'HSL_EPISODE_001';

  validateBeforeRender(episodeArg)
    .then(res => {
      if (!res.passed) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error(`FATAL_GATEKEEPER_ERROR: ${err.message}`);
      process.exit(1);
    });
}
