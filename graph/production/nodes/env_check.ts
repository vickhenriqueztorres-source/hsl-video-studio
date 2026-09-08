import { Context, NodeFn } from '../runtime';
import { spawnTool } from '../../lib/proc';

export const envCheck = (c: Context): NodeFn => async s => {
  if ((s.options.graph.storageMode ?? 'off') === 'drive') {
    if (!process.env.HSL_DRIVE_FOLDER_ID) throw new Error('HSL_DRIVE_FOLDER_ID obrigatório em storageMode drive');
    const secret = process.env.HSL_GOOGLE_CLIENT_SECRET_FILE;
    if (!secret || !require('node:path').isAbsolute(secret)) throw new Error('HSL_GOOGLE_CLIENT_SECRET_FILE deve ser path absoluto');
  }

  // Preflight check for FFmpeg & FFprobe when not running offline
  if (!s.options.graph.offline) {
    try {
      const probeRes = await spawnTool('ffmpeg', ['-version'], { cwd: c.root, timeoutMs: 30_000 });
      if (probeRes.exitCode !== 0 || probeRes.timedOut || probeRes.errorCode) throw new Error(
        `FFmpeg: code=${probeRes.exitCode ?? 'unknown'}, timeout=${probeRes.timedOut}, error=${probeRes.errorCode ?? probeRes.stderr.trim()}`);
    } catch (e: any) {
      // Allow purely mocked test suites to bypass missing system binary if mock inspect is active
      const isMock = c.deps && (c.deps as any)._isMock;
      if (!isMock && !process.env.HSL_TEST_MOCK_ENV) {
        throw new Error(`PREFLIGHT_TOOL_MISSING: FFmpeg não está disponível no sistema: ${e.message}`);
      }
    }
  }

  // Firefly is checked by firefly_session_prepare, after images have been
  // generated and reviewed. Missing video configuration must not disable photos.
  return { __status: 'skipped' };
};
