import fs from 'node:fs';
import path from 'node:path';
import {interrupt} from '@langchain/langgraph';
import {Context,NodeFn,paths,writeJson,readJson,copyFile,beginStage} from '../runtime';
import {agentGuide,planTakes} from '../lib/firefly';
import {qaPromptForTake} from '../lib/firefly/guide';
import {assertMediaPlan} from '../lib/mediaPlan';
import {KlingLedger,digest,hashFile,type KlingOperation} from '../lib/firefly/ledger';
import type {VideoTake,AssetResult,State} from '../state';
import {takeRecipe} from '../lib/firefly/recipe';
import type {FireflyAuthorization} from '../lib/firefly/process';
import {resolveValidatedFrames} from '../lib/frameInventory';
import {repairReceiptPath,resolveFireflyArtifact} from '../lib/firefly/repair';

interface TransportReceipt {schema?:string;phase:string;authorization?:FireflyAuthorization;inputFrameHash?:string;outputHash?:string;outputPath?:string}
function matchesTransport(receipt:TransportReceipt|undefined,take:VideoTake,operation:KlingOperation|undefined):boolean {
  const auth=receipt?.authorization;
  return !!operation&&!!auth&&receipt?.schema==='hsl.kling-dispatch.v2'
    &&auth.operationId===take.operationId&&auth.recipeHash===take.recipeHash
    &&auth.authorizationId===operation.authorizationId&&auth.planHash===operation.planHash
    &&receipt.inputFrameHash===operation.inputHash;
}

