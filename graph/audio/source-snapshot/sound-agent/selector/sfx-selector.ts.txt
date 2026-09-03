import fs from 'fs';
import path from 'path';
import {FrequencyRole} from '../types/audio-plan.types';

export interface SfxCatalogEntry {
  readonly canonicalName: string;
  readonly category: string;
  readonly localPath: string;
  readonly fullPath: string;
  readonly durationSeconds: number;
}

export class SfxSelector {
  private readonly rootDir: string;
  private items: SfxCatalogEntry[] = [];
  private usedFiles = new Set<string>();

  constructor(baseDir = process.cwd()) {
    this.rootDir = path.resolve(baseDir);
    this.loadCatalog();
  }

  private loadCatalog(): void {
    const manifestPath = path.join(this.rootDir, 'public', 'audio', 'sfx', 'sfx-catalog-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      this.items = data.items || [];
    }
  }

  public select(options: {
    category: string;
    preferredRole?: FrequencyRole;
    excludeUsed?: boolean;
  }): SfxCatalogEntry {
    const matching = this.items.filter(item => {
      const catLower = item.category.toLowerCase();
      const optCatLower = options.category.toLowerCase();
      return catLower.includes(optCatLower) || optCatLower.includes(catLower);
    });

    const candidates = matching.length > 0 ? matching : this.items;

    // Filter used if requested to avoid repetitive SFX
    const unused = candidates.filter(c => !this.usedFiles.has(c.localPath));
    const selected = (unused.length > 0 ? unused[0] : candidates[0]) || {
      canonicalName: 'fallback_sfx.wav',
      category: options.category,
      localPath: 'cinematic/impacts/impact_strike_01.wav',
      fullPath: path.join(this.rootDir, 'public', 'audio', 'sfx', 'cinematic', 'impacts', 'impact_strike_01.wav'),
      durationSeconds: 2.0
    };

    if (options.excludeUsed !== false) {
      this.usedFiles.add(selected.localPath);
    }

    return selected;
  }
}
