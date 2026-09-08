import fs from 'fs';
import path from 'path';
import { HslRunIdentity, HslRunIdComponents } from './hslRunIdentity';
import { HslArtifactRegistry, HslArtifactType } from '../../registry/hslArtifactRegistry';
import { inspectMediaWithFfprobe } from './hslPathResolver';
import { HslSceneDirectorAgent, EpisodeTopicInput, HslLongFormProjectPlan } from './hslSceneDirectorAgent';
import { HSL_DURATION_TOLERANCE_SECONDS } from '../../spec/hsl-spec';
import { HslRunManifest } from './hslRunManifest';

export interface DerivationResult {
  readonly success: boolean;
  readonly targetRunId: string;
  readonly targetHandle: string;
  readonly sourceRunId: string;
  readonly sourceAudioSha256: string;
  readonly targetAudioSha256: string;
  readonly targetDirectory: string;
}

export interface CleanRevisionResult {
  readonly success: boolean;
  readonly sourceRunId: string;
  readonly targetRunId: string;
  readonly targetHandle: string;
  readonly sourceScenePlanSha256: string;
  readonly targetScenePlanSha256: string;
  readonly inheritedArtifacts: readonly [];
  readonly targetDirectory: string;
}

export class HslRunDerivator {
  /**
   * Cria uma revisão com o mesmo plano temporal, mas sem copiar áudio, frames ou
   * vídeos. É o caminho seguro quando nenhum asset da origem é compatível.
   */
  public static deriveCleanRevision(params: {
    sourceRunId: string;
    newVersion?: number;
  }): CleanRevisionResult {
    const root = process.cwd();
    const sourceIdentity = HslRunIdentity.parse(params.sourceRunId);
    const canonicalSourceRunId = HslRunIdentity.buildRunId(sourceIdentity.project, sourceIdentity.episode, sourceIdentity.version);
    const canonicalSourceDir = HslRunIdentity.getRunDirectory(sourceIdentity, root);
    const sourceRunDir = fs.existsSync(canonicalSourceDir)
      ? canonicalSourceDir
      : path.resolve(root, 'runs', params.sourceRunId);
    const sourcePlanPath = path.resolve(sourceRunDir, 'scene-plan.json');
    if (!fs.existsSync(sourcePlanPath)) {
      throw new Error(`DERIVATION_BLOCKED: Plano de origem ausente em '${sourcePlanPath}'.`);
    }

    const targetVersion = params.newVersion ?? sourceIdentity.version + 1;
    if (!Number.isSafeInteger(targetVersion) || targetVersion <= sourceIdentity.version) {
      throw new Error('DERIVATION_BLOCKED: A nova versão deve ser um inteiro maior que a versão de origem.');
    }
    const targetIdentity: HslRunIdComponents = { ...sourceIdentity, version: targetVersion };
    const targetRunId = HslRunIdentity.buildRunId(targetIdentity.project, targetIdentity.episode, targetIdentity.version);
    const targetHandle = HslRunIdentity.buildHandle(targetIdentity.project, targetIdentity.episode, targetIdentity.version);
    const targetRunDir = HslRunIdentity.getRunDirectory(targetIdentity, root);
    const targetPublicDir = HslRunIdentity.getPublicRunDirectory(targetIdentity, root);
    if (fs.existsSync(targetRunDir) || fs.existsSync(targetPublicDir)) {
      throw new Error(`IMMUTABILITY_VIOLATION_FATAL: A run de destino '${targetRunId}' já existe.`);
    }

    const sourcePlan = JSON.parse(fs.readFileSync(sourcePlanPath, 'utf8')) as HslLongFormProjectPlan;
    if (!Array.isArray(sourcePlan.beats) || !sourcePlan.beats.length || sourcePlan.totalFrames <= 0) {
      throw new Error('DERIVATION_BLOCKED: Plano de origem inválido ou vazio.');
    }
    const targetPlan: HslLongFormProjectPlan = {
      ...sourcePlan,
      episodeId: targetRunId,
      targetMinutes: sourcePlan.totalDurationSeconds / 60,
      beats: sourcePlan.beats.map(beat => ({
        ...beat,
        sourceBeatId: beat.sourceBeatId ?? beat.beatId,
        outputFramePath: `runs/${targetRunId}/frames/${beat.beatId}.png`,
        outputVideoPath: `runs/${targetRunId}/videos/${beat.beatId}.mp4`
      }))
    };

    fs.mkdirSync(targetRunDir, { recursive: true });
    fs.mkdirSync(path.resolve(targetRunDir, 'thumbnails'), { recursive: true });
    fs.mkdirSync(path.resolve(targetPublicDir, 'frames'), { recursive: true });
    fs.mkdirSync(path.resolve(targetPublicDir, 'videos'), { recursive: true });
    const targetPlanPath = path.resolve(targetRunDir, 'scene-plan.json');
    fs.writeFileSync(targetPlanPath, JSON.stringify(targetPlan, null, 2), 'utf8');

    const sourceScenePlanSha256 = HslArtifactRegistry.computeSha256(sourcePlanPath);
    const targetScenePlanSha256 = HslArtifactRegistry.computeSha256(targetPlanPath);
    const lineage = {
      derivedFromRunId: canonicalSourceRunId,
      sourceScenePlanSha256,
      inheritedArtifacts: [] as const
    };
    const manifest = new HslRunManifest(targetRunId, root);
    manifest.setArtifacts({ scenePlanPath: targetPlanPath });
    manifest.setLineage(lineage);
    fs.writeFileSync(path.resolve(targetRunDir, 'revision-receipt.json'), JSON.stringify({
      schema: 'hsl.clean-revision/v1', sourceRunId: canonicalSourceRunId, targetRunId,
      sourceScenePlanSha256, targetScenePlanSha256, inheritedArtifacts: [],
      createdAt: new Date().toISOString()
    }, null, 2) + '\n', 'utf8');

    new HslArtifactRegistry(root).registerRun(targetRunId, {
      lineage: { derivedFromRunId: canonicalSourceRunId, inheritedArtifacts: [] }
    });
    return {
      success: true, sourceRunId: canonicalSourceRunId, targetRunId, targetHandle,
      sourceScenePlanSha256, targetScenePlanSha256, inheritedArtifacts: [], targetDirectory: targetRunDir
    };
  }

