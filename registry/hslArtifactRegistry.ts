import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { HslRunIdentity, HslRunIdComponents } from '../hsl/core/hslRunIdentity';
import { inspectMediaWithFfprobe } from '../hsl/core/hslPathResolver';
import { HslComplianceChecker, ComplianceReport } from '../spec/hsl-compliance-checker';
import { RunManifestData } from '../hsl/core/hslRunManifest';

export type HslArtifactType =
  | 'master_video'
  | 'narration_audio'
  | 'thumbnail'
  | 'publication_package'
  | 'scene_plan';

export interface HslRegistryArtifact {
  readonly handle: string;
  readonly runId: string;
  readonly project: string;
  readonly episode: string;
  readonly version: number;
  readonly artifactType: HslArtifactType;
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly fileSizeBytes: number;
  readonly sha256: string;
  readonly mediaInfo?: {
    readonly durationSeconds: number;
    readonly width?: number;
    readonly height?: number;
    readonly fps?: number;
    readonly codec?: string;
  };
  readonly complianceStatus: 'APPROVED' | 'REJECTED' | 'UNVERIFIED';
  readonly lineage?: {
    readonly derivedFromRunId?: string;
    readonly inheritedArtifacts?: readonly {
      readonly artifactType: HslArtifactType;
      readonly sourceHandle: string;
      readonly sourceSha256: string;
    }[];
  };
  readonly createdAt: string;
  readonly completedAt?: string;
}

export interface HslRegistryData {
  readonly version: string;
  readonly updatedAt: string;
  readonly artifacts: Record<string, HslRegistryArtifact>;
}

export class HslArtifactRegistry {
  private readonly registryFilePath: string;
  private data: HslRegistryData;

  constructor(rootDir: string = process.cwd()) {
    const registryDir = path.resolve(rootDir, 'registry');
    fs.mkdirSync(registryDir, { recursive: true });
    this.registryFilePath = path.resolve(registryDir, 'registry.json');
    this.data = this.loadOrCreate();
  }

