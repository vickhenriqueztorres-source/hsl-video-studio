import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020';
import { REPO_ROOT } from '../checkpointer';

function compileJsonSchema(schema: any, options: { allErrors?: boolean; strict?: boolean } = { allErrors: true, strict: true }) {
  const is2020 = typeof schema === 'object' && schema !== null && typeof schema.$schema === 'string' && schema.$schema.includes('2020-12');
  const Cls = is2020 ? Ajv2020 : Ajv;
  return new Cls(options).compile(schema);
}
import { DriverResult, IdePreparation, IdeResult, IdeTask, PreparedTask, RunnerContext } from './types';
import { inlineAntigravityContext, runAntigravity } from './drivers/antigravity';
import { runCodex } from './drivers/codex';
import {listCodexProfiles,preferCodexProfile} from './codexProfiles';
import {checkCodexAccount} from './codexAccount';

function safeSegment(value: string, label: string): string {
  if (/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,159}$/.test(value)) return value;
  if (/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+){1,3}$/.test(value)) {
    return value.replace(/\//g, '__');
  }
  throw new Error(`${label} invalido: ${value}`);
}

function writeOnce(file: string, contents: string | Buffer): void {
  try { fs.writeFileSync(file, contents, { flag: 'wx' }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
}

export function taskDirectory(task: Pick<IdeTask, 'threadId' | 'node' | 'attempt'>, repoRoot = REPO_ROOT): string {
  const safeThreadId = safeSegment(task.threadId, 'threadId');
  const safeNode = safeSegment(task.node, 'node');
  if (!Number.isSafeInteger(task.attempt) || task.attempt < 1) throw new Error('attempt deve ser inteiro positivo.');
  return path.join(repoRoot, 'runs', safeThreadId, 'ide', safeNode, String(task.attempt));
}

/** File preparation only. Never interrupts or spawns a CLI. */
export function prepareIdeTask(task: IdeTask, context: RunnerContext = {}, errors: string[] = []): PreparedTask {
  if (!['antigravity', 'codex', 'manual'].includes(task.provider)) throw new Error('Provider invalido.');
  const repoRoot = path.resolve(context.repoRoot ?? REPO_ROOT);
  for (const image of task.imageFiles ?? []) {
    const absolute = path.resolve(repoRoot, image);
    if (!fs.existsSync(absolute)) throw new Error(`Imagem de contexto ausente: ${absolute}`);
  }
  const ioMode = task.ioMode ?? (task.provider === 'antigravity' ? 'stdout' : 'file');
  const timeoutMs = task.timeoutMs ?? 600_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 2_147_483_647) throw new Error('timeoutMs invalido.');
  const folder = taskDirectory(task, repoRoot);
  const prepared: PreparedTask = {
    task: { ...task, ioMode }, repoRoot, timeoutMs,
    promptPath: path.join(folder, 'prompt.md'), schemaPath: path.join(folder, 'schema.json'),
    outputPath: path.join(folder, 'output.json'), logPath: path.join(folder, 'run.log'),
  };
  // A completed preparation is immutable, even if source files later change.
  if (fs.existsSync(prepared.promptPath) && fs.existsSync(prepared.schemaPath)) return prepared;
  const template = fs.readFileSync(path.resolve(repoRoot, task.promptTemplate), 'utf8');
  const schemaText = fs.readFileSync(path.resolve(repoRoot, task.schemaPath), 'utf8');
  compileJsonSchema(JSON.parse(schemaText));
  let prompt = template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => task.vars?.[key] ?? match);
  if (task.provider === 'antigravity' && ioMode === 'stdout') {
    prompt += inlineAntigravityContext(task, repoRoot);
    prompt += '\n\n## Schema da resposta (nao leia arquivos)\n```json\n' + schemaText + '\n```\n';
  }
  if (errors.length) prompt += '\n\n## Erros da tentativa anterior — corrija todos\n' + errors.map(e => `- ${e}`).join('\n');
  prompt += ioMode === 'stdout'
    ? '\n\n## Contrato obrigatorio de saida\nNao use ferramentas, nao leia nem escreva arquivos. Todo o contexto necessario esta neste prompt. O driver grava output.json. Responda APENAS com o JSON final, sem markdown, sem texto antes ou depois.\n'
    : '\n\n## Contrato obrigatorio de saida\n' +
      `Escreva o resultado FINAL como JSON válido no arquivo ${prepared.outputPath}, ` +
      'conforme schema.json na mesma pasta. Não escreva nada além do JSON nesse arquivo.\n';
  fs.mkdirSync(path.join(folder, 'context'), { recursive: true });
  writeOnce(prepared.schemaPath, schemaText);
  for (const [index, source] of (task.contextFiles ?? []).entries()) {
    const original = path.resolve(repoRoot, source);
    writeOnce(path.join(folder, 'context', `${index}-${path.basename(original)}`), fs.readFileSync(original));
  }
  writeOnce(prepared.logPath, `[prepared] ${new Date().toISOString()} provider=${task.provider} attempt=${task.attempt} ioMode=${ioMode}\n`);
  writeOnce(prepared.promptPath, prompt);
  return prepared;
}

