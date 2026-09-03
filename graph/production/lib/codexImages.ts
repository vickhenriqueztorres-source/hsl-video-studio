import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {codexCommand, checkCodexAccount} from '../../ide/codexAccount';
import {assertWithin} from './assets';
import {validateImage, fixImage} from './imageQueue';
import type {ImageQueue} from '../state';

export interface ImageGenerationIssue {kind: 'CODEX_AUTH'|'CODEX_IMAGE_UNAVAILABLE'|'IMAGE_GENERATION_RECOVERY'; reason: string}
const write = (p: string, v: unknown) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const hash = (text: string|Buffer) => crypto.createHash('sha256').update(text).digest('hex');
export async function generateCodexImages(root: string, queuePath: string): Promise<ImageGenerationIssue|null> {
  assertWithin(root, queuePath);
  const queue: ImageQueue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  if (queue.generator !== 'codex-imagegen') throw new Error('IMAGE_GENERATOR_NOT_ALLOWED');
  if (!(await checkCodexAccount(root)).authenticated) return {kind: 'CODEX_AUTH', reason: 'npm run hsl:codex:login'};
  const lock = queuePath + '.worker.lock';
  if (fs.existsSync(lock)) {
    const pid = Number(fs.readFileSync(lock, 'utf8'));
    try {process.kill(pid, 0); return {kind: 'IMAGE_GENERATION_RECOVERY', reason: 'Image worker já está executando'};}
    catch (e) {if ((e as NodeJS.ErrnoException).code !== 'ESRCH') throw e; fs.unlinkSync(lock);}
  }
  fs.writeFileSync(lock, String(process.pid), {flag: 'wx'});
  try {
    for (const item of queue.items) {
      assertWithin(root, item.outputPath); assertWithin(root, item.promptPath);
      const current = validateImage(item.outputPath);
      if (current.ok && item.status === 'done') {
        item.status = 'done'; item.generatedBy = 'codex-imagegen'; write(queuePath, queue); continue;
      }
      const imagePrompt = fs.readFileSync(item.promptPath, 'utf8');
      const key = hash(imagePrompt + '\n' + (item.lastError ?? '')).slice(0, 20);
      const dir = path.join(path.dirname(item.outputPath), '.codex', key);
      fs.mkdirSync(dir, {recursive: true});
      const resultPath = path.join(dir, 'result.json'), schemaPath = path.join(dir, 'schema.json');
      const receiptPath = path.join(dir, 'receipt.json');
      const receipt = fs.existsSync(receiptPath) ? JSON.parse(fs.readFileSync(receiptPath, 'utf8')) : undefined;
      if (receipt?.sha256 === current.sha256 && current.ok) {
        item.status = 'done'; item.generatedBy = 'codex-imagegen'; delete item.lastError; write(queuePath, queue); continue;
      }
      write(schemaPath, {type: 'object', additionalProperties: false, properties: {
        status: {type: 'string', enum: ['generated', 'unavailable']}, sourcePath: {type: ['string', 'null']}, reason: {type: 'string'}
      }, required: ['status', 'sourcePath', 'reason']});
      const prompt = `Generate exactly ONE image using your built-in image_gen tool, authenticated with the existing ChatGPT account.
This is native image generation in Codex CLI, NOT the Python image_gen.py/API fallback. Do not use API keys, SDKs, browser automation, downloaded pictures, SVG or procedural substitute images.
Do not edit project code or prompts. Do not execute QUEUE.json resumeCommand or run the pipeline. The parent LangGraph owns validation, queue updates and resume.
Use the following visual brief. Instructions about saving embedded in the brief are advisory: let image_gen save normally, then return its actual absolute source file path. The parent copies it to the episode.
<visual_brief>\n${imagePrompt}\n</visual_brief>
${item.lastError ? `Previous validation/review feedback: ${item.lastError}` : ''}
Use 16:9, photorealistic cinematic style, no text or watermark. Make exactly one native generation call. If unavailable, report unavailable with reason; never fake success or use a fallback.
Return the JSON schema result with the existing absolute generated file path. Do not copy credentials or account details to any output.`;
      fs.writeFileSync(path.join(dir, 'prompt.md'), prompt);
      const requestPath = path.join(dir, 'request.json');
      const previousRequest = fs.existsSync(requestPath) ? JSON.parse(fs.readFileSync(requestPath, 'utf8')) : undefined;
      let result = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath, 'utf8')) : {};
      // Recover a completed generation after a crash during copying/validation.
      // The model never needs to spend another generation for this request.
      const completed = previousRequest && result.status === 'generated' && result.sourcePath;
      const startedAt = completed ? previousRequest.startedAt : Date.now();
      if (!completed) {
        write(requestPath, {startedAt, key});
        item.attempts++; item.status = 'pending'; write(queuePath, queue);
        const codexHome = process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex');
        const imageSkillRoot = path.join(codexHome, 'skills', '.system', 'imagegen');
        const run = await codexCommand(root, ['exec', '--ignore-user-config', '--sandbox', 'workspace-write',
          ...(fs.existsSync(imageSkillRoot) ? ['--add-dir', imageSkillRoot] : []),
          '-c', 'approval_policy="never"', '--enable', 'image_generation', '--ephemeral', '--json',
          '--output-schema', schemaPath, '-o', resultPath, '-'], {stdin: prompt, timeoutMs: 900_000, logPath: path.join(dir, 'run.log')});
        if (run.exitCode !== 0 || run.timedOut) {
          item.lastError = run.timedOut ? 'Codex image generation timeout' : 'Codex CLI failed; inspect image worker run.log';
          write(queuePath, queue); return {kind: 'IMAGE_GENERATION_RECOVERY', reason: item.lastError};
        }
        result = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath, 'utf8')) : {};
      }
      if (result.status !== 'generated' || !result.sourcePath) {
        item.lastError = result.reason || 'Native image_gen unavailable in Codex CLI'; write(queuePath, queue);
        return {kind: 'CODEX_IMAGE_UNAVAILABLE', reason: item.lastError!};
      }
      const source = path.resolve(result.sourcePath);
      const generatedRoot = path.join(process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex'), 'generated_images');
      try {assertWithin(generatedRoot, source);} catch {assertWithin(root, source);}
      if (!fs.existsSync(source) || fs.statSync(source).mtimeMs < startedAt - 2000) throw new Error('CODEX_IMAGE_SOURCE_NOT_FRESH');
      if (fs.existsSync(item.outputPath)) fs.copyFileSync(item.outputPath, path.join(dir, 'previous.png'));
      fs.copyFileSync(source, item.outputPath);
      if (!validateImage(item.outputPath).ok) await fixImage(item);
      const verified = validateImage(item.outputPath);
      if (!verified.ok) {
        item.status = 'rejected'; item.lastError = verified.error; write(queuePath, queue);
        return {kind: 'IMAGE_GENERATION_RECOVERY', reason: verified.error!};
      }
      write(receiptPath, {generator: 'codex-imagegen', transport: 'codex-exec', sha256: verified.sha256,
        sourcePath: source, outputPath: item.outputPath, width: verified.width, height: verified.height});
      item.status = 'done'; item.generatedBy = 'codex-imagegen'; delete item.lastError; write(queuePath, queue);
    }
    return null;
  } finally {fs.unlinkSync(lock);}
}
if (require.main === module) {
  const index = process.argv.indexOf('--queue');
  if (index < 0 || !process.argv[index + 1]) throw new Error('Use --queue <QUEUE.json>');
  generateCodexImages(process.cwd(), path.resolve(process.argv[index + 1]))
    .then(issue => {console.log(JSON.stringify({ok: !issue, issue}, null, 2)); process.exitCode = issue ? 2 : 0;})
    .catch(e => {console.error(e.message); process.exitCode = 1;});
}
