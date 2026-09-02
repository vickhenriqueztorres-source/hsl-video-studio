import {SfxAgent} from './sfxAgent';

async function main(): Promise<void> {
  const agent = new SfxAgent();
  await agent.run();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('SFX_AGENT_FATAL_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
