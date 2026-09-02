import https from 'https';
import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
import {ElevenLabsConfig} from '../config/elevenlabs.config';

export interface NarrationGenerateOptions {
  readonly text: string;
  readonly outputPath?: string;
  readonly voiceId?: string;
  readonly modelId?: string;
  readonly stability?: number;
  readonly similarityBoost?: number;
}

export class ElevenLabsNarrationAdapter {
  private readonly voiceId: string;
  private readonly modelId: string;
  private readonly keyPool: string[];

  constructor(apiKey = ElevenLabsConfig.apiKey, voiceId = ElevenLabsConfig.voiceId, modelId = ElevenLabsConfig.modelId) {
    this.voiceId = voiceId;
    this.modelId = modelId;
    const keys = [apiKey, ...ElevenLabsConfig.fallbackKeys];
    this.keyPool = Array.from(new Set(keys.filter(Boolean)));
  }

  public async generateSpeech(options: NarrationGenerateOptions): Promise<string> {
    const targetVoiceId = options.voiceId || this.voiceId;
    const targetModelId = options.modelId || this.modelId;
    const destPath = options.outputPath || path.resolve(process.cwd(), 'public', 'audio', 'narration.mp3');

    fs.mkdirSync(path.dirname(destPath), {recursive: true});

    // Reutiliza áudio existente se já sintetizado
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 10000) {
      console.log(`✅ [ElevenLabsNarration] Reutilizando áudio master existente em cache: ${destPath}`);
      return destPath;
    }

    // Se o texto for maior que 3500 caracteres, divide em blocos para respeitar o limite da API
    if (options.text.length > 3500) {
      console.log(`[ElevenLabsNarration] Texto longo detectado (${options.text.length} chars). Dividindo em blocos modulares...`);
      return this.generateChunkedSpeech(options.text, destPath, targetVoiceId, targetModelId, options);
    }

    const payload = JSON.stringify({
      text: options.text,
      model_id: targetModelId,
      voice_settings: {
        stability: options.stability ?? ElevenLabsConfig.voiceSettings.stability,
        similarity_boost: options.similarityBoost ?? ElevenLabsConfig.voiceSettings.similarity_boost,
        style: ElevenLabsConfig.voiceSettings.style,
        use_speaker_boost: ElevenLabsConfig.voiceSettings.use_speaker_boost
      }
    });

    let lastError: Error | null = null;

    for (let i = 0; i < this.keyPool.length; i++) {
      const currentKey = this.keyPool[i];
      const keySnippet = currentKey.slice(0, 7) + '...' + currentKey.slice(-4);

      try {
        const result = await this.executeTtsRequest(currentKey, targetVoiceId, payload, destPath);
        console.log(`[ElevenLabsNarration] Áudio sintetizado com sucesso via chave [${i + 1}/${this.keyPool.length}] (${keySnippet}) em: ${destPath}`);
        return result;
      } catch (err: any) {
        console.warn(`[ElevenLabsNarration] Aviso na chave [${i + 1}/${this.keyPool.length}] (${keySnippet}): ${err.message}`);
        lastError = err;
      }
    }

    // Fallback automático para Edge-TTS Neural (Christopher) caso a cota do ElevenLabs esteja esgotada
    console.warn(`[ElevenLabsNarration] Chaves ElevenLabs sem cota disponível. Ativando síntese neural de alta definição via Edge-TTS (voz Christopher)...`);
    const tempTextPath = path.resolve(process.cwd(), 'runs', `temp_tts_${Date.now()}.txt`);
    fs.mkdirSync(path.dirname(tempTextPath), { recursive: true });
    fs.writeFileSync(tempTextPath, options.text, 'utf8');

    const edgeRes = spawnSync('python', [
      '-m', 'edge_tts',
      '--voice', 'en-US-ChristopherNeural',
      '--file', tempTextPath,
      '--write-media', destPath
    ], { encoding: 'utf8' });

