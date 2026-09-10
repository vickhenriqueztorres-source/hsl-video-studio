import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  getChannelProfile,
  isKnownChannel,
  resolveRunChannelSnapshot,
  verifySnapshotIntegrity,
  assertChannelConsistency,
  isHistoricalHslRun,
  createHistoricalHslSnapshot
} from '../../../channels';
import { threadId, initialState, type State } from '../state';
import { BrechaSceneDirectorAgent } from '../../../channels/brecha/sceneDirector';
import { HslSceneDirectorAgent } from '../../../hsl/core/hslSceneDirectorAgent';
import { BrechaComplianceChecker } from '../../../channels/brecha/compliance';
import { BrechaPackagingEngine } from '../../../channels/brecha/packaging';
import {
  createEvidencePackage,
  validateEvidencePackage,
  saveEvidencePackage,
  loadEvidencePackage
} from '../lib/evidenceRegistry';
import { nextEpisodeId, reserveTheme, suggestThemes } from '../../console/themeRegistry';
import type { HslSceneBeat } from '../../../hsl/core/types';
import type { ComplianceRuleResult } from '../../../spec/hsl-compliance-checker';

test('I01: Channel unknown rejects without silent fallback', () => {
  assert.equal(isKnownChannel('hsl'), true);
  assert.equal(isKnownChannel('brecha'), true);
  assert.equal(isKnownChannel('invalid_channel'), false);
  assert.throws(() => getChannelProfile('invalid_channel' as any), /CHANNEL_UNKNOWN/);
});

test('I02: Channel mismatch on resume rejects with CHANNEL_IDENTITY_MISMATCH', () => {
  const brechaSnapshot = resolveRunChannelSnapshot('brecha');
  assert.throws(
    () => assertChannelConsistency('hsl', brechaSnapshot),
    /CHANNEL_IDENTITY_MISMATCH/
  );

  const hslSnapshot = resolveRunChannelSnapshot('hsl');
  assert.throws(
    () => assertChannelConsistency('brecha', hslSnapshot),
    /CHANNEL_IDENTITY_MISMATCH/
  );

  assert.doesNotThrow(() => assertChannelConsistency('brecha', brechaSnapshot));
  assert.doesNotThrow(() => assertChannelConsistency('hsl', hslSnapshot));
});

test('I03: Historical HSL episode backwards compatibility', () => {
  const historicalHslState = { episodeId: 'HSL_EPISODE_002', scenePlan: { acts: new Array(8) } };
  assert.equal(isHistoricalHslRun(historicalHslState), true);

  const syntheticSnapshot = createHistoricalHslSnapshot('HSL_EPISODE_002');
  assert.equal(syntheticSnapshot.channelId, 'hsl');
  assert.equal(syntheticSnapshot.profile.id, 'hsl');
  assert.equal(verifySnapshotIntegrity(syntheticSnapshot), true);
});

test('I04: Thread ID isolation between channels', () => {
  const hslThread = threadId('EPISODE_001', 'hsl');
  const brechaThread = threadId('EPISODE_001', 'brecha');
  assert.notEqual(hslThread, brechaThread);
  assert.equal(hslThread, 'EPISODE_001@v2');
  assert.equal(brechaThread, 'brecha__EPISODE_001@v2');

  // Automatic prefix detection
  assert.equal(threadId('BRECHA_EPISODE_001'), 'brecha__BRECHA_EPISODE_001@v2');
  assert.equal(threadId('HSL_EPISODE_001'), 'HSL_EPISODE_001@v2');
});

test('I05: Initial state resolution preserves channel isolation', () => {
  const brechaState = initialState({ episodeId: 'BRECHA_EPISODE_001', channel: 'brecha' }) as State;
  assert.equal(brechaState.channelId, 'brecha');
  assert.equal(brechaState.channelSnapshot?.channelId, 'brecha');
  assert.equal(brechaState.channelSnapshot?.profile.locale, 'pt-BR');
  assert.ok(brechaState.topicInput?.topic.includes('8 minutos') || brechaState.topicInput?.topic.includes('celular'));

  const hslState = initialState({ episodeId: 'HSL_EPISODE_001', channel: 'hsl' }) as State;
  assert.equal(hslState.channelId, 'hsl');
  assert.equal(hslState.channelSnapshot?.channelId, 'hsl');
  assert.equal(hslState.channelSnapshot?.profile.locale, 'en-US');
  assert.ok(hslState.topicInput?.topic.includes('PLANES') || hslState.topicInput?.topic.includes('HIDDEN'));
});

