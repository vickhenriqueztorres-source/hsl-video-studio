import path from 'path';
import fs from 'fs';
import { ThumbnailSeoEngine } from '../hsl/packaging/thumbnailSeoEngine';
import { MEGASHIP_TOPIC_INPUT } from './generateMegashipEpisode';
import { HslSceneDirectorAgent } from '../hsl/core/hslSceneDirectorAgent';

async function refreshPackaging() {
  const root = process.cwd();
  const plan = HslSceneDirectorAgent.planEpisodeFromScratch(MEGASHIP_TOPIC_INPUT);
  const pkg = ThumbnailSeoEngine.generatePackage({
    ...MEGASHIP_TOPIC_INPUT,
    mainTopic: MEGASHIP_TOPIC_INPUT.topic,
    chapters: plan.acts.map(a => ({ title: a.title, durationSeconds: a.durationSeconds }))
  });

  console.log('HOOK:', pkg.layeredDescription.hookLines);
  ThumbnailSeoEngine.exportPackagingDeliverables(pkg, root);

  // Copia para pasta oficial de deliveries
  const deliveryPubDir = path.resolve(root, 'deliveries', pkg.episodeId, 'publication');
  const deliveryThumbDir = path.resolve(root, 'deliveries', pkg.episodeId, 'thumbnails');
  fs.mkdirSync(deliveryPubDir, { recursive: true });
  fs.mkdirSync(deliveryThumbDir, { recursive: true });

  const runDir = path.resolve(root, 'runs', pkg.episodeId);
  fs.copyFileSync(path.join(runDir, 'YOUTUBE_PUBLICATION_PACKAGE.md'), path.join(deliveryPubDir, 'YOUTUBE_PUBLICATION_PACKAGE.md'));
  fs.copyFileSync(path.join(runDir, 'publication-package.json'), path.join(deliveryPubDir, 'publication-package.json'));

  const thumbFiles = fs.readdirSync(path.join(runDir, 'thumbnails'));
  for (const f of thumbFiles) {
    fs.copyFileSync(path.join(runDir, 'thumbnails', f), path.join(deliveryThumbDir, f));
  }

  console.log('✅ REFRESH_PACKAGING_COMPLETED_SUCCESSFULLY');
}

refreshPackaging().catch(console.error);
