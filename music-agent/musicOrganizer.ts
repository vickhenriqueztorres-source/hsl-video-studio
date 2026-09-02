import fs from 'fs';
import path from 'path';
import {MusicMood} from './musicCatalog';

export interface OrganizedMusicTrack {
  readonly title: string;
  readonly canonicalName: string;
  readonly category: string;
  readonly mood: MusicMood;
  readonly artist: string;
  readonly license: string;
  readonly licenseUrl: string;
  readonly attributionRequired: boolean;
  readonly attributionText: string;
  readonly localPath: string;
  readonly fullPath: string;
  readonly sha256: string;
  readonly sampleRate: number;
  readonly bitDepth: number;
  readonly channels: number;
  readonly durationSeconds: number;
}

export interface MusicCatalogManifest {
  readonly schema: 'hsl.music.master-catalog.v1';
  readonly schema_version: '1.0.0';
  readonly generated_at: string;
  readonly total_tracks_count: number;
  readonly mood_counts: Record<string, number>;
  readonly licenses: readonly string[];
  readonly tracks: readonly OrganizedMusicTrack[];
}

export class MusicOrganizer {
  private readonly targetBaseDir: string;
  private readonly seenHashes = new Set<string>();

  constructor(targetBaseDir: string) {
    this.targetBaseDir = path.resolve(targetBaseDir);
    fs.mkdirSync(this.targetBaseDir, {recursive: true});
  }

  public registerTrack(track: OrganizedMusicTrack): boolean {
    if (this.seenHashes.has(track.sha256)) {
      console.log(`[Music Organizer] Ignorando faixa duplicada (SHA-256 já registrado): ${track.canonicalName}`);
      return false;
    }
    this.seenHashes.add(track.sha256);
    return true;
  }

  public generateManifest(tracks: readonly OrganizedMusicTrack[]): MusicCatalogManifest {
    const moodCounts: Record<string, number> = {};
    const licenses = new Set<string>();

    for (const track of tracks) {
      moodCounts[track.mood] = (moodCounts[track.mood] || 0) + 1;
      licenses.add(track.license);
    }

    const manifest: MusicCatalogManifest = {
      schema: 'hsl.music.master-catalog.v1',
      schema_version: '1.0.0',
      generated_at: new Date().toISOString(),
      total_tracks_count: tracks.length,
      mood_counts: moodCounts,
      licenses: Array.from(licenses),
      tracks
    };

    const manifestPath = path.join(this.targetBaseDir, 'music-catalog-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`[Music Organizer] Manifesto de música salvo em: ${manifestPath}`);

    this.writeReadme(tracks, manifest);

    return manifest;
  }

  private writeReadme(tracks: readonly OrganizedMusicTrack[], manifest: MusicCatalogManifest): void {
    const readmePath = path.join(this.targetBaseDir, 'README.md');
    const attributionTracks = tracks.filter(t => t.attributionRequired);

    const content = `# 🎵 Biblioteca de Música Cinematográfica Royalty-Free

> **Total de Faixas:** ${manifest.total_tracks_count}  
> **Formato Padrão:** WAV 24-bit / 48.000 Hz Estéreo (Broadcast Master Quality)  
> **Diretório Raiz:** \`public/audio/music/\`

---

## 📁 Distribuição por Categorias & Moods

| Categoria | Subdiretório | Quantidade de Faixas | Descrição |
| :--- | :--- | :--- | :--- |
| **Epic / Orchestral** | \`cinematic/epic/\` | ${manifest.mood_counts.epic || 0} faixas | Trilhas monumentais, orquestras completas, metais e percussão de trailer |
| **Suspense / Tension** | \`cinematic/suspense/\` | ${manifest.mood_counts.suspense || 0} faixas | Cordas tensas, dissonâncias, atmosferas investigativas e dark thriller |
| **Emotional / Dramatic**| \`cinematic/emotional/\` | ${manifest.mood_counts.emotional || 0} faixas | Pianos expressivos, violoncelos dramáticos, nostalgia e esperança |
| **Ambient / Soundscape** | \`cinematic/ambient/\` | ${manifest.mood_counts.ambient || 0} faixas | Drones profundos, texturas espaciais e soundscapes minimalistas |
| **Action / Percussion** | \`cinematic/action/\` | ${manifest.mood_counts.action || 0} faixas | Taikos, percussão rápida, ritmo de perseguição e combate |

---

## 📜 Licenças & Atribuições

- **Faixas CC0 / Domínio Público / HSL Studio Synthesis:** Uso livre sem necessidade de atribuição comercial.
- **Faixas CC BY 4.0:** Requerem atribuição simples na descrição do vídeo.

### Modelos de Atribuição (Copiar e Colar na Descrição):
${attributionTracks.length > 0 ? attributionTracks.map(t => `- **${t.title}**: ${t.attributionText}`).join('\n') : '- Nenhuma faixa requer atribuição obrigatória (todas CC0 / HSL Studio).'}

---

## 🔍 Manifesto Técnico
Consulte o arquivo [\`music-catalog-manifest.json\`](./music-catalog-manifest.json) para ver os hashes SHA-256, bit depth e durações exatas de cada arquivo.
`;

    fs.writeFileSync(readmePath, content, 'utf8');
    console.log(`[Music Organizer] README.md com guia de licenças salvo em: ${readmePath}`);
  }
}