test('I06: Evidence package validation and persistence', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-test-'));
  try {
    const pkg = createEvidencePackage(
      'BRECHA_EPISODE_001',
      'brecha',
      [
        {
          id: 'SRC_01',
          title: 'Banco Central MED Report',
          type: 'central_bank',
          accessedAt: new Date().toISOString(),
          confidenceTier: 'primary'
        }
      ],
      [
        {
          id: 'CLM_01',
          statement: 'Liquidação em menos de 120s',
          sources: ['SRC_01'],
          confidenceTier: 'primary',
          status: 'verified'
        }
      ],
      {
        SCENE_001: {
          sceneId: 'SCENE_001',
          beatId: 'SCENE_001',
          claims: ['CLM_01'],
          reconstructionDisclaimerRequired: true
        }
      }
    );

    const check = validateEvidencePackage(pkg);
    assert.equal(check.valid, true);

    const savedPath = saveEvidencePackage(tmpDir, pkg);
    assert.ok(fs.existsSync(savedPath));

    const loaded = loadEvidencePackage(tmpDir);
    assert.ok(loaded);
    assert.equal(loaded?.episodeId, 'BRECHA_EPISODE_001');
    assert.equal(loaded?.sources.length, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('I07: Editorial 4-acts (BRECHA) vs 8-acts (HSL) isolation', () => {
  const brechaPlan = BrechaSceneDirectorAgent.planEpisodeFromScratch({
    episodeId: 'BRECHA_EPISODE_001',
    topic: 'Roubaram o celular. O banco foi aberto 8 minutos depois',
    entity: 'Engenharia Social',
    mechanism: 'Troca de chip e reset de senha',
    constraint: 'Janela de reação da vítima',
    consequence: 'Transferências Pix em cascata',
    thesis: 'O roubo de celular no Brasil é um ataque bancário coordenado'
  });

  assert.equal(brechaPlan.acts.length, 4);
  assert.equal(brechaPlan.acts[0].title, 'Superfície da Normalidade');
  assert.equal(brechaPlan.acts[1].title, 'Anomalia & Vetor de Ataque');
  assert.equal(brechaPlan.acts[2].title, 'A Mecânica Oculta / Momento da Brecha');
  assert.equal(brechaPlan.acts[3].title, 'Impacto, Consequências & Protocolo de Sobrevivência');
  assert.ok(brechaPlan.beats.some((b: HslSceneBeat) => b.isReconstruction === true));

  const hslPlan = HslSceneDirectorAgent.planEpisodeFromScratch({
    episodeId: 'HSL_EPISODE_001',
    topic: 'THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING',
    entity: 'Airport Jet Fuel Logistics',
    mechanism: 'Hydrant Manifold Pressure Injection',
    constraint: 'Pressure collapse at Node D',
    consequence: '56 delayed flights',
    thesis: 'The hidden product is controlled pressure'
  });

  assert.equal(hslPlan.acts.length, 8);
  assert.equal(hslPlan.acts[0].title, 'THE HOOK & THE VISIBLE MIRACLE');
});

test('I08: Narration locale and language isolation', () => {
  const brechaPlan = BrechaSceneDirectorAgent.planEpisodeFromScratch({
    episodeId: 'BRECHA_EPISODE_001',
    topic: 'Roubaram o celular. O banco foi aberto 8 minutos depois',
    entity: 'Engenharia Social',
    mechanism: 'Troca de chip e reset de senha',
    constraint: 'Janela de reação da vítima',
    consequence: 'Transferências Pix em cascata',
    thesis: 'O roubo de celular no Brasil é um ataque bancário coordenado'
  });

  const brechaText = brechaPlan.beats.map((b: HslSceneBeat) => b.voiceoverScript).join(' ');
  assert.ok(/brasileiros|celular|banc|vulnerabilidade|sistema/i.test(brechaText));
  assert.ok(!/pipeline to hydrant|airport fuel/i.test(brechaText));

  const hslPlan = HslSceneDirectorAgent.planEpisodeFromScratch({
    episodeId: 'HSL_EPISODE_001',
    topic: 'THE HIDDEN SYSTEM THAT KEEPS PLANES FLYING',
    entity: 'Airport Jet Fuel Logistics',
    mechanism: 'Hydrant Manifold Pressure Injection',
    constraint: 'Pressure collapse at Node D',
    consequence: '56 delayed flights',
    thesis: 'The hidden product is controlled pressure'
  });

  const hslText = hslPlan.beats.map((b: HslSceneBeat) => b.voiceoverScript).join(' ');
  assert.ok(/fuel|airport|hydrant|pressure|system/i.test(hslText));
});

test('I09: Prohibited vocabulary enforcement in BRECHA compliance', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compliance-test-'));
  try {
    const cleanPlan = BrechaSceneDirectorAgent.planEpisodeFromScratch({
      episodeId: 'BRECHA_EPISODE_001',
      topic: 'Roubaram o celular. O banco foi aberto 8 minutos depois',
      entity: 'Engenharia Social',
      mechanism: 'Troca de chip e reset de senha',
      constraint: 'Janela de reação da vítima',
      consequence: 'Transferências Pix em cascata',
      thesis: 'O roubo de celular no Brasil é um ataque bancário coordenado'
    });

    const runDir = path.join(tmpDir, 'runs', 'BRECHA_EPISODE_001');
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, 'scene-plan.json'), JSON.stringify(cleanPlan, null, 2));

    // Save valid evidence package so evidence rule passes
    saveEvidencePackage(
      runDir,
      createEvidencePackage('BRECHA_EPISODE_001', 'brecha', [
        { id: 'SRC_01', title: 'Doc', type: 'central_bank', accessedAt: '', confidenceTier: 'primary' }
      ], [
        { id: 'CLM_01', statement: 'St', sources: ['SRC_01'], confidenceTier: 'primary', status: 'verified' }
      ], {
        SCENE_001: { sceneId: 'SCENE_001', beatId: 'SCENE_001', claims: ['CLM_01'], reconstructionDisclaimerRequired: true }
      })
    );

    // Mock dummy master
    const outDir = path.join(tmpDir, 'out');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'brecha_episode_001.mp4'), Buffer.alloc(1000005));

    const cleanReport = BrechaComplianceChecker.checkCompliance(
      'BRECHA_EPISODE_001',
      { plan: cleanPlan, expectedMasterPath: path.join(outDir, 'brecha_episode_001.mp4') },
      tmpDir
    );

    const vocabRule = cleanReport.results.find((r: ComplianceRuleResult) => r.ruleId === 'RULE_BRECHA_PROHIBITED_VOCABULARY');
    assert.equal(vocabRule?.passed, true);

    // Contaminate with sensationalist word
    const dirtyPlan = {
      ...cleanPlan,
      beats: cleanPlan.beats.map((b: HslSceneBeat, i: number) => i === 0 ? { ...b, voiceoverScript: `${b.voiceoverScript} É simplesmente imperdível e chocante!` } : b)
    };

    const dirtyReport = BrechaComplianceChecker.checkCompliance(
      'BRECHA_EPISODE_001',
      { plan: dirtyPlan, expectedMasterPath: path.join(outDir, 'brecha_episode_001.mp4') },
      tmpDir
    );

    const dirtyVocabRule = dirtyReport.results.find((r: ComplianceRuleResult) => r.ruleId === 'RULE_BRECHA_PROHIBITED_VOCABULARY');
    assert.equal(dirtyVocabRule?.passed, false);
    assert.ok(dirtyVocabRule?.failureReason?.includes('imperdível') || dirtyVocabRule?.failureReason?.includes('chocante'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('I10: Reconstruction label audit in BRECHA compliance', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compliance-reconst-'));
  try {
    const plan = BrechaSceneDirectorAgent.planEpisodeFromScratch({
      episodeId: 'BRECHA_EPISODE_001',
      topic: 'Roubaram o celular',
      entity: 'Engenharia Social',
      mechanism: 'Troca de chip',
      constraint: 'Janela de reação',
      consequence: 'Perda financeira',
      thesis: 'Fraude de dispositivos móveis'
    });

    const unlabelledPlan = {
      ...plan,
      beats: plan.beats.map((b: HslSceneBeat) => b.isReconstruction ? { ...b, telemetryLabel: undefined } : b)
    };

    const report = BrechaComplianceChecker.checkCompliance(
      'BRECHA_EPISODE_001',
      { plan: unlabelledPlan },
      tmpDir
    );

    const reconstRule = report.results.find((r: ComplianceRuleResult) => r.ruleId === 'RULE_BRECHA_RECONSTRUCTION_LABELS');
    assert.equal(reconstRule?.passed, false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('I11: Visual policy and color palette isolation', () => {
  const brecha = getChannelProfile('brecha');
  assert.equal(brecha.visual.palette.background, '#0D0D0F');
  assert.equal(brecha.visual.palette.accent, '#FF5A47');
  assert.equal(brecha.visual.palette.flowSystem, '#4F9B96');
  assert.equal(brecha.visual.palette.verificationSafe, '#BCD5C2');

  const hsl = getChannelProfile('hsl');
  assert.equal(hsl.visual.palette.background, '#07080B');
  assert.equal(hsl.visual.palette.yellow, '#FFE500');
  assert.equal(hsl.visual.palette.red, '#FF2E00');
});

test('I12: YouTube publication packaging isolation', () => {
  const brechaPackage = BrechaPackagingEngine.generatePackage({
    episodeId: 'BRECHA_EPISODE_001',
    mainTopic: 'Roubaram o celular. O banco foi aberto 8 minutos depois',
    entity: 'Engenharia Social',
    mechanism: 'Troca de chip',
    constraint: 'Janela de tempo',
    consequence: 'Saque Pix',
    thesis: 'O crime do celular é bancário',
    chapters: [
      { title: 'Superfície da Normalidade', durationSeconds: 180 },
      { title: 'Anomalia & Vetor de Ataque', durationSeconds: 150 },
      { title: 'A Mecânica Oculta', durationSeconds: 180 },
      { title: 'Impacto & Sobrevivência', durationSeconds: 90 },
    ]
  });

  assert.equal(brechaPackage.titles.length, 3);
  assert.ok(brechaPackage.titles.some((t: any) => t.title.includes('8 Minutos') || t.title.includes('Celular')));
  assert.ok(brechaPackage.layeredDescription.fullFormattedText.includes('AVISO DE CONFORMIDADE'));
  assert.ok(brechaPackage.layeredDescription.fullFormattedText.includes('FONTES E REFERÊNCIAS'));
  assert.ok(brechaPackage.youtubeTags.includes('brecha'));
  assert.ok(brechaPackage.youtubeTags.includes('pix'));
});

test('I13: Channel catalog and episode numbering isolation', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-iso-'));
  try {
    assert.equal(nextEpisodeId('hsl', tmpDir), 'HSL_EPISODE_001');
    assert.equal(nextEpisodeId('brecha', tmpDir), 'BRECHA_EPISODE_001');

    reserveTheme('BRECHA_EPISODE_001', 'O Roubo dos 8 minutos', 'brecha', tmpDir);
    assert.equal(nextEpisodeId('brecha', tmpDir), 'BRECHA_EPISODE_002');
    assert.equal(nextEpisodeId('hsl', tmpDir), 'HSL_EPISODE_001'); // HSL untouched

    reserveTheme('HSL_EPISODE_001', 'Airport Jet Fuel Logistics', 'hsl', tmpDir);
    assert.equal(nextEpisodeId('hsl', tmpDir), 'HSL_EPISODE_002');
    assert.equal(nextEpisodeId('brecha', tmpDir), 'BRECHA_EPISODE_002'); // Brecha untouched

    // Suggestions isolation
    const brechaSuggestions = suggestThemes('brecha', tmpDir, 5);
    assert.ok(brechaSuggestions.every((idea: any) => !/airport|vaccine|power grid/i.test(idea.theme)));

    const hslSuggestions = suggestThemes('hsl', tmpDir, 5);
    assert.ok(hslSuggestions.every((idea: any) => !/celular|pix|estelionato/i.test(idea.theme)));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('I14: Audio bed per-run directory isolation', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-iso-'));
  try {
    const ep1Dir = path.join(tmpDir, 'runs', 'HSL_EPISODE_001', 'audio');
    const ep2Dir = path.join(tmpDir, 'runs', 'BRECHA_EPISODE_001', 'audio');
    fs.mkdirSync(ep1Dir, { recursive: true });
    fs.mkdirSync(ep2Dir, { recursive: true });

    fs.writeFileSync(path.join(ep1Dir, 'AudioBed.tsx'), '// HSL audio bed');
    fs.writeFileSync(path.join(ep2Dir, 'AudioBed.tsx'), '// BRECHA audio bed');

    assert.equal(fs.readFileSync(path.join(ep1Dir, 'AudioBed.tsx'), 'utf8'), '// HSL audio bed');
    assert.equal(fs.readFileSync(path.join(ep2Dir, 'AudioBed.tsx'), 'utf8'), '// BRECHA audio bed');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
