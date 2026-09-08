import https from 'https';
import fs from 'fs';
import path from 'path';
import { createHash, randomUUID } from 'crypto';
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

type NarrationProvider = 'elevenlabs' | 'edge-tts' | 'mixed';
interface ProviderReceipt {
  schema: 'hsl.narration.provider-receipt.v1'; provider: NarrationProvider; voice: string; model: string;
  textSha256: string; outputSha256: string; createdAt: string;
}

function digestText(value: string): string { return createHash('sha256').update(value, 'utf8').digest('hex'); }
function digestFile(file: string): string { return createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function receiptPath(output: string): string { return `${output}.provider.json`; }
function readReceipt(output: string): ProviderReceipt | undefined {
  try { return JSON.parse(fs.readFileSync(receiptPath(output), 'utf8')) as ProviderReceipt; } catch { return undefined; }
}
function writeReceipt(output: string, text: string, provider: NarrationProvider, voice: string, model: string) {
  const receipt: ProviderReceipt = {
    schema: 'hsl.narration.provider-receipt.v1', provider, voice, model,
    textSha256: digestText(text), outputSha256: digestFile(output), createdAt: new Date().toISOString()
  };
  fs.writeFileSync(receiptPath(output), JSON.stringify(receipt, null, 2), 'utf8');
}

export class ElevenLabsNarrationAdapter {
  private readonly voiceId: string;
  private readonly modelId: string;
  private readonly keyPool: string[];

  constructor(apiKey = ElevenLabsConfig.apiKey, voiceId = ElevenLabsConfig.voiceId, modelId = ElevenLabsConfig.modelId) {
    this.voiceId = voiceId;
    this.modelId = modelId;
    this.keyPool = Array.from(new Set([apiKey, ...ElevenLabsConfig.fallbackKeys].filter(Boolean)));
  }

  public async generateSpeech(options: NarrationGenerateOptions): Promise<string> {
    const targetVoiceId = options.voiceId || this.voiceId;
    const targetModelId = options.modelId || this.modelId;
    const destPath = options.outputPath || path.resolve(process.cwd(), 'public', 'audio', 'narration.mp3');
    fs.mkdirSync(path.dirname(destPath), {recursive: true});

    const cached = readReceipt(destPath);
    if (cached?.textSha256 === digestText(options.text) && fs.existsSync(destPath) && fs.statSync(destPath).size > 1000 && cached.outputSha256 === digestFile(destPath)) {
      console.log(`[ElevenLabsNarration] Reutilizando cache verificado: ${destPath}`);
      return destPath;
    }
    try { if (fs.existsSync(destPath)) fs.unlinkSync(destPath); } catch {}
    try { if (fs.existsSync(receiptPath(destPath))) fs.unlinkSync(receiptPath(destPath)); } catch {}

    if (options.text.length > 3500) {
      console.log(`[ElevenLabsNarration] Texto longo (${options.text.length} caracteres); sintetizando em blocos.`);
      return this.generateChunkedSpeech(options.text, destPath, targetVoiceId, targetModelId, options);
    }

    const payload = JSON.stringify({
      text: options.text, model_id: targetModelId,
      voice_settings: {
        stability: options.stability ?? ElevenLabsConfig.voiceSettings.stability,
        similarity_boost: options.similarityBoost ?? ElevenLabsConfig.voiceSettings.similarity_boost,
        style: ElevenLabsConfig.voiceSettings.style,
        use_speaker_boost: ElevenLabsConfig.voiceSettings.use_speaker_boost
      }
    });

    let lastError: Error | null = null;
    for (let i = 0; i < this.keyPool.length; i++) {
      try {
        await this.executeTtsRequest(this.keyPool[i], targetVoiceId, payload, destPath);
        writeReceipt(destPath, options.text, 'elevenlabs', targetVoiceId, targetModelId);
        console.log(`[ElevenLabsNarration] Áudio sintetizado via chave ${i + 1}/${this.keyPool.length}: ${destPath}`);
        return destPath;
      } catch (error) {
        try { if (fs.existsSync(destPath)) fs.unlinkSync(destPath); } catch {}
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[ElevenLabsNarration] Chave ${i + 1}/${this.keyPool.length} indisponível: ${lastError.message}`);
      }
    }

    try {
      this.generateEdgeSpeech(options.text, destPath);
      writeReceipt(destPath, options.text, 'edge-tts', 'en-US-ChristopherNeural', 'edge-tts');
      console.log(`[EdgeTTS] Narração gerada: ${destPath}`);
      return destPath;
    } catch (error) {
      throw new Error(`ELEVENLABS_AND_EDGETTS_FAILED:${lastError?.message || 'no ElevenLabs key'}:${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private generateEdgeSpeech(text: string, destPath: string) {
    const tempTextPath = path.resolve(path.dirname(destPath), `.edge-tts-${randomUUID()}.txt`);
    fs.writeFileSync(tempTextPath, text, 'utf8');
    try {
      const result = spawnSync('python', ['-m', 'edge_tts', '--voice', 'en-US-ChristopherNeural', '--file', tempTextPath, '--write-media', destPath], {encoding: 'utf8'});
      if (result.status !== 0 || !fs.existsSync(destPath) || fs.statSync(destPath).size <= 1000) throw new Error(result.stderr || result.stdout || `exit ${result.status}`);
    } finally { try { fs.unlinkSync(tempTextPath); } catch {} }
  }

  private async generateChunkedSpeech(fullText: string, finalDest: string, voiceId: string, modelId: string, options: NarrationGenerateOptions): Promise<string> {
    const chunks: string[] = [];
    let currentChunk = '';
    for (const sentence of fullText.split(/(?<=[.?!])\s+/)) {
      if ((currentChunk + ' ' + sentence).length > 2500) {
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());
    const tmpDir = path.resolve(path.dirname(finalDest), `.narration-chunks-${randomUUID()}`);
    fs.mkdirSync(tmpDir, {recursive: true});
    const files: string[] = [];
    const providers = new Set<NarrationProvider>();
    try {
      for (let index = 0; index < chunks.length; index++) {
        const chunkFile = path.join(tmpDir, `chunk_${String(index).padStart(3, '0')}.mp3`);
        await this.generateSpeech({text: chunks[index], outputPath: chunkFile, voiceId, modelId, stability: options.stability, similarityBoost: options.similarityBoost});
        const receipt = readReceipt(chunkFile);
        if (!receipt) throw new Error(`NARRATION_CHUNK_RECEIPT_MISSING:${index}`);
        if (receipt.provider === 'edge-tts') {
          try { if (fs.existsSync(finalDest)) fs.unlinkSync(finalDest); } catch {}
          this.generateEdgeSpeech(fullText, finalDest);
          writeReceipt(finalDest, fullText, 'edge-tts', 'en-US-ChristopherNeural', 'edge-tts');
          return finalDest;
        }
        providers.add(receipt.provider); files.push(chunkFile);
      }
      if (files.length !== chunks.length) throw new Error('ELEVENLABS_INCOMPLETE_CHUNK_SET');
      const list = path.join(tmpDir, 'concat.txt');
      fs.writeFileSync(list, files.map(file => `file '${file.replace(/\\/g, '/')}'`).join('\n'), 'utf8');
      const result = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c:a', 'libmp3lame', '-b:a', '192k', '-ar', '48000', '-ac', '1', finalDest], {encoding: 'utf8'});
      if (result.status !== 0 || !fs.existsSync(finalDest) || fs.statSync(finalDest).size <= 1000) throw new Error(`NARRATION_CHUNK_CONCAT_FAILED:${result.stderr || result.stdout}`);
      const provider: NarrationProvider = providers.size === 1 ? [...providers][0] : 'mixed';
      writeReceipt(finalDest, fullText, provider, provider === 'edge-tts' ? 'en-US-ChristopherNeural' : voiceId, provider === 'edge-tts' ? 'edge-tts' : modelId);
      return finalDest;
    } finally { try { fs.rmSync(tmpDir, {recursive: true, force: true}); } catch {} }
  }

  private executeTtsRequest(apiKey: string, voiceId: string, payload: string, destPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.request({hostname: 'api.elevenlabs.io', path: `/v1/text-to-speech/${voiceId}`, method: 'POST', headers: {'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg'}}, res => {
        if (res.statusCode !== 200) {
          let error = ''; res.on('data', data => { error += data; }); res.on('end', () => reject(new Error(`HTTP_${res.statusCode}_ERROR:${error}`))); return;
        }
        const stream = fs.createWriteStream(destPath); res.pipe(stream);
        stream.on('error', reject); stream.on('finish', () => stream.close(() => resolve(destPath)));
      });
      req.on('error', reject); req.write(payload); req.end();
    });
  }
}
