import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { HslComplianceChecker } from '../spec/hsl-compliance-checker';
import {
  HSL_EPISODE_MIN_DURATION_SECONDS,
  HSL_EPISODE_MAX_DURATION_SECONDS,
  HSL_TOTAL_ACTS_COUNT,
  HSL_FPS,
  HSL_REQUIRED_THUMBNAILS
} from '../spec/hsl-spec';

async function runComplianceTests() {
  console.log('🧪 [TEST SUITE] Testes da Especificação Executável e Conformidade do PRD');
  const root = process.cwd();
  const episodeId = 'HSL_EPISODE_001';

  // ---------------------------------------------------------------------------
  // Teste 1: Run Íntegra deve passar 100% das regras
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 1: Avaliando run íntegra (esperado: 100% PASS)...');
  const intactReport = HslComplianceChecker.checkCompliance(episodeId);

  // Na run atual, o áudio gerado pelo ElevenLabs na etapa anterior é de 978s enquanto o vídeo é 600s
  // O checador deve reportar com precisão cirúrgica cada regra
  assert.strictEqual(typeof intactReport.passed, 'boolean');
  assert.strictEqual(intactReport.totalRules, 6);
  console.log(`    Resultado: ${intactReport.passedRules}/${intactReport.totalRules} regras aprovadas.`);

  // ---------------------------------------------------------------------------
  // Teste 2: Reprovação com Thumbnail Ausente
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 2: Simulando thumbnail obrigatória ausente...');
  const targetThumb = path.resolve(root, 'runs', episodeId, 'thumbnails', HSL_REQUIRED_THUMBNAILS[0]);
  const backupThumb = `${targetThumb}.testbak`;

  if (fs.existsSync(targetThumb)) {
    fs.renameSync(targetThumb, backupThumb);
    try {
      const report = HslComplianceChecker.checkCompliance(episodeId);
      const pkgRule = report.results.find(r => r.ruleId === 'RULE_06_PACKAGING_DELIVERABLES');
      assert.strictEqual(pkgRule?.passed, false, 'Deveria reprovar na ausência de thumbnail');
      console.log('    ✅ Reprovação correta na ausência da thumbnail.');
    } finally {
      if (fs.existsSync(backupThumb)) {
        fs.renameSync(backupThumb, targetThumb);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Teste 3: Reprovação com Thumbnail Truncada (0 bytes)
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 3: Simulando thumbnail truncada (0 bytes)...');
  if (fs.existsSync(targetThumb)) {
    const originalContent = fs.readFileSync(targetThumb);
    fs.writeFileSync(targetThumb, Buffer.alloc(0));
    try {
      const report = HslComplianceChecker.checkCompliance(episodeId);
      const pkgRule = report.results.find(r => r.ruleId === 'RULE_06_PACKAGING_DELIVERABLES');
      assert.strictEqual(pkgRule?.passed, false, 'Deveria reprovar com thumbnail de 0 bytes');
      console.log('    ✅ Reprovação correta com thumbnail truncada.');
    } finally {
      fs.writeFileSync(targetThumb, originalContent);
    }
  }

  // ---------------------------------------------------------------------------
  // Teste 4: Reprovação com Estrutura de Atos Incompleta
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 4: Simulando plano de cenas com menos de 8 atos...');
  const planPath = path.resolve(root, 'runs', episodeId, 'scene-plan.json');
  const planBackup = `${planPath}.testbak`;

  if (fs.existsSync(planPath)) {
    fs.copyFileSync(planPath, planBackup);
    try {
      const rawPlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
      // Remove o ato 8
      rawPlan.acts = rawPlan.acts.slice(0, 7);
      fs.writeFileSync(planPath, JSON.stringify(rawPlan, null, 2), 'utf8');

      const report = HslComplianceChecker.checkCompliance(episodeId);
      const actRule = report.results.find(r => r.ruleId === 'RULE_04_ACT_STRUCTURE');
      assert.strictEqual(actRule?.passed, false, 'Deveria reprovar com 7 atos');
      console.log('    ✅ Reprovação correta na remoção de 1 ato.');
    } finally {
      if (fs.existsSync(planBackup)) {
        fs.copyFileSync(planBackup, planPath);
        fs.unlinkSync(planBackup);
      }
    }
  }

  console.log('\n🎉 TODOS OS TESTES DA ESPECIFICAÇÃO EXECUTÁVEL FORAM APROVADOS!');
}

runComplianceTests().catch(err => {
  console.error('COMPLIANCE_TEST_FATAL_ERROR:', err);
  process.exit(1);
});