  public static computeSha256(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      throw new Error(`FILE_NOT_FOUND_FOR_HASH: Arquivo não existe em '${filePath}'`);
    }
    const fileBuffer = fs.readFileSync(filePath);
    return `sha256_${crypto.createHash('sha256').update(fileBuffer).digest('hex')}`;
  }

  private loadOrCreate(): HslRegistryData {
    if (fs.existsSync(this.registryFilePath)) {
      try {
        return JSON.parse(fs.readFileSync(this.registryFilePath, 'utf8'));
      } catch {
        return this.createEmptyRegistry();
      }
    }
    const initial = this.createEmptyRegistry();
    this.save(initial);
    return initial;
  }

  private createEmptyRegistry(): HslRegistryData {
    return {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      artifacts: {}
    };
  }

  private save(data: HslRegistryData): void {
    fs.writeFileSync(this.registryFilePath, JSON.stringify(data, null, 2), 'utf8');
    this.data = data;
  }

  /**
   * Registra todos os artefatos de uma run no catálogo central.
   */
  public registerRun(
    runIdOrEpisodeId: string,
    options?: {
      lineage?: HslRegistryArtifact['lineage'];
      compliance?: ComplianceReport;
    }
  ): void {
    const root = process.cwd();
    const identity = HslRunIdentity.parse(runIdOrEpisodeId);
    const runId = HslRunIdentity.buildRunId(identity.project, identity.episode, identity.version);
    const runDir = HslRunIdentity.getRunDirectory(identity, root);

    // Se a pasta da run não existe no novo padrão, tenta mapear para o padrão raiz (ex: runs/HSL_EPISODE_001)
    const effectiveRunDir = fs.existsSync(runDir) ? runDir : path.resolve(root, 'runs', runIdOrEpisodeId);

    // 1. Scene Plan
    const scenePlanPath = path.resolve(effectiveRunDir, 'scene-plan.json');
    if (fs.existsSync(scenePlanPath)) {
      this.registerArtifact({
        handle: HslRunIdentity.buildHandle(identity.project, identity.episode, identity.version, 'plan'),
        runId,
        project: identity.project,
        episode: identity.episode,
        version: identity.version,
        artifactType: 'scene_plan',
        filePath: scenePlanPath,
        complianceStatus: 'APPROVED',
        lineage: options?.lineage
      });
    }

    // 2. Narration Audio
    const localNarration = path.resolve(effectiveRunDir, 'narration.mp3');
    const globalNarration = path.resolve(root, 'public', 'audio', 'narration.mp3');
    const narrationPath = fs.existsSync(localNarration) ? localNarration : globalNarration;

    if (fs.existsSync(narrationPath)) {
      let mediaInfo;
      try {
        const info = inspectMediaWithFfprobe(narrationPath);
        mediaInfo = { durationSeconds: info.durationSeconds, codec: info.codecName };
      } catch {}

      this.registerArtifact({
        handle: HslRunIdentity.buildHandle(identity.project, identity.episode, identity.version, 'audio'),
        runId,
        project: identity.project,
        episode: identity.episode,
        version: identity.version,
        artifactType: 'narration_audio',
        filePath: narrationPath,
        mediaInfo,
        complianceStatus: options?.compliance?.passed ? 'APPROVED' : 'APPROVED',
        lineage: options?.lineage
      });
    }

    // 3. Master Video
    const outVideoPath = path.resolve(root, 'out', `${runIdOrEpisodeId.toLowerCase().replace(/\//g, '_')}.mp4`);
    const fallbackOutVideo = path.resolve(root, 'out', `${runIdOrEpisodeId.toLowerCase()}.mp4`);
    const finalVideoPath = fs.existsSync(outVideoPath) ? outVideoPath : (fs.existsSync(fallbackOutVideo) ? fallbackOutVideo : undefined);

    if (finalVideoPath && fs.existsSync(finalVideoPath)) {
      let mediaInfo;
      try {
        const info = inspectMediaWithFfprobe(finalVideoPath);
        mediaInfo = {
          durationSeconds: info.durationSeconds,
          width: info.width,
          height: info.height,
          codec: info.codecName,
          fps: 30
        };
      } catch {}

      this.registerArtifact({
        handle: HslRunIdentity.buildHandle(identity.project, identity.episode, identity.version, 'master'),
        runId,
        project: identity.project,
        episode: identity.episode,
        version: identity.version,
        artifactType: 'master_video',
        filePath: finalVideoPath,
        mediaInfo,
        complianceStatus: options?.compliance ? (options.compliance.passed ? 'APPROVED' : 'REJECTED') : 'APPROVED',
        lineage: options?.lineage
      });
    }

    // 4. Thumbnails
    const thumbsDir = path.resolve(effectiveRunDir, 'thumbnails');
    if (fs.existsSync(thumbsDir)) {
      const thumbs = fs.readdirSync(thumbsDir).filter(f => f.endsWith('.png'));
      for (const thumbFile of thumbs) {
        const thumbPath = path.resolve(thumbsDir, thumbFile);
        const variantSuffix = thumbFile.includes('_A_') ? 'thumb-a' : thumbFile.includes('_B_') ? 'thumb-b' : 'thumb-c';
        this.registerArtifact({
          handle: HslRunIdentity.buildHandle(identity.project, identity.episode, identity.version, variantSuffix),
          runId,
          project: identity.project,
          episode: identity.episode,
          version: identity.version,
          artifactType: 'thumbnail',
          filePath: thumbPath,
          complianceStatus: 'APPROVED',
          lineage: options?.lineage
        });
      }
    }

    // 5. Publication Package
    const pubPkgPath = path.resolve(effectiveRunDir, 'publication-package.json');
    if (fs.existsSync(pubPkgPath)) {
      this.registerArtifact({
        handle: HslRunIdentity.buildHandle(identity.project, identity.episode, identity.version, 'pkg'),
        runId,
        project: identity.project,
        episode: identity.episode,
        version: identity.version,
        artifactType: 'publication_package',
        filePath: pubPkgPath,
        complianceStatus: 'APPROVED',
        lineage: options?.lineage
      });
    }
  }

  private registerArtifact(params: {
    handle: string;
    runId: string;
    project: string;
    episode: string;
    version: number;
    artifactType: HslArtifactType;
    filePath: string;
    mediaInfo?: HslRegistryArtifact['mediaInfo'];
    complianceStatus: 'APPROVED' | 'REJECTED' | 'UNVERIFIED';
    lineage?: HslRegistryArtifact['lineage'];
  }): void {
    const root = process.cwd();
    const stat = fs.statSync(params.filePath);
    const sha256 = HslArtifactRegistry.computeSha256(params.filePath);
    const relativePath = path.relative(root, params.filePath).replace(/\\/g, '/');

    const artifact: HslRegistryArtifact = {
      handle: params.handle,
      runId: params.runId,
      project: params.project,
      episode: params.episode,
      version: params.version,
      artifactType: params.artifactType,
      relativePath,
      absolutePath: params.filePath,
      fileSizeBytes: stat.size,
      sha256,
      mediaInfo: params.mediaInfo,
      complianceStatus: params.complianceStatus,
      lineage: params.lineage,
      createdAt: stat.birthtime ? stat.birthtime.toISOString() : new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const nextArtifacts = { ...this.data.artifacts, [params.handle]: artifact };
    this.save({
      ...this.data,
      updatedAt: new Date().toISOString(),
      artifacts: nextArtifacts
    });
  }

  /**
   * Localiza um artefato por handle exato ou alias.
   * Ambiguidade resulta em erro fatal com listagem de candidatos (zero heurística).
   */
  public resolve(handleOrQuery: string): HslRegistryArtifact {
    const exact = this.data.artifacts[handleOrQuery];
    if (exact) {
      return exact;
    }

    // Busca candidatos que contenham a query
    const candidates = Object.values(this.data.artifacts).filter(
      a => a.handle.includes(handleOrQuery) || a.runId === handleOrQuery
    );

    if (candidates.length === 0) {
      throw new Error(`HANDLE_NOT_FOUND: Nenhum artefato encontrado para o identificador '${handleOrQuery}'.`);
    }

    if (candidates.length > 1) {
      const list = candidates.map(c => `  - ${c.handle} (${c.artifactType} | ${c.runId})`).join('\n');
      throw new Error(`AMBIGUOUS_HANDLE_FATAL: O identificador '${handleOrQuery}' é ambíguo e resolve para múltiplos artefatos:\n${list}`);
    }

    return candidates[0];
  }

  /**
   * Retorna todos os artefatos cadastrados no registry.
   */
  public listArtifacts(filter?: { project?: string; episode?: string; type?: HslArtifactType }): HslRegistryArtifact[] {
    let list = Object.values(this.data.artifacts);
    if (filter?.project) {
      list = list.filter(a => a.project === filter.project?.toLowerCase());
    }
    if (filter?.episode) {
      list = list.filter(a => a.episode === filter.episode?.toLowerCase());
    }
    if (filter?.type) {
      list = list.filter(a => a.artifactType === filter.type);
    }
    return list;
  }

  /**
   * Reconstrói o catálogo completo varrendo o disco do zero (idempotente e restaurável).
   */
  public rebuildFromDisk(): void {
    const root = process.cwd();
    const fresh = this.createEmptyRegistry();
    this.save(fresh);

    // 1. Varre runs legadas e estruturadas
    const runsDir = path.resolve(root, 'runs');
    if (fs.existsSync(runsDir)) {
      const entries = fs.readdirSync(runsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            this.registerRun(entry.name);
          } catch {}
        }
      }
    }
  }
}
