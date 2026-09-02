import { HslArtifactRegistry } from './hslArtifactRegistry';
import { HslRunDerivator } from '../hsl/core/hslRunDerivator';
import { HslCleaner } from '../hsl/core/hslCleaner';

export class HslRegistryCli {
  public static run(): void {
    const args = process.argv.slice(2);
    const command = args[0] || 'list';
    const registry = new HslArtifactRegistry();

    switch (command) {
      case 'list': {
        const artifacts = registry.listArtifacts();
        const runIds = Array.from(new Set(artifacts.map(a => a.runId)));

        console.log('\n📦 HSL REGISTRY // RUNS & ENTREGÁVEIS:');
        console.log('----------------------------------------------------------------');
        console.log('| Handle Master | Run ID | Tipo | Tamanho | Status |');
        console.log('| :--- | :--- | :--- | :--- | :--- |');

        for (const runId of runIds) {
          const runArtifacts = artifacts.filter(a => a.runId === runId);
          const master = runArtifacts.find(a => a.artifactType === 'master_video') || runArtifacts[0];
          const sizeMb = master ? (master.fileSizeBytes / (1024 * 1024)).toFixed(2) : '0';
          console.log(`| \`${master?.handle || runId}\` | ${runId} | ${master?.artifactType} | ${sizeMb} MB | ${master?.complianceStatus} |`);
        }
        console.log('----------------------------------------------------------------\n');
        break;
      }

      case 'inspect': {
        const handle = args[1];
        if (!handle) {
          console.error('❌ ERRO: Handle não especificado. Uso: ts-node registry/hslRegistryCli.ts inspect <handle>');
          process.exit(1);
        }
        try {
          const artifact = registry.resolve(handle);
          console.log('\n🔍 DETALHAMENTO DO ARTEFATO:');
          console.log('----------------------------------------------------------------');
          console.log(`Handle:           ${artifact.handle}`);
          console.log(`Run ID:           ${artifact.runId}`);
          console.log(`Projeto / Episódio: ${artifact.project} / ${artifact.episode} (v${artifact.version})`);
          console.log(`Tipo:             ${artifact.artifactType}`);
          console.log(`Caminho:          ${artifact.absolutePath}`);
          console.log(`Tamanho:          ${artifact.fileSizeBytes} bytes`);
          console.log(`SHA-256:          ${artifact.sha256}`);
          console.log(`Compliance:       ${artifact.complianceStatus}`);
          if (artifact.mediaInfo) {
            console.log(`Duração:          ${artifact.mediaInfo.durationSeconds}s`);
            if (artifact.mediaInfo.width) console.log(`Resolução:        ${artifact.mediaInfo.width}x${artifact.mediaInfo.height}`);
            if (artifact.mediaInfo.codec) console.log(`Codec:            ${artifact.mediaInfo.codec}`);
          }
          if (artifact.lineage) {
            console.log(`Linhagem:         Derivado de ${artifact.lineage.derivedFromRunId}`);
          }
          console.log('----------------------------------------------------------------\n');
        } catch (err: any) {
          console.error(`❌ ERRO: ${err.message}`);
          process.exit(1);
        }
        break;
      }

      case 'resolve': {
        const handle = args[1];
        if (!handle) {
          console.error('❌ ERRO: Handle não especificado. Uso: ts-node registry/hslRegistryCli.ts resolve <handle>');
          process.exit(1);
        }
        try {
          const artifact = registry.resolve(handle);
          console.log(artifact.absolutePath);
        } catch (err: any) {
          console.error(`❌ ERRO: ${err.message}`);
          process.exit(1);
        }
        break;
      }

      case 'audios': {
        const audios = registry.listArtifacts({ type: 'narration_audio' });
        console.log('\n🎙️ ÁUDIOS APROVADOS E REAPROVEITÁVEIS:');
        console.log('----------------------------------------------------------------');
        console.log('| Handle | Duração | SHA-256 | Caminho |');
        console.log('| :--- | :--- | :--- | :--- |');
        for (const a of audios) {
          const dur = a.mediaInfo?.durationSeconds ? `${a.mediaInfo.durationSeconds.toFixed(1)}s` : 'N/A';
          console.log(`| \`${a.handle}\` | ${dur} | \`${a.sha256.substring(0, 15)}...\` | ${a.relativePath} |`);
        }
        console.log('----------------------------------------------------------------\n');
        break;
      }

      case 'rebuild': {
        registry.rebuildFromDisk();
        console.log('✅ Catálogo reconstruído com sucesso a partir do disco em registry/registry.json.');
        break;
      }

      case 'derive': {
        const fromArg = args.find(a => a.startsWith('--from='))?.split('=')[1] || args[1];
        if (!fromArg) {
          console.error('❌ ERRO: Run de origem não informada. Uso: npm run hsl:derive -- --from=<handle>');
          process.exit(1);
        }
        try {
          HslRunDerivator.deriveWithInheritedAudio({ sourceRunHandleOrId: fromArg });
        } catch (err: any) {
          console.error(`❌ ERRO DE DERIVAÇÃO: ${err.message}`);
          process.exit(1);
        }
        break;
      }

      case 'clean': {
        const target = args[1] || 'HSL_EPISODE_001';
        try {
          HslCleaner.cleanIntermediates(target);
        } catch (err: any) {
          console.error(`❌ ERRO DE LIMPEZA: ${err.message}`);
          process.exit(1);
        }
        break;
      }

      default:
        console.log(`Comando desconhecido: ${command}`);
        console.log('Comandos válidos: list, inspect, resolve, audios, rebuild, derive, clean');
        process.exit(1);
    }
  }
}

if (require.main === module) {
  HslRegistryCli.run();
}
