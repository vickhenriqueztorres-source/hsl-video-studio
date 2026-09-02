import {AudioLayerPlan, FrequencyRole} from '../types/audio-plan.types';
import {FrequencyUtils} from '../utils/frequency-utils';
import {WaveformUtils} from '../utils/waveform-utils';

export class LayerOptimizer {
  public static optimizeLayers(layers: AudioLayerPlan[]): AudioLayerPlan[] {
    const optimized: AudioLayerPlan[] = [];

    for (const layer of layers) {
      // 1. Clamp volume within safe broadcast range (-45dB to -6dB)
      const clampedVol = WaveformUtils.clampVolumeDb(layer.volumeDb, -45, -6);

      // 2. Map frequency role if not present
      let role: FrequencyRole = layer.frequencyRole || 'mid';
      if (layer.category.includes('boom') || layer.category.includes('sub')) role = 'low';
      if (layer.category.includes('riser') || layer.category.includes('whoosh')) role = 'high';

      optimized.push({
        ...layer,
        volumeDb: clampedVol,
        frequencyRole: role
      });
    }

    return optimized;
  }
}
