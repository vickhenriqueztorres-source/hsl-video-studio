import fs from 'fs';
import path from 'path';
import { ThumbnailSeoEngine, EpisodePackagingInput } from '../hsl/packaging/thumbnailSeoEngine';
import { HslComplianceChecker } from '../spec/hsl-compliance-checker';
import { AI_COOLING_TOPIC_INPUT } from './generateAiCoolingEpisode';

async function main() {
  const root = process.cwd();
  const episodeId = AI_COOLING_TOPIC_INPUT.episodeId;
  const scenePlanPath = path.resolve(root, 'runs', episodeId, 'scene-plan.json');
  const scenePlan = JSON.parse(fs.readFileSync(scenePlanPath, 'utf8'));

  const packagingInput: EpisodePackagingInput = {
    episodeId: AI_COOLING_TOPIC_INPUT.episodeId,
    mainTopic: AI_COOLING_TOPIC_INPUT.topic,
    entity: AI_COOLING_TOPIC_INPUT.entity,
    mechanism: AI_COOLING_TOPIC_INPUT.mechanism,
    constraint: AI_COOLING_TOPIC_INPUT.constraint,
    consequence: AI_COOLING_TOPIC_INPUT.consequence,
    thesis: AI_COOLING_TOPIC_INPUT.thesis,
    chapters: scenePlan.acts.map((a: any) => ({ title: a.title, durationSeconds: a.durationSeconds }))
  };

  console.log('Generating publication package and rendering 3 4K thumbnails...');
  const publicationPackage = ThumbnailSeoEngine.generatePackage(packagingInput);
  ThumbnailSeoEngine.exportPackagingDeliverables(publicationPackage, root);

  // Sync to deliveries
  const deliveryThumbsDir = path.resolve(root, 'deliveries', episodeId, 'thumbnails');
  const deliveryPubDir = path.resolve(root, 'deliveries', episodeId, 'publication');
  fs.mkdirSync(deliveryThumbsDir, { recursive: true });
  fs.mkdirSync(deliveryPubDir, { recursive: true });

  const runThumbsDir = path.resolve(root, 'runs', episodeId, 'thumbnails');
  if (fs.existsSync(runThumbsDir)) {
    fs.readdirSync(runThumbsDir).forEach(f => {
      fs.copyFileSync(path.join(runThumbsDir, f), path.join(deliveryThumbsDir, f));
    });
  }

  ['YOUTUBE_PUBLICATION_PACKAGE.md', 'publication-package.json'].forEach(f => {
    const src = path.join(root, 'runs', episodeId, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(deliveryPubDir, f));
    }
  });

  console.log('\nRunning PRD Compliance Audit for Episode 009...');
  const report = HslComplianceChecker.checkCompliance(episodeId);
  HslComplianceChecker.printReportAndExit(report);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
