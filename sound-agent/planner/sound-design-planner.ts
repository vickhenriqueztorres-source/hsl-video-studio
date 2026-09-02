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

      // 3. Dense & Subtle SFX Layers (Calibrated gains -16 dB to -28 dB)
      const layers: AudioLayerPlan[] = [];
      let layerCounter = 1;

      // (A) ENTRANCE PUNCH: Braam / Sub-Drop / Bass Impact discreto no frame 0
      const isIntro = i === 0;
      const isClimax = i === scenes.length - 1;
      const entranceCategory = isClimax ? 'cinematic/booms' : isIntro ? 'cinematic/braams' : 'cinematic/impacts';
      const entranceSfx = this.sfxSelector.select({ category: entranceCategory });
      layers.push({
        layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
        type: 'impact',
        category: 'scene_entrance_punch',
        file: entranceSfx.localPath,
        startFrame: scene.startFrame,
        durationFrames: isIntro ? 90 : 45,
        volumeDb: isIntro ? -15.0 : -17.0, // Sub-presença sem agredir o ouvido
        frequencyRole: 'low'
      });

      // (B) CONTINUOUS ATMOSPHERE / DRONE: Textura sutil de fundo
      const atmosSfx = this.sfxSelector.select({ category: 'cinematic/loops' });
      layers.push({
        layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
        type: 'drone',
        category: 'tension_drone_bed',
        file: atmosSfx.localPath,
        startFrame: scene.startFrame,
        endFrame: scene.endFrame,
        volumeDb: -28.0, // Cama suave
        frequencyRole: 'mid',
        reverb: 'large_hall'
      });

      // (C) KINETIC TYPOGRAPHY / MOTION GRAPHICS CUES (Frame 8, 16, 30)
      const click1 = this.sfxSelector.select({ category: 'ui', keywords: ['click', 'switch'] });
      layers.push({
        layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
        type: 'foley',
        category: 'ui_text_eyebrow_reveal',
        file: click1.localPath,
        startFrame: scene.startFrame + 8,
        durationFrames: 12,
        volumeDb: -20.0, // Click nítido e discreto
        frequencyRole: 'high'
      });

      const click2 = this.sfxSelector.select({ category: 'ui', keywords: ['click', 'tick'] });
      layers.push({
        layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
        type: 'foley',
        category: 'ui_accent_line_expand',
        file: click2.localPath,
        startFrame: scene.startFrame + 18,
        durationFrames: 12,
        volumeDb: -21.0,
        frequencyRole: 'high'
      });

      const popHit = this.sfxSelector.select({ category: 'cinematic/impacts' });
      layers.push({
        layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
        type: 'impact',
        category: 'ui_headline_pop_hit',
        file: popHit.localPath,
        startFrame: scene.startFrame + 30,
        durationFrames: 25,
        volumeDb: -18.0,
        frequencyRole: 'mid'
      });

      // (D) VISUAL CUES EXPLICITOS
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
            volumeDb: -22.0,
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
            volumeDb: isWhoosh ? -18.0 : -17.0,
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
            durationFrames: 50,
            volumeDb: -14.0, // Impacto controlado
            frequencyRole: isBoom ? 'low' : 'mid'
          });
        }
      }

      // (E) SCENE EXIT TRANSITIONS (Triple Calçamento Cinematográfico)
      const transitions: SceneTransitionPlan[] = [];
      if (i < scenes.length - 1) {
        const supportSfx = this.sfxSelector.select({ category: 'cinematic/loops' });
        const riserSfx = this.sfxSelector.select({ category: 'cinematic/tension' });
        const anchorSfx = this.sfxSelector.select({ category: 'cinematic/impacts' });

        transitions.push({
          transitionId: `trans_${(i + 1).toString().padStart(3, '0')}`,
          type: 'music_transition',
          method: 'triple_calcar',
          supportTrack: {
            file: supportSfx.localPath,
            startFrame: Math.max(0, scene.endFrame - 20),
            endFrame: scene.endFrame + 10,
            volumeDb: -26.0
          },
          riserTrack: {
            file: riserSfx.localPath,
            startFrame: Math.max(0, scene.endFrame - 25),
            endFrame: scene.endFrame,
            volumeDb: -18.0
          },
          anchorTrack: {
            file: anchorSfx.localPath,
            startFrame: scene.endFrame,
            durationFrames: 20,
            volumeDb: -16.0
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
