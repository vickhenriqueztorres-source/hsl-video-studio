import {VoiceTreatmentPlan} from '../types/audio-plan.types';
import {AudioCue} from '../types/scene-analysis.types';

export class VoiceProcessor {
  public static planVoiceTreatment(cue?: AudioCue, environment?: string): VoiceTreatmentPlan {
    let reverb: VoiceTreatmentPlan['reverb'] = 'small_room';
    let distance: VoiceTreatmentPlan['distance'] = 'near';
    let eqProfile: VoiceTreatmentPlan['eqProfile'] = 'voice_clear';

    if (environment?.includes('cathedral') || environment?.includes('monument')) {
      reverb = 'cathedral';
      distance = 'mid';
    } else if (environment?.includes('hall') || environment?.includes('outdoor')) {
      reverb = 'large_hall';
    }

    if (cue?.voiceType === 'whisper' || cue?.voiceType === 'dialogue') {
      eqProfile = 'voice_warm';
    }

    return {
      reverb,
      eqProfile,
      distance,
      targetDb: cue?.targetDb ?? -12.0
    };
  }
}