const key=(t:VideoTake)=>`${t.beatId}-take-${t.takeIndex}`;
const readyPendingTake=(takes:VideoTake[])=>takes.find(t=>t.status==='pending'&&(!t.dependsOnTake||takes.some(parent=>key(parent)===t.dependsOnTake&&['ok','skipped'].includes(parent.status))));
const directory=(c:Context,s:State)=>path.join(paths(c,s).run,'firefly');
const runtimeFor=(c:Context,s:State,t:VideoTake)=>path.join(directory(c,s),'runtime',t.operationId!);
function terminalProviderNoOutput(runtime:string,take:VideoTake):string|undefined {
  const artifacts=path.join(runtime,'screenshots','provider','terminal_state_artifacts');
  if(fs.existsSync(path.join(runtime,'saida',key(take)+'.mp4'))||!fs.existsSync(artifacts))return;
  for(const file of fs.readdirSync(artifacts).filter(name=>name.endsWith('_provider_reason.json'))){
    const text=JSON.stringify(readJson<unknown>(path.join(artifacts,file))??{}).toLowerCase();
    if(text.includes('não podemos exibir o vídeo gerado')||text.includes('tente novamente mais tarde'))return `FIREFLY_PROVIDER_TERMINAL_NO_OUTPUT:${file}`;
  }
}
function useLedger<T>(c:Context,s:State,fn:(ledger:KlingLedger)=>T):T {
  const ledger=new KlingLedger(directory(c,s));
  try{return fn(ledger);}finally{try{writeJson(path.join(directory(c,s),'ledger-export.json'),ledger.export());}finally{ledger.close();}}
}
function reusable(c:Context,t:VideoTake,op:KlingOperation|undefined):boolean {
  try {
    if(!op||op.phase!=='validated'||op.recipeHash!==t.recipeHash||op.inputHash!==hashFile(t.firstFramePath)||op.outputHash!==hashFile(t.outputPath))return false;
    const p=c.deps.inspect(t.outputPath);
    return p.hasVideo&&p.codecName==='h264'&&p.width===1920&&p.height===1080&&p.durationSeconds>=t.requestedSeconds-1/30;
  }catch{return false;}
}
export const fireflyGuide=(c:Context):NodeFn=>s=>{
  const media=assertMediaPlan(s),ids=new Set(media.fireflyBeatIds);
  if(!ids.size)throw new Error('MEDIA_PLAN_REQUIRED_PROVIDER_EMPTY');
  beginStage(c,s,'STAGE_03_FIREFLY_VIDEOS');
  const prompts=s.visualPrompts.filter(p=>ids.has(p.beatId));
  if(prompts.length!==ids.size||new Set(prompts.map(p=>p.beatId)).size!==ids.size)throw new Error('FIREFLY_PROMPT_COVERAGE_MISMATCH');
  const allBeatIds=[...ids];
  const usable=new Map(s.frames.filter(f=>f.status!=='failed'&&fs.existsSync(f.path)).map(f=>[f.beatId,f.path]));
  const recovered=allBeatIds.some(id=>!usable.has(id))?resolveValidatedFrames(c,s,allBeatIds):s.frames;
  const images=new Map(recovered.filter(f=>f.status!=='failed').map(f=>[f.beatId,f.path]));
  const takes=planTakes(prompts,images,path.join(directory(c,s),'takes'));
  const recipeState={...s,frames:recovered};
  for(const t of takes){
    const p=prompts.find(p=>p.beatId===t.beatId)!,beat=s.scenePlan!.beats.find(b=>b.beatId===t.beatId)!;
    if(Math.abs(p.durationSeconds-beat.durationFrames/30)>0.001)throw new Error(`FIREFLY_PROMPT_DURATION_MISMATCH:${t.beatId}`);
    t.provider='firefly-kling';t.recipeHash=takeRecipe(recipeState,t);
    t.operationId=digest([s.episodeId,t.recipeHash]);t.outputPath=path.join(directory(c,s),'takes',`${t.operationId}.mp4`);
    if(t.takeIndex>1)t.firstFramePath=takes.find(x=>x.beatId===t.beatId&&x.takeIndex===t.takeIndex-1)!.outputPath+'.last-frame.png';
  }
  const inventory=useLedger(c,s,l=>takes.map(t=>{const op=l.operation(t.operationId!);return reusable(c,t,op)?'reusable':op?'reconcile':'new';}));
  const required=inventory.filter(x=>x==='new').length;
  const budget={kind:'KLING_BUDGET' as const,model:'Kling 2.5 Turbo' as const,planHash:media.hash,scopeHash:digest([media.hash,takes.map(t=>t.operationId)]),videoBeats:ids.size,totalTakes:takes.length,reusableTakes:inventory.filter(x=>x==='reusable').length,reconciliationRequired:inventory.filter(x=>x==='reconcile').length,requiredGenerations:required,operationIds:takes.map(t=>t.operationId!)};
  const guidePath=path.join(directory(c,s),'guide.json');writeJson(guidePath,{...budget,takes});
  return{frames:recovered,videoTakes:takes,fireflyGuidePath:guidePath,klingBudget:budget,fireflyIssue:null};
};
export const klingBudgetWait=(c:Context):NodeFn=>s=>{
  const b=s.klingBudget;if(!b||b.planHash!==assertMediaPlan(s).hash)throw new Error('KLING_BUDGET_PLAN_MISMATCH');
  const existing=useLedger(c,s,l=>l.authorization(b.scopeHash));if(existing)return{klingAuthorization:existing};
  if(b.requiredGenerations===0)return{klingAuthorization:null,__status:'skipped'};
  let source:'cli-limit'|'interactive'='cli-limit',approvedLimit=s.options.graph.maxGenerations;
  if(s.options.graph.maxGenerations<b.requiredGenerations){
    const answer=interrupt({...b,message:`Autorizar exatamente ${b.requiredGenerations} novas gerações Kling?`}) as {decision?:string;limit?:number};
    if(answer?.decision==='abort')return{productionStatus:'ABORTED',gateDecisions:[{gate:'kling',decision:'abort',at:new Date().toISOString()}]};
    if(answer?.decision!=='proceed')throw new Error('KLING_BUDGET_DECISION_INVALID');
    const limit=answer.limit??s.options.graph.maxGenerations;
    if(!Number.isSafeInteger(limit)||limit<b.requiredGenerations)throw new Error('KLING_BUDGET_LIMIT_TOO_LOW');source='interactive';approvedLimit=limit;
  }
  const a=useLedger(c,s,l=>l.authorize(b,source));writeJson(path.join(directory(c,s),'authorization.json'),a);
  return{klingAuthorization:a,options:{...s.options,graph:{...s.options.graph,maxGenerations:approvedLimit}},gateDecisions:[{gate:'kling',decision:'proceed',at:a.approvedAt}]};
};
export const routeKlingBudget=(s:State)=>s.productionStatus==='ABORTED'?'finalize':s.klingBudget?.totalTakes&&s.klingBudget.reusableTakes===s.klingBudget.totalTakes?'firefly_dispatch':'firefly_session_prepare';
export const fireflySessionPrepare=(c:Context):NodeFn=>async s=>{
  if(!assertMediaPlan(s).fireflyBeatIds.length)throw new Error('MEDIA_PLAN_REQUIRED_PROVIDER_EMPTY');
  try{
    const e=c.deps.fireflyEnvironment(),log=path.join(paths(c,s).audit,'firefly-session.log');
    const valid=await c.deps.probeFireflySession(e,path.join(directory(c,s),'session'),log);if(!valid)await c.deps.openFireflyLogin(e,log);
    return{environment:{agentDir:e.agentDir,profileDir:e.profileDir,sessionValid:valid},fireflyIssue:valid?null:{kind:'FIREFLY_LOGIN',reason:'Autentique no Chrome Firefly aberto e use Continuar episódio. A janela de login será encerrada automaticamente para validar a sessão.'}};
  }catch(e){return{environment:null,fireflyIssue:{kind:'FIREFLY_LOGIN',reason:e instanceof Error?e.message:String(e)}};}
};
export const fireflySessionWait:NodeFn=s=>{if(s.environment?.sessionValid)return{__status:'skipped'};interrupt({kind:'FIREFLY_LOGIN',profileDir:s.environment?.profileDir,reason:s.fireflyIssue?.reason});return{};};
export const fireflyDispatch=(c:Context):NodeFn=>async s=>{
  const media=assertMediaPlan(s),takes=s.videoTakes.map(t=>({...t}));
  if(!takes.length||!s.klingBudget||s.klingBudget.planHash!==media.hash)throw new Error('FIREFLY_TAKES_NOT_PREPARED');
  // A failed export must not hold unrelated, already authorized scenes. Never
  // select a dependent take until its parent's last frame passed intake/QA.
  const next=takes.find(t=>t.status==='dispatched')??readyPendingTake(takes)??takes.find(t=>t.status==='failed')??takes.find(t=>!['ok','skipped'].includes(t.status));if(!next)return{__status:'skipped'};
  if(!next.operationId||!next.recipeHash)throw new Error('FIREFLY_CHECKPOINT_MIGRATION_REQUIRED: run --from media_plan_prepare');
  if(takeRecipe(s,next)!==next.recipeHash||digest([s.episodeId,next.recipeHash])!==next.operationId)throw new Error('KLING_RECIPE_CHANGED: replanejar e revalidar orçamento');
  if(next.dependsOnTake&&!takes.some(t=>key(t)===next.dependsOnTake&&['ok','skipped'].includes(t.status)))throw new Error('FIREFLY_DEPENDENCY_PENDING');
  const runtime=runtimeFor(c,s,next),receiptPath=path.join(runtime,'dispatch-receipt.json'),produced=path.join(runtime,'saida',key(next)+'.mp4');
  const prompt=s.visualPrompts.find(p=>p.beatId===next.beatId)!,prior=useLedger(c,s,l=>l.operation(next.operationId!));
  if(reusable(c,next,prior)){next.status='skipped';next.actualSeconds=prior!.duration;await c.deps.extractLastFrame(next.outputPath,next.outputPath+'.last-frame.png');return{videoTakes:takes,fireflyIssue:null};}
  const recovery=(reason:string)=>({fireflyIssue:{kind:'FIREFLY_RECOVERY',reason,take:key(next),receiptPath,retryPolicy:'manual-reconcile-no-auto-resubmit'}});
  if(prior&&prior.inputHash!==hashFile(next.firstFramePath))return recovery('KLING_OPERATION_INPUT_CHANGED');
  if(prior?.phase==='validated')return recovery('KLING_VALIDATED_ASSET_CHANGED: restaurar o arquivo autorizado; não reenviar');
  const transport=readJson<TransportReceipt>(receiptPath),matches=matchesTransport(transport,next,prior);
  if(transport?.inputFrameHash&&transport.inputFrameHash!==hashFile(next.firstFramePath))return recovery('KLING_RECEIPT_INPUT_CHANGED');
  if(transport?.outputHash&&fs.existsSync(produced)&&transport.outputHash!==hashFile(produced))return recovery('KLING_RECEIPT_OUTPUT_CHANGED');
  if(prior&&matches&&transport?.phase==='transport_complete'&&transport.outputHash&&fs.existsSync(produced)){
    try{copyFile(resolveFireflyArtifact(runtime,next.operationId,produced,transport.outputHash).path,next.outputPath);}
    catch(error){return recovery(error instanceof Error?error.message:String(error));}
    next.status='dispatched';next.generationCounted=true;return{videoTakes:takes,fireflyIssue:null,generationCount:useLedger(c,s,l=>l.count())};
  }
  // A durable reservation survives death before the node checkpoint. Only a
  // reconciled, unstarted external job may be submitted again automatically.
  if(prior&&!(matches&&transport?.phase==='enqueued')&&!(prior.phase==='unstarted'&&!fs.existsSync(receiptPath)))return recovery('KLING_DISPATCH_UNCERTAIN: reconciliar o recibo antes de retomar');
  const auth=s.klingAuthorization??useLedger(c,s,l=>l.authorization(s.klingBudget!.scopeHash));
  if(!auth||auth.scopeHash!==s.klingBudget.scopeHash)throw new Error('KLING_PAID_DISPATCH_NOT_AUTHORIZED');
  const reservation=useLedger(c,s,l=>l.reserve(auth,{id:next.operationId!,planHash:media.hash,recipeHash:next.recipeHash!,inputHash:hashFile(next.firstFramePath),outputPath:next.outputPath}));
  if(!reservation.created&&!prior)return recovery('KLING_CONCURRENT_RESERVATION');
  const guide=path.join(runtime,'guide.json');writeJson(guide,agentGuide(prompt,next));
  try{
    await c.deps.runFireflyTake(c.deps.fireflyEnvironment(),runtime,guide,path.join(paths(c,s).audit,`${next.operationId}.log`),{authorizationId:auth.id,planHash:media.hash,operationId:next.operationId,recipeHash:next.recipeHash});
    useLedger(c,s,l=>l.update(next.operationId!,{phase:'submitted'}));
  }catch(e){
    const reason=e instanceof Error?e.message:String(e);
    const unstarted=!fs.existsSync(receiptPath)&&/^(FIREFLY_ENV_|FIREFLY_PROFILE_IN_USE|FIREFLY_PROFILE_LOCK|KLING_AUTHORIZATION_INVALID|KLING_PAID_DISPATCH_NOT_AUTHORIZED)/.test(reason);
    useLedger(c,s,l=>l.update(next.operationId!,{phase:unstarted?'unstarted':'uncertain',error:reason}));return recovery(reason);
  }
  const confirmed=readJson<TransportReceipt>(receiptPath);
  if(!matchesTransport(confirmed,next,reservation.operation)||confirmed?.phase!=='transport_complete'||!confirmed.outputHash||confirmed.inputFrameHash!==hashFile(next.firstFramePath))return recovery('KLING_TRANSPORT_PROVENANCE_MISSING');
  if(fs.existsSync(produced)&&confirmed.outputHash!==hashFile(produced))return recovery('KLING_TRANSPORT_OUTPUT_CHANGED');
  if(fs.existsSync(produced)){
    try{copyFile(resolveFireflyArtifact(runtime,next.operationId,produced,confirmed.outputHash!).path,next.outputPath);}
    catch(error){return recovery(error instanceof Error?error.message:String(error));}
  }
  next.status='dispatched';next.generationCounted=true;next.startedAt=new Date().toISOString();
  return{videoTakes:takes,generationCount:useLedger(c,s,l=>l.count()),fireflyIssue:null};
};
export const fireflyRecoveryWait=(c:Context):NodeFn=>async s=>{
  // `interruptAfter` can preserve the next recovery task after intake while
  // retaining the state immediately before the intake update. Rehydrate the
  // exact dispatched take so a resume never loses its receipt or guesses a
  // different provider result.
  const inFlight=s.videoTakes.find(t=>t.status==='dispatched');
  const issue=s.fireflyIssue??(inFlight?{kind:'FIREFLY_RECOVERY',take:key(inFlight),receiptPath:path.join(runtimeFor(c,s,inFlight),'dispatch-receipt.json'),retryPolicy:'intake-state-repair-no-auto-resubmit',reason:'FIREFLY_INTAKE_STATE_REPAIR: retomar a verificação do take já exportado; nenhuma nova geração será criada.'}:{kind:'FIREFLY_RECOVERY',reason:'Resultado externo requer reconciliação'});
  interrupt(issue);
  if(!issue.receiptPath)throw new Error('FIREFLY_RECOVERY_RECEIPT_MISSING');
  const runtime=path.dirname(issue.receiptPath),take=s.videoTakes.find(item=>runtime===runtimeFor(c,s,item));
  if(!take?.operationId)throw new Error('FIREFLY_RECOVERY_OPERATION_MISSING');
  const recovered=()=>({fireflyIssue:null,videoTakes:s.videoTakes.map(t=>t.operationId===take.operationId?{...t,status:'pending' as const,error:undefined}:t)});
  const deferred=(reason:string)=>({fireflyIssue:{...issue,reason},videoTakes:s.videoTakes.map(t=>t.operationId===take.operationId?{...t,status:'failed' as const,error:reason}:t)});
  const persistedQa=readJson<{passed?:boolean;issues?:string[]}>(take.outputPath+'.qa.json');
  if(persistedQa?.passed===false)return deferred(`FIREFLY_QA_REJECTED:${(persistedQa.issues??['revisão visual reprovada']).join('; ')}`);
  const terminalNoOutput=terminalProviderNoOutput(runtime,take);
  if(terminalNoOutput)return deferred(terminalNoOutput);
  const receipt=readJson<TransportReceipt>(issue.receiptPath);
  // A completed transport is retried only through intake/QA. An already
  // enqueued operation may resume the same external job. Neither path creates
  // a second job or consumes a new reservation.
  if(receipt?.phase==='transport_complete'||receipt?.phase==='enqueued')return recovered();
  if(receipt?.phase==='uncertain'&&receipt.outputPath&&fs.existsSync(receipt.outputPath)){
    try{
      await c.deps.reconcileCompletedFireflyTake(c.deps.fireflyEnvironment(),runtime,path.join(runtime,'guide.json'),path.join(paths(c,s).audit,`${take.operationId}-completed-reconcile.log`));
      return recovered();
    }catch(error){
      const reason=error instanceof Error?error.message:String(error);
      return{fireflyIssue:{...issue,reason:`FIREFLY_COMPLETED_RECONCILIATION_PENDING:${reason}`}};
    }
  }
  // No receipt means the adapter never established an external job. Keep the
  // checkpoint blocked: absence of evidence is not proof that a send is safe.
  if(!receipt)return{fireflyIssue:issue};
  // Running/succeeded/prepared receipts are ambiguous and must stay blocked.
  // Only the adapter's explicit uncertain state can enter the transactional
  // external proof below.
  if(receipt.phase!=='uncertain')return{fireflyIssue:issue};
  const resultIdentity=path.join(runtime,'screenshots','provider_result_identity.json');
  if(fs.existsSync(resultIdentity)){
    try{
      // Recovery opens a fresh provider page. Re-probe the stored profile so a
      // stale session becomes the normal login gate instead of a misleading
      // recovery failure.
      const environment=c.deps.fireflyEnvironment();
      const sessionValid=await c.deps.probeFireflySession(environment,path.join(directory(c,s),'session'),path.join(paths(c,s).audit,`${take.operationId}-recovery-session.log`));
      if(!sessionValid)return{environment:{agentDir:environment.agentDir,profileDir:environment.profileDir,sessionValid:false},fireflyIssue:{kind:'FIREFLY_LOGIN',take:key(take),receiptPath:issue.receiptPath,retryPolicy:'recover-existing-job-only',reason:'FIREFLY_RECOVERY_LOGIN_REQUIRED: autentique o perfil Adobe para recuperar o job já enviado; nenhuma nova geração será criada.'}};
      await c.deps.recoverFireflyResult(environment,runtime,path.join(runtime,'guide.json'),path.join(paths(c,s).audit,`${take.operationId}-result-recovery.log`));
      useLedger(c,s,ledger=>ledger.update(take.operationId!,{phase:'submitted',error:undefined}));
      return recovered();
    }catch(error){
      const reason=error instanceof Error?error.message:String(error);
      // Defer only provider-result recovery failures, not profile, protocol,
      // provenance or infrastructure failures that also threaten other takes.
      if(reason.startsWith('FIREFLY_RECOVERY_PROVIDER_QUERY:'))return deferred(`FIREFLY_RESULT_RECOVERY_PENDING:${reason}`);
      return{fireflyIssue:{...issue,reason:`FIREFLY_RESULT_RECOVERY_PENDING:${reason}`}};
    }
  }
  // The external transactional guard is the authority: it succeeds only for
  // a reserved job whose generation intent is still NULL. Any ambiguous or
  // submitted operation remains blocked and cannot be resent.
  try{
    await c.deps.reconcileFireflyTake(c.deps.fireflyEnvironment(),runtime,path.join(runtime,'guide.json'),path.join(paths(c,s).audit,`${take.operationId}-reconcile.log`));
    useLedger(c,s,ledger=>ledger.update(take.operationId!,{phase:'unstarted',error:undefined}));
    return recovered();
  }catch(error){
    const reason=error instanceof Error?error.message:String(error);
    return{fireflyIssue:{...issue,reason:`FIREFLY_RECONCILIATION_PENDING:${reason}`}};
  }
};
export const routeDispatch=(s:State)=>s.fireflyIssue?'firefly_recovery_wait':'firefly_intake_wait';
/** Keep a recovery checkpoint suspended until a reconciliation has proved it safe to advance.
 * A static edge here would re-enter dispatch with the same uncertain receipt. */
