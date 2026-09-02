import {MusicAgent} from '../music-agent/musicAgent';

async function main(): Promise<void> {
  const agent = new MusicAgent();
  const result = await agent.run();
  if (result.totalTracksCollected < 100) {
    console.warn(`[Music Script] Aviso: Total de faixas coletadas (${result.totalTracksCollected}) foi menor que a meta de 100.`);
  }
}

main().catch((err) => {
  console.error('MUSIC_RUNNER_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
  process.exit(1);
});
