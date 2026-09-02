import fs from 'fs';
import path from 'path';
import {AudioMetadata, convertToBroadcastWav, probeAudio, sha256File} from './audioProcessor';
import {CategoryRule, SFX_CATEGORY_RULES, SfxSourcePack} from './sfxCatalog';

export interface OrganizedSfxItem {
  readonly canonicalName: string;
  readonly category: string;
  readonly originalFile: string;
  readonly packId: string;
  readonly provider: string;
  readonly license: string;
  readonly localPath: string;
  readonly fullPath: string;
  readonly sha256: string;
  readonly sampleRate: number;
  readonly bitDepth: number;
  readonly channels: number;
  readonly durationSeconds: number;
}

export interface SfxCatalogManifest {
  readonly schema: 'hsl.soundfx.master-catalog.v1';
  readonly schema_version: '1.0.0';
  readonly generated_at: string;
  readonly total_sfx_count: number;
  readonly categories_count: Record<string, number>;
  readonly providers: readonly string[];
  readonly items: readonly OrganizedSfxItem[];
}

export class SfxOrganizer {
  private readonly targetBaseDir: string;
  private readonly seenHashes = new Set<string>();
  private readonly categoryCounters: Record<string, number> = {};

  constructor(targetBaseDir: string) {
    this.targetBaseDir = path.resolve(targetBaseDir);
    fs.mkdirSync(this.targetBaseDir, {recursive: true});
  }

  private matchCategory(filename: string, defaultCategory: string): CategoryRule {
    const lower = filename.toLowerCase().replace(/[-_]/g, ' ');

    for (const rule of SFX_CATEGORY_RULES) {
      for (const kw of rule.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          return rule;
        }
      }
    }

    // Default category fallback match
    const fallbackRule = SFX_CATEGORY_RULES.find(r => r.targetSubdir === defaultCategory);
    if (fallbackRule) return fallbackRule;

    return SFX_CATEGORY_RULES[0]; // fallback to first rule
  }

  public organizeExtractedFolder(
    extractedDir: string,
    pack: SfxSourcePack
  ): OrganizedSfxItem[] {
    const items: OrganizedSfxItem[] = [];
    const files = this.scanAudioFiles(extractedDir);

    console.log(`[SFX Organizer] Processando ${files.length} arquivos de áudio do pack ${pack.name}...`);

    for (const file of files) {
      try {
        const baseName = path.basename(file);
        const rule = this.matchCategory(baseName, pack.defaultCategory);
        const categoryDir = path.join(this.targetBaseDir, ...rule.targetSubdir.split('/'));
        fs.mkdirSync(categoryDir, {recursive: true});

        // Initialize category index counter
        if (!this.categoryCounters[rule.targetSubdir]) {
          this.categoryCounters[rule.targetSubdir] = 0;
        }
        this.categoryCounters[rule.targetSubdir] += 1;
        const index = this.categoryCounters[rule.targetSubdir];

        const canonicalName = `${rule.prefix}_${index.toString().padStart(2, '0')}.wav`;
        const finalPath = path.join(categoryDir, canonicalName);

        // Transcode and normalize to 24-bit 48kHz WAV
        const meta = convertToBroadcastWav(file, finalPath);

        // Deduplication check by audio content SHA-256
        if (this.seenHashes.has(meta.sha256)) {
          // Remover duplicata física
          if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
          this.categoryCounters[rule.targetSubdir] -= 1;
          continue;
        }
        this.seenHashes.add(meta.sha256);

        const relPath = path.relative(this.targetBaseDir, finalPath).replace(/\\/g, '/');

        items.push({
          canonicalName,
          category: rule.targetSubdir,
          originalFile: path.basename(file),
          packId: pack.id,
          provider: pack.provider,
          license: pack.license,
          localPath: relPath,
          fullPath: finalPath,
          sha256: meta.sha256,
          sampleRate: meta.sampleRate,
          bitDepth: meta.bitDepth,
          channels: meta.channels,
          durationSeconds: meta.durationSeconds
        });
      } catch (err) {
        console.warn(`[SFX Organizer] Erro ao processar arquivo ${file}:`, err instanceof Error ? err.message : String(err));
      }
    }

    return items;
  }

  private scanAudioFiles(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir, {withFileTypes: true});
    for (const entry of list) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.scanAudioFiles(full));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.wav', '.ogg', '.mp3', '.flac', '.aif', '.aiff'].includes(ext)) {
          results.push(full);
        }
      }
    }
    return results;
  }

  public generateManifest(items: readonly OrganizedSfxItem[]): SfxCatalogManifest {
    const categoryCounts: Record<string, number> = {};
    const providers = new Set<string>();

    for (const item of items) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      providers.add(item.provider);
    }

    const manifest: SfxCatalogManifest = {
      schema: 'hsl.soundfx.master-catalog.v1',
      schema_version: '1.0.0',
      generated_at: new Date().toISOString(),
      total_sfx_count: items.length,
      categories_count: categoryCounts,
      providers: Array.from(providers),
      items
    };

    const manifestPath = path.join(this.targetBaseDir, 'sfx-catalog-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`[SFX Organizer] Manifesto mestre salvo em: ${manifestPath}`);

    return manifest;
  }
}
