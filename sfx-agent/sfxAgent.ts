import fs from 'fs';
import os from 'os';
import path from 'path';
import {SFX_SOURCE_PACKS, SfxSourcePack} from './sfxCatalog';
import {SfxDownloader} from './sfxDownloader';
import {OrganizedSfxItem, SfxCatalogManifest, SfxOrganizer} from './sfxOrganizer';
import {CINEMATIC_SYNTH_PRESETS, synthesizePreset} from './sfxSynthesizer';

export interface SfxAgentConfig {
  readonly targetDirectory?: string;
  readonly packsToDownload?: readonly SfxSourcePack[];
  readonly minAudioCount?: number;
}

export interface SfxAgentRunResult {
  readonly status: 'SFX_AGENT_SUCCESS' | 'SFX_AGENT_PARTIAL';
  readonly targetDirectory: string;
  readonly totalSfxCollected: number;
  readonly manifestPath: string;
  readonly manifest: SfxCatalogManifest;
}

export class SfxAgent {
  private readonly targetDir: string;
  private readonly downloader: SfxDownloader;
  private readonly organizer: SfxOrganizer;

  constructor(config?: SfxAgentConfig) {
    this.targetDir = path.resolve(config?.targetDirectory || path.join(process.cwd(), 'public', 'audio', 'sfx'));
    this.downloader = new SfxDownloader();
    this.organizer = new SfxOrganizer(this.targetDir);
  }

  public async run(customPacks?: readonly SfxSourcePack[]): Promise<SfxAgentRunResult> {
    const packs = customPacks || SFX_SOURCE_PACKS;
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hsl-sfx-agent-'));
    const allOrganizedItems: OrganizedSfxItem[] = [];

    console.log('\n=======================================================');
    console.log('🎧 SFX AGENT: INICIANDO CONSTRUÇÃO DO BANCO DE ÁUDIO');
    console.log('=======================================================');
    console.log(`📁 Diretório de destino: ${this.targetDir}`);
    console.log(`📦 Total de pacotes a processar: ${packs.length}\n`);

    try {
      // 1. Download e organização de pacotes externos
      for (const pack of packs) {
        try {
          console.log(`\n--- [Pacote: ${pack.name}] ---`);
          const extractedPath = await this.downloader.fetchPack(pack, tempRoot);
          const packItems = this.organizer.organizeExtractedFolder(extractedPath, pack);
          allOrganizedItems.push(...packItems);
          console.log(`✅ [${pack.id}] ${packItems.length} SFXs convertidos e organizados.`);
        } catch (err) {
          console.warn(`⚠️ [${pack.id}] Falha ao processar pacote:`, err instanceof Error ? err.message : String(err));
        }
      }

      // 2. Geração e síntese estúdio de presets cinematográficos especializados
      console.log('\n--- [Síntese Cinematográfica HSL: Braams, Booms, Whooshes, Tension, Loops, Horror, Sci-Fi, Foley] ---');
      for (const preset of CINEMATIC_SYNTH_PRESETS) {
        try {
          const item = synthesizePreset(preset, this.targetDir);
          allOrganizedItems.push(item);
        } catch (err) {
          console.warn(`⚠️ [Synth: ${preset.canonicalName}] Falha:`, err instanceof Error ? err.message : String(err));
        }
      }
      console.log(`✅ ${CINEMATIC_SYNTH_PRESETS.length} presets de áudio cinematográfico sintetizados em 24-bit/48kHz.`);

      const manifest = this.organizer.generateManifest(allOrganizedItems);
      const manifestPath = path.join(this.targetDir, 'sfx-catalog-manifest.json');

      console.log('\n=======================================================');
      console.log('🏁 SFX AGENT: BANCO DE EFEITOS SONOROS CONCLUÍDO!');
      console.log('=======================================================');
      console.log(`🎵 Total de SFXs disponíveis: ${allOrganizedItems.length}`);
      console.log(`📁 Local: ${this.targetDir}`);
      console.log('📊 Contagem por categoria:');
      for (const [cat, count] of Object.entries(manifest.categories_count)) {
        console.log(`   - ${cat.padEnd(30)}: ${count} SFXs`);
      }
      console.log('=======================================================\n');

      return {
        status: allOrganizedItems.length >= 200 ? 'SFX_AGENT_SUCCESS' : 'SFX_AGENT_PARTIAL',
        targetDirectory: this.targetDir,
        totalSfxCollected: allOrganizedItems.length,
        manifestPath,
        manifest
      };
    } finally {
      fs.rmSync(tempRoot, {recursive: true, force: true});
    }
  }
}
