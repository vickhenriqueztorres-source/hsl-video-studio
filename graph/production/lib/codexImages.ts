import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {codexCommand, checkCodexAccount} from '../../ide/codexAccount';
import {listCodexProfiles,preferCodexProfile,CodexProfile} from '../../ide/codexProfiles';
import {prepareAndRunIdeTask,taskDirectory} from '../../ide/ideRunner';
import {unavailableReason} from '../../ide/drivers/process';
import {assertWithin} from './assets';
import {validateImage, fixImage} from './imageQueue';
import type {ImageQueue} from '../state';
import {emitLive} from '../telemetry';

export interface ImageGenerationIssue {kind: 'CODEX_AUTH'|'CODEX_IMAGE_UNAVAILABLE'|'IMAGE_GENERATION_RECOVERY'; reason: string}
const write = (p: string, v: unknown) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const hash = (text: string|Buffer) => crypto.createHash('sha256').update(text).digest('hex');
const progress = (message: string) => { if (process.env.HSL_GRAPH_PROGRESS === '1') console.log(`[imagens] ${message}`); };
const quotaFailure=(run:{stdout:string;stderr:string;errorCode?:string;timedOut:boolean})=>!run.timedOut&&/quota|usage limit|rate limit|credits? exhausted|reached your.*limit|insufficient\.quota/i.test(run.stdout+'\n'+run.stderr)&&!run.stdout.includes('status":"generated');
const profileEnv=(profile:CodexProfile):NodeJS.ProcessEnv=>({...process.env,CODEX_HOME:profile.home});