/** Read-only: safe in the interrupt node, including on every re-entry. */
export function validateIdeOutput(prepared: PreparedTask, driver: DriverResult = {}, durationMs = 0): IdeResult {
  const validate = compileJsonSchema(JSON.parse(fs.readFileSync(prepared.schemaPath, 'utf8')));
  const outputPath = driver.outputPath ?? prepared.outputPath;
  let output: unknown;
  let errors: string[] = [];
  try {
    output = JSON.parse(fs.readFileSync(outputPath, 'utf8').replace(/^\uFEFF/, ''));
    if (!validate(output)) errors = (validate.errors ?? []).map(e => `${e.instancePath || '/'} ${e.message} ${JSON.stringify(e.params)}`);
  } catch (error) { errors = [`output.json ausente ou invalido: ${error instanceof Error ? error.message : String(error)}`]; }
  if (driver.timedOut) errors.push(driver.reason ?? 'Timeout da IDE.');
  const ok = errors.length === 0;
  return {
    provider: prepared.task.provider, ok, outputPath, durationMs,
    ...(output !== undefined ? { output } : {}),
    ...(driver.exitCode !== undefined ? { exitCode: driver.exitCode } : {}),
    ...(driver.gitDiffStat !== undefined ? { gitDiffStat: driver.gitDiffStat } : {}),
    ...(!ok && driver.reason ? { reason: driver.reason } : {}),
    ...(!ok && driver.skipped ? { skipped: true } : {}),
    ...(!ok ? { validationErrors: errors } : {}),
  };
}

/** Prepare/headless phase only. No interrupt, including when headless is skipped. */
export async function prepareAndRunIdeTask(task: IdeTask, context: RunnerContext = {}): Promise<IdePreparation> {
  const started = Date.now();
  let errors: string[] = [];
  let result!: IdePreparation;
  const maxAttempts = task.provider === 'manual' ? 1 : (task.maxAttempts ?? 2);
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 2) {
    throw new Error('maxAttempts deve ser 1 ou 2.');
  }
  for (let offset = 0; offset < maxAttempts; offset++) {
    const prepared = prepareIdeTask({ ...task, attempt: task.attempt + offset }, context, errors);
    if (task.provider === 'manual') return { prepared };
    if (fs.existsSync(prepared.outputPath)) {
      fs.renameSync(prepared.outputPath, path.join(path.dirname(prepared.outputPath), `output.previous-${Date.now()}.json`));
    }
    let driver: DriverResult;
    try { driver = task.provider === 'codex' ? await runCodex(prepared) : await runAntigravity(prepared); }
    catch (error) {
      driver = { reason: `Falha de IDE: ${error instanceof Error ? error.message : String(error)}` };
      fs.appendFileSync(prepared.logPath, `[driver-error] ${driver.reason}\n`);
    }
    const headlessResult = { ...validateIdeOutput(prepared, driver, Date.now() - started), completionMode: 'headless' as const };
    fs.appendFileSync(prepared.logPath, `[result] ${JSON.stringify(headlessResult)}\n`);
    result = { prepared, headlessResult };
    errors = headlessResult.validationErrors ?? [];
    if (headlessResult.ok || driver.skipped || driver.timedOut) return result;
  }
  return result;
}

function isQuotaFailure(result?:IdeResult){return Boolean(result?.skipped&&/cota|quota|usage limit|rate limit|credits? exhausted|insufficient\.quota/i.test(result.reason??''));}

/**
 * Provider failover is allowed only after the first provider explicitly
 * reports quota exhaustion. The alternate provider receives a new immutable
 * task directory, so its receipt cannot overwrite the Codex attempt.
 */
export async function prepareAndRunIdeTaskWithFailover(task:IdeTask,context:RunnerContext={}):Promise<IdePreparation>{
  if(task.provider!=='codex')return prepareAndRunIdeTask(task,context);
  const profiles=listCodexProfiles(),attempted:string[]=[];
  let last:IdePreparation|undefined;
  for(const profile of profiles){
    const env={...process.env,CODEX_HOME:profile.home};
    if(!(await checkCodexAccount(context.repoRoot??REPO_ROOT,env)).authenticated)continue;
    attempted.push(profile.id);
    const candidate=await prepareAndRunIdeTask({...task,codexHome:profile.home,node:`${task.node}-codex-${profile.id}`,attempt:1},context);
    last=candidate;
    if(candidate.headlessResult?.ok)return candidate;
    const next=profiles[profiles.indexOf(profile)+1];if(next)preferCodexProfile(next.id);
  }
  const fallbackTask:IdeTask={...task,provider:'antigravity',node:`${task.node}-antigravity`,attempt:1,maxAttempts:1};
  const fallback=await prepareAndRunIdeTask(fallbackTask,context);
  if(fallback.headlessResult&&!fallback.headlessResult.ok){
    const lastReason=last?.headlessResult?.reason??'indisponível ou não autenticado';
    const quota=attempted.length?`Codex falhou (${lastReason}); `:'Codex não possui conta autenticada; ';
    const visualAction=task.imageFiles?.length&&/não aceita imagens anexadas|nao encontrado|indisponivel/i.test(fallback.headlessResult.reason??'')
      ? ' Cadastre e autentique uma conta reserva Codex para concluir a revisão visual headless.' : '';
    const fallbackReason=(fallback.headlessResult.reason??'indisponível').replace(/[.!?]+$/,'');
    fallback.headlessResult.reason=quota+`Antigravity: ${fallbackReason}.${visualAction}`;
  }
  return fallback;
}

/** Non-interactive convenience API. Manual callers must use the split graph. */
export async function runIdeTask(task: IdeTask, context: RunnerContext = {}): Promise<IdeResult> {
  if (task.provider === 'manual') throw new Error('Manual exige os nos separados ide_prepare e ide_wait.');
  return (await prepareAndRunIdeTask(task, context)).headlessResult!;
}
