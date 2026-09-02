import fs from 'fs';
import path from 'path';
import {SceneAnalyzer} from './analyzer/scene-analyzer';
import {SoundDesignPlanner} from './planner/sound-design-planner';
import {RemotionAudioRenderer} from './renderer/remotion-audio-renderer';
import {AudioPlan} from './types/audio-plan.types';
import {VideoAnalysisInput} from './types/scene-analysis.types';

export * from './types/audio-plan.types';
export * from './types/scene-analysis.types';
export * from './analyzer/scene-analyzer';
export * from './analyzer/voice-processor';
export * from './planner/sound-design-planner';
export * from './planner/layer-optimizer';
export * from './selector/sfx-selector';
export * from './selector/music-selector';
export * from './renderer/remotion-audio-renderer';
export * from './renderer/audio-processor';
export * from './rag/rag-client';
export * from './rag/query-builder';

export class SoundDesignAgent {
  private readonly analyzer: SceneAnalyzer;
  private readonly planner: SoundDesignPlanner;
  private readonly renderer: RemotionAudioRenderer;

  constructor(baseDir = process.cwd()) {
    this.analyzer = new SceneAnalyzer();
    this.planner = new SoundDesignPlanner(baseDir);
    this.renderer = new RemotionAudioRenderer();
  }

  public generatePlan(input: VideoAnalysisInput): AudioPlan {
    const scenes = this.analyzer.analyze(input);
    return this.planner.plan(input, scenes);
  }

  public renderPlanToTsx(plan: AudioPlan): string {
    return this.renderer.renderToTsx(plan);
  }

  public runFullPipeline(input: VideoAnalysisInput, outputTsxPath?: string, outputPlanPath?: string): {
    plan: AudioPlan;
    tsxCode: string;
  } {
    const plan = this.generatePlan(input);
    const tsxCode = this.renderPlanToTsx(plan);

    if (outputPlanPath) {
      fs.mkdirSync(path.dirname(outputPlanPath), {recursive: true});
      fs.writeFileSync(outputPlanPath, JSON.stringify(plan, null, 2), 'utf8');
      console.log(`[Sound Agent] AudioPlan salvo em: ${outputPlanPath}`);
    }

    if (outputTsxPath) {
      this.renderer.exportToFile(plan, outputTsxPath);
    }

    return {plan, tsxCode};
  }
}

// CLI Runner
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const agent = new SoundDesignAgent();

  if (command === 'plan') {
    const videoIdx = args.indexOf('--video');
    const outIdx = args.indexOf('--output');
    const videoPath = videoIdx !== -1 ? args[videoIdx + 1] : 'examples/video-analysis-sample.json';
    const outPath = outIdx !== -1 ? args[outIdx + 1] : 'examples/audio-plan-sample.json';

    const inputData = JSON.parse(fs.readFileSync(videoPath, 'utf8'));
    const plan = agent.generatePlan(inputData);
    fs.mkdirSync(path.dirname(outPath), {recursive: true});
    fs.writeFileSync(outPath, JSON.stringify(plan, null, 2), 'utf8');
    console.log(`✅ [Plan] Gerado com sucesso: ${outPath}`);
  } else if (command === 'render') {
    const planIdx = args.indexOf('--plan');
    const outIdx = args.indexOf('--output');
    const planPath = planIdx !== -1 ? args[planIdx + 1] : 'examples/audio-plan-sample.json';
    const outPath = outIdx !== -1 ? args[outIdx + 1] : 'examples/video-audio-sample.tsx';

    const planData = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    agent.renderPlanToTsx(planData);
    agent.runFullPipeline(planData as any, outPath);
    console.log(`✅ [Render] Código Remotion gerado: ${outPath}`);
  } else if (command === 'full') {
    const videoIdx = args.indexOf('--video');
    const outIdx = args.indexOf('--output');
    const videoPath = videoIdx !== -1 ? args[videoIdx + 1] : 'examples/video-analysis-sample.json';
    const outPath = outIdx !== -1 ? args[outIdx + 1] : 'examples/video-audio-sample.tsx';
    const planPath = outPath.replace(/\.tsx$/, '.json');

    const inputData = JSON.parse(fs.readFileSync(videoPath, 'utf8'));
    agent.runFullPipeline(inputData, outPath, planPath);
    console.log(`✅ [Full Pipeline] Concluído com sucesso!`);
  } else {
    console.log(`Uso do Sound Design Agent:`);
    console.log(`  npx ts-node sound-agent/index.ts plan --video video.json --output audio-plan.json`);
    console.log(`  npx ts-node sound-agent/index.ts render --plan audio-plan.json --output video-audio.tsx`);
    console.log(`  npx ts-node sound-agent/index.ts full --video video.json --output video-audio.tsx`);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('SOUND_AGENT_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
