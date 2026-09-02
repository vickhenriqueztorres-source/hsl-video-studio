import {FrequencyRole} from '../types/audio-plan.types';

export class FrequencyUtils {
  public static categorizeFrequency(role: FrequencyRole): {
    hzRange: [number, number];
    roleName: string;
  } {
    switch (role) {
      case 'low':
        return { hzRange: [20, 250], roleName: 'Sub-bass / Peso / Impacto' };
      case 'mid':
        return { hzRange: [250, 4000], roleName: 'Corpo / Voz / Foley Principal' };
      case 'high':
        return { hzRange: [4000, 20000], roleName: 'Ataque / Brilho / Detalhe' };
      case 'full':
      default:
        return { hzRange: [20, 20000], roleName: 'Espectro Completo' };
    }
  }

  public static checkCollision(layers: Array<{ frequencyRole: FrequencyRole; startFrame: number; endFrame: number }>): boolean {
    // Detect if more than 3 simultaneous layers share the exact same narrow frequency band
    for (let i = 0; i < layers.length; i++) {
      let overlappingCount = 0;
      for (let j = 0; j < layers.length; j++) {
        if (i !== j && layers[i].frequencyRole === layers[j].frequencyRole) {
          const overlap = Math.max(0, Math.min(layers[i].endFrame, layers[j].endFrame) - Math.max(layers[i].startFrame, layers[j].startFrame));
          if (overlap > 15) {
            overlappingCount++;
          }
        }
      }
      if (overlappingCount > 2) return true;
    }
    return false;
  }
}
