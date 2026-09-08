import fs from 'fs';
import path from 'path';
import {createHash} from 'crypto';
import {ChatGptImageAdapter, ChatGptImageRequest} from '../../adapters/chatgptImageAdapter';
import {formatCinematic35mmPrompt} from './photographicPrompt';
export {formatCinematic35mmPrompt} from './photographicPrompt';

export interface ChatGptGeneratedFrame {
  readonly shot_id: string;
  readonly scene_id: string;
  readonly status: 'GENERATED';
  readonly sha256: string;
  readonly prompt_sha256: string;
}

export interface ChatGptShotPlanItem {
  readonly shot_id: string;
  readonly parent_scene_id: string;
  readonly start_frame_prompt?: string | null;
  readonly motion_prompt?: string | null;
  readonly variant?: string;
}

export interface ChatGptStartFrameRunConfig {
  readonly episodeId: string;
  readonly shotPlanItems: readonly ChatGptShotPlanItem[];
  readonly outputDirectory: string;
  readonly customBotDir?: string;
  readonly autoRunBot?: boolean;
}

export interface ChatGptStartFrameRunResult {
  readonly status: 'CHATGPT_START_FRAMES_READY' | 'CHATGPT_START_FRAMES_PARTIAL';
  readonly manifestPath: string;
  readonly totalShots: number;
  readonly generatedShots: number;
  readonly items: readonly ChatGptGeneratedFrame[];
}

export class ChatGptStartFrameRuntime {
  private readonly adapter: ChatGptImageAdapter;

  constructor(customBotDir?: string) {
    this.adapter = new ChatGptImageAdapter(customBotDir);
  }

  public run(config: ChatGptStartFrameRunConfig): ChatGptStartFrameRunResult {
    const outputRoot = path.resolve(config.outputDirectory);
    const startFramesDir = path.join(outputRoot, 'start-frames');
    fs.mkdirSync(startFramesDir, {recursive: true});

    const requests: ChatGptImageRequest[] = [];
    const shotMap = new Map<string, ChatGptShotPlanItem>();

    for (const item of config.shotPlanItems) {
      const rawPrompt = item.start_frame_prompt || item.motion_prompt || item.shot_id;
      const formattedPrompt = formatCinematic35mmPrompt(rawPrompt);
      const targetPath = path.join(startFramesDir, `${item.shot_id}.png`);

      requests.push({
        id: item.shot_id,
        prompt: formattedPrompt,
        targetPath
      });
      shotMap.set(item.shot_id, item);
    }

    const batchResult = this.adapter.processRequests(requests, config.autoRunBot !== false);

    const generatedItems: ChatGptGeneratedFrame[] = [];
    let generatedCount = 0;

    for (const resItem of batchResult.items) {
      const shotItem = shotMap.get(resItem.id);
      if (resItem.status === 'SUCCESS' && resItem.sha256) {
        generatedCount += 1;
        generatedItems.push({
          shot_id: resItem.id,
          scene_id: shotItem?.parent_scene_id || resItem.id,
          status: 'GENERATED',
          sha256: resItem.sha256,
          prompt_sha256: createHash('sha256').update(resItem.prompt).digest('hex')
        });
      }
    }

    const complete = requests.length > 0 && generatedCount === requests.length;
    const manifest = {
      episode_id: config.episodeId,
      status: complete ? 'PENDING_REVIEW' : generatedCount ? 'PARTIAL' : 'GENERATION_FAILED',
      total_requested: requests.length,
      total_generated: generatedCount,
      visual_identity_contract_version: 'hsl.visual-identity.v1',
      start_frame_provenance_sha256: createHash('sha256').update(JSON.stringify(generatedItems)).digest('hex'),
      items: generatedItems
    };

    // Generation is not approval. Preserve any separately recorded human review.
    const manifestPath = path.join(outputRoot, 'start-frame-generation.json');
    fs.mkdirSync(path.dirname(manifestPath), {recursive: true});
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    return {
      status: complete ? 'CHATGPT_START_FRAMES_READY' : 'CHATGPT_START_FRAMES_PARTIAL',
      manifestPath,
      totalShots: config.shotPlanItems.length,
      generatedShots: generatedCount,
      items: generatedItems
    };
  }
}
