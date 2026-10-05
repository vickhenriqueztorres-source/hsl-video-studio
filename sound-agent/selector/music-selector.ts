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
    const candidatePaths = [
      path.join(this.rootDir, 'public', 'audio', 'music', 'music-catalog-manifest.json'),
      path.join(this.rootDir, 'assets', 'audio-library', 'music', 'music-catalog-manifest.json')
    ];
    for (const manifestPath of candidatePaths) {
      if (fs.existsSync(manifestPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          if (data.tracks && data.tracks.length > 0) {
            this.tracks = data.tracks;
            break;
          }
        } catch {}
      }
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

    if (this.tracks.length > 0) {
      return this.tracks[0];
    }

    // Fallback garantido para faixa de suspense real presente no repositório
    const existingMusic = path.join(this.rootDir, 'assets', 'audio-library', 'music', 'cinematic', 'suspense', 'suspense_oppressive_gloom.mp3');
    return {
      title: 'Cinematic Suspense Theme',
      canonicalName: 'suspense_oppressive_gloom.mp3',
      category: 'cinematic/suspense',
      mood: 'suspense',
      localPath: 'cinematic/suspense/suspense_oppressive_gloom.mp3',
      fullPath: existingMusic,
      durationSeconds: 180
    };
  }
}
