import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { HslArtifactRegistry } from '../registry/hslArtifactRegistry';
import { HslRunIdentity } from '../hsl/core/hslRunIdentity';
import { HslRunDerivator } from '../hsl/core/hslRunDerivator';
import { HslCleaner } from '../hsl/core/hslCleaner';

async function runRegistryAndDerivationTests() {
  console.log('🧪 [TEST SUITE] Registry, Identidade Hierárquica e Derivação de Runs');
  const root = process.cwd();
  const registry = new HslArtifactRegistry(root);

  // Reindexa inicialmente
  registry.rebuildFromDisk();

  // ---------------------------------------------------------------------------
  // Teste 1 & 2: Listagem e Resolução de Handle com Metadados
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 1 & 2: Listando runs e resolvendo handle exato...');
  const artifacts = registry.listArtifacts({ project: 'hsl' });
  assert(artifacts.length > 0, 'Deveria encontrar artefatos do projeto hsl');

  const masterArtifact = registry.resolve('hsl-ep001-v1-master');
  assert.strictEqual(masterArtifact.artifactType, 'master_video');
  assert.strictEqual(masterArtifact.project, 'hsl');
  assert.strictEqual(masterArtifact.episode, 'ep001');
  assert.strictEqual(masterArtifact.version, 1);
  assert(masterArtifact.sha256.startsWith('sha256_'), 'Deve conter hash SHA-256');
  assert(masterArtifact.mediaInfo !== undefined, 'Deve conter metadados ffprobe');
  assert.strictEqual(masterArtifact.mediaInfo?.durationSeconds, 600);
  console.log('    ✅ Handle resolvido com sucesso com metadados de ffprobe e SHA-256.');

  // ---------------------------------------------------------------------------
  // Teste 3: Handle Inexistente (Erro sem Palpite)
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 3: Testando handle inexistente...');
  assert.throws(
    () => registry.resolve('hsl-ep999-v1-unknown'),
    /HANDLE_NOT_FOUND/,
    'Deveria lançar erro explícito HANDLE_NOT_FOUND'
  );
  console.log('    ✅ Rejeição correta com erro claro para handle inexistente.');

  // ---------------------------------------------------------------------------
  // Teste 4: Handle Ambíguo (Listagem de Candidatos sem Escolher)
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 4: Testando handle ambíguo...');
  assert.throws(
    () => registry.resolve('hsl-ep001'),
    /AMBIGUOUS_HANDLE_FATAL/,
    'Deveria rejeitar handle ambíguo com lista de candidatos'
  );
  console.log('    ✅ Bloqueio de heurística: ambiguidade gera erro fatal.');

  // ---------------------------------------------------------------------------
  // Teste 5: Derivação com Herança de Áudio e Integridade SHA-256
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 5: Testando derivação segura com herança de áudio...');
  const v2Dir = path.resolve(root, 'runs', 'hsl', 'ep001', 'v2');
  const v2Public = path.resolve(root, 'public', 'runs', 'hsl', 'ep001', 'v2');
  if (fs.existsSync(v2Dir)) fs.rmSync(v2Dir, { recursive: true, force: true });
  if (fs.existsSync(v2Public)) fs.rmSync(v2Public, { recursive: true, force: true });

  const derivation = HslRunDerivator.deriveWithInheritedAudio({
    sourceRunHandleOrId: 'hsl-ep001-v1-audio',
    newVersion: 2
  });

  assert.strictEqual(derivation.success, true);
  assert.strictEqual(derivation.sourceAudioSha256, derivation.targetAudioSha256, 'O hash SHA-256 do áudio deve ser byte-a-byte idêntico');
  assert.strictEqual(fs.readdirSync(path.resolve(v2Public, 'frames')).length, 0, 'Zero frames devem vazar da origem');
  console.log('    ✅ Derivação realizada com herança byte-a-byte íntegra e linhagem registrada.');

  // ---------------------------------------------------------------------------
  // Teste 6: Rejeição de Herança com Áudio Inválido/Corrompido
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 6: Tentativa de herdar áudio inexistente ou corrompido...');
  assert.throws(
    () => HslRunDerivator.deriveWithInheritedAudio({ sourceRunHandleOrId: 'hsl-ep999-v1-audio' }),
    /HANDLE_NOT_FOUND|DERIVATION_BLOCKED/
  );
  console.log('    ✅ Bloqueio correto de derivação com artefato ausente.');

  // ---------------------------------------------------------------------------
  // Teste 7: Rejeição de Derivação com Duração Incompatível
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 7: Derivação com plano de duração incompatível...');
  const v99Dir = path.resolve(root, 'runs', 'hsl', 'ep001', 'v99');
  fs.mkdirSync(v99Dir, { recursive: true });
  const shortAudioPath = path.resolve(v99Dir, 'narration.mp3');
  // Copia o áudio existente ou cria com ffmpeg
  const child_process = require('child_process');
  child_process.spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', '60', '-q:a', '9', '-acodec', 'libmp3lame', shortAudioPath]);

  registry.registerRun('hsl/ep001/v99');

  assert.throws(
    () => HslRunDerivator.deriveWithInheritedAudio({ sourceRunHandleOrId: 'hsl-ep001-v99-audio', newVersion: 100 }),
    /DERIVATION_DURATION_MISMATCH_FATAL/,
    'Deveria reprovar derivação com duração divergente'
  );
  console.log('    ✅ Bloqueio correto de derivação quando a duração do áudio diverge do plano.');
  if (fs.existsSync(v99Dir)) fs.rmSync(v99Dir, { recursive: true, force: true });

  // ---------------------------------------------------------------------------
  // Teste 8: Imutabilidade - Tentativa de Sobrescrever Run Existente
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 8: Imutabilidade - Proibido sobrescrever versão existente...');
  assert.throws(
    () => HslRunDerivator.deriveWithInheritedAudio({ sourceRunHandleOrId: 'hsl-ep001-v1-audio', newVersion: 2 }),
    /IMMUTABILITY_VIOLATION_FATAL/,
    'Deveria impedir sobrescrita de run v2 existente'
  );
  console.log('    ✅ Imutabilidade garantida: reexecução na mesma versão é bloqueada.');

  // ---------------------------------------------------------------------------
  // Teste 9: Isolamento Multiprojeto (Anti-Cruzamento)
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 9: Isolamento de namespace entre projetos...');
  assert.throws(
    () => HslRunIdentity.assertProjectNamespace('subsea', 'hsl/ep001/v1'),
    /CROSS_PROJECT_VIOLATION_FATAL/,
    'Deveria impedir acesso a hsl dentro de subsea'
  );
  console.log('    ✅ Isolamento estrito entre projetos comprovado.');

  // ---------------------------------------------------------------------------
  // Teste 10: Reconstrução Total a Partir do Disco
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 10: Reconstrução do Registry a partir do disco...');
  const registryFile = path.resolve(root, 'registry', 'registry.json');
  const backupRegistry = fs.readFileSync(registryFile, 'utf8');

  fs.unlinkSync(registryFile); // Apaga o registro
  registry.rebuildFromDisk(); // Reconstrói do disco

  const restored = registry.listArtifacts({ project: 'hsl' });
  assert(restored.length > 0, 'Deveria reconstruir os artefatos a partir do disco');
  console.log('    ✅ Catálogo reconstruído com sucesso do filesystem.');

  // ---------------------------------------------------------------------------
  // Teste 11: Limpeza Segura de Intermediários
  // ---------------------------------------------------------------------------
  console.log('  ▶ Teste 11: Limpeza de intermediários...');
  const dummyFrame = path.resolve(v2Public, 'frames', 'DUMMY_FRAME.png');
  fs.writeFileSync(dummyFrame, Buffer.from('dummy frame content'));

  // 11.a: Bloqueio em run incompleta
  assert.throws(
    () => HslCleaner.cleanIntermediates('hsl/ep001/v2'),
    /CLEANUP_BLOCKED_FATAL/,
    'Deveria bloquear limpeza em run não completada'
  );
  console.log('    ✅ Bloqueio correto de limpeza em run incompleta.');

  // 11.b: Conclui a run e executa limpeza
  const { HslRunManifest } = require('../hsl/core/hslRunManifest');
  const v2Manifest = new HslRunManifest('hsl/ep001/v2', root);
  v2Manifest.completeRun();

  const cleanup = HslCleaner.cleanIntermediates('hsl/ep001/v2');
  assert(cleanup.deletedFilesCount >= 1, 'Deveria remover o dummy frame');
  assert(fs.existsSync(path.resolve(v2Dir, 'narration.mp3')), 'Narração DEVE ser preservada');
  console.log('    ✅ Limpeza segura comprovada (entregáveis preservados, intermediários removidos).');

  // Limpeza de testes
  if (fs.existsSync(v2Dir)) fs.rmSync(v2Dir, { recursive: true, force: true });
  if (fs.existsSync(v2Public)) fs.rmSync(v2Public, { recursive: true, force: true });

  console.log('\n🎉 TODOS OS TESTES DE REGISTRY, IDENTIDADE E DERIVAÇÃO PASSARAM COM SUCESSO!');
}

runRegistryAndDerivationTests().catch(err => {
  console.error('REGISTRY_TEST_FATAL_ERROR:', err);
  process.exit(1);
});
