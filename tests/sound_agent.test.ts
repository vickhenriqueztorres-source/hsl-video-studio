import fs from 'fs';
import path from 'path';
import {SoundDesignAgent} from '../sound-agent/index';
import {VideoAnalysisInput} from '../sound-agent/types/scene-analysis.types';

function runSoundAgentTests(): void {
  console.log('[TEST] Iniciando validação completa do Sound Design Agent...');

  const root = process.cwd();
  const sampleVideoPath = path.resolve(root, 'examples', 'video-analysis-sample.json');

  if (!fs.existsSync(sampleVideoPath)) {
    throw new Error(`Arquivo de exemplo não encontrado: ${sampleVideoPath}`);
  }

  const sampleVideo: VideoAnalysisInput = JSON.parse(fs.readFileSync(sampleVideoPath, 'utf8'));

  const agent = new SoundDesignAgent(root);

  // 1. Testar geração de plano
  const plan = agent.generatePlan(sampleVideo);

  if (plan.version !== '1.0.0' || !plan.scenes || plan.scenes.length === 0) {
    throw new Error('Plano de áudio inválido gerado pelo SoundDesignPlanner');
  }

  console.log(`[PASS] AudioPlan gerado com ${plan.scenes.length} cenas planejadas.`);

  // 2. Validar que todos os arquivos de áudio existem fisicamente
  for (const scene of plan.scenes) {
    if (scene.music) {
      const musicPath = path.resolve(root, 'public', 'audio', 'music', scene.music.file.replace(/^public\/audio\/music\//, '').replace(/^audio\/music\//, ''));
      if (!fs.existsSync(musicPath)) {
        throw new Error(`Arquivo de música não encontrado no disco: ${musicPath} (referenciado em ${scene.sceneId})`);
      }
    }

    for (const layer of scene.layers) {
      const sfxPath = path.resolve(root, 'public', 'audio', 'sfx', layer.file.replace(/^public\/audio\/sfx\//, '').replace(/^audio\/sfx\//, ''));
      if (!fs.existsSync(sfxPath)) {
        throw new Error(`Arquivo de SFX não encontrado no disco: ${sfxPath} (layer ${layer.layerId})`);
      }

      // 3. Validar faixas de volume seguro (-45dB a -6dB)
      if (layer.volumeDb < -45 || layer.volumeDb > -6) {
        throw new Error(`Volume inseguro detectado na layer ${layer.layerId}: ${layer.volumeDb}dB (deve estar entre -45 e -6 dB)`);
      }
    }

    // 4. Validar que o Master Limiter está habilitado
    if (!scene.mixing.masterLimiter.enabled || scene.mixing.masterLimiter.ceilingDb > 0) {
      throw new Error(`Master Limiter ausente ou com teto inseguro na cena ${scene.sceneId}`);
    }

    // 5. Validar prioridade de voz e ducking
    if (scene.hasVoice) {
      if (!scene.voiceTreatment || scene.voiceTreatment.targetDb !== -12) {
        throw new Error(`Voz não configurada com targetDb de -12dB na cena ${scene.sceneId}`);
      }
      if (scene.music && !scene.music.ducking?.enabled) {
        throw new Error(`Ducking de música não ativado em cena com voz na cena ${scene.sceneId}`);
      }
    }

    // 6. Validar transições (calçamento triplo)
    if (scene.transitions) {
      for (const tr of scene.transitions) {
        if (tr.method === 'triple_calcar') {
          if (!tr.supportTrack || !tr.riserTrack || !tr.anchorTrack) {
            throw new Error(`Transição triple_calcar incompleta na cena ${scene.sceneId}`);
          }
        }
      }
    }
  }

  console.log('[PASS] Todos os arquivos físicos de áudio validados e regras de mixagem conferidas!');

  // 7. Testar renderização de código Remotion TSX
  const tsxCode = agent.renderPlanToTsx(plan);

  if (!tsxCode.includes('export const RemotionCinematicAudioBed') || !tsxCode.includes('<Sequence') || !tsxCode.includes('<Audio')) {
    throw new Error('Código Remotion gerado incompleto ou com sintaxe inválida');
  }

  // 8. Salvar artefatos de exemplo
  const samplePlanPath = path.resolve(root, 'examples', 'audio-plan-sample.json');
  const sampleTsxPath = path.resolve(root, 'examples', 'video-audio-sample.tsx');
  fs.writeFileSync(samplePlanPath, JSON.stringify(plan, null, 2), 'utf8');
  fs.writeFileSync(sampleTsxPath, tsxCode, 'utf8');

  console.log('[PASS] Exemplos exportados com sucesso em examples/');
  console.log(JSON.stringify({
    status: 'SOUND_AGENT_TESTS_PASS',
    videoId: plan.videoId,
    scenesCount: plan.scenes.length,
    totalLayers: plan.scenes.reduce((acc, s) => acc + s.layers.length, 0),
    masterLimiterCeiling: plan.scenes[0].mixing.masterLimiter.ceilingDb
  }, null, 2));
}

runSoundAgentTests();
