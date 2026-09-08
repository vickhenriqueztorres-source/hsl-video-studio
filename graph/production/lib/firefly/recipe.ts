import type {State,VideoTake} from '../../state';
import {assertMediaPlan} from '../mediaPlan';
import {digest,hashFile} from './ledger';

export function takeRecipe(s:State,t:Pick<VideoTake,'beatId'|'takeIndex'|'dependsOnTake'>):string {
  const media=assertMediaPlan(s),p=s.visualPrompts.find(p=>p.beatId===t.beatId);
  const image=[...s.frames].reverse().find(f=>f.beatId===t.beatId&&f.status!=='failed');
  if(!p||!image)throw new Error(`FIREFLY_RECIPE_INPUT_MISSING:${t.beatId}`);
  return digest({plan:media.hash,beat:t.beatId,take:t.takeIndex,prompt:p.videoPrompt,rootImage:hashFile(image.path),profile:['Kling 2.5 Turbo',5,1920,1080,false],predecessor:t.dependsOnTake});
}