export const routeRecovery=(s:State)=>s.fireflyIssue?.kind==='FIREFLY_LOGIN'?'firefly_session_prepare':s.fireflyIssue
  ?s.videoTakes.some(t=>key(t)===s.fireflyIssue?.take&&t.status==='failed')&&readyPendingTake(s.videoTakes)?'firefly_dispatch':'firefly_recovery_wait'
  :'firefly_dispatch';
export const fireflyIntakeWait=(c:Context):NodeFn=>async s=>{
  assertMediaPlan(s);const takes=s.videoTakes.map(t=>({...t})),t=takes.find(x=>x.status==='dispatched');if(!t)return{};
  try{
    const p=await c.deps.detailedProbe(t.outputPath);
    if(p.codec!=='h264'||p.width!==1920||p.height!==1080||p.duration<t.requestedSeconds-1/30)throw new Error(`FIREFLY_PROBE_INVALID:${JSON.stringify(p)}`);
    const visualPrompt=s.visualPrompts.find(p=>p.beatId===t.beatId)!;
    const qa=await c.deps.reviewFireflyTake(c.root,t.outputPath,t.firstFramePath,qaPromptForTake(visualPrompt,t));writeJson(t.outputPath+'.qa.json',qa);
    if(!qa.passed)throw new Error(`FIREFLY_QA_REJECTED:${qa.issues.join('; ')}`);
    useLedger(c,s,l=>l.update(t.operationId!,{phase:'validated',outputHash:hashFile(t.outputPath),duration:p.duration}));t.status='ok';t.actualSeconds=p.duration;t.endedAt=new Date().toISOString();
    await c.deps.extractLastFrame(t.outputPath,t.outputPath+'.last-frame.png');return{videoTakes:takes,fireflyIssue:null};
  }catch(e){
    const reason=e instanceof Error?e.message:String(e),receiptPath=path.join(runtimeFor(c,s,t),'dispatch-receipt.json');
    // Semantic rejection consumes the existing provider job. Preserve its QA
    // evidence, never resubmit it, and let other authorized independent takes
    // progress. Dependents remain blocked because their first frame is absent.
    if(reason.startsWith('FIREFLY_QA_REJECTED:'))return{videoTakes:takes.map(item=>item.operationId===t.operationId?{...item,status:'failed' as const,error:reason}:item),fireflyIssue:{kind:'FIREFLY_RECOVERY',reason,take:key(t),receiptPath,retryPolicy:'qa-rejected-no-auto-resubmit'}};
    return{fireflyIssue:{kind:'FIREFLY_RECOVERY',reason,take:key(t),receiptPath,retryPolicy:'manual-reconcile-no-auto-resubmit'}};
  }
};
export const routeTakes=(s:State)=>{if(s.fireflyIssue)return'firefly_recovery_wait';if(!s.videoTakes.length)throw new Error('MEDIA_PLAN_REQUIRED_PROVIDER_EMPTY');return s.videoTakes.every(t=>['ok','skipped'].includes(t.status))?'firefly_finalize':'firefly_dispatch';};
export const fireflyFinalize=(c:Context):NodeFn=>async s=>{
  const ids=assertMediaPlan(s).fireflyBeatIds,videos:AssetResult[]=[];
  for(const id of ids){
    const takes=s.videoTakes.filter(t=>t.beatId===id).sort((a,b)=>a.takeIndex-b.takeIndex);
    if(!takes.length||takes.some(t=>!['ok','skipped'].includes(t.status)||!useLedger(c,s,l=>reusable(c,t,l.operation(t.operationId!)))))throw new Error(`FIREFLY_COVERAGE_INVALID:${id}`);
    const beat=s.scenePlan!.beats.find(b=>b.beatId===id)!,out=path.join(paths(c,s).run,'videos',`${id}.mp4`),joined=out+'.joined.mp4';
    if(takes.length===1)copyFile(takes[0].outputPath,joined);else await c.deps.concatTakes(takes.map(t=>t.outputPath),joined);
    await c.deps.fitSceneVideo(joined,out,beat.durationFrames);
    const pub=path.join(c.root,'public','runs',s.episodeId,'videos',`${id}.mp4`);copyFile(out,pub);
    const sha256=hashFile(out),recipeHash=digest(takes.map(t=>[t.recipeHash,hashFile(t.outputPath)]));
    const repairs=takes.flatMap(t=>{const runtime=runtimeFor(c,s,t),receipt=repairReceiptPath(runtime);return fs.existsSync(receipt)?[{operationId:t.operationId,receiptPath:receipt,receiptHash:hashFile(receipt)}]:[];});
    writeJson(out+'.provenance.json',{provider:'firefly-kling',planHash:s.mediaPlan!.hash,recipeHash,sha256,operations:takes.map(t=>t.operationId),repairs,durationFrames:beat.durationFrames});
    videos.push({beatId:id,path:out,status:takes.every(t=>t.status==='skipped')?'skipped':'ok',attempts:1,provider:'firefly-kling',sha256,recipeHash});
  }
  return{videos};
};
