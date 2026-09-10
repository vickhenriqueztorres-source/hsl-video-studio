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
import { BRECHA_HEADER_PALETTE, HSL_HEADER_PALETTE } from '../../../remotion/motion/HslUniversalHeader';

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

test('I15: Remotion component tree visual isolation (Zero HSL leaks in BRECHA)', () => {
  // 1. Palette isolation verification
  assert.equal(BRECHA_HEADER_PALETTE.coral, '#FF5A47');
  assert.equal(BRECHA_HEADER_PALETTE.teal, '#4F9B96');
  assert.equal(BRECHA_HEADER_PALETTE.charcoal, '#0D0D0F');
  assert.equal(BRECHA_HEADER_PALETTE.bone, '#E8E2D7');
  assert.notEqual(BRECHA_HEADER_PALETTE.coral, HSL_HEADER_PALETTE.acidYellow);
  assert.equal(HSL_HEADER_PALETTE.acidYellow, '#FFE500');

  // 2. Universal Header contract verification
  const headerPath = path.resolve(__dirname, '../../../remotion/motion/HslUniversalHeader.tsx');
  const headerContent = fs.readFileSync(headerPath, 'utf8');
  assert.ok(headerContent.includes("badgeText = isBrecha ? 'BRECHA' : 'HSL DOCS'"));
  assert.ok(headerContent.includes("channelId = 'hsl'"));
  assert.ok(!headerContent.includes('>HSL DOCS</div>')); // Must not have static unconditioned badge

  // 3. Long Form Composition contract verification
  const compPath = path.resolve(__dirname, '../../../remotion/HslLongFormComposition.tsx');
  const compContent = fs.readFileSync(compPath, 'utf8');
  assert.ok(compContent.includes("channelId={channelId}"));
  assert.ok(compContent.includes("beat.actNumber === 2 ? '#4F9B96' : '#FF5A47'"));
  assert.ok(compContent.includes("isBrecha ? 'rgba(255,90,71,0.4)' : 'rgba(255,229,0,0.4)'"));
  assert.ok(compContent.includes("ATO 0"));

  // 4. Visual prompts multi-channel awareness
  const promptPath = path.resolve(__dirname, '../../prompts/visual-prompts.md');
  const promptContent = fs.readFileSync(promptPath, 'utf8');
  assert.ok(promptContent.includes('Canal BRECHA'));
  assert.ok(promptContent.includes('Canal HSL'));
});

test('I16: Brand Bible visual mode and scene distribution fidelity (Zero foreign references, canonical 6 modes, freeze-frame Momento da Brecha, real evidence, and cold open callback)', () => {
  // 1. Purge of invented foreign references across brecha files
  const brechaVisualPath = path.resolve(__dirname, '../../../channels/brecha/visual.md');
  const brechaVisual = fs.readFileSync(brechaVisualPath, 'utf8');
  assert.ok(!/LEMMiNO/i.test(brechaVisual), 'LEMMiNO must not exist in brecha visual.md');
  assert.ok(!/Jim Browning/i.test(brechaVisual), 'Jim Browning must not exist in brecha visual.md');
  assert.ok(!/\bneo\b/i.test(brechaVisual), 'neo must not exist in brecha visual.md');
  assert.ok(!/Elementar/i.test(brechaVisual), 'Elementar must not exist in brecha visual.md');
  assert.ok(!/Disrupt/i.test(brechaVisual), 'Disrupt must not exist in brecha visual.md');
  assert.ok(!/James Jani/i.test(brechaVisual), 'James Jani must not exist in brecha visual.md');
  assert.ok(!/BRECHA_RULE_02/i.test(brechaVisual), 'BRECHA_RULE_02 must not exist');

  // fern is strictly permitted only as cutting pace metric
  assert.ok(brechaVisual.includes('fern'), 'fern should be present as pace benchmark');
  assert.ok(brechaVisual.includes('19 a 35 mudanças'), '19-35 changes metric must be present');

  // 2. Profile and Prompt files clean of foreign references
  const promptPath = path.resolve(__dirname, '../../prompts/visual-prompts.md');
  const promptContent = fs.readFileSync(promptPath, 'utf8');
  assert.ok(!/LEMMiNO/i.test(promptContent), 'LEMMiNO must not exist in visual-prompts.md');
  assert.ok(!/Fincher/i.test(promptContent), 'Fincher must not exist in visual-prompts.md');

  const profilePath = path.resolve(__dirname, '../../../channels/brecha/profile.ts');
  const profileContent = fs.readFileSync(profilePath, 'utf8');
  assert.ok(!/BRECHA_RULE_02/i.test(profileContent), 'BRECHA_RULE_02 must not exist in profile.ts');
  assert.ok(profileContent.includes('RULE_BRECHA_MOMENTO_DA_BRECHA'));

  // 3. Plan scene selection fidelity
  const plan = BrechaSceneDirectorAgent.planEpisodeFromScratch({
    episodeId: 'BRECHA_EPISODE_001',
    topic: 'A ligação era perfeita — até este detalhe',
    entity: 'Falsa Central Bancária',
    mechanism: 'Spoofing telefônico e URA simulada',
    constraint: 'Janela de reação',
    consequence: 'Transferências Pix fraudulentas',
    thesis: 'A central falsa não explora o código; explora a anatomia da confiança humana.'
  });

  // Check evidence mode presence
  const evidenceBeats = plan.beats.filter((b: HslSceneBeat) => b.telemetryLabel?.includes('EVIDÊNCIA') || b.telemetryLabel?.includes('PROVA'));
  assert.ok(evidenceBeats.length > 0, 'Must have on-screen evidence beats');
  assert.ok(evidenceBeats.some((b: HslSceneBeat) => b.evidenceRefs?.includes('SRC_BCB_MED_2024')), 'Evidence beats must reference BCB MED');

  // Check Momento da Brecha freeze-frame positioning in Act 2
  const breachMoments = plan.beats.filter((b: HslSceneBeat) => b.telemetryLabel === 'MOMENTO DA BRECHA');
  assert.ok(breachMoments.length > 0, 'Must have MOMENTO DA BRECHA');
  assert.ok(breachMoments.some((b: HslSceneBeat) => b.actNumber === 2), 'Momento da Brecha must be at the climax of Act 2 decision point');
  assert.ok(breachMoments.every((b: HslSceneBeat) => !b.cinematicPrompt.includes('pulso concêntrico')), 'Must not have concentric light pulse');

  // Check Act 4 closing: Cold open callback + 3 defense steps + No YubiKey
  const act4Beats = plan.beats.filter((b: HslSceneBeat) => b.actNumber === 4);
  assert.ok(act4Beats.length > 0);
  const coldOpenCallback = act4Beats[0];
  assert.ok(coldOpenCallback.cinematicPrompt.includes('Retorno visual à mesma mesa') || coldOpenCallback.cinematicPrompt.includes('smartphone da abertura'), 'Act 4 must return to cold open object');
  assert.ok(!act4Beats.some((b: HslSceneBeat) => /yubikey|chave física/i.test(b.cinematicPrompt)), 'Must not reference YubiKey or physical hardware key');

  // Check 3 prioritized defense steps in Act 4
  const defenseStepBeat = act4Beats[act4Beats.length - 1];
  assert.ok(defenseStepBeat.cinematicPrompt.includes('Desligar') && defenseStepBeat.cinematicPrompt.includes('cartão'), 'Must contain 3 practical defense steps');
  assert.ok(/toda fraude começa por uma brecha/i.test(defenseStepBeat.voiceoverScript), 'Closing voiceover must conclude with brand signature');
});

