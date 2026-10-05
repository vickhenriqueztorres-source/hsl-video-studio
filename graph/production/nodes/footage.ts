import fs from 'node:fs';
import path from 'node:path';
import type { Context, NodeFn } from '../runtime';
import { audit, paths, readJson, writeJson } from '../runtime';
import { planFootage, resolveFootageOptions } from '../../footage/planner';
import { buildFootageContactSheet, validateFootageArtifact } from '../../footage/acquire';
import type { AssetResult } from '../state';
import type { FootageVisualReview } from '../../footage/contracts';

export const footagePlan = (c: Context): NodeFn => s => {
  const target = path.join(paths(c, s).run, 'footage', 'brief.json');
  const options=resolveFootageOptions(s.options.graph.footage);
  if (s.options.graph.mediaMode === 'legacy' || options.mode === 'off') {
    return { footageBriefs: [], footageArtifacts: [], footageFailures: [], __status: 'skipped' };
  }
  const reserved = new Set(s.motionPlan?.scenes.map(scene => scene.beatId) ?? []);
  const briefs = planFootage(s.scenePlan!, s.channelId, options, reserved);
  writeJson(target, { schema: 'hsl-footage-briefs/v1', episodeId: s.episodeId, items: briefs });
  audit(c, s.episodeId, { type: 'footage-plan', mode: options.mode,
    briefs: briefs.map(brief => brief.beatId), frameBudget: Math.floor(s.scenePlan!.totalFrames * options.maxTimelineShare) });
  return { footageBriefs: briefs, footageArtifacts: [], footageFailures: [], __status: briefs.length ? 'ok' : 'skipped' };
};

export const footageAcquire = (c: Context): NodeFn => async s => {
  const options=resolveFootageOptions(s.options.graph.footage);
  const briefs=s.footageBriefs??[];
  if (s.options.graph.mediaMode === 'legacy' || options.mode !== 'auto' || !briefs.length) return { __status: 'skipped' };
  if (s.options.graph.offline) return { footageFailures: briefs.map(brief => ({ beatId: brief.beatId, reason: 'OFFLINE_FOOTAGE_SKIPPED' })), __status: 'skipped' };
  const result = await c.deps.acquireFootage(s.episodeId, briefs, options);
  return { footageArtifacts: result.artifacts, footageFailures: result.failures,
    footageCandidatesPath: result.candidatesPath, footageManifestPath: result.manifestPath,
    __status: result.artifacts.length ? 'ok' : 'skipped' };
};

