import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SceneAudioMixer } from '../graph/audio/sceneAudioMixer';
import { SoundDesignAgent } from '../sound-agent/index';
import type { VideoAnalysisInput } from '../sound-agent/types/scene-analysis.types';

async function runSceneAudioMixerTests(): Promise<void> {
  console.log('[TEST] Iniciando teste do SceneAudioMixer (Ambiência e SFX por cena)...');

  const root = process.cwd();
  const testDir = path.join(root, 'runs', '.audio-mixer-test');
  fs.mkdirSync(testDir, { recursive: true });

  const agent = new SoundDesignAgent(root);

  // Cenário de teste: 3 cenas com diferentes ambientes técnicos
  const testInput: VideoAnalysisInput = {
    videoId: 'SCENE_MIXER_TEST',
    totalFrames: 900, // 30 segundos a 30fps
    fps: 30,
    globalMood: 'suspense',
    scenes: [
      {
        sceneId: 'SCENE_01_DATACENTER',
        startFrame: 0,
        endFrame: 300, // 10 segundos
        detectedMood: 'suspense',
        detectedEnvironment: 'datacenter_chiller_plant',
        visualCues: [
          { frame: 30, type: 'action', description: 'valve turn', soundNeeded: 'valve_turn' }
        ],
        audioCues: [
          { frame: 0, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }
        ],
        recommendedLayers: ['ambience', 'foley']
      },
      {
        sceneId: 'SCENE_02_SUBSTATION',
        startFrame: 300,
        endFrame: 600, // 10 segundos
        detectedMood: 'dark',
        detectedEnvironment: 'high_voltage_substation',
        visualCues: [
          { frame: 450, type: 'climax', description: 'bottleneck alert', soundNeeded: 'subtle_strike_impact' }
        ],
        audioCues: [
          { frame: 300, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }
        ],
        recommendedLayers: ['ambience', 'foley', 'tension_riser', 'impact']
      },
      {
        sceneId: 'SCENE_03_CONTROL_ROOM',
        startFrame: 600,
        endFrame: 900, // 10 segundos
        detectedMood: 'calm',
        detectedEnvironment: 'control_room_telemetry',
        visualCues: [
          { frame: 630, type: 'action', description: 'airflow', soundNeeded: 'airflow_whoosh' }
        ],
        audioCues: [
          { frame: 600, type: 'voice', hasVoice: true, voiceType: 'narration', targetDb: -12 }
        ],
        recommendedLayers: ['ambience', 'foley']
      }
    ]
  };

  const plan = agent.generatePlan(testInput);
  assert.equal(plan.scenes.length, 3, 'Deve planejar 3 cenas');

  console.log(`[PASS] AudioPlan gerado com ${plan.scenes.length} cenas e ${plan.scenes.reduce((acc, s) => acc + s.layers.length, 0)} camadas.`);

  const outWav = path.join(testDir, 'sfx-track-test.wav');
  const mixer = new SceneAudioMixer(root);

  const result = mixer.mix(plan, outWav, 30.0);

  console.log(`[PASS] Mix concluído: ${result.totalCuesMixed} cues no total (${result.ambientLayersMixed} camas de fundo, ${result.pointSfxMixed} efeitos pontuais).`);

  assert.ok(fs.existsSync(outWav), 'O arquivo sfx-track-test.wav deve existir');
  assert.ok(fs.statSync(outWav).size > 100000, 'O arquivo deve ter tamanho representativo de áudio');
  assert.equal(result.qa.status, 'SFX_QA_PASS', 'QA deve aprovar a faixa com SFX_QA_PASS');
  assert.ok(Math.abs(result.durationSeconds - 30.0) <= 0.15, `Duração deve ser 30s (medido ${result.durationSeconds}s)`);
  assert.ok(result.ambientLayersMixed >= 3, 'Deve haver pelo menos uma camada de ambiência por cena');

  console.log('[PASS] Verificações de integridade estéreo 48kHz e duração validadas com sucesso!');
  console.log(JSON.stringify({
    status: 'SCENE_AUDIO_MIXER_TESTS_PASS',
    totalDuration: result.durationSeconds,
    ambientLayersMixed: result.ambientLayersMixed,
    pointSfxMixed: result.pointSfxMixed,
    totalCues: result.totalCuesMixed,
    qa: result.qa
  }, null, 2));

  // Limpar diretório temporário
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch {}
}

runSceneAudioMixerTests().catch(err => {
  console.error('SCENE_AUDIO_MIXER_TEST_FAILED:', err);
  process.exit(1);
});
