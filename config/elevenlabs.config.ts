import dotenv from 'dotenv';
dotenv.config();

export const ElevenLabsConfig = {
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  fallbackKeys: [
    process.env.ELEVENLABS_API_KEY,
    process.env.ELEVENLABS_BACKUP_KEY_1,
    process.env.ELEVENLABS_BACKUP_KEY_2,
    process.env.ELEVENLABS_BACKUP_KEY_3
  ].filter(Boolean) as string[],
  voiceId: process.env.HSL_ELEVENLABS_VOICE_ID || 'iP95p4xoKVk53GoZ742B', // Chris
  voiceName: process.env.HSL_ELEVENLABS_VOICE_NAME || 'Chris',
  modelId: process.env.HSL_ELEVENLABS_MODEL || 'eleven_multilingual_v2',
  voiceSettings: {
    stability: Number(process.env.HSL_ELEVENLABS_STABILITY || 0.45),
    similarity_boost: Number(process.env.HSL_ELEVENLABS_SIMILARITY_BOOST || 0.80),
    style: Number(process.env.HSL_ELEVENLABS_STYLE || 0.25),
    use_speaker_boost: true
  }
};
