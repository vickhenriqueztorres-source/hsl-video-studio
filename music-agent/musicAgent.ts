import fs from 'fs';
import os from 'os';
import path from 'path';
import {DIRECT_MUSIC_TRACKS, MusicTrackSource} from './musicCatalog';
import {MusicDownloader} from './musicDownloader';
import {normalizeMusicTrack} from './musicProcessor';
import {MusicCatalogManifest, MusicOrganizer, OrganizedMusicTrack} from './musicOrganizer';
import {generateCinematicMusicPresets, synthesizeMusicPreset} from './musicSynthesizer';

export interface MusicAgentConfig {
  readonly targetDirectory?: string;
  readonly directTracks?: readonly MusicTrackSource[];
}

export interface MusicAgentRunResult {
  readonly status: 'MUSIC_AGENT_SUCCESS' | 'MUSIC_AGENT_PARTIAL';
  readonly targetDirectory: string;
  readonly totalTracksCollected: number;
  readonly manifestPath: string;
  readonly manifest: MusicCatalogManifest;
}

export class MusicAgent {
  private readonly targetDir: string;
  private readonly downloader: MusicDownloader;
  private readonly organizer: MusicOrganizer;

  constructor(config?: MusicAgentConfig) {
    this.targetDir = path.resolve(config?.targetDirectory || path.join(process.cwd(), 'public', 'audio', 'music'));
    this.downloader = new MusicDownloader();
    this.organizer = new MusicOrganizer(this.targetDir);
  }

  public async run(customTracks?: readonly MusicTrackSource[]): Promise<MusicAgentRunResult> {
    const tracksToDownload = customTracks || DIRECT_MUSIC_TRACKS;
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hsl-music-agent-'));
    const organizedTracks: OrganizedMusicTrack[] = [];

    console.log('\n=======================================================');
    console.log('🎼 MUSIC AGENT: INICIANDO CONSTRUÇÃO DO BANCO MUSICAL');
    console.log('=======================================================');
    console.log(`📁 Diretório de destino: ${this.targetDir}`);
    console.log(`🎵 Músicas externas a baixar: ${tracksToDownload.length}`);
    console.log('🎻 Presets de estúdio cinematográfico a sintetizar: 100\n');

    try {
      // 1. Download e normalização das faixas externas
      for (const track of tracksToDownload) {
        try {
          const tempDownloadPath = path.join(tempRoot, `${track.id}.mp3`);
          await this.downloader.downloadTrack(track, tempDownloadPath);

          const categorySubdir = track.mood === 'epic' ? 'cinematic/epic'
            : track.mood === 'suspense' ? 'cinematic/suspense'
            : track.mood === 'emotional' ? 'cinematic/emotional'
            : track.mood === 'ambient' ? 'cinematic/ambient'
            : 'cinematic/action';

          const categoryDir = path.join(this.targetDir, ...categorySubdir.split('/'));
          fs.mkdirSync(categoryDir, {recursive: true});

          const canonicalFilename = `${track.mood}_${track.id.replace(/^incompetech-/, '').replace(/-/g, '_')}.mp3`;
          const finalPath = path.join(categoryDir, canonicalFilename);

          const meta = normalizeMusicTrack(tempDownloadPath, finalPath);
          const relPath = path.relative(this.targetDir, finalPath).replace(/\\/g, '/');

          const organizedItem: OrganizedMusicTrack = {
            title: track.title,
            canonicalName: canonicalFilename,
            category: categorySubdir,
            mood: track.mood,
            artist: track.artist,
            license: track.license,
            licenseUrl: track.licenseUrl,
            attributionRequired: track.attributionRequired,
            attributionText: track.attributionText,
            localPath: relPath,
            fullPath: finalPath,
            sha256: meta.sha256,
            sampleRate: meta.sampleRate,
            bitDepth: meta.bitDepth,
            channels: meta.channels,
            durationSeconds: meta.durationSeconds
          };

          if (this.organizer.registerTrack(organizedItem)) {
            organizedTracks.push(organizedItem);
          }
        } catch (err) {
          console.warn(`⚠️ [Download Track: ${track.title}] Falha:`, err instanceof Error ? err.message : String(err));
        }
      }

      // 2. Síntese de 100 trilhas sonoras completas em 48kHz Stereo WAV
      console.log('\n--- [Síntese Cinematográfica HSL: 100 Composições de Estúdio 48kHz] ---');
      const synthPresets = generateCinematicMusicPresets();

      for (const preset of synthPresets) {
        try {
          const synthResult = synthesizeMusicPreset(preset, this.targetDir);
          const organizedItem: OrganizedMusicTrack = {
            title: preset.title,
            canonicalName: preset.canonicalName,
            category: preset.category,
            mood: preset.mood,
            artist: 'HSL Studio Soundscapes',
            license: 'CC0-1.0 (Public Domain)',
            licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
            attributionRequired: false,
            attributionText: 'HSL Studio Soundscapes (Public Domain / CC0)',
            localPath: synthResult.localPath,
            fullPath: synthResult.fullPath,
            sha256: synthResult.sha256,
            sampleRate: synthResult.sampleRate,
            bitDepth: synthResult.bitDepth,
            channels: synthResult.channels,
            durationSeconds: synthResult.durationSeconds
          };

          if (this.organizer.registerTrack(organizedItem)) {
            organizedTracks.push(organizedItem);
          }
        } catch (err) {
          console.warn(`⚠️ [Synth Track: ${preset.canonicalName}] Falha:`, err instanceof Error ? err.message : String(err));
        }
      }

      console.log(`✅ ${synthPresets.length} composições musicais de estúdio sintetizadas e organizadas.`);

      const manifest = this.organizer.generateManifest(organizedTracks);
      const manifestPath = path.join(this.targetDir, 'music-catalog-manifest.json');

      console.log('\n=======================================================');
      console.log('🏁 MUSIC AGENT: BANCO DE MÚSICA CINEMATOGRÁFICA CONCLUÍDO!');
      console.log('=======================================================');
      console.log(`🎵 Total de Trilhas Disponíveis: ${organizedTracks.length}`);
      console.log(`📁 Local: ${this.targetDir}`);
      console.log('📊 Contagem por Mood:');
      for (const [mood, count] of Object.entries(manifest.mood_counts)) {
        console.log(`   - ${mood.toUpperCase().padEnd(15)}: ${count} faixas`);
      }
      console.log('=======================================================\n');

      return {
        status: organizedTracks.length >= 100 ? 'MUSIC_AGENT_SUCCESS' : 'MUSIC_AGENT_PARTIAL',
        targetDirectory: this.targetDir,
        totalTracksCollected: organizedTracks.length,
        manifestPath,
        manifest
      };
    } finally {
      fs.rmSync(tempRoot, {recursive: true, force: true});
    }
  }
}
