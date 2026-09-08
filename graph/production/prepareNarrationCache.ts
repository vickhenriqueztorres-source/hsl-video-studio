import path from 'node:path';
import { REPO_ROOT } from '../checkpointer';
import { HslLongFormProjectPlan } from '../../hsl/core/types';
import { readJson } from './runtime';
import { initialState, State, threadId } from './state';
import { realDependencies } from './deps';
import { narration } from './nodes/narration';

// Reexecuta o mesmo nó transacional usado pelo LangGraph. O utilitário não cria
// um cache paralelo: recibo, hash do texto, nivelamento e QA continuam obrigatórios.
async function main() {
  const episodeId = process.argv[2] || 'HSL_EPISODE_011';
  threadId(episodeId);
  const planPath = path.join(REPO_ROOT, 'runs', episodeId, 'scene-plan.json');
  const plan = readJson<HslLongFormProjectPlan>(planPath);
  if (!plan?.beats?.length) throw new Error('NARRATION_SCENE_PLAN_REQUIRED');
  const state = {
    ...initialState({ episodeId, targetMinutes: plan.targetMinutes }),
    episodeId,
    scenePlan: plan,
    scenePlanPath: planPath
  } as State;
  const update = await narration({ root: REPO_ROOT, deps: realDependencies(REPO_ROOT) })(state, {} as any);
  console.log(JSON.stringify(update.narration, null, 2));
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
