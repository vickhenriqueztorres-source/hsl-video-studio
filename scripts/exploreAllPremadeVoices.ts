import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = 'sk_1b2f65d0b659c8cc335588721485de7f00c8d7bdebced797';

interface VoiceItem {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  labels: Record<string, string>;
  preview_url: string;
}

function fetchAllVoices(): Promise<VoiceItem[]> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: '/v1/voices',
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.voices || []);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function generateSampleAudio(voiceId: string, voiceName: string, text: string, filename: string, isEnglish = false) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.45, // Mais dinâmico e expressivo, menos mecânico
        similarity_boost: 0.80,
        style: 0.25,
        use_speaker_boost: true
      }
    });

    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voiceId}`,
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      }
    }, res => {
      if (res.statusCode !== 200) {
        let err = '';
        res.on('data', d => { err += d; });
        res.on('end', () => {
          console.warn(`[FAIL] ${voiceName}: HTTP ${res.statusCode} -> ${err}`);
          resolve(null);
        });
        return;
      }

      const outPath = path.resolve(process.cwd(), 'public', 'audio', filename);
      const stream = fs.createWriteStream(outPath);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        console.log(`✅ [OK] ${voiceName} -> ${filename}`);
        resolve(outPath);
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const voices = await fetchAllVoices();
  console.log(`Total vozes no catálogo: ${voices.length}`);

  const premadeMales = voices.filter(v => v.category === 'premade' && (v.labels?.gender === 'male' || !v.labels?.gender));

  console.log('\nVozes Premade Masculinas Disponíveis:');
  premadeMales.forEach(v => {
    console.log(`- ${v.name} (${v.voice_id}): ${v.labels?.descriptive || ''} | ${v.labels?.accent || ''}`);
  });

  const textPT = 'Existe um sistema invisível operando agora mesmo sob as ruas da sua cidade. Milhões de dados e transações acontecendo no mais absoluto silêncio.';
  const textEN = 'There is an invisible system operating right now beneath the streets of your city. Millions of transactions flowing in absolute silence.';

  console.log('\n--- Gerando novas amostras em estilos alternativos ---');

  // Testar 5 vozes com timbres muito diferentes
  const targets = [
    { name: 'Eric', id: 'cjVigY5qzO86Huf0OWal', style: 'Natural, suave, sem sotaque forçado' },
    { name: 'Callum', id: 'N2lVS1w4EtoT3dr4eOWO', style: 'Rouco, misterioso, thriller documental' },
    { name: 'George', id: 'JBFqnCBsd6RMkjVDRZzb', style: 'Profundo, caloroso, clássico sofisticado' },
    { name: 'Chris', id: 'iP95p4xoKVk53GoZ742B', style: 'Conversacional moderno, estilo YouTuber investigativo' },
    { name: 'Bill', id: 'pqHfZKP75CvOlQylNhV4', style: 'Maduro, narrador experiente de documentário' }
  ];

  for (const t of targets) {
    await generateSampleAudio(t.id, `${t.name} (PT)`, textPT, `teste_${t.name.toLowerCase()}_pt.mp3`);
    await generateSampleAudio(t.id, `${t.name} (EN)`, textEN, `teste_${t.name.toLowerCase()}_en.mp3`, true);
  }
}

main().catch(console.error);
