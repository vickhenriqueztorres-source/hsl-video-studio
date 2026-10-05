import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { ElevenLabsNarrationAdapter } from '../adapters/elevenLabsNarrationAdapter';
import { DialogLevelingAgent, LoudnessQaAgent } from '../hsl/postproduction/narrationAudioRuntime';
import { createFfmpeg, probe } from '../graph/production/lib/ffmpeg';
import { narrationText } from '../graph/production/nodes/narration';
import { HSL_AUDIO_BITRATE } from '../spec/hsl-spec';

function digestText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function digestFile(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

async function main() {
  const root = process.cwd();
  const episodeId = 'BRECHA_EPISODE_009';
  const runDir = path.join(root, 'runs', episodeId);
  const audioDir = path.join(runDir, 'audio');
  const scenePlanPath = path.join(runDir, 'scene-plan.json');

  console.log('=== ETAPA 1: Preparando Roteiro Canônico ===');
  const plan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));
  const scripts = plan.beats.map((b: any) => b.voiceoverScript);
  const text = narrationText(scripts, 'pt-BR');
  const scriptSha256 = digestText(text);
  console.log(`Roteiro canônico processado: ${text.length} caracteres em ${scripts.length} cenas.`);
  console.log(`SHA256 do roteiro: ${scriptSha256}`);

  console.log('\n=== ETAPA 2: Sintetizando Narração com ElevenLabs (Voz Brian: nPczCjzI2devNBz1zQrb) ===');
  const voiceId = 'nPczCjzI2devNBz1zQrb';
  const modelId = 'eleven_multilingual_v2';
  const sourceMp3 = path.join(audioDir, 'narration-source.mp3');
  const masterWav = path.join(audioDir, 'narration-master.wav');
  const syncedWav = path.join(audioDir, 'narration-synced.wav');
  const receiptPath = path.join(audioDir, 'narration-receipt.json');
  const qaPath = path.join(audioDir, 'narration-audio-qa.json');

  if (fs.existsSync(sourceMp3)) fs.unlinkSync(sourceMp3);
  if (fs.existsSync(masterWav)) fs.unlinkSync(masterWav);
  if (fs.existsSync(syncedWav)) fs.unlinkSync(syncedWav);

  const adapter = new ElevenLabsNarrationAdapter();
  await adapter.generateSpeech({
    text,
    outputPath: sourceMp3,
    voiceId,
    modelId,
    stability: 0.45,
    similarityBoost: 0.80,
    style: 0.25,
    useSpeakerBoost: true,
    speed: 1.0,
    locale: 'pt-BR'
  });

  if (!fs.existsSync(sourceMp3) || fs.statSync(sourceMp3).size < 1000) {
    throw new Error('Falha na geração do arquivo de áudio source do ElevenLabs.');
  }
  console.log(`Áudio bruto gerado com sucesso: ${sourceMp3} (${fs.statSync(sourceMp3).size} bytes)`);

  console.log('\n=== ETAPA 3: Nivelamento Dinâmico e Masterização (DialogLevelingAgent) ===');
  new DialogLevelingAgent().level(sourceMp3, masterWav);
  console.log(`Áudio nivelado em 48kHz / stereo pcm: ${masterWav}`);

  const qa = new LoudnessQaAgent().validate(masterWav);
  fs.writeFileSync(qaPath, JSON.stringify(qa, null, 2), 'utf8');
  console.log('QA de Loudness aprovado:', qa);

  console.log('\n=== ETAPA 4: Sincronização Temporal Fina com a Faixa Visual ===');
  const visualPath = path.join(root, 'out', 'temp_visual_brecha_episode_009.mp4');
  if (!fs.existsSync(visualPath)) {
    throw new Error(`Vídeo visual não encontrado em: ${visualPath}`);
  }

  const visualProbe = await probe(visualPath);
  const audioProbe = await probe(masterWav);
  console.log(`Duração Visual: ${visualProbe.duration.toFixed(3)}s`);
  console.log(`Duração Narração Bruta: ${audioProbe.duration.toFixed(3)}s`);

  const factor = audioProbe.duration / visualProbe.duration;
  console.log(`Fator de sincronização temporal (atempo): ${factor.toFixed(4)}`);

  const ffmpeg = createFfmpeg(root);
  const tempoResult = await ffmpeg.atempo(masterWav, factor, syncedWav);
  if (tempoResult.exitCode !== 0 || !fs.existsSync(syncedWav)) {
    throw new Error(`Falha no atempo da narração: ${tempoResult.stderr}`);
  }

  fs.copyFileSync(syncedWav, masterWav);
  const syncedQa = new LoudnessQaAgent().validate(masterWav);
  fs.writeFileSync(qaPath, JSON.stringify(syncedQa, null, 2), 'utf8');

  const syncedProbe = await probe(masterWav);
  console.log(`Duração Narração Sincronizada: ${syncedProbe.duration.toFixed(3)}s (Delta: ${(Math.abs(syncedProbe.duration - visualProbe.duration)).toFixed(3)}s)`);

  const receipt = {
    schema: 'hsl.narration.receipt.v1',
    scriptSha256,
    sourceSha256: digestFile(sourceMp3),
    masterSha256: digestFile(masterWav),
    provider: 'elevenlabs',
    voice: voiceId,
    model: modelId,
    createdAt: new Date().toISOString(),
    synchronizedFromSha256: digestFile(syncedWav),
    synchronizationFactor: factor,
    synchronizedDurationSeconds: syncedProbe.duration,
    synchronizedAt: new Date().toISOString()
  };
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8');
  console.log('Recibo de narração oficial atualizado com sucesso.');

  console.log('\n=== ETAPA 5: Multiplexação com SFX e Trilha Musical Master ===');
  const musicPath = path.join(root, 'assets/audio-library/music/cinematic/suspense/suspense_oppressive_gloom.mp3');
  const sfxPath = path.join(audioDir, 'sfx-track.wav');
  const finalOutPath = path.join(root, 'out', 'brecha_episode_009.mp4');
  const deliveryPath = path.join(root, 'deliveries', episodeId, 'video', 'brecha_episode_009.mp4');
  const runVideoPath = path.join(runDir, 'video', 'brecha_episode_009.mp4');

  if (!fs.existsSync(sfxPath)) throw new Error(`Trilha de SFX ausente: ${sfxPath}`);
  if (!fs.existsSync(musicPath)) throw new Error(`Música de fundo ausente: ${musicPath}`);

  if (fs.existsSync(finalOutPath)) fs.unlinkSync(finalOutPath);

  const muxResult = await ffmpeg.muxFinalWithSfx(
    visualPath,
    musicPath,
    masterWav,
    sfxPath,
    finalOutPath,
    HSL_AUDIO_BITRATE
  );
  if (muxResult.exitCode !== 0 || !fs.existsSync(finalOutPath)) {
    throw new Error(`Falha no multiplexador final: ${muxResult.stderr}`);
  }

  console.log(`Master final multiplexado gerado em: ${finalOutPath} (${fs.statSync(finalOutPath).size} bytes)`);

  console.log('\n=== ETAPA 6: Atualizando Pacote de Entregas (deliveries) ===');
  fs.mkdirSync(path.dirname(deliveryPath), { recursive: true });
  fs.copyFileSync(finalOutPath, deliveryPath);
  fs.mkdirSync(path.dirname(runVideoPath), { recursive: true });
  fs.copyFileSync(finalOutPath, runVideoPath);

  const finalProbe = await probe(finalOutPath);
  console.log(`Verificação FFprobe do Vídeo Final:`);
  console.log(`- Resolução: ${finalProbe.width}x${finalProbe.height}`);
  console.log(`- Duração: ${finalProbe.duration.toFixed(3)}s`);
  console.log(`- Codec Vídeo: ${finalProbe.videoCodec}`);
  console.log(`- Codec Áudio: ${finalProbe.audioCodec}`);
  console.log(`- Streams: ${finalProbe.streams}`);
  console.log(`- Tamanho: ${(fs.statSync(finalOutPath).size / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n=== PROCESSO CONCLUÍDO COM SUCESSO ABSOLUTO! ===');
}

main().catch(err => {
  console.error('\n[ERRO]', err);
  process.exit(1);
});
