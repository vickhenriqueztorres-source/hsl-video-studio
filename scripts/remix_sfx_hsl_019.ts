import fs from 'node:fs';
import path from 'node:path';
import { soundDesignInput } from '../graph/production/lib/soundDesignInput';
import { SoundDesignAgent } from '../sound-agent';
import { SceneAudioMixer } from '../graph/audio/sceneAudioMixer';
import { createFfmpeg } from '../graph/production/lib/ffmpeg';
import { HSL_AUDIO_BITRATE } from '../spec/hsl-spec';
import { HslComplianceChecker } from '../spec/hsl-compliance-checker';

async function main() {
  const REPO_ROOT = path.resolve(__dirname, '..');
  const episodeId = 'HSL_EPISODE_019';
  const runDir = path.join(REPO_ROOT, 'runs', episodeId);
  const scenePlanPath = path.join(runDir, 'scene-plan.json');
  const scenePlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));

  console.log(`[Remix SFX] Gerando novo Sound Design sutil para ${episodeId}...`);

  const audioPlanPath = path.join(runDir, 'audio-plan.json');
  const runAudioTsx = path.join(runDir, 'audio', 'AudioBed.tsx');

  const input = soundDesignInput(episodeId, scenePlan);
  const agent = new SoundDesignAgent(REPO_ROOT);
  const { plan: newAudioPlan } = agent.runFullPipeline(input, runAudioTsx, audioPlanPath);

  console.log(`[Remix SFX] Novo AudioPlan gerado com ${newAudioPlan.scenes.length} cenas.`);

  const sfxTrackPath = path.join(runDir, 'audio', 'sfx-track.wav');
  const mixer = new SceneAudioMixer(REPO_ROOT);
  const mixResult = mixer.mix(newAudioPlan, sfxTrackPath, scenePlan.totalDurationSeconds);

  console.log(`[Remix SFX] sfx-track.wav mixado com sucesso:`);
  console.log(`  - Total cues mixed: ${mixResult.totalCuesMixed}`);
  console.log(`  - Ambient layers: ${mixResult.ambientLayersMixed}`);
  console.log(`  - Point SFX: ${mixResult.pointSfxMixed}`);
  console.log(`  - Duração: ${mixResult.durationSeconds}s`);

  const currentVideo = path.join(REPO_ROOT, 'out', 'hsl_episode_019.mp4');
  const tempVideo = path.join(REPO_ROOT, 'out', 'hsl_episode_019_remixed.mp4');
  const musicPath = path.join(REPO_ROOT, 'assets', 'audio-library', 'music', 'cinematic', 'suspense', 'suspense_oppressive_gloom.mp3');
  const narrationPath = path.join(runDir, 'audio', 'narration-master.wav');

  console.log(`[Remix SFX] Remuxando vídeo master com o novo SFX atenuado...`);
  const ffmpeg = createFfmpeg(REPO_ROOT);
  await ffmpeg.muxFinalWithSfx(currentVideo, musicPath, narrationPath, sfxTrackPath, tempVideo, HSL_AUDIO_BITRATE);

  if (!fs.existsSync(tempVideo) || fs.statSync(tempVideo).size === 0) {
    throw new Error('Falha no remux do vídeo master.');
  }

  console.log(`[Remix SFX] Substituindo vídeo master e atualizando entregáveis...`);
  fs.copyFileSync(tempVideo, currentVideo);
  fs.unlinkSync(tempVideo);

  const deliveryVideo = path.join(REPO_ROOT, 'deliveries', episodeId, 'video', 'hsl_episode_019.mp4');
  const runVideo = path.join(runDir, 'video', 'hsl_episode_019.mp4');

  fs.copyFileSync(currentVideo, deliveryVideo);
  fs.copyFileSync(currentVideo, runVideo);

  console.log(`[Remix SFX] Arquivos copiados:`);
  console.log(`  - ${currentVideo} (${(fs.statSync(currentVideo).size / (1024*1024)).toFixed(1)} MB)`);
  console.log(`  - ${deliveryVideo} (${(fs.statSync(deliveryVideo).size / (1024*1024)).toFixed(1)} MB)`);
  console.log(`  - ${runVideo} (${(fs.statSync(runVideo).size / (1024*1024)).toFixed(1)} MB)`);

  console.log(`[Remix SFX] Validando auditoria de conformidade...`);
  const report = HslComplianceChecker.checkCompliance(episodeId);
  HslComplianceChecker.printReportAndExit(report);
}

main().catch(err => {
  console.error('[Remix SFX] Erro:', err);
  process.exit(1);
});
