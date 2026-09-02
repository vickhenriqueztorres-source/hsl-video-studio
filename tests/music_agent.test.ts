import fs from 'fs';
import path from 'path';
import {MusicCatalogManifest} from '../music-agent/musicOrganizer';

function runMusicAgentTests(): void {
  console.log('[TEST] Validando integridade da biblioteca musical gerada pelo Music Agent...');

  const manifestPath = path.resolve('public', 'audio', 'music', 'music-catalog-manifest.json');
  const readmePath = path.resolve('public', 'audio', 'music', 'README.md');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifesto de música não encontrado em: ${manifestPath}`);
  }
  if (!fs.existsSync(readmePath)) {
    throw new Error(`README de música não encontrado em: ${readmePath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as MusicCatalogManifest;

  if (manifest.schema !== 'hsl.music.master-catalog.v1') {
    throw new Error(`Schema inválido no manifesto de música: ${manifest.schema}`);
  }

  if (manifest.total_tracks_count < 100) {
    throw new Error(`Quantidade de faixas (${manifest.total_tracks_count}) abaixo da meta de 100`);
  }

  const requiredMoods = ['epic', 'suspense', 'emotional', 'ambient', 'action'];

  for (const mood of requiredMoods) {
    const count = manifest.mood_counts[mood] || 0;
    if (count === 0) {
      throw new Error(`Categoria de mood vazia no catálogo: ${mood}`);
    }
  }

  // Verificar existência física de cada arquivo e qualidade
  for (const track of manifest.tracks) {
    if (!fs.existsSync(track.fullPath)) {
      throw new Error(`Arquivo físico de música ausente: ${track.fullPath}`);
    }
    if (track.sampleRate < 44100) {
      throw new Error(`Taxa de amostragem inválida na faixa ${track.canonicalName}: ${track.sampleRate}Hz`);
    }
    if (track.channels < 2) {
      throw new Error(`Faixa ${track.canonicalName} não é estéreo`);
    }
    if (track.durationSeconds < 10) {
      throw new Error(`Duração inválida na faixa ${track.canonicalName}: ${track.durationSeconds}s`);
    }
  }

  console.log('[PASS] Biblioteca de música cinematográfica validada com sucesso!');
  console.log(JSON.stringify({
    status: 'MUSIC_AGENT_TESTS_PASS',
    total_tracks: manifest.total_tracks_count,
    moods: manifest.mood_counts
  }, null, 2));
}

runMusicAgentTests();
