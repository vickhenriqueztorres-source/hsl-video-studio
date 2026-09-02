import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = 'sk_1b2f65d0b659c8cc335588721485de7f00c8d7bdebced797';

async function generateSample(voiceId: string, voiceName: string, text: string, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.65,
        similarity_boost: 0.85,
        style: 0.15,
        use_speaker_boost: true
      }
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voiceId}`,
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errBody = '';
        res.on('data', d => { errBody += d; });
        res.on('end', () => {
          reject(new Error(`HTTP ${res.statusCode}: ${errBody}`));
        });
        return;
      }

      const outPath = path.resolve(process.cwd(), 'public', 'audio', filename);
      fs.mkdirSync(path.dirname(outPath), {recursive: true});
      const fileStream = fs.createWriteStream(outPath);

      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✅ [ElevenLabs] Amostra gerada com sucesso (${voiceName}): ${outPath}`);
        resolve(outPath);
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('[ElevenLabs] Gerando amostras de teste em PT-BR e EN com as vozes de documentário...');

  // 1. Testar Nando Andrade (Português do Brasil - Documentário / Investigação)
  try {
    await generateSample(
      'ojFdI32rbZHI2rxgzrEw',
      'Nando Andrade (PT-BR)',
      'Por trás das telas brilhantes e dos números do mercado, existe uma engrenagem que ninguém vê.',
      'sample_nando_andrade_ptbr.mp3'
    );
  } catch (e) {
    console.warn('Falha na voz Nando Andrade:', (e as Error).message);
  }

  // 2. Testar Brian (Inglês / Internacional - Premade Free Tier)
  try {
    await generateSample(
      'nPczCjzI2devNBz1zQrb',
      'Brian (Deep Documentary)',
      'Behind every seamless financial transaction lies a hidden subterranean infrastructure.',
      'sample_brian_doc_en.mp3'
    );
  } catch (e) {
    console.warn('Falha na voz Brian:', (e as Error).message);
  }

  // 3. Testar Adam (Inglês / Autoritário - Premade Free Tier)
  try {
    await generateSample(
      'pNInz6obpgDQGcFmaJgB',
      'Adam (Authoritative)',
      'The modern global economy doesn’t run on money. It runs on milliseconds.',
      'sample_adam_doc_en.mp3'
    );
  } catch (e) {
    console.warn('Falha na voz Adam:', (e as Error).message);
  }
}

run();
