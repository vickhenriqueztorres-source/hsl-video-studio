import {SfxAgent} from '../sfx-agent/sfxAgent';

async function main(): Promise<void> {
  const agent = new SfxAgent();
  const result = await agent.run();
  if (result.totalSfxCollected < 200) {
    console.warn(`[SFX Script] Aviso: Total de SFXs coletados (${result.totalSfxCollected}) foi menor que a meta mínima de 200.`);
  }
}

main().catch((err) => {
  console.error('SFX_RUNNER_ERROR:', err instanceof Error ? err.stack || err.message : String(err));
  process.exit(1);
});
