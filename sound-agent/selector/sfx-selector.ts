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
    keywords?: readonly string[];
    excludeUsed?: boolean;
  }): SfxCatalogEntry {
    const optCatLower = options.category.toLowerCase();
    const keywords = options.keywords ? options.keywords.map(k => k.toLowerCase()) : [];

    // Filter by category or keywords
    let matching = this.items.filter(item => {
      const catLower = item.category.toLowerCase();
      const nameLower = item.canonicalName.toLowerCase();

      const catMatches = catLower.includes(optCatLower) || optCatLower.includes(catLower);
      const keywordMatches = keywords.some(kw => catLower.includes(kw) || nameLower.includes(kw));

      return catMatches || keywordMatches;
    });

    if (matching.length === 0) {
      matching = this.items;
    }

    // Filter used files if requested to maximize variation
    const unused = matching.filter(c => !this.usedFiles.has(c.localPath));
    const pool = unused.length > 0 ? unused : matching;

    // Pick random candidate from pool to guarantee sonic variation
    const selected = pool[Math.floor(Math.random() * pool.length)] || {
      canonicalName: 'impact_strike_01.wav',
      category: 'cinematic/impacts',
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
