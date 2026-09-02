export interface RagQuery {
  readonly mood?: string;
  readonly sceneType?: string;
  readonly effectType?: string;
  readonly technicalNeed?: string;
  readonly tags?: readonly string[];
}

export class QueryBuilder {
  public static fromSceneContext(context: {
    mood?: string;
    environment?: string;
    hasVoice?: boolean;
    cues?: readonly string[];
  }): RagQuery {
    const tags: string[] = [];

    if (context.mood) {
      if (['suspense', 'dark', 'mystery'].includes(context.mood.toLowerCase())) {
        tags.push('drone', 'suspense', 'narrative_intent');
      } else if (['epic', 'action'].includes(context.mood.toLowerCase())) {
        tags.push('score', 'hit', 'boom', 'beat_alignment');
      } else if (['emotional', 'calm'].includes(context.mood.toLowerCase())) {
        tags.push('score', 'ambience', 'restraint');
      }
    }

    if (context.hasVoice) {
      tags.push('voice_processing', 'frequency_separation', 'mixing');
    }

    if (context.environment) {
      tags.push('ambience', 'room_matching', 'foley');
    }

    if (context.cues && context.cues.length > 0) {
      for (const cue of context.cues) {
        const lower = cue.toLowerCase();
        if (lower.includes('trans') || lower.includes('zoom')) tags.push('riser', 'transition', 'whoosh');
        if (lower.includes('climax') || lower.includes('boom')) tags.push('boom', 'restraint');
        if (lower.includes('punch') || lower.includes('hit')) tags.push('hit');
      }
    }

    return {
      mood: context.mood,
      technicalNeed: context.hasVoice ? 'voice_masking_prevention' : undefined,
      tags: Array.from(new Set(tags))
    };
  }
}
