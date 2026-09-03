import fs from 'fs';
import path from 'path';

export type StageName =
  | 'STAGE_01_SCENE_PLAN'
  | 'STAGE_02_IMAGE_FRAMES'
  | 'STAGE_03_FIREFLY_VIDEOS'
  | 'STAGE_04_NARRATION'
  | 'STAGE_05_SOUND_DESIGN'
  | 'STAGE_06_PRE_RENDER_GATE'
  | 'STAGE_07_REMOTION_RENDER'
  | 'STAGE_08_PRE_MUX_GATE'
  | 'STAGE_09_FFMPEG_MUX'
  | 'STAGE_10_PACKAGING'
  | 'STAGE_11_PRD_COMPLIANCE'
  | 'STAGE_12_CLOUD_ARCHIVE';

export type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'FAILED';

export interface StageRecord {
  readonly name: StageName;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  metrics?: Record<string, any>;
}

export interface RunManifestData {
  readonly episodeId: string;
  readonly createdAt: string;
  updatedAt: string;
  overallStatus: 'RUNNING' | 'COMPLETED' | 'FAILED';
  stages: Record<StageName, StageRecord>;
  artifacts: {
    scenePlanPath?: string;
    framesCount?: number;
    videosCount?: number;
    narrationAudioPath?: string;
    narrationDurationSeconds?: number;
    videoVisualPath?: string;
    masterVideoPath?: string;
    masterVideoDurationSeconds?: number;
    thumbnails: string[];
    publicationPackagePath?: string;
  };
}

export class HslRunManifest {
  private readonly manifestPath: string;
  private data: RunManifestData;

  constructor(episodeId: string, rootDir: string = process.cwd()) {
    const runDir = path.resolve(rootDir, 'runs', episodeId);
    fs.mkdirSync(runDir, {recursive: true});
    this.manifestPath = path.resolve(runDir, 'run-manifest.json');

    if (fs.existsSync(this.manifestPath)) {
      try {
        this.data = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
      } catch {
        this.data = this.createInitialData(episodeId);
      }
    } else {
      this.data = this.createInitialData(episodeId);
      this.save();
    }
  }

  private createInitialData(episodeId: string): RunManifestData {
    const allStages: StageName[] = [
      'STAGE_01_SCENE_PLAN',
      'STAGE_02_IMAGE_FRAMES',
      'STAGE_03_FIREFLY_VIDEOS',
      'STAGE_04_NARRATION',
      'STAGE_05_SOUND_DESIGN',
      'STAGE_06_PRE_RENDER_GATE',
      'STAGE_07_REMOTION_RENDER',
      'STAGE_08_PRE_MUX_GATE',
      'STAGE_09_FFMPEG_MUX',
      'STAGE_10_PACKAGING',
      'STAGE_11_PRD_COMPLIANCE'
    ];

    const stagesRecord: any = {};
    for (const st of allStages) {
      stagesRecord[st] = {
        name: st,
        status: 'PENDING'
      };
    }

    return {
      episodeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      overallStatus: 'RUNNING',
      stages: stagesRecord,
      artifacts: {
        thumbnails: []
      }
    };
  }

  public startStage(stage: StageName): void {
    if (!this.data.stages[stage]) {
      this.data.stages[stage] = { name: stage, status: 'PENDING' };
    }
    this.data.stages[stage].status = 'IN_PROGRESS';
    this.data.stages[stage].startedAt = new Date().toISOString();
    this.data.updatedAt = new Date().toISOString();
    this.save();
  }

  public completeStage(stage: StageName, metrics?: Record<string, any>): void {
    if (!this.data.stages[stage]) {
      this.data.stages[stage] = { name: stage, status: 'PENDING' };
    }
    this.data.stages[stage].status = 'DONE';
    this.data.stages[stage].completedAt = new Date().toISOString();
    if (metrics) {
      this.data.stages[stage].metrics = metrics;
    }
    this.data.updatedAt = new Date().toISOString();
    this.save();
  }

  public failStage(stage: StageName, errorMessage: string): void {
    if (!this.data.stages[stage]) {
      this.data.stages[stage] = { name: stage, status: 'PENDING' };
    }
    this.data.stages[stage].status = 'FAILED';
    this.data.stages[stage].completedAt = new Date().toISOString();
    this.data.stages[stage].error = errorMessage;
    this.data.overallStatus = 'FAILED';
    this.data.updatedAt = new Date().toISOString();
    this.save();
  }

  public setArtifacts(partial: Partial<RunManifestData['artifacts']>): void {
    this.data.artifacts = {
      ...this.data.artifacts,
      ...partial
    };
    this.data.updatedAt = new Date().toISOString();
    this.save();
  }

  public completeRun(): void {
    this.data.overallStatus = 'COMPLETED';
    this.data.updatedAt = new Date().toISOString();
    this.save();
  }

  public getData(): RunManifestData {
    return this.data;
  }

  private save(): void {
    fs.writeFileSync(this.manifestPath, JSON.stringify(this.data, null, 2), 'utf8');
  }
}
