import fs from 'node:fs';
import path from 'node:path';
import { Context, NodeFn, paths, readJson, copyFile, withStage, validMedia } from '../runtime';
import { HslPublicationPackage } from '../../../hsl/packaging/thumbnailSeoEngine';
import { HSL_REQUIRED_THUMBNAILS } from '../../../spec/hsl-spec';
export const packaging = (c: Context): NodeFn => s => withStage(c, s, 'STAGE_10_PACKAGING', async () => {
  const p = paths(c, s), t = s.topicInput;
  const cached = readJson<HslPublicationPackage>(path.join(p.run, 'publication-package.json'));
  const valid = cached && fs.existsSync(path.join(p.run, 'YOUTUBE_PUBLICATION_PACKAGE.md')) &&
    HSL_REQUIRED_THUMBNAILS.every(f => validMedia(c, path.join(p.run, 'thumbnails', f), 'image'));
  const pkg = valid ? cached : c.deps.package({ episodeId: t.episodeId, mainTopic: t.topic, entity: t.entity, mechanism: t.mechanism, constraint: t.constraint, consequence: t.consequence, thesis: t.thesis, chapters: s.scenePlan!.acts.map(a => ({ title: a.title, durationSeconds: a.durationSeconds })) });
  let server = s.assetServer;
  if (!valid) {
    server = await c.deps.ensureRunning(c.root);
    const prior = process.env.HSL_ASSET_BASE_URL;
    process.env.HSL_ASSET_BASE_URL = server.baseUrl;
    try { c.deps.exportPackage(pkg, c.root); }
    finally { if (prior === undefined) delete process.env.HSL_ASSET_BASE_URL; else process.env.HSL_ASSET_BASE_URL = prior; }
  }
  const thumbs = path.join(p.run, 'thumbnails');
  if (fs.existsSync(thumbs)) for (const f of fs.readdirSync(thumbs)) copyFile(path.join(thumbs, f), path.join(c.root, 'deliveries', s.episodeId, 'thumbnails', f));
  for (const f of ['YOUTUBE_PUBLICATION_PACKAGE.md', 'publication-package.json']) {
    const src = path.join(p.run, f);
    if (fs.existsSync(src)) copyFile(src, path.join(c.root, 'deliveries', s.episodeId, 'publication', f));
  }
  return { update: { packaging: pkg, assetServer: server }, skipped: !!valid };
});
