import {spawnSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {probeMusicTrack} from './musicProcessor';
import {MusicMood} from './musicCatalog';

export interface SynthMusicTrackPreset {
  readonly title: string;
  readonly canonicalName: string;
  readonly category: string;
  readonly mood: MusicMood;
  readonly filter: string;
  readonly durationSeconds: number;
}

export function generateCinematicMusicPresets(): SynthMusicTrackPreset[] {
  const presets: SynthMusicTrackPreset[] = [];

  // =========================================================================
  // 1. EPIC / ORCHESTRAL (20 UNIQUE TRACKS)
  // =========================================================================
  for (let i = 1; i <= 20; i++) {
    const baseFreq = 45 + i * 2.2;
    const duration = 90 + i * 4; // 94s to 170s (each unique)
    const indexStr = i.toString().padStart(2, '0');
    const f1 = baseFreq.toFixed(2);
    const f2 = (baseFreq * 2.0).toFixed(2);
    const f3 = (baseFreq * 2.996).toFixed(2);
    const f4 = (baseFreq * 4.0).toFixed(2);
    const f5 = (baseFreq * 5.993).toFixed(2);
    const modRate = (0.2 + i * 0.05).toFixed(2);

    const filter = `aevalsrc=sin(${f1}*2*PI*t)*0.45+sin(${f2}*2*PI*t)*0.35+sin(${f3}*2*PI*t)*0.25+sin(${f4}*2*PI*t)*0.2+sin(${f5}*2*PI*t)*0.15+0.2*sin(${modRate}*2*PI*t)*sin(${f2}*2*PI*t):s=48000:d=${duration},chorus=0.8:0.9:50:0.4:0.3:2,flanger=delay=15:depth=4:speed=0.3,aecho=0.8:0.85:200:0.45,volume=2.2`;

    presets.push({
      title: `Monumental Symphony ${indexStr}`,
      canonicalName: `epic_orchestra_${indexStr}.wav`,
      category: 'cinematic/epic',
      mood: 'epic',
      filter,
      durationSeconds: duration
    });
  }

  // =========================================================================
  // 2. SUSPENSE / THRILLER (20 UNIQUE TRACKS)
  // =========================================================================
  for (let i = 1; i <= 20; i++) {
    const baseFreq = 38 + i * 1.8;
    const duration = 90 + i * 4;
    const indexStr = i.toString().padStart(2, '0');
    const f1 = baseFreq.toFixed(2);
    const f2 = (baseFreq * 2.0).toFixed(2);
    const f3 = (baseFreq * 2.828).toFixed(2); // tritone / dark interval
    const f4 = (baseFreq * 4.0).toFixed(2);
    const f5 = (baseFreq * 5.656).toFixed(2);
    const lfoRate = (0.15 + i * 0.04).toFixed(2);

    const filter = `aevalsrc=sin(${f1}*2*PI*t)*0.5+sin((${f2}+0.5*sin(${lfoRate}*t))*2*PI*t)*0.35+sin(${f3}*2*PI*t)*0.25+sin(${f4}*2*PI*t)*0.2+0.15*sin(2.5*2*PI*t)*sin(${f5}*2*PI*t):s=48000:d=${duration},flanger=delay=20:depth=8:speed=0.2,aecho=0.85:0.85:180:0.5,volume=2.0`;

    presets.push({
      title: `Shadow Investigation ${indexStr}`,
      canonicalName: `suspense_strings_${indexStr}.wav`,
      category: 'cinematic/suspense',
      mood: 'suspense',
      filter,
      durationSeconds: duration
    });
  }

  // =========================================================================
  // 3. EMOTIONAL / DRAMATIC PIANO (20 UNIQUE TRACKS)
  // =========================================================================
  for (let i = 1; i <= 20; i++) {
    const baseFreq = 50 + i * 2.0;
    const duration = 90 + i * 4;
    const indexStr = i.toString().padStart(2, '0');
    const period = (3.5 + (i % 3) * 0.5).toFixed(1);
    const f1 = baseFreq.toFixed(2);
    const f2 = (baseFreq * 2.0).toFixed(2);
    const f3 = (baseFreq * 2.519).toFixed(2); // major third
    const f4 = (baseFreq * 2.996).toFixed(2); // perfect fifth
    const f5 = (baseFreq * 3.775).toFixed(2); // major seventh

    const filter = `aevalsrc=sin(${f1}*2*PI*t)*0.4*exp(-0.1*mod(t\\,${period}))+sin(${f2}*2*PI*t)*0.35*exp(-0.15*mod(t\\,${period}))+sin(${f3}*2*PI*t)*0.3*exp(-0.2*mod(t\\,${period}))+sin(${f4}*2*PI*t)*0.2*exp(-0.25*mod(t\\,${period}))+sin(${f5}*2*PI*t)*0.15*exp(-0.3*mod(t\\,${period})):s=48000:d=${duration},chorus=0.7:0.9:45:0.35:0.25:2,aecho=0.8:0.8:250:0.4,volume=2.4`;

    presets.push({
      title: `Elegiac Reflections ${indexStr}`,
      canonicalName: `emotional_piano_${indexStr}.wav`,
      category: 'cinematic/emotional',
      mood: 'emotional',
      filter,
      durationSeconds: duration
    });
  }

  // =========================================================================
  // 4. AMBIENT / SOUNDSCAPE (20 UNIQUE TRACKS)
  // =========================================================================
  for (let i = 1; i <= 20; i++) {
    const baseFreq = 30 + i * 1.5;
    const duration = 95 + i * 4;
    const indexStr = i.toString().padStart(2, '0');
    const f1 = baseFreq.toFixed(2);
    const f2 = (baseFreq * 2.0).toFixed(2);
    const f3 = (baseFreq * 3.0).toFixed(2);
    const f4 = (baseFreq * 4.0).toFixed(2);
    const f5 = (baseFreq * 6.0).toFixed(2);
    const slowMod = (0.1 + i * 0.02).toFixed(2);

    const filter = `aevalsrc=sin(${f1}*2*PI*t)*0.45+sin(${f2}*2*PI*t)*0.35+sin(${f3}*2*PI*t)*0.25+sin(${f4}*2*PI*t)*0.2+0.1*sin(${slowMod}*t)*sin(${f5}*2*PI*t):s=48000:d=${duration},chorus=0.8:0.9:65:0.4:0.3:2,flanger=delay=20:depth=6:speed=0.15,aecho=0.85:0.85:300:0.5,volume=2.0`;

    presets.push({
      title: `Cosmic Horizon ${indexStr}`,
      canonicalName: `ambient_drone_${indexStr}.wav`,
      category: 'cinematic/ambient',
      mood: 'ambient',
      filter,
      durationSeconds: duration
    });
  }

  // =========================================================================
  // 5. ACTION / PERCUSSION (20 UNIQUE TRACKS)
  // =========================================================================
  for (let i = 1; i <= 20; i++) {
    const bpm = 100 + i * 2.5;
    const pulsePeriod = (60 / bpm).toFixed(3);
    const duration = 90 + i * 4;
    const indexStr = i.toString().padStart(2, '0');
    const subFreq = (40 + i * 1.2).toFixed(2);
    const snapFreq = (180 + i * 5).toFixed(2);

    const filter = `aevalsrc=sin(${subFreq}*2*PI*t)*exp(-3.0*mod(t\\,${pulsePeriod}))*0.6+sin(${snapFreq}*2*PI*t)*exp(-6.0*mod(t\\,${pulsePeriod}))*0.4+0.15*sin(110*2*PI*t):s=48000:d=${duration},chorus=0.6:0.8:30:0.3:0.2:2,aecho=0.7:0.7:100:0.3,volume=2.5`;

    presets.push({
      title: `Kinetic Pursuit ${indexStr}`,
      canonicalName: `action_percussion_${indexStr}.wav`,
      category: 'cinematic/action',
      mood: 'action',
      filter,
      durationSeconds: duration
    });
  }

  return presets;
}

export function synthesizeMusicPreset(preset: SynthMusicTrackPreset, targetBaseDir: string): {
  canonicalName: string;
  category: string;
  mood: MusicMood;
  fullPath: string;
  localPath: string;
  sha256: string;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  durationSeconds: number;
} {
  const categoryDir = path.join(targetBaseDir, ...preset.category.split('/'));
  fs.mkdirSync(categoryDir, {recursive: true});

  const finalPath = path.join(categoryDir, preset.canonicalName);

  const result = spawnSync('ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', preset.filter,
    '-ar', '48000',
    '-ac', '2',
    '-c:a', 'pcm_s24le',
    '-t', preset.durationSeconds.toString(),
    finalPath
  ], {encoding: 'utf8'});

  if (result.status !== 0) {
    throw new Error(`SYNTH_MUSIC_PRESET_FAILED:${preset.canonicalName}:${result.stderr}`);
  }

  const meta = probeMusicTrack(finalPath);
  const relPath = path.relative(targetBaseDir, finalPath).replace(/\\/g, '/');

  return {
    canonicalName: preset.canonicalName,
    category: preset.category,
    mood: preset.mood,
    fullPath: finalPath,
    localPath: relPath,
    sha256: meta.sha256,
    sampleRate: meta.sampleRate,
    bitDepth: meta.bitDepth,
    channels: meta.channels,
    durationSeconds: meta.durationSeconds
  };
}
