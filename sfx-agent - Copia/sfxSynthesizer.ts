import {spawnSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {convertToBroadcastWav, probeAudio} from './audioProcessor';
import {OrganizedSfxItem} from './sfxOrganizer';

export interface SynthPreset {
  readonly canonicalName: string;
  readonly category: string;
  readonly filter: string;
  readonly durationSeconds: number;
}

export const CINEMATIC_SYNTH_PRESETS: readonly SynthPreset[] = [
  // --- BRAAMS (5) ---
  {
    canonicalName: 'braam_hit_01.wav',
    category: 'cinematic/braams',
    filter: 'aevalsrc=sin(55*2*PI*t)*exp(-0.4*t)+0.5*sin(110*2*PI*t)*exp(-0.6*t)+0.25*sin(165*2*PI*t)*exp(-0.8*t):s=48000:d=4.5,chorus=0.7:0.9:55:0.4:0.25:2,aecho=0.8:0.88:60:0.4,lowpass=f=2200,volume=2.2',
    durationSeconds: 4.5
  },
  {
    canonicalName: 'braam_hit_02.wav',
    category: 'cinematic/braams',
    filter: 'aevalsrc=sin(45*2*PI*t)*exp(-0.3*t)+0.6*sin(90*2*PI*t)*exp(-0.5*t)+0.3*sin(135*2*PI*t)*exp(-0.7*t):s=48000:d=5.0,flanger=delay=15:depth=4:regen=50:width=80:speed=0.5,aecho=0.8:0.8:120:0.5,volume=2.4',
    durationSeconds: 5.0
  },
  {
    canonicalName: 'braam_hit_03.wav',
    category: 'cinematic/braams',
    filter: 'aevalsrc=sin(65*2*PI*t)*exp(-0.5*t)+0.4*sin(130*2*PI*t)*exp(-0.7*t)+0.2*sin(195*2*PI*t)*exp(-0.9*t):s=48000:d=4.0,chorus=0.6:0.9:40:0.3:0.2:2,aecho=0.8:0.7:80:0.45,volume=2.0',
    durationSeconds: 4.0
  },
  {
    canonicalName: 'braam_hit_04.wav',
    category: 'cinematic/braams',
    filter: 'aevalsrc=sin(38*2*PI*t)*exp(-0.25*t)+0.5*sin(76*2*PI*t)*exp(-0.4*t)+0.3*sin(114*2*PI*t)*exp(-0.6*t):s=48000:d=5.5,chorus=0.8:0.9:60:0.4:0.3:2,aecho=0.85:0.85:150:0.5,volume=2.5',
    durationSeconds: 5.5
  },
  {
    canonicalName: 'braam_hit_05.wav',
    category: 'cinematic/braams',
    filter: 'aevalsrc=sin(50*2*PI*t)*exp(-0.35*t)+0.7*sin(100*2*PI*t)*exp(-0.55*t)+0.35*sin(150*2*PI*t)*exp(-0.75*t):s=48000:d=4.8,flanger=delay=20:depth=6:regen=60:width=90:speed=0.3,aecho=0.8:0.8:100:0.4,volume=2.3',
    durationSeconds: 4.8
  },

  // --- BOOMS & SUB DROPS (5) ---
  {
    canonicalName: 'boom_explosion_01.wav',
    category: 'cinematic/booms',
    filter: 'anoisesrc=d=4.0:c=pink:r=48000,lowpass=f=180,volume=3.5,aecho=0.8:0.9:100:0.6',
    durationSeconds: 4.0
  },
  {
    canonicalName: 'boom_explosion_02.wav',
    category: 'cinematic/booms',
    filter: 'aevalsrc=sin((120-25*t)*2*PI*t)*exp(-1.2*t)+0.5*sin(40*2*PI*t)*exp(-0.5*t):s=48000:d=3.5,lowpass=f=280,volume=3.0,aecho=0.8:0.85:150:0.5',
    durationSeconds: 3.5
  },
  {
    canonicalName: 'boom_explosion_03.wav',
    category: 'cinematic/booms',
    filter: 'anoisesrc=d=5.0:c=brown:r=48000,lowpass=f=120,volume=4.0,aecho=0.9:0.9:200:0.5',
    durationSeconds: 5.0
  },
  {
    canonicalName: 'boom_explosion_04.wav',
    category: 'cinematic/booms',
    filter: 'aevalsrc=sin((180-40*t)*2*PI*t)*exp(-1.5*t)+sin(45*2*PI*t)*exp(-0.4*t):s=48000:d=3.8,chorus=0.7:0.9:50:0.4:0.25:2,lowpass=f=350,volume=3.2',
    durationSeconds: 3.8
  },
  {
    canonicalName: 'boom_explosion_05.wav',
    category: 'cinematic/booms',
    filter: 'anoisesrc=d=4.5:c=brown:r=48000,bandpass=f=80:w=60,volume=4.5,aecho=0.85:0.88:180:0.55',
    durationSeconds: 4.5
  },

  // --- WHOOSHES & TRANSITIONS (5) ---
  {
    canonicalName: 'whoosh_swoosh_01.wav',
    category: 'cinematic/whooshes',
    filter: 'anoisesrc=d=1.8:c=white:r=48000,bandpass=f=1200:w=800,volume=3.0,flanger=delay=10:depth=6:speed=1',
    durationSeconds: 1.8
  },
  {
    canonicalName: 'whoosh_swoosh_02.wav',
    category: 'cinematic/whooshes',
    filter: 'anoisesrc=d=2.2:c=pink:r=48000,bandpass=f=800:w=600,volume=3.5,aecho=0.7:0.6:80:0.3',
    durationSeconds: 2.2
  },
  {
    canonicalName: 'whoosh_swoosh_03.wav',
    category: 'cinematic/whooshes',
    filter: 'anoisesrc=d=1.2:c=white:r=48000,bandpass=f=2000:w=1200,volume=3.2',
    durationSeconds: 1.2
  },
  {
    canonicalName: 'whoosh_swoosh_04.wav',
    category: 'cinematic/whooshes',
    filter: 'anoisesrc=d=2.5:c=brown:r=48000,bandpass=f=600:w=400,volume=4.0,aecho=0.8:0.7:120:0.4',
    durationSeconds: 2.5
  },
  {
    canonicalName: 'whoosh_swoosh_05.wav',
    category: 'cinematic/whooshes',
    filter: 'anoisesrc=d=1.5:c=white:r=48000,bandpass=f=1500:w=900,volume=3.2,flanger=delay=8:depth=4:speed=1.5',
    durationSeconds: 1.5
  },

  // --- TENSION & RISERS (5) ---
  {
    canonicalName: 'tension_riser_01.wav',
    category: 'cinematic/tension',
    filter: 'aevalsrc=sin((100+150*t*t)*2*PI*t)*0.6+sin((102+150*t*t)*2*PI*t)*0.4:s=48000:d=6.0,flanger=delay=10:depth=5:speed=0.5,volume=1.8',
    durationSeconds: 6.0
  },
  {
    canonicalName: 'tension_riser_02.wav',
    category: 'cinematic/tension',
    filter: 'aevalsrc=sin((80+90*t*t)*2*PI*t)*0.5+sin((160+180*t*t)*2*PI*t)*0.3:s=48000:d=7.0,aecho=0.8:0.8:100:0.35,volume=2.0',
    durationSeconds: 7.0
  },
  {
    canonicalName: 'tension_riser_03.wav',
    category: 'cinematic/tension',
    filter: 'aevalsrc=sin((60+120*t*t)*2*PI*t)*0.5+sin((180+360*t*t)*2*PI*t)*0.3:s=48000:d=5.5,flanger=delay=8:depth=4:speed=1.2,volume=2.2',
    durationSeconds: 5.5
  },
  {
    canonicalName: 'tension_riser_04.wav',
    category: 'cinematic/tension',
    filter: 'aevalsrc=sin((50+70*t*t)*2*PI*t)*0.6+sin((75+105*t*t)*2*PI*t)*0.4:s=48000:d=8.0,chorus=0.7:0.9:50:0.4:0.25:2,volume=2.2',
    durationSeconds: 8.0
  },
  {
    canonicalName: 'tension_riser_05.wav',
    category: 'cinematic/tension',
    filter: 'aevalsrc=sin((120+200*t*t)*2*PI*t)*0.5+sin((125+200*t*t)*2*PI*t)*0.5:s=48000:d=6.5,flanger=delay=12:depth=4:speed=0.8,volume=1.9',
    durationSeconds: 6.5
  },

  // --- LOOPS & ATMOSPHERES (5) ---
  {
    canonicalName: 'loop_atmosphere_01.wav',
    category: 'cinematic/loops',
    filter: 'aevalsrc=sin(60*2*PI*t)*0.4+sin(90*2*PI*t)*0.3+sin(150*2*PI*t)*0.2:s=48000:d=10.0,chorus=0.8:0.9:60:0.4:0.3:2,aecho=0.8:0.8:250:0.4,volume=1.8',
    durationSeconds: 10.0
  },
  {
    canonicalName: 'loop_atmosphere_02.wav',
    category: 'cinematic/loops',
    filter: 'anoisesrc=d=12.0:c=brown:r=48000,lowpass=f=350,chorus=0.7:0.8:70:0.3:0.2:2,volume=2.5,aecho=0.8:0.8:300:0.4',
    durationSeconds: 12.0
  },
  {
    canonicalName: 'loop_atmosphere_03.wav',
    category: 'cinematic/loops',
    filter: 'aevalsrc=sin(48*2*PI*t)*0.5+sin(72*2*PI*t)*0.3+sin(120*2*PI*t)*0.2:s=48000:d=10.0,flanger=delay=15:depth=5:speed=0.2,volume=1.9',
    durationSeconds: 10.0
  },
  {
    canonicalName: 'loop_atmosphere_04.wav',
    category: 'cinematic/loops',
    filter: 'anoisesrc=d=11.0:c=pink:r=48000,bandpass=f=450:w=200,aecho=0.8:0.85:200:0.45,volume=2.2',
    durationSeconds: 11.0
  },
  {
    canonicalName: 'loop_atmosphere_05.wav',
    category: 'cinematic/loops',
    filter: 'aevalsrc=sin(55*2*PI*t)*0.4+sin(82.5*2*PI*t)*0.35+sin(165*2*PI*t)*0.25:s=48000:d=10.0,chorus=0.8:0.9:55:0.35:0.25:2,volume=1.8',
    durationSeconds: 10.0
  },

  // --- HORROR (5) ---
  {
    canonicalName: 'horror_dark_01.wav',
    category: 'horror',
    filter: 'aevalsrc=sin(440*2*PI*t)*exp(-0.8*t)+sin(466*2*PI*t)*exp(-0.8*t)+sin(45*2*PI*t)*exp(-0.4*t):s=48000:d=4.5,flanger=delay=20:depth=8:speed=2,aecho=0.8:0.8:180:0.5,volume=2.2',
    durationSeconds: 4.5
  },
  {
    canonicalName: 'horror_dark_02.wav',
    category: 'horror',
    filter: 'aevalsrc=sin(666*2*PI*t)*exp(-1.0*t)+sin(700*2*PI*t)*exp(-1.0*t)+sin(50*2*PI*t)*exp(-0.3*t):s=48000:d=4.0,aecho=0.85:0.85:220:0.6,volume=2.4',
    durationSeconds: 4.0
  },
  {
    canonicalName: 'horror_dark_03.wav',
    category: 'horror',
    filter: 'anoisesrc=d=5.0:c=white:r=48000,bandpass=f=2400:w=300,flanger=delay=15:depth=10:speed=3,volume=2.0,aecho=0.8:0.75:150:0.4',
    durationSeconds: 5.0
  },
  {
    canonicalName: 'horror_dark_04.wav',
    category: 'horror',
    filter: 'aevalsrc=sin((300-40*t)*2*PI*t)*exp(-0.5*t)+sin(315*2*PI*t)*exp(-0.5*t):s=48000:d=4.2,aecho=0.8:0.8:160:0.5,volume=2.3',
    durationSeconds: 4.2
  },
  {
    canonicalName: 'horror_dark_05.wav',
    category: 'horror',
    filter: 'aevalsrc=sin(110*2*PI*t)*exp(-0.3*t)+sin(116.54*2*PI*t)*exp(-0.3*t):s=48000:d=5.0,chorus=0.8:0.9:50:0.4:0.3:2,aecho=0.8:0.8:200:0.4,volume=2.0',
    durationSeconds: 5.0
  },

  // --- SCI-FI (5) ---
  {
    canonicalName: 'scifi_laser_01.wav',
    category: 'sci-fi',
    filter: 'aevalsrc=sin((2400-1800*t)*2*PI*t)*exp(-3.5*t):s=48000:d=1.2,flanger=delay=4:depth=2:speed=2,volume=2.8',
    durationSeconds: 1.2
  },
  {
    canonicalName: 'scifi_laser_02.wav',
    category: 'sci-fi',
    filter: 'aevalsrc=sin((3200-2600*t)*2*PI*t)*exp(-4.0*t):s=48000:d=1.0,volume=3.0,aecho=0.7:0.6:60:0.3',
    durationSeconds: 1.0
  },
  {
    canonicalName: 'scifi_laser_03.wav',
    category: 'sci-fi',
    filter: 'aevalsrc=sin((1800+400*sin(40*t))*2*PI*t)*exp(-1.5*t):s=48000:d=2.0,flanger=delay=8:depth=4:speed=4,volume=2.5',
    durationSeconds: 2.0
  },
  {
    canonicalName: 'scifi_laser_04.wav',
    category: 'sci-fi',
    filter: 'aevalsrc=sin((800+600*t)*2*PI*t)*exp(-1.2*t)+sin(1600*2*PI*t)*exp(-2.0*t):s=48000:d=2.2,aecho=0.8:0.7:90:0.4,volume=2.6',
    durationSeconds: 2.2
  },
  {
    canonicalName: 'scifi_laser_05.wav',
    category: 'sci-fi',
    filter: 'aevalsrc=sin((4000-3400*t)*2*PI*t)*exp(-5.0*t):s=48000:d=0.8,volume=3.2',
    durationSeconds: 0.8
  },

  // --- FOLEY DOORS (3) ---
  {
    canonicalName: 'foley_door_01.wav',
    category: 'foley/doors',
    filter: 'anoisesrc=d=1.2:c=brown:r=48000,bandpass=f=250:w=120,volume=3.5,aecho=0.7:0.6:50:0.3',
    durationSeconds: 1.2
  },
  {
    canonicalName: 'foley_door_02.wav',
    category: 'foley/doors',
    filter: 'aevalsrc=sin((350+120*sin(15*t))*2*PI*t)*exp(-1.8*t)+0.4*sin(80*2*PI*t)*exp(-2.5*t):s=48000:d=1.8,volume=2.5',
    durationSeconds: 1.8
  },
  {
    canonicalName: 'foley_door_03.wav',
    category: 'foley/doors',
    filter: 'anoisesrc=d=0.9:c=pink:r=48000,lowpass=f=400,volume=3.2,aecho=0.6:0.5:40:0.25',
    durationSeconds: 0.9
  },

  // --- FOLEY VEHICLES (3) ---
  {
    canonicalName: 'foley_vehicle_01.wav',
    category: 'foley/vehicles',
    filter: 'aevalsrc=sin((60+8*sin(6*t))*2*PI*t)*0.6+sin((120+16*sin(6*t))*2*PI*t)*0.4:s=48000:d=3.5,lowpass=f=450,volume=2.8',
    durationSeconds: 3.5
  },
  {
    canonicalName: 'foley_vehicle_02.wav',
    category: 'foley/vehicles',
    filter: 'anoisesrc=d=2.8:c=pink:r=48000,bandpass=f=1800:w=600,volume=2.2,flanger=delay=6:depth=3:speed=1',
    durationSeconds: 2.8
  },
  {
    canonicalName: 'foley_vehicle_03.wav',
    category: 'foley/vehicles',
    filter: 'aevalsrc=sin((90+15*sin(10*t))*2*PI*t)*0.5+0.5*sin(45*2*PI*t):s=48000:d=4.0,lowpass=f=300,volume=3.0',
    durationSeconds: 4.0
  }
];

export function synthesizePreset(preset: SynthPreset, targetBaseDir: string): OrganizedSfxItem {
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
    throw new Error(`SYNTH_PRESET_FAILED:${preset.canonicalName}:${result.stderr}`);
  }

  const meta = probeAudio(finalPath);
  const relPath = path.relative(targetBaseDir, finalPath).replace(/\\/g, '/');

  return {
    canonicalName: preset.canonicalName,
    category: preset.category,
    originalFile: `synth_${preset.canonicalName}`,
    packId: 'hsl-cinematic-synth-engine',
    provider: 'HSL Studio Audio Synthesis',
    license: 'CC0-1.0 (Public Domain)',
    localPath: relPath,
    fullPath: finalPath,
    sha256: meta.sha256,
    sampleRate: meta.sampleRate,
    bitDepth: meta.bitDepth,
    channels: meta.channels,
    durationSeconds: meta.durationSeconds
  };
}