export const footageReview = (c:Context):NodeFn=>async s=>{
  const options=resolveFootageOptions(s.options.graph.footage);
  const artifacts=s.footageArtifacts??[],briefs=s.footageBriefs??[];
  if(s.options.graph.mediaMode==='legacy'||options.mode!=='auto'||!artifacts.length)return{__status:'skipped'};
  const approved=Array<typeof artifacts[number]>(),reviews:FootageVisualReview[]=[],failures=[...(s.footageFailures??[])];
  for(const artifact of artifacts){
    const brief=briefs.find(item=>item.beatId===artifact.beatId);
    if(!brief){failures.push({beatId:artifact.beatId,reason:'FOOTAGE_BRIEF_MISSING'});continue;}
    try{
      validateFootageArtifact(c.root,artifact,{inspect:c.deps.inspect},false);
      const contactSheet=await buildFootageContactSheet(c.root,artifact);
      const reviewPath=path.join(paths(c,s).run,'footage','qa',artifact.beatId,'visual-review.json');
      const cached=readReview(reviewPath,artifact.videoSha256,brief.hash);
      let output:Omit<FootageVisualReview,'schema'|'artifactSha256'|'briefHash'|'approved'>|undefined=cached;
      if(!output){
        const run=await c.deps.ide({threadId:s.episodeId,node:`footage-review-${artifact.beatId}-${artifact.videoSha256.slice(0,8)}`,attempt:1,
          provider:'codex',ioMode:'stdout',readOnly:true,maxAttempts:2,imageFiles:[contactSheet],
          promptTemplate:'graph/prompts/footage-review.md',schemaPath:'graph/prompts/footage-review.schema.json',
          vars:{brief:JSON.stringify(brief),source:JSON.stringify({provider:artifact.source,pageUrl:artifact.sourcePageUrl,usage:'illustrative_broll'}),threshold:'75'}},{repoRoot:c.root});
        if(!run.headlessResult?.ok)throw new Error(`FOOTAGE_VISUAL_REVIEW_UNAVAILABLE:${run.headlessResult?.reason??'no result'}`);
        output=run.headlessResult.output as typeof output;
      }
      if(!output||output.beatId!==artifact.beatId)throw new Error('FOOTAGE_VISUAL_REVIEW_INVALID');
      const passed=output.score>=75&&output.showsRealCameraFootage&&output.semanticallyMatches&&!output.textOrWatermark&&!output.misleadingSpecificity;
      const review:FootageVisualReview={schema:'hsl-footage-visual-review/v1',...output,artifactSha256:artifact.videoSha256,briefHash:brief.hash,approved:passed};
      writeJson(reviewPath,review);reviews.push(review);
      const updated={...artifact,editorialStatus:passed?'approved' as const:'rejected' as const,visualReviewPath:reviewPath};
      writeJson(artifact.provenancePath,updated);
      approved.push(updated);if(!passed)failures.push({beatId:artifact.beatId,reason:`FOOTAGE_VISUAL_REJECTED:${output.issues.join('; ')}`});
    }catch(error){
      failures.push({beatId:artifact.beatId,reason:error instanceof Error?error.message:String(error)});
      const rejected={...artifact,editorialStatus:'rejected' as const};
      try{writeJson(artifact.provenancePath,rejected);}catch{}
      approved.push(rejected);
    }
  }
  if(s.footageManifestPath){
    const prior=readJson<Record<string,unknown>>(s.footageManifestPath)??{};
    writeJson(s.footageManifestPath,{...prior,schema:'hsl-footage-manifest/v1',artifacts:approved,failures,
      candidatesPath:s.footageCandidatesPath,manifestPath:s.footageManifestPath,reviewedAt:new Date().toISOString()});
  }
  return{footageArtifacts:approved,footageReviews:reviews,footageFailures:failures,__status:approved.some(item=>item.editorialStatus==='approved')?'ok':'skipped'};
};

function readReview(file:string,artifactSha256:string,briefHash:string):Omit<FootageVisualReview,'schema'|'artifactSha256'|'briefHash'|'approved'>|undefined{
  try{
    const value=JSON.parse(fs.readFileSync(file,'utf8')) as FootageVisualReview;
    if(value.schema!=='hsl-footage-visual-review/v1'||value.artifactSha256!==artifactSha256||value.briefHash!==briefHash)return undefined;
    const {schema:_schema,artifactSha256:_artifactSha256,briefHash:_briefHash,approved:_approved,...output}=value;
    return output;
  }catch{return undefined;}
}

export const footageResolve = (c: Context): NodeFn => s => {
  const options=resolveFootageOptions(s.options.graph.footage);
  if (s.options.graph.mediaMode === 'legacy' || options.mode !== 'auto') return { __status: 'skipped' };
  const validIds = new Set((s.footageBriefs??[]).map(brief => brief.beatId)), videos: AssetResult[] = [];
  for (const artifact of (s.footageArtifacts??[]).filter(item=>item.editorialStatus==='approved')) {
    if (!validIds.has(artifact.beatId)) throw new Error(`FOOTAGE_UNPLANNED_ARTIFACT:${artifact.beatId}`);
    validateFootageArtifact(c.root, artifact, { inspect: c.deps.inspect });
    const publicPath = path.join(c.root, 'public', 'runs', s.episodeId, 'videos', `${artifact.beatId}.mp4`);
    if (!fs.existsSync(publicPath) || c.deps.inspect(publicPath).durationSeconds !== c.deps.inspect(artifact.videoPath).durationSeconds) {
      fs.mkdirSync(path.dirname(publicPath), { recursive: true }); fs.copyFileSync(artifact.videoPath, publicPath);
    }
    videos.push({ beatId: artifact.beatId, path: artifact.videoPath, provider: 'licensed-footage',
      status: 'ok', attempts: 1, sha256: artifact.videoSha256 });
  }
  audit(c, s.episodeId, { type: 'footage-resolved', approved: videos.map(video => video.beatId), failures: s.footageFailures??[] });
  return { videos, __status: videos.length ? 'ok' : 'skipped' };
};
