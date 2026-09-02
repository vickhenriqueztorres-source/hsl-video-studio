import {MusicAgent} from './musicAgent';

async function main(): Promise<void> {
  const agent = new MusicAgent();
  await agent.run();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('MUSIC_AGENT_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
