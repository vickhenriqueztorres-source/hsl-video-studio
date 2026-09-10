import assert from 'node:assert/strict';
import test from 'node:test';
import { calibratePlanToNarration, countWords, normalizePlanDuration } from '../graph/production/lib/plan';
import { prepareMotionNarration, sha256Text } from '../graph/motion-audio';
import type { HslLongFormProjectPlan } from '../hsl/core/types';

test('Pacing: countWords accurately measures voiceover script length', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   '), 0);
  assert.equal(countWords('Quando o telefone toca e o identificador mostra o nome do seu banco'), 13);
});

test('Pacing: calibratePlanToNarration expands totalFrames to match 1.0x narration without compression', () => {
  const originalPlan: HslLongFormProjectPlan = {
    episodeId: 'BRECHA_TEST',
    episodeTitle: 'Golpe da Falsa Central',
    subtitle: 'Vozes Sinteticas',
    totalDurationSeconds: 60,
    totalFrames: 1800,
    totalBeatsCount: 2,
    targetMinutes: 1,
    thesis: 'A engenharia social manipula a autoridade percebida.',
    acts: [
      { actNumber: 1, title: 'Superficie', durationSeconds: 60, beatsCount: 2 }
    ],
    beats: [
      {
        beatId: 'SCENE_001',
        actNumber: 1,
        actTitle: 'Superficie',
        stage: 'ACT_1',
        durationSeconds: 10,
        durationFrames: 300,
        visualMode: 'generated_image_35mm',
        shotSize: 'CLOSE',
        cameraMovement: 'CAMERA_DRIFT',
        pacingType: 'PUNCH_HOOK',
        narrativeRole: 'CORE_THESIS',
        cinematicPrompt: 'Cozinha com telefone',
        voiceoverScript: 'Quando o telefone toca e o identificador mostra o nome do seu banco o cerebro assume imediatamente que a autoridade da instituicao esta do outro lado da linha.', // 27 words
      },
      {
        beatId: 'SCENE_002',
        actNumber: 1,
        actTitle: 'Superficie',
        stage: 'ACT_1',
        durationSeconds: 50,
        durationFrames: 1500,
        visualMode: 'generated_image_35mm',
        shotSize: 'WIDE',
        cameraMovement: 'SLOW_DOLLY_IN',
        pacingType: 'MODULAR_NARRATIVE',
        narrativeRole: 'CORE_THESIS',
        cinematicPrompt: 'Bancada vazia',
        voiceoverScript: 'A voz tem tom profissional.', // 5 words
      }
    ]
  };

  const calibrated = calibratePlanToNarration(originalPlan, 100);

  assert.equal(calibrated.totalDurationSeconds, 100);
  assert.equal(calibrated.totalFrames, 3000); // 100s * 30fps

  const beat1 = calibrated.beats[0];
  const beat2 = calibrated.beats[1];

  assert.ok(beat1.durationFrames > beat2.durationFrames, 'Beat com 27 palavras deve ter mais tempo que beat com 5 palavras');
  assert.ok(beat1.durationSeconds >= 80, `Beat 1 esperado >= 80s, obtido ${beat1.durationSeconds}s`);
  assert.ok(beat2.durationSeconds <= 20, `Beat 2 esperado <= 20s, obtido ${beat2.durationSeconds}s`);
});

