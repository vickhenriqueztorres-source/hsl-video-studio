import fs from 'fs';
import path from 'path';
import {SfxCatalogManifest} from '../sfx-agent/sfxOrganizer';

function runSfxAgentTests(): void {
  console.log('[TEST] Validando integridade do banco de SFX gerado pelo SFX Agent...');

  const manifestPath = path.resolve('public', 'audio', 'sfx', 'sfx-catalog-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifesto do banco de SFX não encontrado em: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as SfxCatalogManifest;

  if (manifest.schema !== 'hsl.soundfx.master-catalog.v1') {
    throw new Error(`Schema inválido no manifesto de SFX: ${manifest.schema}`);
  }

  if (manifest.total_sfx_count < 200) {
    throw new Error(`Quantidade de SFXs (${manifest.total_sfx_count}) abaixo da meta mínima de 200`);
  }

  const requiredCategories = [
    'cinematic/braams',
    'cinematic/booms',
    'cinematic/impacts',
    'cinematic/whooshes',
    'cinematic/tension',
    'cinematic/loops',
    'horror',
    'sci-fi',
    'ui',
    'foley/footsteps',
    'foley/doors',
    'foley/vehicles',
    'foley/household'
  ];

  for (const cat of requiredCategories) {
    const count = manifest.categories_count[cat] || 0;
    if (count === 0) {
      throw new Error(`Categoria obrigatória sem arquivos no banco de SFX: ${cat}`);
    }
  }

  // Verificar existência física de cada arquivo
  for (const item of manifest.items) {
    if (!fs.existsSync(item.fullPath)) {
      throw new Error(`Arquivo físico ausente: ${item.fullPath}`);
    }
    if (item.sampleRate < 44100) {
      throw new Error(`Taxa de amostragem inválida em ${item.canonicalName}: ${item.sampleRate}Hz`);
    }
    if (item.bitDepth < 16) {
      throw new Error(`Profundidade de bits inválida em ${item.canonicalName}: ${item.bitDepth}-bit`);
    }
  }

  console.log('[PASS] Banco de SFX validado com sucesso!');
  console.log(JSON.stringify({
    status: 'SFX_AGENT_TESTS_PASS',
    total_sfx: manifest.total_sfx_count,
    categories: Object.keys(manifest.categories_count).length
  }, null, 2));
}

runSfxAgentTests();
