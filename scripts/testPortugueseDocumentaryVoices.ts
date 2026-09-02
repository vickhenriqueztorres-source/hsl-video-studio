import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = 'sk_1b2f65d0b659c8cc335588721485de7f00c8d7bdebced797';

async function generateSamplePT(voiceId: string, voiceName: string, text: string, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.60,
        similarity_boost: 0.85,
        style: 0.10,
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
        console.log(`✅ [ElevenLabs] Amostra PT-BR gerada com sucesso (${voiceName}): ${outPath}`);
        resolve(outPath);
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('[ElevenLabs] Testando narração documental em Português nas melhores vozes do Plano Grátis...');
  const textPT = 'Por trás de cada transação bancária instantânea, existe uma rede subterrânea de fibra ótica e servidores invisíveis controlando o fluxo do dinheiro.';

  // 1. Brian - Deep, Resonant and Comforting (Ideal para Documentários Investigativos)
  await generateSamplePT('nPczCjzI2devNBz1zQrb', 'Brian (Grave / Documentário)', textPT, 'sample_brian_documentario_ptbr.mp3');

  // 2. Daniel - Steady Broadcaster (Tom sério / Repórter / Histórico)
  await generateSamplePT('onwK4e9ZLuTAKqWW03F9', 'Daniel (Broadcaster / Jornalístico)', textPT, 'sample_daniel_documentario_ptbr.mp3');

  // 3. Adam - Dominant, Firm (Impacto / Autoridade)
  await generateSamplePT('pNInz6obpgDQGcFmaJgB', 'Adam (Autoridade / Firme)', textPT, 'sample_adam_documentario_ptbr.mp3');
}

run();
