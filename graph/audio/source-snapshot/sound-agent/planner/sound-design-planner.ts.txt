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
    const mixGuidelines = this.rag.getMixGuidelines();

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const hasVoice = scene.audioCues.some(c => c.hasVoice || c.type === 'voice');
      const voiceCue = scene.audioCues.find(c => c.hasVoice || c.type === 'voice');

      // 1. Voice Treatment
      const voiceTreatment = hasVoice
        ? VoiceProcessor.planVoiceTreatment(voiceCue, scene.detectedEnvironment)
        : undefined;

      // 2. Score Selection (Mood-based)
      const musicTrack = this.musicSelector.selectByMood(scene.detectedMood);
      const sceneMusic = {
        role: 'tension_bed' as const,
        mood: scene.detectedMood,
        file: musicTrack.localPath,
        startFrame: scene.startFrame,
        endFrame: scene.endFrame,
        volumeDb: hasVoice ? -24.0 : -18.0,
        ducking: hasVoice ? {
          enabled: true,
          duckAmount: -8.0,
          attackFrames: 5,
          releaseFrames: 15
        } : undefined
      };

      // 3. Layer Generation
      const layers: AudioLayerPlan[] = [];
      let layerCounter = 1;

      // Ambience (Mandatory for every scene)
      const ambienceSfx = this.sfxSelector.select({ category: 'foley/household' });
      layers.push({
        layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
        type: 'ambience',
        category: 'room_tone',
        file: ambienceSfx.localPath,
        startFrame: scene.startFrame,
        endFrame: scene.endFrame,
        volumeDb: -32.0,
        frequencyRole: 'mid',
        reverb: 'small_room'
      });

      // Visual Cues mapping to Foley & Creative SFX
      for (const cue of scene.visualCues) {
        if (cue.type === 'action' || cue.soundNeeded?.includes('foley') || cue.soundNeeded?.includes('keyboard') || cue.soundNeeded?.includes('door')) {
          const cat = cue.soundNeeded?.includes('door') ? 'foley/doors' : 'foley/household';
          const foleySfx = this.sfxSelector.select({ category: cat });
          layers.push({
            layerId: `layer_${(layerCounter++).toString().padStart(3, '0')}`,
            type: 'foley',
            category: cue.soundNeeded || 'foley_action',
            file: foleySfx.localPath,
            startFrame: cue.frame,
            endFrame: Math.min(scene.endFrame, cue.frame + 60),
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
            type: isWhoosh ? 'whoosh' : 'creative',
            category: cue.soundNeeded || 'tension_riser',
            file: transSfx.localPath,
            startFrame: Math.max(scene.startFrame, cue.frame - 30),
            endFrame: cue.frame,
            volumeDb: -20.0,
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
            durationFrames: 30,
            volumeDb: -14.0,
            frequencyRole: isBoom ? 'low' : 'mid'
          });
        }
      }

      // 4. Transitions
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
            startFrame: Math.max(0, scene.endFrame - 15),
            endFrame: scene.endFrame + 15,
            volumeDb: -28.0
          },
          riserTrack: {
            file: riserSfx.localPath,
            startFrame: Math.max(0, scene.endFrame - 10),
            endFrame: scene.endFrame,
            volumeDb: -18.0
          },
          anchorTrack: {
            file: anchorSfx.localPath,
            startFrame: scene.endFrame,
            durationFrames: 15,
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
            ceilingDb: mixGuidelines.master_bus.hard_limiter_ceiling_db || -2.5
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
