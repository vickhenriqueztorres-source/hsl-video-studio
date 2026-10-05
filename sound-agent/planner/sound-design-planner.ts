import {VoiceProcessor} from '../analyzer/voice-processor';
import {RagClient} from '../rag/rag-client';
import {MusicSelector} from '../selector/music-selector';
import {SfxSelector} from '../selector/sfx-selector';
import {AudioLayerPlan, AudioPlan, SceneAudioPlan, SceneTransitionPlan} from '../types/audio-plan.types';
import {SceneAnalysis, VideoAnalysisInput} from '../types/scene-analysis.types';
import {LayerOptimizer} from './layer-optimizer';

export class SoundDesignPlanner {
  private readonly rag: RagClient;
  private readonly sfxSelector: SfxSelector;
  private readonly musicSelector: MusicSelector;

  constructor(baseDir = process.cwd()) {
    this.rag = new RagClient(baseDir);
    this.sfxSelector = new SfxSelector(baseDir);
    this.musicSelector = new MusicSelector(baseDir);
  }

  public plan(input: VideoAnalysisInput, scenes: readonly SceneAnalysis[]): AudioPlan {
    const plannedScenes: SceneAudioPlan[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const hasVoice = scene.audioCues.some(c => c.hasVoice || c.type === 'voice');
      const voiceCue = scene.audioCues.find(c => c.hasVoice || c.type === 'voice');

      // 1. Voice Treatment (Voice is HERO at -12 dB)
      const voiceTreatment = hasVoice
        ? VoiceProcessor.planVoiceTreatment(voiceCue, scene.detectedEnvironment)
        : undefined;

      // 2. Score Selection (Mood-based, ducked under dialog)
      const musicTrack = this.musicSelector.selectByMood(scene.detectedMood);
      const sceneMusic = {
        role: 'tension_bed' as const,
        mood: scene.detectedMood,
        file: musicTrack.localPath,
        startFrame: scene.startFrame,
        endFrame: scene.endFrame,
        volumeDb: hasVoice ? -26.0 : -22.0, // Perfeito equilíbrio sob a voz
        ducking: hasVoice ? {
          enabled: true,
          duckAmount: -6.0,
          attackFrames: 6,
          releaseFrames: 16
        } : undefined
      };

      // 3. Subtle & Cinematic Documentary SFX Layers (Tasteful, non-distracting)
      const layers: AudioLayerPlan[] = [];
      let layerCounter = 1;

      // (A) ENTRANCE PUNCH: Only at intro or major dramatic turning point
      const isIntro = i === 0;
      const isClimax = scene.visualCues.some(c => c.type === 'climax');
      if (isIntro || isClimax) {
        const entranceCategory = isIntro ? 'cinematic/braams' : 'cinematic/impacts';
        const entranceSfx = this.sfxSelector.select({ category: entranceCategory });
        layers.push({
          layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
          type: 'impact',
          category: 'scene_entrance_punch',
          file: entranceSfx.localPath,
          startFrame: scene.startFrame,
          durationFrames: isIntro ? 75 : 40,
          volumeDb: isIntro ? -22.0 : -24.0,
          frequencyRole: 'low'
        });
      }

      // (B) CONTINUOUS ATMOSPHERE / DRONE: Subtle, immersive background bed
      const atmosSfx = this.sfxSelector.select({ category: 'cinematic/loops' });
      layers.push({
        layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
        type: 'drone',
        category: 'tension_drone_bed',
        file: atmosSfx.localPath,
        startFrame: scene.startFrame,
        endFrame: scene.endFrame,
        volumeDb: -32.0, // Cama suave e discreta que não compete com a narração
        frequencyRole: 'mid',
        reverb: 'large_hall'
      });

      // (C) KINETIC TYPOGRAPHY / UI: Only if explicitly required by scene metadata
      const hasExplicitUi = scene.visualCues.some(c => c.soundNeeded?.includes('ui') || c.type === 'ui');
      if (hasExplicitUi) {
        const click = this.sfxSelector.select({ category: 'ui', keywords: ['click'] });
        layers.push({
          layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
          type: 'foley',
          category: 'ui_subtle_foley',
          file: click.localPath,
          startFrame: scene.startFrame + 15,
          durationFrames: 10,
          volumeDb: -28.0,
          frequencyRole: 'high'
        });
      }

      // (D) CONTEXTUAL VISUAL CUES (Physical actions, subtle whooshes and structural strain)
      for (const cue of scene.visualCues) {
        if (cue.type === 'action' || cue.soundNeeded?.includes('foley') || cue.soundNeeded?.includes('keyboard') || cue.soundNeeded?.includes('door')) {
          const isDoor = cue.soundNeeded?.includes('door');
          const cat = isDoor ? 'foley/doors' : 'foley/household';
          const foleySfx = this.sfxSelector.select({ category: cat });
          layers.push({
            layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
            type: 'foley',
            category: cue.soundNeeded || 'foley_action',
            file: foleySfx.localPath,
            startFrame: cue.frame,
            endFrame: Math.min(scene.endFrame, cue.frame + 45),
            volumeDb: -26.0,
            frequencyRole: 'mid',
            variations: 3
          });
        } else if (cue.type === 'transition' || cue.type === 'camera_move' || cue.soundNeeded?.includes('riser') || cue.soundNeeded?.includes('whoosh')) {
          const isWhoosh = cue.soundNeeded?.includes('whoosh') || cue.type === 'camera_move';
          const cat = isWhoosh ? 'cinematic/whooshes' : 'cinematic/tension';
          const transSfx = this.sfxSelector.select({ category: cat });
          layers.push({
            layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
            type: isWhoosh ? 'whoosh' : 'riser',
            category: cue.soundNeeded || 'tension_riser',
            file: transSfx.localPath,
            startFrame: Math.max(scene.startFrame, cue.frame - 30),
            endFrame: cue.frame,
            volumeDb: isWhoosh ? -24.0 : -22.0,
            frequencyRole: 'high',
            reverse: false
          });
        } else if (cue.type === 'climax' || cue.soundNeeded?.includes('boom') || cue.soundNeeded?.includes('impact')) {
          const isBoom = cue.soundNeeded?.includes('boom') || cue.type === 'climax';
          const cat = isBoom ? 'cinematic/booms' : 'cinematic/impacts';
          const impactSfx = this.sfxSelector.select({ category: cat });
          layers.push({
            layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
            type: 'impact',
            category: isBoom ? 'ominous_boom' : 'impact_strike',
            file: impactSfx.localPath,
            startFrame: cue.frame,
            durationFrames: 45,
            volumeDb: -20.0,
            frequencyRole: isBoom ? 'low' : 'mid'
          });
        }
      }

      // (E) SCENE EXIT TRANSITIONS: Subtle swells only at act boundaries
      const transitions: SceneTransitionPlan[] = [];
      const isActBoundary = (i > 0 && (i + 1) % 8 === 0) || i === scenes.length - 2;
      if (isActBoundary) {
        const riserSfx = this.sfxSelector.select({ category: 'cinematic/tension' });
        transitions.push({
          transitionId: `trans_${(i + 1).toString().padStart(3, '0')}`,
          type: 'music_transition',
          method: 'subtle_swell',
          riserTrack: {
            file: riserSfx.localPath,
            startFrame: Math.max(0, scene.endFrame - 25),
            endFrame: scene.endFrame,
            volumeDb: -24.0
          }
        });
      }

      const optimizedLayers = LayerOptimizer.optimizeLayers(layers);

      plannedScenes.push({
        sceneId: scene.sceneId,
        startFrame: scene.startFrame,
        endFrame: scene.endFrame,
        mood: scene.detectedMood,
        environment: scene.detectedEnvironment,
        hasVoice,
        voiceTreatment,
        music: sceneMusic,
        layers: optimizedLayers,
        transitions: transitions.length > 0 ? transitions : undefined,
        mixing: {
          masterLimiter: {
            enabled: true,
            ceilingDb: -2.0 // Teto seguro broadcast
          },
          sidechain: {
            enabled: hasVoice,
            source: 'voice',
            targets: ['music', 'ambience'],
            thresholdDb: -18.0,
            ratio: 3.0
          }
        }
      });
    }

    return {
      version: '1.0.0',
      videoId: input.videoId || 'video_001',
      totalFrames: input.totalFrames || (plannedScenes[plannedScenes.length - 1]?.endFrame ?? 300),
      fps: input.fps || 30,
      scenes: plannedScenes
    };
  }
}
