import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_1b2f65d0b659c8cc335588721485de7f00c8d7bdebced797';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  labels: Record<string, string>;
  preview_url: string;
}

function fetchVoices(): Promise<ElevenLabsVoice[]> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1/voices',
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.voices) {
            resolve(parsed.voices);
          } else {
            reject(new Error(`API_RESPONSE_ERROR: ${data}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('[ElevenLabs] Consultando catálogo de vozes disponíveis na conta...');
  try {
    const voices = await fetchVoices();
    console.log(`[ElevenLabs] Total de vozes encontradas: ${voices.length}\n`);

    // Filtrar vozes masculinas adequadas para documentários
    const documentaryCandidates = voices.filter(v => {
      const gender = (v.labels?.gender || '').toLowerCase();
      const desc = `${v.description || ''} ${v.labels?.description || ''} ${v.labels?.['use case'] || ''}`.toLowerCase();
      return gender === 'male' || desc.includes('documentary') || desc.includes('narrat') || desc.includes('deep') || desc.includes('calm');
    });

    console.log('=== 🎙️ TOP VOZES MASCULINAS PARA DOCUMENTÁRIO (ELEVENLABS FREE COMPATÍVEL) ===\n');

    for (const v of documentaryCandidates) {
      console.log(`- Nome: ${v.name}`);
      console.log(`  Voice ID: ${v.voice_id}`);
      console.log(`  Categoria: ${v.category}`);
      console.log(`  Labels: ${JSON.stringify(v.labels)}`);
      console.log(`  Preview: ${v.preview_url}`);
      console.log(`  Descrição: ${v.description || 'Voz de estúdio'}\n`);
    }

    // Salvar catálogo em JSON para consulta
    const outputPath = path.resolve(process.cwd(), 'examples', 'elevenlabs-documentary-voices.json');
    fs.mkdirSync(path.dirname(outputPath), {recursive: true});
    fs.writeFileSync(outputPath, JSON.stringify(documentaryCandidates, null, 2), 'utf8');
    console.log(`[ElevenLabs] Relatório salvo em: ${outputPath}`);

  } catch (err) {
    console.error('ERRO AO CONSULTAR ELEVENLABS:', err instanceof Error ? err.message : String(err));
  }
}

main();