    try { fs.unlinkSync(tempTextPath); } catch {}

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      console.log(`✅ [EdgeTTS] Narração master gerada com sucesso via voz Christopher neural em: ${destPath}`);
      return destPath;
    }

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      console.warn(`[ElevenLabsNarration] Reutilizando áudio master existente em cache: ${destPath}`);
      return destPath;
    }

    throw lastError || new Error(`ELEVENLABS_AND_EDGETTS_FAILED: ${edgeRes.stderr || edgeRes.stdout || 'unknown error'}`);
  }

  private async generateChunkedSpeech(
    fullText: string,
    finalDest: string,
    voiceId: string,
    modelId: string,
    options: NarrationGenerateOptions
  ): Promise<string> {
    const sentences = fullText.split(/(?<=[.?!])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const s of sentences) {
      if ((currentChunk + ' ' + s).length > 2500) {
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        currentChunk = s;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + s;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());

    const tmpDir = path.resolve(process.cwd(), 'runs', 'temp_audio_chunks');
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, {recursive: true});
    const chunkFiles: string[] = [];

    for (let idx = 0; idx < chunks.length; idx++) {
      const chunkFile = path.join(tmpDir, `chunk_${String(idx).padStart(3, '0')}.mp3`);

      try {
        await this.generateSpeech({
          text: chunks[idx],
          outputPath: chunkFile,
          voiceId,
          modelId,
          stability: options.stability,
          similarityBoost: options.similarityBoost
        });
        chunkFiles.push(chunkFile);
      } catch (err: any) {
        console.warn(`[ElevenLabsNarration] Aviso no bloco [${idx + 1}/${chunks.length}]: ${err.message}. Continuando com os blocos disponíveis.`);
        if (fs.existsSync(chunkFile) && fs.statSync(chunkFile).size > 1000) {
          chunkFiles.push(chunkFile);
        }
      }
    }

    if (chunkFiles.length === 0) {
      console.warn(`[ElevenLabsNarration] Chaves ElevenLabs sem cota para blocos. Sintetizando narração completa via Edge-TTS (voz Christopher)...`);
      const tempTextPath = path.resolve(process.cwd(), 'runs', `temp_tts_${Date.now()}.txt`);
      fs.mkdirSync(path.dirname(tempTextPath), { recursive: true });
      fs.writeFileSync(tempTextPath, fullText, 'utf8');

      const edgeRes = spawnSync('python', [
        '-m', 'edge_tts',
        '--voice', 'en-US-ChristopherNeural',
        '--file', tempTextPath,
        '--write-media', finalDest
      ], { encoding: 'utf8' });

      try { fs.unlinkSync(tempTextPath); } catch {}

      if (fs.existsSync(finalDest) && fs.statSync(finalDest).size > 1000) {
        console.log(`✅ [EdgeTTS] Narração master gerada com sucesso via voz Christopher neural em: ${finalDest}`);
        return finalDest;
      }

      if (fs.existsSync(finalDest) && fs.statSync(finalDest).size > 1000) {
        console.warn(`[ElevenLabsNarration] Reutilizando áudio master final existente: ${finalDest}`);
        return finalDest;
      }
      throw new Error(`ELEVENLABS_NO_CHUNKS_GENERATED: ${edgeRes.stderr || edgeRes.stdout || 'unknown error'}`);
    }

    // Concatena com FFmpeg
    const listFile = path.join(tmpDir, 'concat_list.txt');
    fs.writeFileSync(listFile, chunkFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n'), 'utf8');

    spawnSync('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'concat', '-safe', '0', '-i', listFile,
      '-c', 'copy',
      finalDest
    ], {encoding: 'utf8'});

    console.log(`✅ [ElevenLabsNarration] Todos os ${chunks.length} blocos concatenados com sucesso em: ${finalDest}`);
    return finalDest;
  }

  private executeTtsRequest(apiKey: string, voiceId: string, payload: string, destPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${voiceId}`,
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        }
      }, res => {
        if (res.statusCode !== 200) {
          let err = '';
          res.on('data', d => { err += d; });
          res.on('end', () => {
            reject(new Error(`HTTP_${res.statusCode}_ERROR: ${err}`));
          });
          return;
        }

        const stream = fs.createWriteStream(destPath);
        res.pipe(stream);
        stream.on('finish', () => {
          stream.close();
          resolve(destPath);
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }
}