async function generateWithAntigravity(root:string,item:any,visualBrief:string){
  for (let attempt = 1; attempt <= 3; attempt++) {
    const threadId = item.beatId + '-image-fallback-' + Date.now();
    const task = {
      threadId, node: 'antigravity-image', attempt, maxAttempts: 1, provider: 'antigravity' as const,
      promptTemplate: 'graph/production/prompts/antigravity-image.md', schemaPath: 'graph/production/prompts/antigravity-image.schema.json', ioMode: 'file' as const, readOnly: false, timeoutMs: 900_000,
      vars: { visualBrief, expectedPath: item.outputPath, resultPath: path.join(taskDirectory({ threadId, node: 'antigravity-image', attempt }, root), 'output.json') }
    };
    const result = await prepareAndRunIdeTask(task, { repoRoot: root }), output = result.headlessResult?.output as any;
    if (result.headlessResult?.ok && output?.status === 'generated' && output.sourcePath) {
      const source = path.resolve(output.sourcePath);
      assertWithin(root, source);
      const validation = validateImage(source);
      if (validation.ok) {
        if (path.resolve(source) !== path.resolve(item.outputPath)) fs.copyFileSync(source, item.outputPath);
        return { ok: true, validation };
      }
    }
    const reason = output?.reason || result.headlessResult?.reason || '';
    const isQuota = /quota|rate limit|429|resource_exhausted/i.test(reason);
    if (isQuota && attempt < 3) {
      progress(`${item.beatId}: cota temporária do Antigravity atingida; aguardando 25s antes da tentativa ${attempt + 1}/3...`);
      await new Promise(r => setTimeout(r, 25_000));
      continue;
    }
    return { ok: false, reason: reason || 'Antigravity não gerou um PNG validado' };
  }
  return { ok: false, reason: 'Antigravity esgotou tentativas' };
}
export async function generateCodexImages(root: string, queuePath: string): Promise<ImageGenerationIssue|null> {
  assertWithin(root, queuePath);
  const queue: ImageQueue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  const report=(message:string)=>{progress(message);emitLive(root,queue.episodeId,{node:'image_generate_run',kind:'progress',message,current:queue.items.filter(x=>x.status==='done').length,total:queue.items.length});};
  if (queue.generator !== 'codex-imagegen') throw new Error('IMAGE_GENERATOR_NOT_ALLOWED');
  const profiles=listCodexProfiles();
  if (!(await checkCodexAccount(root,profileEnv(profiles[0]))).authenticated && profiles.length===1) return {kind: 'CODEX_AUTH', reason: 'Nenhuma conta Codex autenticada. Cadastre uma conta reserva ou execute o login.'};
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
        report(`${item.beatId}: reaproveitada`);
        item.status = 'done'; item.generatedBy = 'codex-imagegen'; write(queuePath, queue); continue;
      }
      const imagePrompt = fs.readFileSync(item.promptPath, 'utf8');
      const cleanError = (item.lastError && !['arquivo ausente', 'worker ainda não concluiu a imagem'].includes(item.lastError) && !item.lastError.startsWith('PATH_CONFINEMENT')) ? item.lastError : '';
      const key = hash(imagePrompt + (cleanError ? '\n' + cleanError : '\n')).slice(0, 20);
      const baseDir = path.join(path.dirname(item.outputPath), '.codex');
      let dir = path.join(baseDir, key);
      if (!fs.existsSync(path.join(dir, 'result.json')) && fs.existsSync(baseDir)) {
        const entries = fs.readdirSync(baseDir, {withFileTypes: true}).filter(d => d.isDirectory());
        for (const entry of entries) {
          const candDir = path.join(baseDir, entry.name);
          const candResult = path.join(candDir, 'result.json');
          if (fs.existsSync(candResult)) {
            try {
              const parsed = JSON.parse(fs.readFileSync(candResult, 'utf8'));
              if (parsed.status === 'generated' && parsed.sourcePath && fs.existsSync(parsed.sourcePath)) {
                dir = candDir;
                break;
              }
            } catch {}
          }
        }
      }
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
${cleanError ? `Previous validation/review feedback: ${cleanError}` : ''}
Use 16:9, photorealistic cinematic documentary style. Any in-scene text, numbers, and UI details on device screens, terminals, receipts, and physical surfaces requested in the visual brief must be rendered sharp, authentic, and legible. No floating title cards, watermarks, or gibberish.
This is a NEW image, not an edit: omit num_last_images_to_include and referenced_image_paths entirely. Do not send zero, null or an empty list for reference parameters. Follow the available native tool schema.
Produce at most ONE successful native image generation. Only if the tool explicitly rejects the arguments before generation starts (for example, an invalid num_last_images_to_include value), correct the arguments and retry ONCE with the same native tool. This is argument correction, not a fallback.
Never retry a timeout, authorization/policy refusal, quota error, provider failure or uncertain generation outcome. If unavailable or the one argument correction fails, report unavailable with reason; never fake success or use a fallback.
Return the JSON schema result with the existing absolute generated file path. Do not copy credentials or account details to any output.`;
      fs.writeFileSync(path.join(dir, 'prompt.md'), prompt);
      const requestPath = path.join(dir, 'request.json');
      const previousRequest = fs.existsSync(requestPath) ? JSON.parse(fs.readFileSync(requestPath, 'utf8')) : undefined;
      let result = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath, 'utf8')) : {};
      // Recover a completed generation after a crash during copying/validation.
      // The model never needs to spend another generation for this request.
      const completed = previousRequest && result.status === 'generated' && result.sourcePath;
      const startedAt = completed ? previousRequest.startedAt : Date.now();
      let successfulCodexHome: string | undefined = completed ? previousRequest.codexHome : undefined;
      let successfulProfileId: string | undefined = completed ? previousRequest.profileId : undefined;
      if (!completed) {
        report(`${item.beatId}: gerando pelo Codex CLI (${queue.items.filter(x => x.status === 'done').length}/${queue.items.length} prontas)`);
        let exhausted=true;
        for(let index=0;index<profiles.length;index++){
          const profile=profiles[index],env=profileEnv(profile),account=await checkCodexAccount(root,env);
          if(!account.authenticated)continue;
          exhausted=false;const accountStarted=Date.now();write(requestPath,{startedAt:accountStarted,key,profileId:profile.id,codexHome:profile.home,profileIndex:index});
          const imageSkillRoot=path.join(profile.home,'skills','.system','imagegen');
          const run=await codexCommand(root,['exec','--ignore-user-config','--sandbox','workspace-write',...(fs.existsSync(imageSkillRoot)?['--add-dir',imageSkillRoot]:[]),'-c','approval_policy="never"','--enable','image_generation','--ephemeral','--json','--output-schema',schemaPath,'-o',resultPath,'-'],{stdin:prompt,timeoutMs:900_000,logPath:path.join(dir,`run-${profile.id}.log`),env,abortOnOutput:/usage limit|quota exceeded|insufficient\.quota|credits? exhausted|reached your.*limit/i});
          result=fs.existsSync(resultPath)?JSON.parse(fs.readFileSync(resultPath,'utf8')):{};
          if(run.exitCode===0&&!run.timedOut&&result.status==='generated'&&result.sourcePath){successfulCodexHome=profile.home;successfulProfileId=profile.id;break;}
          const isQuota = quotaFailure(run);
          const isAuth = /autenticacao|token_revoked|unauthorized|refresh_token/i.test(unavailableReason(run) ?? '');
          if(isQuota || isAuth){
            const next=profiles[index+1];
            write(requestPath,{startedAt:accountStarted,key,profileId:next?.id??profile.id,codexHome:next?.home??profile.home,profileIndex:index+1,reason:isQuota?'explicit-quota':'auth-failed'});
            write(path.join(dir,'account-switch.json'),{from:profile.id,to:next?.id??'antigravity',reason:isQuota?'explicit-quota':'auth-failed',at:new Date().toISOString()});
            if(next)preferCodexProfile(next.id);
            continue;
          }
          item.lastError=run.timedOut?'Codex image generation timeout':unavailableReason(run)??'Codex CLI failed; inspect the provider log';
          if(index<profiles.length-1)continue;
          break;
        }
        if(result.status!=='generated'||!result.sourcePath){
          const fallback=await generateWithAntigravity(root,item,imagePrompt);
          if(fallback.ok){
            item.status='done';item.generatedBy='antigravity-imagegen';delete item.lastError;
            write(receiptPath,{generator:'antigravity-imagegen',transport:'antigravity-cli',sha256:fallback.validation?.sha256,outputPath:item.outputPath,width:fallback.validation?.width,height:fallback.validation?.height});
            write(queuePath,queue);report(`${item.beatId}: validada Antigravity ${fallback.validation?.width}x${fallback.validation?.height} (${queue.items.filter(x=>x.status==='done').length}/${queue.items.length} prontas)`);continue;
          }
          item.lastError=exhausted?'Todas as contas Codex estão indisponíveis e Antigravity falhou: '+fallback.reason:(result.reason||fallback.reason||'Nenhum provedor de imagem concluiu');write(queuePath,queue);return{kind:'CODEX_IMAGE_UNAVAILABLE',reason:item.lastError!};
        }
      }
      if (result.status !== 'generated' || !result.sourcePath) {
        item.lastError = result.reason || 'Native image_gen unavailable in Codex CLI'; write(queuePath, queue);
        return {kind: 'CODEX_IMAGE_UNAVAILABLE', reason: item.lastError!};
      }
      const source = path.resolve(result.sourcePath);
      const candidateRoots = [
        path.join(successfulCodexHome ?? process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex'), 'generated_images'),
        path.join(os.homedir(), '.codex', 'generated_images'),
        process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.codex', 'generated_images') : '',
        (process.env.HOMEDRIVE && process.env.HOMEPATH) ? path.join(process.env.HOMEDRIVE, process.env.HOMEPATH, '.codex', 'generated_images') : '',
        root
      ].filter(Boolean);
      let allowed = false;
      for (const candidate of candidateRoots) {
        try {
          assertWithin(candidate, source);
          allowed = true;
          break;
        } catch {}
      }
      if (!allowed) {
        const parts = source.split(path.sep);
        const codexIdx = parts.lastIndexOf('.codex');
        if (codexIdx >= 0 && parts[codexIdx + 1] === 'generated_images') {
          const codexGenRoot = parts.slice(0, codexIdx + 2).join(path.sep);
          if (fs.existsSync(codexGenRoot)) {
            assertWithin(codexGenRoot, source);
            allowed = true;
          }
        }
      }
      if (!allowed) {
        throw new Error(`PATH_CONFINEMENT: ${source} outside allowed Codex generated_images roots or ${root}`);
      }
      if (!fs.existsSync(source) || fs.statSync(source).mtimeMs < startedAt - 2000) throw new Error('CODEX_IMAGE_SOURCE_NOT_FRESH');
      if (fs.existsSync(item.outputPath)) fs.copyFileSync(item.outputPath, path.join(dir, 'previous.png'));
      fs.copyFileSync(source, item.outputPath);
      if (!validateImage(item.outputPath).ok) await fixImage(item);
      const verified = validateImage(item.outputPath);
      if (!verified.ok) {
        item.status = 'rejected'; item.lastError = verified.error; write(queuePath, queue);
        return {kind: 'IMAGE_GENERATION_RECOVERY', reason: verified.error!};
      }
      write(receiptPath, {generator: 'codex-imagegen', transport: 'codex-exec', profileId: successfulProfileId ?? 'primary', sha256: verified.sha256,
        sourcePath: source, outputPath: item.outputPath, width: verified.width, height: verified.height});
      item.status = 'done'; item.generatedBy = 'codex-imagegen'; delete item.lastError; write(queuePath, queue);
      report(`${item.beatId}: validada ${verified.width}x${verified.height} (${queue.items.filter(x => x.status === 'done').length}/${queue.items.length})`);
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
