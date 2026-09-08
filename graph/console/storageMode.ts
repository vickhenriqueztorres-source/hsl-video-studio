import path from 'node:path';

export type MatrixStorageSelection = {
  mode: 'off' | 'drive';
  reason?: string;
};

/**
 * Matrix must only opt into Drive when the production graph can pass its
 * deterministic preflight. Authentication itself remains a resumable graph
 * gate, but missing configuration falls back to durable local storage.
 */
export function selectMatrixStorage(env: NodeJS.ProcessEnv = process.env): MatrixStorageSelection {
  if (!env.HSL_DRIVE_FOLDER_ID) {
    return { mode: 'off', reason: 'HSL_DRIVE_FOLDER_ID não configurado' };
  }
  const secret = env.HSL_GOOGLE_CLIENT_SECRET_FILE;
  if (!secret || !path.isAbsolute(secret)) {
    return { mode: 'off', reason: 'HSL_GOOGLE_CLIENT_SECRET_FILE não configurado com caminho absoluto' };
  }
  return { mode: 'drive' };
}