test('Pacing: normalizePlanDuration weights beat frame allocations by word count', () => {
  const sourcePlan: HslLongFormProjectPlan = {
    episodeId: 'BRECHA_TEST',
    episodeTitle: 'Pacing',
    subtitle: 'WPM',
    totalDurationSeconds: 120,
    totalFrames: 3600,
    totalBeatsCount: 4,
    targetMinutes: 2,
    thesis: 'Pacing teste',
    acts: [
      { actNumber: 1, title: 'Ato 1', durationSeconds: 60, beatsCount: 2 },
      { actNumber: 2, title: 'Ato 2', durationSeconds: 60, beatsCount: 2 }
    ],
    beats: [
      {
        beatId: 'SCENE_001',
        actNumber: 1,
        actTitle: 'Ato 1',
        stage: 'ACT_1',
        durationSeconds: 30,
        durationFrames: 900,
        visualMode: 'generated_image_35mm',
        shotSize: 'CLOSE',
        cameraMovement: 'CAMERA_DRIFT',
        pacingType: 'PUNCH_HOOK',
        narrativeRole: 'CORE_THESIS',
        cinematicPrompt: 'prompt',
        voiceoverScript: 'Um dois tres quatro cinco seis sete oito nove dez.', // 10 palavras
      },
      {
        beatId: 'SCENE_002',
        actNumber: 1,
        actTitle: 'Ato 1',
        stage: 'ACT_1',
        durationSeconds: 30,
        durationFrames: 900,
        visualMode: 'generated_image_35mm',
        shotSize: 'WIDE',
        cameraMovement: 'CAMERA_DRIFT',
        pacingType: 'MODULAR_NARRATIVE',
        narrativeRole: 'CORE_THESIS',
        cinematicPrompt: 'prompt',
        voiceoverScript: 'Quando a voz humana perde seu status de prova biologica de identidade qualquer protocolo de confianca desaba completamente sem qualquer aviso previo.', // 20 palavras
      },
      {
        beatId: 'SCENE_003',
        actNumber: 2,
        actTitle: 'Ato 2',
        stage: 'ACT_2',
        durationSeconds: 30,
        durationFrames: 900,
        visualMode: 'generated_image_35mm',
        shotSize: 'CLOSE',
        cameraMovement: 'CAMERA_DRIFT',
        pacingType: 'PUNCH_HOOK',
        narrativeRole: 'CORE_THESIS',
        cinematicPrompt: 'prompt',
        voiceoverScript: 'Texto curto.',
      },
      {
        beatId: 'SCENE_004',
        actNumber: 2,
        actTitle: 'Ato 2',
        stage: 'ACT_2',
        durationSeconds: 30,
        durationFrames: 900,
        visualMode: 'generated_image_35mm',
        shotSize: 'WIDE',
        cameraMovement: 'CAMERA_DRIFT',
        pacingType: 'MODULAR_NARRATIVE',
        narrativeRole: 'CORE_THESIS',
        cinematicPrompt: 'prompt',
        voiceoverScript: 'Mais duas.', // 2 palavras
      }
    ]
  };

  const normalized = normalizePlanDuration(sourcePlan, 1); // normaliza para 1 minuto (1800 frames)
  assert.equal(normalized.totalFrames, 1800);
  assert.ok(normalized.beats.length >= 2, 'Deve reter ao menos 2 beats');
  // O beat com 10 palavras deve ter consideravelmente mais frames que o beat com menos palavras
  assert.ok(normalized.beats[0].durationFrames > normalized.beats[1].durationFrames);
});

test('Pacing: prepareMotionNarration rejects 1.72x speedup with MOTION_AUDIO_TEMPO_EXCESSIVE', async () => {
  const SCRIPT = 'A central falsa fala com tranquilidade.';
  const mockDeps: any = {
    probeAudio: async () => ({ hasAudio: true, durationSeconds: 103.3 }),
    hashFile: async () => sha256Text('audio'),
    synchronizer: {
      synchronize: async () => { throw new Error('Unreachable: must be rejected before synchronizer'); }
    },
    aligner: {
      align: async () => ({ evidence: 'forced_alignment', provider: 'test', model: 'v1', audioSha256: 'x', scriptSha256: 'y', words: [] })
    },
    nowIso: () => '2026-09-10T12:00:00.000Z'
  };

  await assert.rejects(
    () => prepareMotionNarration({
      script: SCRIPT,
      sourceAudioPath: 'source.wav',
      synchronizedAudioPath: 'locked.wav',
      targetDurationSeconds: 60, // 103.3 / 60 = 1.72x (proibido!)
      intervals: [{ intervalId: 'ep', startMs: 0, endMs: 60000 }],
      phrases: []
    }, mockDeps),
    (err: any) => err.code === 'MOTION_AUDIO_TEMPO_EXCESSIVE'
  );
});
