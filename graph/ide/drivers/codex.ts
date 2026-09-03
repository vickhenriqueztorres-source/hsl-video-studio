import fs from 'node:fs';
import { DriverResult, PreparedTask } from '../types';
import { findCli, runProcess, unavailableReason } from './process';

// Only assistant final messages are eligible, never tool output or arbitrary
// JSON telemetry. Used solely for older CLIs without -o.
export function extractFinalJson(stdout: string): unknown | undefined {
  let final: unknown;
  for (const line of stdout.split(/\r?\n/)) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'item.completed' && event.item?.type === 'agent_message') {
        final = JSON.parse(event.item.text);
      }
    } catch { /* non-JSON log or intermediate message */ }
  }
  return final;
}

export async function runCodex(prepared: PreparedTask): Promise<DriverResult> {
  const cli = findCli('codex');
  if (!cli) return { skipped: true, reason: 'codex nao encontrado no PATH (ENOENT ou shim nao suportado).' };
  const help = await runProcess(cli, ['exec', '--help'], prepared.repoRoot, 30_000, prepared.logPath);
  const flags = help.stdout + help.stderr;
  if (help.errorCode || help.timedOut || help.exitCode !== 0) {
    return { skipped: true, reason: 'Nao foi possivel verificar codex exec --help.' };
  }
  if (!flags.includes('--sandbox') || !flags.includes('read-only') || !flags.includes('--output-schema')) {
    return { skipped: true, reason: 'Codex sem sandbox read-only ou --output-schema; driver nao executado.' };
  }
  const hasOutput = flags.includes('--output-last-message');
  const args = ['exec', '--sandbox', 'read-only', '--output-schema', prepared.schemaPath, '--json'];
  if (!flags.includes('--ignore-user-config')) {
    return { skipped: true, reason: 'Atualize Codex: --ignore-user-config e necessario para isolar a configuracao global.' };
  }
  args.push('--ignore-user-config', '-c', 'approval_policy="never"');
  if (flags.includes('--ephemeral')) args.push('--ephemeral');
  if (prepared.task.imageFiles?.length) {
    if (!flags.includes('--image')) return { skipped: true, reason: 'Codex sem -i/--image; revisão visual não executada.' };
    for (const image of prepared.task.imageFiles) args.push('-i', image);
  }
  if (hasOutput) args.push('-o', prepared.outputPath);
  const prompt = fs.readFileSync(prepared.promptPath, 'utf8');
  const input=prompt + '\n\nCodex transport instructions: The complete task is included above. ' +
    'Evaluate the embedded task and attached images directly. Do not use tools, read files, edit repository files or access the network. ' +
    'Return only the final JSON. The CLI output transport writes that final response to output.json; do not attempt a shell write.';
  args.push('-');
  const result = await runProcess(cli, args, prepared.repoRoot, prepared.timeoutMs, prepared.logPath,input);
  if (!hasOutput) {
    const output = extractFinalJson(result.stdout);
    if (output !== undefined) fs.writeFileSync(prepared.outputPath, JSON.stringify(output, null, 2) + '\n');
  }
  const reason = unavailableReason(result);
  return {
    exitCode: result.exitCode, timedOut: result.timedOut,
    skipped: !!reason, reason: reason ?? (result.timedOut ? 'Timeout do Codex.' : undefined),
  };
}
