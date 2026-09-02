import fs from 'fs';
import path from 'path';
import {SceneMood} from '../types/scene-analysis.types';

export interface MusicCatalogEntry {
  readonly title: string;
  readonly canonicalName: string;
  readonly category: string;
  readonly mood: string;
  readonly localPath: string;
  readonly fullPath: string;
  readonly durationSeconds: number;
}

export class MusicSelector {
  private readonly rootDir: string;
  private tracks: MusicCatalogEntry[] = [];

  constructor(baseDir = process.cwd()) {
    this.rootDir = path.resolve(baseDir);
    this.loadCatalog();
  }

  private loadCatalog(): void {
    const manifestPath = path.join(this.rootDir, 'public', 'audio', 'music', 'music-catalog-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      this.tracks = data.tracks || [];
    }
  }

  public selectByMood(mood: SceneMood): MusicCatalogEntry {
    const normalizedMood = mood === 'calm' ? 'ambient'
      : mood === 'dark' || mood === 'dramatic' ? 'suspense'
      : mood;

    const matching = this.tracks.filter(t => t.mood === normalizedMood);
    if (matching.length > 0) {
      return matching[0];
    }

    // Fallback to first track or dummy fallback
    return this.tracks[0] || {
      title: 'Cinematic Atmosphere Theme',
      canonicalName: 'epic_orchestra_01.wav',
      category: 'cinematic/epic',
      mood: 'epic',
      localPath: 'cinematic/epic/epic_orchestra_01.wav',
      fullPath: path.join(this.rootDir, 'public', 'audio', 'music', 'cinematic', 'epic', 'epic_orchestra_01.wav'),
      durationSeconds: 120
    };
  }
}