  /**
   * Deriva uma nova versão de run a partir de uma existente, herdando a narração com validação estrita.
   */
  public static deriveWithInheritedAudio(params: {
    sourceRunHandleOrId: string;
    newVersion?: number;
    customTopic?: Partial<EpisodeTopicInput>;
  }): DerivationResult {
    const root = process.cwd();
    const registry = new HslArtifactRegistry(root);

    // 1. Resolve o artefato de áudio da run de origem
    const sourceAudioArtifact = registry.resolve(
      params.sourceRunHandleOrId.includes('-audio')
        ? params.sourceRunHandleOrId
        : `${params.sourceRunHandleOrId}-audio`
    );

    if (sourceAudioArtifact.artifactType !== 'narration_audio') {
      throw new Error(`DERIVATION_BLOCKED: O artefato selecionado '${sourceAudioArtifact.handle}' não é uma narração válida.`);
    }

    if (sourceAudioArtifact.complianceStatus !== 'APPROVED') {
      throw new Error(
        `DERIVATION_BLOCKED: A narração '${sourceAudioArtifact.handle}' está ${sourceAudioArtifact.complianceStatus}; somente áudio APPROVED pode ser herdado.`
      );
    }

    if (!fs.existsSync(sourceAudioArtifact.absolutePath)) {
      throw new Error(`DERIVATION_BLOCKED: Arquivo físico de áudio não encontrado em '${sourceAudioArtifact.absolutePath}'.`);
    }

    // 2. Valida o áudio de origem via ffprobe
    const sourceAudioInfo = inspectMediaWithFfprobe(sourceAudioArtifact.absolutePath);
    if (!sourceAudioInfo.hasAudio || sourceAudioInfo.durationSeconds <= 0) {
      throw new Error(`DERIVATION_BLOCKED: Áudio de origem inválido ou sem stream de som (duração: ${sourceAudioInfo.durationSeconds}s).`);
    }

    const sourceSha256 = HslArtifactRegistry.computeSha256(sourceAudioArtifact.absolutePath);

    // 3. Determina a identidade da nova versão
    const sourceIdentity = HslRunIdentity.parse(sourceAudioArtifact.runId);
    const targetVersion = params.newVersion || (sourceIdentity.version + 1);

    const targetComponents: HslRunIdComponents = {
      project: sourceIdentity.project,
      episode: sourceIdentity.episode,
      version: targetVersion
    };

    const targetRunId = HslRunIdentity.buildRunId(targetComponents.project, targetComponents.episode, targetComponents.version);
    const targetHandle = HslRunIdentity.buildHandle(targetComponents.project, targetComponents.episode, targetComponents.version);
    const targetRunDir = HslRunIdentity.getRunDirectory(targetComponents, root);
    const targetPublicDir = HslRunIdentity.getPublicRunDirectory(targetComponents, root);

    if (fs.existsSync(targetRunDir)) {
      throw new Error(`IMMUTABILITY_VIOLATION_FATAL: A run de destino '${targetRunId}' já existe em '${targetRunDir}'. Reexecuções devem usar nova versão.`);
    }

    // 4. Cria diretórios isolados da nova run (zero vazamento de assets visuais antigos)
    fs.mkdirSync(targetRunDir, { recursive: true });
    fs.mkdirSync(path.resolve(targetRunDir, 'thumbnails'), { recursive: true });
    fs.mkdirSync(path.resolve(targetPublicDir, 'frames'), { recursive: true });
    fs.mkdirSync(path.resolve(targetPublicDir, 'videos'), { recursive: true });

    // 5. Herda a narração copiando atomicamente para o diretório da nova run
    const targetAudioPath = path.resolve(targetRunDir, 'narration.mp3');
    fs.copyFileSync(sourceAudioArtifact.absolutePath, targetAudioPath);

    const targetSha256 = HslArtifactRegistry.computeSha256(targetAudioPath);
    if (sourceSha256 !== targetSha256) {
      throw new Error(`INTEGRITY_MISMATCH_FATAL: Hash SHA-256 do áudio herdado (${targetSha256}) difere da origem (${sourceSha256}).`);
    }

    // 6. Planeja as cenas do zero e valida compatibilidade estrita de duração
    const topicInput: EpisodeTopicInput = {
      episodeId: targetRunId,
      topic: params.customTopic?.topic || 'THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING (DERIVED V2)',
      targetMinutes: 10,
      entity: params.customTopic?.entity || 'Airport Jet Fuel Logistics',
      mechanism: params.customTopic?.mechanism || 'Pipeline to Hydrant Manifold High-Pressure Injection',
      constraint: params.customTopic?.constraint || 'Hydrant Pressure Collapse at Node D (72 Units/min)',
      consequence: params.customTopic?.consequence || '56 Delayed Flights and $2.7M Cascading Economic Loss',
      thesis: params.customTopic?.thesis || 'The visible product is a flight; the hidden product is synchronized fuel logistics.'
    };

    const scenePlan: HslLongFormProjectPlan = HslSceneDirectorAgent.planEpisodeFromScratch(topicInput);
    const durationDelta = Math.abs(scenePlan.totalDurationSeconds - sourceAudioInfo.durationSeconds);

    if (durationDelta > HSL_DURATION_TOLERANCE_SECONDS) {
      // Limpa diretório parcial para manter idempotência
      fs.rmSync(targetRunDir, { recursive: true, force: true });
      fs.rmSync(targetPublicDir, { recursive: true, force: true });
      throw new Error(
        `DERIVATION_DURATION_MISMATCH_FATAL: O plano de cenas da nova run (${scenePlan.totalDurationSeconds}s) é incompatível com o áudio herdado (${sourceAudioInfo.durationSeconds}s). Delta (${durationDelta.toFixed(2)}s) excede a tolerância de ${HSL_DURATION_TOLERANCE_SECONDS}s.`
      );
    }

    // Grava o novo plano
    fs.writeFileSync(path.resolve(targetRunDir, 'scene-plan.json'), JSON.stringify(scenePlan, null, 2), 'utf8');

    // 7. Registra a linhagem no manifesto e no registry
    const manifest = new HslRunManifest(targetRunId, root);
    manifest.setArtifacts({
      narrationAudioPath: targetAudioPath,
      narrationDurationSeconds: sourceAudioInfo.durationSeconds,
      scenePlanPath: path.resolve(targetRunDir, 'scene-plan.json')
    });

    registry.registerRun(targetRunId, {
      lineage: {
        derivedFromRunId: sourceAudioArtifact.runId,
        inheritedArtifacts: [
          {
            artifactType: 'narration_audio',
            sourceHandle: sourceAudioArtifact.handle,
            sourceSha256: sourceSha256
          }
        ]
      }
    });

    console.log(`\n🎉 RUN DERIVADA COM SUCESSO!`);
    console.log(`   Origem: ${sourceAudioArtifact.runId} (${sourceAudioArtifact.handle})`);
    console.log(`   Nova Run: ${targetRunId} (${targetHandle})`);
    console.log(`   Áudio SHA-256: ${targetSha256} (100% íntegro)`);
    console.log(`   Visual: 0 frames copiados (geração visual limpa do zero garantida).\n`);

    return {
      success: true,
      targetRunId,
      targetHandle,
      sourceRunId: sourceAudioArtifact.runId,
      sourceAudioSha256: sourceSha256,
      targetAudioSha256: targetSha256,
      targetDirectory: targetRunDir
    };
  }
}
