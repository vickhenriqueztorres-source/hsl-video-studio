export type IdeProvider = 'antigravity' | 'codex' | 'manual';

export interface IdeTask {
  threadId: string;
  node: string;
  attempt: number;
  provider: IdeProvider;
  promptTemplate: string;
  schemaPath: string;
  contextFiles?: string[];
  vars?: Record<string, string>;
  timeoutMs?: number;
  readOnly?: boolean;
  ioMode?: 'file' | 'stdout';
  contextLimitBytes?: number;
}

export interface IdeResult {
  provider: IdeProvider;
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  outputPath: string;
  output?: unknown;
  exitCode?: number;
  durationMs: number;
  validationErrors?: string[];
  gitDiffStat?: string;
  completionMode?: 'headless' | 'manual';
}

export interface RunnerContext {
  repoRoot?: string;
}

export interface IdePreparation {
  prepared: PreparedTask;
  headlessResult?: IdeResult;
}

export interface PreparedTask {
  task: IdeTask;
  repoRoot: string;
  promptPath: string;
  schemaPath: string;
  outputPath: string;
  logPath: string;
  timeoutMs: number;
}

export interface DriverResult {
  exitCode?: number;
  skipped?: boolean;
  reason?: string;
  timedOut?: boolean;
  outputPath?: string;
  gitDiffStat?: string;
}
