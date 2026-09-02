import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import { DriverResult, IdeTask, PreparedTask } from '../types';
import { findCli, runProcess, unavailableReason } from './process';

export function inlineAntigravityContext(task: IdeTask, repoRoot: string): string {
  const limit = task.contextLimitBytes ?? 200 * 1024;
  if (!Number.isSafeInteger(limit) || limit < 0) throw new Error('contextLimitBytes deve ser inteiro nao negativo.');
  let total = 0;
  return (task.contextFiles ?? []).map(file => {
    const source = path.resolve(repoRoot, file);
    total += fs.statSync(source).size;
    if (total > limit) throw new Error(`Contexto excede contextLimitBytes: ${total} > ${limit} bytes.`);
    const content = fs.readFileSync(source, 'utf8');
    return `\n\n\`\`\`file path=${JSON.stringify(file)}\n${content}\n\`\`\`\n`;
  }).join('');
}

// Scan balanced top-level JSON objects, respecting quoted braces and escapes.
function jsonObjects(text: string): unknown[] {
  const objects: unknown[] = [];
  let start = -1, depth = 0, quoted = false, escaped = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (start < 0) { if (char === '{') { start = i; depth = 1; quoted = false; } continue; }
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) {
      try { objects.push(JSON.parse(text.slice(start, i + 1))); } catch { /* log fragment */ }
      start = -1;
    }
  }
  return objects;
}

export function extractAntigravityJson(stdout: string): unknown | undefined {
  function unwrap(value: unknown, depth = 0): unknown | undefined {
    if (depth > 8) return undefined;
    if (typeof value === 'string') {
      const objects = jsonObjects(value);
      return objects.length ? unwrap(objects[objects.length - 1], depth + 1) : undefined;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    const record = value as Record<string, unknown>;
    const fields = ['result', 'response', 'content', 'text'];
    for (const field of fields) {
      if (!(field in record)) continue;
      const candidate = Array.isArray(record[field])
        ? [...record[field] as unknown[]].reverse().map(item => unwrap(item, depth + 1)).find(item => item !== undefined)
        : unwrap(record[field], depth + 1);
      if (candidate !== undefined) return candidate;
    }
    if (fields.some(field => field in record) || 'usage' in record || 'conversation_id' in record || 'type' in record) return undefined;
    return record;
  }
  const candidates = jsonObjects(stdout);
  for (let i = candidates.length - 1; i >= 0; i--) {
    const output = unwrap(candidates[i]);
    if (output !== undefined) return output;
  }
  return undefined;
}

export async function runAntigravity(prepared: PreparedTask): Promise<DriverResult> {
  const cli = findCli('agy') ?? findCli('antigravity');
  if (!cli) return { skipped: true, reason: 'agy/antigravity nao encontrado no PATH (ENOENT).' };
  const help = await runProcess(cli, ['--help'], prepared.repoRoot, 30_000, prepared.logPath);
  const flags = help.stdout + help.stderr;
  if (help.timedOut || help.errorCode || !flags.includes('--print') || !flags.includes('--output-format')) {
    return { skipped: true, reason: 'Antigravity indisponivel em modo headless compativel; consulte run.log.' };
  }
  const stdoutMode = prepared.task.ioMode !== 'file';
  const prompt = stdoutMode ? fs.readFileSync(prepared.promptPath, 'utf8') : `Leia e siga integralmente ${JSON.stringify(prepared.promptPath)}.`;
  if (process.platform === 'win32' && prompt.length > 24_000) {
    return { reason: 'Prompt excede o limite seguro de argv no Windows (24000 caracteres); reduza contexto ou use ioMode=file.' };
  }
  const git = findCli('git');
  const diff = async () => git ? (await runProcess(git, ['diff', '--stat'], prepared.repoRoot, 30_000)).stdout.trim() : 'git indisponivel';
  const before = await diff();
  const args = ['-p', prompt, '--output-format', 'json'];
  if (flags.includes('--mode')) args.push('--mode', stdoutMode ? 'plan' : 'accept-edits');
  if (flags.includes('--disable-slash-commands')) args.push('--disable-slash-commands');
  if (flags.includes('--print-timeout')) args.push('--print-timeout', `${Math.ceil(prepared.timeoutMs / 1000)}s`);
  const result = await runProcess(cli, args, prepared.repoRoot, prepared.timeoutMs, prepared.logPath);
  if (stdoutMode && !result.timedOut) {
    const output = extractAntigravityJson(result.stdout);
    if (output !== undefined) {
      fs.writeFileSync(prepared.outputPath, JSON.stringify(output, null, 2) + '\n');
      const validate = new Ajv({ allErrors: true }).compile(JSON.parse(fs.readFileSync(prepared.schemaPath, 'utf8')));
      if (!validate(output)) fs.appendFileSync(prepared.logPath, `[stdout-validation] ${JSON.stringify(validate.errors)}\n`);
    }
  }
  const after = await diff();
  let reason = unavailableReason(result);
  if (!reason && /no.*project|project.*not found|not connected|connection refused|failed to connect|desktop.*not running|no.*running.*instance|permission.*(required|denied)|approval.*required/i.test(result.stderr + result.stdout)) {
    reason = 'Antigravity precisa de projeto/sessao desktop ou permissao interativa; consulte run.log.';
  }
  return {
    exitCode: result.exitCode, timedOut: result.timedOut, skipped: !!reason,
    reason: reason ?? (result.timedOut ? 'Timeout do Antigravity.' : undefined),
    gitDiffStat: `BEFORE\n${before || '(clean)'}\nAFTER\n${after || '(clean)'}`,
  };
}
