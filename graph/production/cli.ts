import {deriveProgress} from '../console/progress';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Command } from '@langchain/langgraph';
import { createCheckpointer, REPO_ROOT } from '../checkpointer';
import { createProductionGraph, NODE_ALIASES, NODE_ORDER, NodeName } from './graph';
import {realDependencies} from './deps';
import { initialState, STATE_VERSION, State } from './state';
import { configFor, counts, executeProduction, readHistory, readErrors, rewind } from './runner';
import { closeAssetServer } from './lib/assetServer';
import { storageSummary } from './storage/index';
import { checkCodexAccount } from '../ide/codexAccount';
import {resolveMediaPolicy,planMedia} from './lib/mediaPlan';
import {prepareKlingReplacements} from './nodes/firefly_real';
import {normalizePlanDuration} from './lib/plan';
import {HslSceneDirectorAgent} from '../../hsl/core/hslSceneDirectorAgent';
import {readJson,writeJson} from './runtime';
import type {HslLongFormProjectPlan} from '../../hsl/core/types';

export function parseArgs(argv: string[]) {
  const command = argv.shift() ?? 'run';
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--offline' || key === '--test-render' || key==='--motion-require-3d') args[key] = true;
    else if (['--episode','--topic','--entity','--mechanism','--constraint','--consequence','--thesis','--target-minutes','--gates','--asset-concurrency','--render-concurrency','--from','--decision','--until','--beats','--media-mode','--media-policy','--motion-mode','--motion-scenes','--max-generations','--prompt-review-attempts','--storage','--prune','--keep-local-deliverables','--count'].includes(key)) {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Falta valor: ${key}`);
      args[key] = argv[++i];
    } else throw new Error(`Argumento desconhecido: ${key}`);
  }
  if (!['run', 'resume', 'status', 'history', 'mermaid','media-plan','replace-kling'].includes(command)) throw new Error(`Comando desconhecido: ${command}`);
  return { command, args, episodeId: String(args['--episode'] ?? 'HSL_EPISODE_001') };
}
export async function main(argv = process.argv.slice(2)): Promise<number> {
  const { command, args, episodeId } = parseArgs(argv);
  if(command==='media-plan'){
    const state=initialState({episodeId,targetMinutes:args['--target-minutes']?Number(args['--target-minutes']):undefined,graph:{mediaMode:(args['--media-mode']??'real') as any,mediaPolicy:args['--media-policy'] as any}});
    const existing=readJson<HslLongFormProjectPlan>(path.join(REPO_ROOT,'runs',episodeId,'scene-plan.json'));
    const original=existing??HslSceneDirectorAgent.planEpisodeFromScratch(state.topicInput!);
    const plan=normalizePlanDuration(original,args['--target-minutes']?Number(args['--target-minutes']):original.targetMinutes);
    const preview=planMedia(plan,resolveMediaPolicy({options:state.options!}));
    const file=path.join(REPO_ROOT,'out',`${episodeId.toLowerCase()}-media-plan-preview.json`);writeJson(file,preview);
    console.log(JSON.stringify({previewPath:file,policy:preview.mediaPlan.policy,fireflyBeats:preview.mediaPlan.fireflyBeatIds.length,totalTakes:preview.mediaPlan.totalTakes,totalFrames:preview.scenePlan.totalFrames,paidDispatches:0,mediaPlan:preview.mediaPlan},null,2));return 0;
  }
  if (args['--until'] && !['run','resume'].includes(command)) throw new Error('--until é aceito apenas em run ou resume');
  const requestedUntil = args['--until'] ? String(args['--until']) : undefined;
  const until = requestedUntil ? (NODE_ALIASES[requestedUntil] ?? requestedUntil) as NodeName : undefined;
  if (until && !NODE_ORDER.includes(until)) throw new Error(`Nó desconhecido em --until: ${requestedUntil}`);
  const config = configFor(episodeId);
  const saver = createCheckpointer();
  const graph = createProductionGraph(saver, {}, REPO_ROOT, { interruptAfter: until ? [until] : undefined });
  let lock: string | undefined;
  try {
    if (command === 'mermaid') { console.log(graph.getGraph().drawMermaid()); return 0; }
    if (command === 'history') { console.log(JSON.stringify(readHistory(REPO_ROOT, episodeId), null, 2)); return 0; }
    let snapshot = await graph.getState(config);
    if (snapshot.values.episodeId && snapshot.values.stateVersion !== STATE_VERSION) throw new Error('Checkpoint incompatível; utilize nova stateVersion');
    if (command === 'status') {
      console.log(JSON.stringify({ thread_id: config.configurable.thread_id, next: snapshot.next,
        Progress:deriveProgress(REPO_ROOT,episodeId,snapshot.values,snapshot.next,snapshot.tasks.flatMap(t=>t.interrupts.map(i=>i.value))),
        Accounts:{codex:await checkCodexAccount(REPO_ROOT),loginCommand:'npm run hsl:codex:login'},
        frames: counts(snapshot.values.frames ?? []), videos: counts(snapshot.values.videos ?? []), chunks: counts(snapshot.values.renderChunks ?? []),
        generationCount:snapshot.values.generationCount??0,videoTakes:snapshot.values.videoTakes??[],sfxResolved:snapshot.values.sfxResolved??[],sfxUnresolved:snapshot.values.sfxUnresolved??[],
        productionStatus: snapshot.values.productionStatus,Storage:storageSummary(snapshot.values.storageIndex??[]),errors: snapshot.values.errors, journalErrors: readErrors(REPO_ROOT, episodeId), tasks: snapshot.tasks }, null, 2));
      return 0;
    }
    // Shared paths in the reference prohibit simultaneous production processes.
    const lockPath = path.join(REPO_ROOT, 'out', 'production-graph.lock');
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    if (fs.existsSync(lockPath)) {
      const pid = Number(fs.readFileSync(lockPath, 'utf8'));
      let alive = true; try { process.kill(pid, 0); } catch { alive = false; }
      if (alive) throw new Error(`Produção já em execução (PID ${pid})`);
      fs.unlinkSync(lockPath);
    }
    fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' }); lock = lockPath;
    let input: Parameters<typeof graph.stream>[0] = null;
    const historyOffset=readHistory(REPO_ROOT,episodeId).length;
    const storage=String(args['--storage']??(command==='run'?(process.env.HSL_DRIVE_FOLDER_ID?'drive':'off'):'')),prune=String(args['--prune']??'dry-run');
    if(storage&&!['off','drive'].includes(storage))throw new Error('--storage aceita off|drive');if(!['dry-run','apply'].includes(prune))throw new Error('--prune aceita dry-run|apply');
    const mediaModeArg=args['--media-mode']?String(args['--media-mode']):undefined;
    const mediaPolicyArg=args['--media-policy']?String(args['--media-policy']):undefined;
    const motionModeArg=args['--motion-mode']?String(args['--motion-mode']):undefined;
    if(mediaPolicyArg&&!['stills','local-motion','firefly-hybrid'].includes(mediaPolicyArg))throw new Error('--media-policy aceita stills|local-motion|firefly-hybrid');
    if(mediaModeArg&&!['legacy','real'].includes(mediaModeArg))throw new Error('--media-mode aceita legacy|real');
    if(motionModeArg&&!['legacy','authored'].includes(motionModeArg))throw new Error('--motion-mode aceita legacy|authored');
    if(args['--motion-scenes']!==undefined&&(!Number.isSafeInteger(Number(args['--motion-scenes']))||Number(args['--motion-scenes'])<1||Number(args['--motion-scenes'])>12))throw new Error('--motion-scenes deve ser inteiro entre 1 e 12');
    if(args['--max-generations']!==undefined&&(!Number.isSafeInteger(Number(args['--max-generations']))||Number(args['--max-generations'])<0))throw new Error('--max-generations deve ser inteiro não negativo');
    if(args['--prompt-review-attempts']!==undefined&&(!Number.isSafeInteger(Number(args['--prompt-review-attempts']))||Number(args['--prompt-review-attempts'])<1||Number(args['--prompt-review-attempts'])>12))throw new Error('--prompt-review-attempts deve ser inteiro entre 1 e 12');
    const graphOptionUpdates:any={...(storage?{storageMode:storage}:{}),...(mediaModeArg?{mediaMode:mediaModeArg}:{}),...(motionModeArg?{motionMode:motionModeArg}:{}),...(args['--motion-scenes']!==undefined?{motionMaxScenes:Number(args['--motion-scenes'])}:{}),...(args['--motion-require-3d']?{motionRequire3d:true}:{}),...(args['--prune']?{prune}:{}),...(args['--keep-local-deliverables']?{keepLocalDeliverables:Number(args['--keep-local-deliverables'])}:{}),...(args['--max-generations']!==undefined?{maxGenerations:Number(args['--max-generations'])}:{}),...(args['--prompt-review-attempts']!==undefined?{promptReviewMaxIterations:Number(args['--prompt-review-attempts'])}:{})};
    if(mediaPolicyArg)graphOptionUpdates.mediaPolicy=mediaPolicyArg;
    if(command==='replace-kling') {
      const count=Number(args['--count']);
      if(!Number.isSafeInteger(count)||count<1)throw new Error('replace-kling requer --count inteiro positivo');
      if(!snapshot.next.length)throw new Error('replace-kling requer episódio pendente');
      const patch=prepareKlingReplacements({root:REPO_ROOT,deps:realDependencies(REPO_ROOT)},snapshot.values,count);
      await graph.updateState(config,patch as any,'firefly_guide');
      snapshot=await graph.getState(config);
    } else if (command === 'run' && args['--from']) {
      await rewind(graph, REPO_ROOT, episodeId, String(args['--from']),graphOptionUpdates);
    } else if (command === 'run') {
      if (snapshot.next.length) throw new Error('Thread pendente: utilize resume ou --from');
      const gates = String(args['--gates'] ?? '').split(',').filter(Boolean);
      if (gates.some(g => !['render', 'publish'].includes(g))) throw new Error('--gates aceita render,publish');
      const mediaMode=mediaModeArg??'real';
      input = initialState({episodeId,topic:args['--topic']?String(args['--topic']):undefined,entity:args['--entity']?String(args['--entity']):undefined,mechanism:args['--mechanism']?String(args['--mechanism']):undefined,constraint:args['--constraint']?String(args['--constraint']):undefined,consequence:args['--consequence']?String(args['--consequence']):undefined,thesis:args['--thesis']?String(args['--thesis']):undefined,targetMinutes:args['--target-minutes']?Number(args['--target-minutes']):undefined,graph: { offline: !!args['--offline'], assetConcurrency: Number(args['--asset-concurrency'] ?? 1), renderConcurrency: Number(args['--render-concurrency'] ?? 1),
        mediaMode:mediaMode as 'legacy'|'real',mediaPolicy:mediaPolicyArg as any,motionMode:(motionModeArg??'legacy') as 'legacy'|'authored',motionMaxScenes:Number(args['--motion-scenes']??3),motionRequire3d:!!args['--motion-require-3d'],beats:args['--beats']?Number(args['--beats']):undefined,testRender:!!args['--test-render'],maxGenerations:Number(args['--max-generations']??0),storageMode:storage as 'off'|'drive',prune:prune as 'dry-run'|'apply',keepLocalDeliverables:Number(args['--keep-local-deliverables']??1),gates: { render: gates.includes('render'), publish: gates.includes('publish') } } });
    } else {
      if (!snapshot.next.length) {
        if (snapshot.values.productionStatus === 'COMPLIANCE_FAILED') {
          await rewind(graph, REPO_ROOT, episodeId, 'compliance_stage', graphOptionUpdates);
          snapshot = await graph.getState(config);
        } else if (snapshot.values.productionStatus === 'COMPLETED') {
          console.log(`\n  Episódio ${episodeId} já está 100% concluído! Entregáveis em deliveries/${episodeId}/`);
          return 0;
        } else {
          throw new Error('Thread inexistente ou já finalizada');
        }
      }
      const updatedOptions=Object.keys(graphOptionUpdates).length?{...snapshot.values.options,graph:{...snapshot.values.options.graph,...graphOptionUpdates}}:undefined;
      if(updatedOptions)resolveMediaPolicy({options:updatedOptions});
      if (snapshot.tasks.some(t => t.interrupts.length)) {
        const kind=(snapshot.tasks.flatMap(t=>t.interrupts)[0]?.value as any)?.kind;
        const decision = args['--decision'];
        const needsDecision=!kind||kind==='IMAGE_HUMAN_REVIEW'||kind==='VISUAL_PROMPTS_HUMAN_REVIEW'||kind==='KLING_BUDGET'||kind==='AUTHORED_MOTION_REVIEW';
        const validDecisions=kind==='VISUAL_PROMPTS_HUMAN_REVIEW'?['proceed','abort','retry']:kind==='AUTHORED_MOTION_REVIEW'?['retry','abort']:['proceed','abort'];
        const effectiveDecision=decision??(kind==='AUTHORED_MOTION_REVIEW'?'retry':undefined);
        if (needsDecision && !validDecisions.includes(String(effectiveDecision))) throw new Error(`Resume deste gate requer --decision ${validDecisions.join('|')}`);
        // Keep the suspended budget predicate stable: only its resumed decision
        // may apply a larger allowance. updateState would discard the interrupt.
        const resumeOptions=updatedOptions&&kind==='KLING_BUDGET'?{...updatedOptions,graph:{...updatedOptions.graph,maxGenerations:snapshot.values.options.graph.maxGenerations}}:updatedOptions;
        input = new Command({ ...(resumeOptions?{update:{options:resumeOptions}}:{}), resume: needsDecision ? { decision: effectiveDecision, ...(kind==='KLING_BUDGET'?{limit:Number(args['--max-generations']??snapshot.values.options.graph.maxGenerations)}:{}) } : { resumed:true } });
      } else if (args['--decision']) {
        throw new Error('Nenhum gate aguarda decisão');
      } else if (updatedOptions) {
        // Apply option changes at stream start so the current checkpoint's
        // pending node is preserved. Calling updateState without a node here
        // can advance a stale review checkpoint directly to its successor.
        input = new Command({ update: { options: updatedOptions } });
      }
    }
    snapshot = await executeProduction(graph, REPO_ROOT, episodeId, input);
    const executedThisCommand=[...new Set(readHistory(REPO_ROOT,episodeId).slice(historyOffset).map((event:any)=>event.node).filter(Boolean))];
    console.log(JSON.stringify({ thread_id: config.configurable.thread_id, productionStatus: snapshot.values.productionStatus, executedThisCommand, progress:deriveProgress(REPO_ROOT,episodeId,snapshot.values,snapshot.next,snapshot.tasks.flatMap(t=>t.interrupts.map(i=>i.value))).percent, next: snapshot.next, interrupts: snapshot.tasks.flatMap(t => t.interrupts), kling:{plannedTakes:snapshot.values.videoTakes?.length??0,approvedLimit:snapshot.values.options?.graph.maxGenerations??0}, generationCount:snapshot.values.generationCount??0, finalVideo: snapshot.values.finalVideo }, null, 2));
    if (snapshot.tasks.some(t => t.interrupts.length)) return 2;
    if (until && snapshot.next.length) return 3;
    return snapshot.values.productionStatus === 'COMPLETED' ? 0 : 1;
  } finally {
    await closeAssetServer(); saver.db.close();
    if (lock) fs.unlinkSync(lock);
  }
}
if (require.main === module) main().then(code => { process.exitCode = code; }).catch(e => { console.error(e instanceof Error ? e.stack : e); process.exitCode = 1; });
